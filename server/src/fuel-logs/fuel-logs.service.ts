import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateFuelLogDto } from './dto/create-fuel-log.dto'
import { UpdateFuelLogDto } from './dto/update-fuel-log.dto'

@Injectable()
export class FuelLogsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.fuelLog.findMany({
      include: {
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
              },
            },
          },
        },
        trip: true,
      },
    })
  }

  async findOne(id: number) {
    const fuelLog = await this.prisma.fuelLog.findUnique({
      where: { id },
      include: {
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
              },
            },
          },
        },
        trip: true,
      },
    })

    if (!fuelLog) {
      throw new NotFoundException(`Fuel Log with ID ${id} not found`)
    }

    return fuelLog
  }

  async create(createFuelLogDto: CreateFuelLogDto) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: createFuelLogDto.vehicleId },
    })

    if (!vehicle) {
      throw new NotFoundException(
        `Vehicle with ID ${createFuelLogDto.vehicleId} not found`,
      )
    }

    const driver = await this.prisma.driver.findUnique({
      where: { id: createFuelLogDto.driverId },
    })

    if (!driver) {
      throw new NotFoundException(
        `Driver with ID ${createFuelLogDto.driverId} not found`,
      )
    }

    if (createFuelLogDto.tripId) {
      const trip = await this.prisma.trip.findUnique({
        where: { id: createFuelLogDto.tripId },
      })

      if (!trip) {
        throw new NotFoundException(
          `Trip with ID ${createFuelLogDto.tripId} not found`,
        )
      }

      if (trip.vehicleId !== createFuelLogDto.vehicleId) {
        throw new BadRequestException(
          `Trip does not belong to Vehicle ID ${createFuelLogDto.vehicleId}`,
        )
      }

      if (trip.driverId !== createFuelLogDto.driverId) {
        throw new BadRequestException(
          `Trip does not belong to Driver ID ${createFuelLogDto.driverId}`,
        )
      }
    }

    if (createFuelLogDto.mileage < vehicle.currentMileage) {
      throw new BadRequestException(
        `Mileage cannot be lower than current vehicle mileage`,
      )
    }

    return this.prisma.$transaction(async (tx) => {
      const fuelLog = await tx.fuelLog.create({
        data: {
          vehicle: {
            connect: { id: createFuelLogDto.vehicleId },
          },
          driver: {
            connect: { id: createFuelLogDto.driverId },
          },
          trip: createFuelLogDto.tripId
            ? {
                connect: { id: createFuelLogDto.tripId },
              }
            : undefined,
          fuelDate: new Date(createFuelLogDto.fuelDate),
          liters: createFuelLogDto.liters,
          cost: createFuelLogDto.cost,
          mileage: createFuelLogDto.mileage,
          fuelStation: createFuelLogDto.fuelStation,
        },
        include: {
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
                },
              },
            },
          },
          trip: true,
        },
      })

      await tx.vehicle.update({
        where: { id: createFuelLogDto.vehicleId },
        data: {
          currentMileage: createFuelLogDto.mileage,
        },
      })

      return tx.fuelLog.findUnique({
        where: { id: fuelLog.id },
        include: {
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
                },
              },
            },
          },
          trip: true,
        },
      })
    })
  }

  async update(id: number, updateFuelLogDto: UpdateFuelLogDto) {
    await this.findOne(id)

    if (updateFuelLogDto.vehicleId) {
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: updateFuelLogDto.vehicleId },
      })

      if (!vehicle) {
        throw new NotFoundException(
          `Vehicle with ID ${updateFuelLogDto.vehicleId} not found`,
        )
      }
    }

    if (updateFuelLogDto.driverId) {
      const driver = await this.prisma.driver.findUnique({
        where: { id: updateFuelLogDto.driverId },
      })

      if (!driver) {
        throw new NotFoundException(
          `Driver with ID ${updateFuelLogDto.driverId} not found`,
        )
      }
    }

    if (updateFuelLogDto.tripId) {
      const trip = await this.prisma.trip.findUnique({
        where: { id: updateFuelLogDto.tripId },
      })

      if (!trip) {
        throw new NotFoundException(
          `Trip with ID ${updateFuelLogDto.tripId} not found`,
        )
      }
    }

    return this.prisma.fuelLog.update({
      where: { id },
      data: {
        vehicle: updateFuelLogDto.vehicleId
          ? {
              connect: { id: updateFuelLogDto.vehicleId },
            }
          : undefined,
        driver: updateFuelLogDto.driverId
          ? {
              connect: { id: updateFuelLogDto.driverId },
            }
          : undefined,
        trip: updateFuelLogDto.tripId
          ? {
              connect: { id: updateFuelLogDto.tripId },
            }
          : undefined,
        fuelDate: updateFuelLogDto.fuelDate
          ? new Date(updateFuelLogDto.fuelDate)
          : undefined,
        liters: updateFuelLogDto.liters,
        cost: updateFuelLogDto.cost,
        mileage: updateFuelLogDto.mileage,
        fuelStation: updateFuelLogDto.fuelStation,
      },
      include: {
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
              },
            },
          },
        },
        trip: true,
      },
    })
  }

  async remove(id: number) {
    await this.findOne(id)

    return this.prisma.fuelLog.delete({
      where: { id },
      include: {
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
              },
            },
          },
        },
        trip: true,
      },
    })
  }
}
oik