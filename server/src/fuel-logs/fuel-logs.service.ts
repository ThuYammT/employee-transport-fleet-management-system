import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {
  Prisma,
  TripStatus,
  UserStatus,
} from '@prisma/client'

import { PrismaService } from '../prisma/prisma.service'
import { CreateFuelLogDto } from './dto/create-fuel-log.dto'
import { UpdateFuelLogDto } from './dto/update-fuel-log.dto'

const fuelLogInclude = {
  vehicle: true,

  driver: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          status: true,
        },
      },

      assignedVehicle: {
        select: {
          id: true,
          plateNumber: true,
          vehicleType: true,
          status: true,
          currentMileage: true,
        },
      },
    },
  },

  trip: {
    include: {
      request: {
        select: {
          id: true,
          pickupLocation: true,
          destination: true,
          requestDate: true,
          requestTime: true,
          purpose: true,
        },
      },
    },
  },
} satisfies Prisma.FuelLogInclude

@Injectable()
export class FuelLogsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  findAll() {
    return this.prisma.fuelLog.findMany({
      include: fuelLogInclude,

      orderBy: [
        {
          fuelDate: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
    })
  }

  async findOne(id: number) {
    const fuelLog =
      await this.prisma.fuelLog.findUnique({
        where: {
          id,
        },

        include: fuelLogInclude,
      })

    if (!fuelLog) {
      throw new NotFoundException(
        `Fuel log with ID ${id} was not found`,
      )
    }

    return fuelLog
  }

  async findByDriverId(
    driverId: number,
  ) {
    await this.ensureDriverExists(driverId)

    return this.prisma.fuelLog.findMany({
      where: {
        driverId,
      },

      include: fuelLogInclude,

      orderBy: [
        {
          fuelDate: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
    })
  }

  async findByVehicleId(
    vehicleId: number,
  ) {
    await this.ensureVehicleExists(vehicleId)

    return this.prisma.fuelLog.findMany({
      where: {
        vehicleId,
      },

      include: fuelLogInclude,

      orderBy: [
        {
          fuelDate: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
    })
  }

  async findByTripId(tripId: number) {
    const trip =
      await this.prisma.trip.findUnique({
        where: {
          id: tripId,
        },

        select: {
          id: true,
        },
      })

    if (!trip) {
      throw new NotFoundException(
        `Trip with ID ${tripId} was not found`,
      )
    }

    return this.prisma.fuelLog.findMany({
      where: {
        tripId,
      },

      include: fuelLogInclude,

      orderBy: [
        {
          fuelDate: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
    })
  }

  async create(
    createFuelLogDto: CreateFuelLogDto,
  ) {
    const driver =
      await this.prisma.driver.findUnique({
        where: {
          id: createFuelLogDto.driverId,
        },

        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true,
              status: true,
            },
          },
        },
      })

    if (!driver) {
      throw new NotFoundException(
        `Driver with ID ${createFuelLogDto.driverId} was not found`,
      )
    }

    if (driver.user.role !== 'DRIVER') {
      throw new BadRequestException(
        'The selected account is not a driver',
      )
    }

    if (
      driver.user.status !==
      UserStatus.ACTIVE
    ) {
      throw new BadRequestException(
        'An inactive driver cannot create a fuel log',
      )
    }

    const vehicle =
      await this.prisma.vehicle.findUnique({
        where: {
          id: createFuelLogDto.vehicleId,
        },
      })

    if (!vehicle) {
      throw new NotFoundException(
        `Vehicle with ID ${createFuelLogDto.vehicleId} was not found`,
      )
    }

    let connectedTrip:
      | {
          id: number
          driverId: number
          vehicleId: number
          status: TripStatus
        }
      | null = null

    if (createFuelLogDto.tripId) {
      connectedTrip =
        await this.prisma.trip.findUnique({
          where: {
            id: createFuelLogDto.tripId,
          },

          select: {
            id: true,
            driverId: true,
            vehicleId: true,
            status: true,
          },
        })

      if (!connectedTrip) {
        throw new NotFoundException(
          `Trip with ID ${createFuelLogDto.tripId} was not found`,
        )
      }

      if (
        connectedTrip.driverId !==
        createFuelLogDto.driverId
      ) {
        throw new BadRequestException(
          'The selected trip does not belong to this driver',
        )
      }

      if (
        connectedTrip.vehicleId !==
        createFuelLogDto.vehicleId
      ) {
        throw new BadRequestException(
          'The selected trip does not use this vehicle',
        )
      }

      if (
        connectedTrip.status ===
        TripStatus.CANCELLED
      ) {
        throw new BadRequestException(
          'A fuel log cannot be added to a cancelled trip',
        )
      }
    }

    const hasPermanentAssignment =
      driver.assignedVehicleId ===
      createFuelLogDto.vehicleId

    const activeVehicleTrip =
      await this.prisma.trip.findFirst({
        where: {
          driverId:
            createFuelLogDto.driverId,

          vehicleId:
            createFuelLogDto.vehicleId,

          status: {
            in: [
              TripStatus.SCHEDULED,
              TripStatus.IN_PROGRESS,
            ],
          },
        },

        select: {
          id: true,
        },
      })

    const isAllowedVehicle =
      hasPermanentAssignment ||
      Boolean(connectedTrip) ||
      Boolean(activeVehicleTrip)

    if (!isAllowedVehicle) {
      throw new BadRequestException(
        'This vehicle is not assigned to the selected driver',
      )
    }

    const fuelDate = new Date(
      createFuelLogDto.fuelDate,
    )

    if (
      Number.isNaN(fuelDate.getTime())
    ) {
      throw new BadRequestException(
        'Fuel date is invalid',
      )
    }

    return this.prisma.fuelLog.create({
      data: {
        vehicleId:
          createFuelLogDto.vehicleId,

        driverId:
          createFuelLogDto.driverId,

        tripId:
          createFuelLogDto.tripId,

        fuelDate,

        liters:
          createFuelLogDto.liters,

        cost: createFuelLogDto.cost,

        fuelStation:
          createFuelLogDto
            .fuelStation
            ?.trim() || null,

        receiptPhoto:
          createFuelLogDto
            .photoUrl
            ?.trim() || null,
      },

      include: fuelLogInclude,
    })
  }

  async update(
    id: number,
    updateFuelLogDto: UpdateFuelLogDto,
  ) {
    await this.findOne(id)

    const fuelDate =
      updateFuelLogDto.fuelDate !==
      undefined
        ? new Date(
            updateFuelLogDto.fuelDate,
          )
        : undefined

    if (
      fuelDate &&
      Number.isNaN(fuelDate.getTime())
    ) {
      throw new BadRequestException(
        'Fuel date is invalid',
      )
    }

    return this.prisma.fuelLog.update({
      where: {
        id,
      },

      data: {
        fuelDate,

        liters:
          updateFuelLogDto.liters,

        cost: updateFuelLogDto.cost,

        fuelStation:
          updateFuelLogDto
            .fuelStation !== undefined
            ? updateFuelLogDto
                .fuelStation.trim() || null
            : undefined,
      },

      include: fuelLogInclude,
    })
  }

  async remove(id: number) {
    await this.findOne(id)

    return this.prisma.fuelLog.delete({
      where: {
        id,
      },

      include: fuelLogInclude,
    })
  }

  private async ensureDriverExists(
    driverId: number,
  ) {
    const driver =
      await this.prisma.driver.findUnique({
        where: {
          id: driverId,
        },

        select: {
          id: true,
        },
      })

    if (!driver) {
      throw new NotFoundException(
        `Driver with ID ${driverId} was not found`,
      )
    }
  }

  private async ensureVehicleExists(
    vehicleId: number,
  ) {
    const vehicle =
      await this.prisma.vehicle.findUnique({
        where: {
          id: vehicleId,
        },

        select: {
          id: true,
        },
      })

    if (!vehicle) {
      throw new NotFoundException(
        `Vehicle with ID ${vehicleId} was not found`,
      )
    }
  }
}