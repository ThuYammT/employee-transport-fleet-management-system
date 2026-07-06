import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateTransportRequestDto } from './dto/create-transport-request.dto'
import { UpdateTransportRequestDto } from './dto/update-transport-request.dto'

@Injectable()
export class TransportRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.transportRequest.findMany({
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            phone: true,
          },
        },
      },
    })
  }

  async findOne(id: number) {
    const request = await this.prisma.transportRequest.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            phone: true,
          },
        },
      },
    })

    if (!request) {
      throw new NotFoundException(
        `Transport Request with ID ${id} not found`,
      )
    }

    return request
  }

  async create(createDto: CreateTransportRequestDto) {
    const employee = await this.prisma.user.findUnique({
      where: { id: createDto.employeeId },
    })

    if (!employee) {
      throw new NotFoundException(
        `Employee with ID ${createDto.employeeId} not found`,
      )
    }

    if (employee.role !== 'EMPLOYEE') {
      throw new BadRequestException(
        `User with ID ${createDto.employeeId} is not an EMPLOYEE`,
      )
    }

    return this.prisma.transportRequest.create({
      data: {
        employee: {
          connect: {
            id: createDto.employeeId,
          },
        },
        pickupLocation: createDto.pickupLocation,
        destination: createDto.destination,
        requestDate: new Date(createDto.requestDate),
        requestTime: createDto.requestTime,
        purpose: createDto.purpose,
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            phone: true,
          },
        },
      },
    })
  }

  async update(id: number, updateDto: UpdateTransportRequestDto) {
    await this.findOne(id)

    if (updateDto.employeeId) {
      const employee = await this.prisma.user.findUnique({
        where: { id: updateDto.employeeId },
      })

      if (!employee) {
        throw new NotFoundException(
          `Employee with ID ${updateDto.employeeId} not found`,
        )
      }

      if (employee.role !== 'EMPLOYEE') {
        throw new BadRequestException(
          `User with ID ${updateDto.employeeId} is not an EMPLOYEE`,
        )
      }
    }

    return this.prisma.transportRequest.update({
      where: { id },
      data: {
        employee: updateDto.employeeId
          ? {
              connect: {
                id: updateDto.employeeId,
              },
            }
          : undefined,

        pickupLocation: updateDto.pickupLocation,
        destination: updateDto.destination,
        requestDate: updateDto.requestDate
          ? new Date(updateDto.requestDate)
          : undefined,
        requestTime: updateDto.requestTime,
        purpose: updateDto.purpose,
        status: updateDto.status,
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            phone: true,
          },
        },
      },
    })
  }

  async remove(id: number) {
    await this.findOne(id)

    return this.prisma.transportRequest.delete({
      where: { id },
    })
  }
}