import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {
  Prisma,
  TransportRequestStatus,
} from '@prisma/client'

import { PrismaService } from '../prisma/prisma.service'
import { CreateTransportRequestDto } from './dto/create-transport-request.dto'
import { UpdateTransportRequestDto } from './dto/update-transport-request.dto'

const transportRequestInclude = {
  employee: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      status: true,
    },
  },

  trip: {
    include: {
      driver: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
              status: true,
            },
          },
        },
      },

      vehicle: true,
    },
  },
} satisfies Prisma.TransportRequestInclude

@Injectable()
export class TransportRequestsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  findAll() {
    return this.prisma.transportRequest.findMany({
      include: transportRequestInclude,

      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  async findOne(id: number) {
    const request =
      await this.prisma.transportRequest.findUnique({
        where: {
          id,
        },

        include: transportRequestInclude,
      })

    if (!request) {
      throw new NotFoundException(
        `Transport request with ID ${id} was not found`,
      )
    }

    return request
  }

  async create(
    createDto: CreateTransportRequestDto,
  ) {
    const employee =
      await this.prisma.user.findUnique({
        where: {
          id: createDto.employeeId,
        },
      })

    if (!employee) {
      throw new NotFoundException(
        `Employee with ID ${createDto.employeeId} was not found`,
      )
    }

    if (employee.role !== 'EMPLOYEE') {
      throw new BadRequestException(
        `User with ID ${createDto.employeeId} is not an employee`,
      )
    }

    if (employee.status !== 'ACTIVE') {
      throw new BadRequestException(
        'An inactive employee cannot create a transport request',
      )
    }

    return this.prisma.transportRequest.create({
      data: {
        employeeId: createDto.employeeId,
        pickupLocation:
          createDto.pickupLocation.trim(),
        destination:
          createDto.destination.trim(),
        requestDate: new Date(
          createDto.requestDate,
        ),
        requestTime: createDto.requestTime,
        purpose: createDto.purpose.trim(),
      },

      include: transportRequestInclude,
    })
  }

  async update(
    id: number,
    updateDto: UpdateTransportRequestDto,
  ) {
    const existingRequest = await this.findOne(id)

    if (
      existingRequest.trip &&
      updateDto.status &&
      updateDto.status !==
        TransportRequestStatus.APPROVED
    ) {
      throw new BadRequestException(
        'A request with an assigned trip cannot be rejected or cancelled',
      )
    }

    if (updateDto.employeeId) {
      const employee =
        await this.prisma.user.findUnique({
          where: {
            id: updateDto.employeeId,
          },
        })

      if (!employee) {
        throw new NotFoundException(
          `Employee with ID ${updateDto.employeeId} was not found`,
        )
      }

      if (employee.role !== 'EMPLOYEE') {
        throw new BadRequestException(
          `User with ID ${updateDto.employeeId} is not an employee`,
        )
      }
    }

    return this.prisma.transportRequest.update({
      where: {
        id,
      },

      data: {
        employeeId: updateDto.employeeId,

        pickupLocation:
          updateDto.pickupLocation?.trim(),

        destination:
          updateDto.destination?.trim(),

        requestDate: updateDto.requestDate
          ? new Date(updateDto.requestDate)
          : undefined,

        requestTime: updateDto.requestTime,

        purpose: updateDto.purpose?.trim(),

        status: updateDto.status,
      },

      include: transportRequestInclude,
    })
  }

  async remove(id: number) {
    const request = await this.findOne(id)

    if (request.trip) {
      throw new BadRequestException(
        'A transport request with an assigned trip cannot be deleted',
      )
    }

    return this.prisma.transportRequest.delete({
      where: {
        id,
      },
    })
  }
}