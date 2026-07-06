import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateVehicleDto } from './dto/create-vehicle.dto'
import { UpdateVehicleDto } from './dto/update-vehicle.dto'

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.vehicle.findMany({
      select: {
        id: true,
        plateNumber: true,
        vehicleType: true,
        capacity: true,
        status: true,
        currentMileage: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  }

  async findOne(id: number) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      select: {
        id: true,
        plateNumber: true,
        vehicleType: true,
        capacity: true,
        status: true,
        currentMileage: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`)
    }

    return vehicle
  }

  create(createVehicleDto: CreateVehicleDto) {
    return this.prisma.vehicle.create({
      data: {
        plateNumber: createVehicleDto.plateNumber,
        vehicleType: createVehicleDto.vehicleType,
        capacity: createVehicleDto.capacity,
      },
      select: {
        id: true,
        plateNumber: true,
        vehicleType: true,
        capacity: true,
        status: true,
        currentMileage: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  }

  async update(id: number, updateVehicleDto: UpdateVehicleDto) {
    await this.findOne(id)

    return this.prisma.vehicle.update({
      where: { id },
      data: {
        plateNumber: updateVehicleDto.plateNumber,
        vehicleType: updateVehicleDto.vehicleType,
        capacity: updateVehicleDto.capacity,
      },
      select: {
        id: true,
        plateNumber: true,
        vehicleType: true,
        capacity: true,
        status: true,
        currentMileage: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  }

  async remove(id: number) {
    await this.findOne(id)

    return this.prisma.vehicle.delete({
      where: { id },
      select: {
        id: true,
        plateNumber: true,
        vehicleType: true,
        capacity: true,
        status: true,
        currentMileage: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  }
}