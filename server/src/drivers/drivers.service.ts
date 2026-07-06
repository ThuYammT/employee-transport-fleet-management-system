import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateDriverDto } from './dto/create-driver.dto'
import { UpdateDriverDto } from './dto/update-driver.dto'

@Injectable()
export class DriversService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.driver.findMany({
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
            capacity: true,
            status: true,
            currentMileage: true,
          },
        },
      },
    })
  }

  async findOne(id: number) {
    const driver = await this.prisma.driver.findUnique({
      where: { id },
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
            capacity: true,
            status: true,
            currentMileage: true,
          },
        },
      },
    })

    if (!driver) {
      throw new NotFoundException(`Driver with ID ${id} not found`)
    }

    return driver
  }

  async create(createDriverDto: CreateDriverDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: createDriverDto.userId },
    })

    if (!user) {
      throw new NotFoundException(
        `User with ID ${createDriverDto.userId} not found`,
      )
    }

    if (user.role !== 'DRIVER') {
      throw new BadRequestException(
        `User with ID ${createDriverDto.userId} is not a DRIVER`,
      )
    }

    const existingDriver = await this.prisma.driver.findUnique({
      where: { userId: createDriverDto.userId },
    })

    if (existingDriver) {
      throw new BadRequestException(
        `User with ID ${createDriverDto.userId} already has a driver profile`,
      )
    }

    if (createDriverDto.assignedVehicleId) {
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: createDriverDto.assignedVehicleId },
      })

      if (!vehicle) {
        throw new NotFoundException(
          `Vehicle with ID ${createDriverDto.assignedVehicleId} not found`,
        )
      }
    }

    return this.prisma.driver.create({
      data: {
        user: {
          connect: { id: createDriverDto.userId },
        },
        licenseNumber: createDriverDto.licenseNumber,
        assignedVehicle: createDriverDto.assignedVehicleId
          ? {
              connect: { id: createDriverDto.assignedVehicleId },
            }
          : undefined,
      },
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
            capacity: true,
            status: true,
            currentMileage: true,
          },
        },
      },
    })
  }

  async update(id: number, updateDriverDto: UpdateDriverDto) {
    await this.findOne(id)

    if (updateDriverDto.userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: updateDriverDto.userId },
      })

      if (!user) {
        throw new NotFoundException(`User with ID ${updateDriverDto.userId} not found`)
      }

      if (user.role !== 'DRIVER') {
        throw new BadRequestException(
          `User with ID ${updateDriverDto.userId} is not a DRIVER`,
        )
      }
    }

    if (updateDriverDto.assignedVehicleId) {
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: updateDriverDto.assignedVehicleId },
      })

      if (!vehicle) {
        throw new NotFoundException(
          `Vehicle with ID ${updateDriverDto.assignedVehicleId} not found`,
        )
      }
    }

    return this.prisma.driver.update({
      where: { id },
      data: {
        user: updateDriverDto.userId
          ? {
              connect: { id: updateDriverDto.userId },
            }
          : undefined,
        licenseNumber: updateDriverDto.licenseNumber,
        assignedVehicle: updateDriverDto.assignedVehicleId
          ? {
              connect: { id: updateDriverDto.assignedVehicleId },
            }
          : undefined,
      },
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
            capacity: true,
            status: true,
            currentMileage: true,
          },
        },
      },
    })
  }

  async remove(id: number) {
    await this.findOne(id)

    return this.prisma.driver.delete({
      where: { id },
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
            capacity: true,
            status: true,
            currentMileage: true,
          },
        },
      },
    })
  }
}