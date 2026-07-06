import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateTripDto } from './dto/create-trip.dto'
import { UpdateTripDto } from './dto/update-trip.dto'

@Injectable()
export class TripsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.trip.findMany({
      include: {
        request: true,
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
        vehicle: true,
      },
    })
  }

  async findOne(id: number) {
    const trip = await this.prisma.trip.findUnique({
      where: { id },
      include: {
        request: true,
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
        vehicle: true,
      },
    })

    if (!trip) {
      throw new NotFoundException(`Trip with ID ${id} not found`)
    }

    return trip
  }

  async create(createTripDto: CreateTripDto) {
    const request = await this.prisma.transportRequest.findUnique({
      where: { id: createTripDto.requestId },
    })

    if (!request) {
      throw new NotFoundException(
        `Transport Request with ID ${createTripDto.requestId} not found`,
      )
    }

    if (request.status !== 'APPROVED') {
      throw new BadRequestException(
        `Transport Request must be APPROVED before creating a trip`,
      )
    }

    const driver = await this.prisma.driver.findUnique({
      where: { id: createTripDto.driverId },
    })

    if (!driver) {
      throw new NotFoundException(
        `Driver with ID ${createTripDto.driverId} not found`,
      )
    }

    if (driver.availabilityStatus !== 'AVAILABLE') {
      throw new BadRequestException(`Driver is not available`)
    }

    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: createTripDto.vehicleId },
    })

    if (!vehicle) {
      throw new NotFoundException(
        `Vehicle with ID ${createTripDto.vehicleId} not found`,
      )
    }

    if (vehicle.status !== 'AVAILABLE') {
      throw new BadRequestException(`Vehicle is not available`)
    }

    return this.prisma.$transaction(async (tx) => {
      const trip = await tx.trip.create({
        data: {
          request: {
            connect: { id: createTripDto.requestId },
          },
          driver: {
            connect: { id: createTripDto.driverId },
          },
          vehicle: {
            connect: { id: createTripDto.vehicleId },
          },
        },
        include: {
          request: true,
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
          vehicle: true,
        },
      })

      await tx.driver.update({
        where: { id: createTripDto.driverId },
        data: {
          availabilityStatus: 'ON_TRIP',
        },
      })

      await tx.vehicle.update({
        where: { id: createTripDto.vehicleId },
        data: {
          status: 'IN_USE',
        },
      })

      return trip
    })
  }

  async update(id: number, updateTripDto: UpdateTripDto) {
    await this.findOne(id)

    if (updateTripDto.requestId) {
      const request = await this.prisma.transportRequest.findUnique({
        where: { id: updateTripDto.requestId },
      })

      if (!request) {
        throw new NotFoundException(
          `Transport Request with ID ${updateTripDto.requestId} not found`,
        )
      }
    }

    if (updateTripDto.driverId) {
      const driver = await this.prisma.driver.findUnique({
        where: { id: updateTripDto.driverId },
      })

      if (!driver) {
        throw new NotFoundException(
          `Driver with ID ${updateTripDto.driverId} not found`,
        )
      }
    }

    if (updateTripDto.vehicleId) {
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: updateTripDto.vehicleId },
      })

      if (!vehicle) {
        throw new NotFoundException(
          `Vehicle with ID ${updateTripDto.vehicleId} not found`,
        )
      }
    }

    return this.prisma.trip.update({
      where: { id },
      data: {
        request: updateTripDto.requestId
          ? { connect: { id: updateTripDto.requestId } }
          : undefined,
        driver: updateTripDto.driverId
          ? { connect: { id: updateTripDto.driverId } }
          : undefined,
        vehicle: updateTripDto.vehicleId
          ? { connect: { id: updateTripDto.vehicleId } }
          : undefined,
      },
      include: {
        request: true,
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
        vehicle: true,
      },
    })
  }

  async remove(id: number) {
    await this.findOne(id)

    return this.prisma.trip.delete({
      where: { id },
      include: {
        request: true,
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
        vehicle: true,
      },
    })
  }
}