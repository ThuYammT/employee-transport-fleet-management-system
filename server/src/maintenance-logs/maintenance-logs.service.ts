import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateMaintenanceLogDto } from './dto/create-maintenance-log.dto'
import { UpdateMaintenanceLogDto } from './dto/update-maintenance-log.dto'

@Injectable()
export class MaintenanceLogsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.maintenanceLog.findMany({
      include: {
        vehicle: true,
      },
    })
  }

  async findOne(id: number) {
    const maintenanceLog = await this.prisma.maintenanceLog.findUnique({
      where: { id },
      include: {
        vehicle: true,
      },
    })

    if (!maintenanceLog) {
      throw new NotFoundException(`Maintenance Log with ID ${id} not found`)
    }

    return maintenanceLog
  }

  async create(createMaintenanceLogDto: CreateMaintenanceLogDto) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: createMaintenanceLogDto.vehicleId },
    })

    if (!vehicle) {
      throw new NotFoundException(
        `Vehicle with ID ${createMaintenanceLogDto.vehicleId} not found`,
      )
    }

    return this.prisma.maintenanceLog.create({
      data: {
        vehicle: {
          connect: { id: createMaintenanceLogDto.vehicleId },
        },
        serviceDate: new Date(createMaintenanceLogDto.serviceDate),
        description: createMaintenanceLogDto.description,
        cost: createMaintenanceLogDto.cost,
        nextServiceDate: createMaintenanceLogDto.nextServiceDate
          ? new Date(createMaintenanceLogDto.nextServiceDate)
          : undefined,
      },
      include: {
        vehicle: true,
      },
    })
  }

  async update(id: number, updateMaintenanceLogDto: UpdateMaintenanceLogDto) {
    await this.findOne(id)

    if (updateMaintenanceLogDto.vehicleId) {
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: updateMaintenanceLogDto.vehicleId },
      })

      if (!vehicle) {
        throw new NotFoundException(
          `Vehicle with ID ${updateMaintenanceLogDto.vehicleId} not found`,
        )
      }
    }

    return this.prisma.maintenanceLog.update({
      where: { id },
      data: {
        vehicle: updateMaintenanceLogDto.vehicleId
          ? {
              connect: { id: updateMaintenanceLogDto.vehicleId },
            }
          : undefined,
        serviceDate: updateMaintenanceLogDto.serviceDate
          ? new Date(updateMaintenanceLogDto.serviceDate)
          : undefined,
        description: updateMaintenanceLogDto.description,
        cost: updateMaintenanceLogDto.cost,
        nextServiceDate: updateMaintenanceLogDto.nextServiceDate
          ? new Date(updateMaintenanceLogDto.nextServiceDate)
          : undefined,
        status: updateMaintenanceLogDto.status,
      },
      include: {
        vehicle: true,
      },
    })
  }

  async remove(id: number) {
    await this.findOne(id)

    return this.prisma.maintenanceLog.delete({
      where: { id },
      include: {
        vehicle: true,
      },
    })
  }
}