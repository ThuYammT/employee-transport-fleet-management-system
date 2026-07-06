import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateVehicleIssueReportDto } from './dto/create-vehicle-issue-report.dto'
import { UpdateVehicleIssueReportDto } from './dto/update-vehicle-issue-report.dto'

@Injectable()
export class VehicleIssueReportsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.vehicleIssueReport.findMany({
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
      },
    })
  }

  async findOne(id: number) {
    const report = await this.prisma.vehicleIssueReport.findUnique({
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
      },
    })

    if (!report) {
      throw new NotFoundException(
        `Vehicle Issue Report with ID ${id} not found`,
      )
    }

    return report
  }

  async create(createDto: CreateVehicleIssueReportDto) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: createDto.vehicleId },
    })

    if (!vehicle) {
      throw new NotFoundException(
        `Vehicle with ID ${createDto.vehicleId} not found`,
      )
    }

    const driver = await this.prisma.driver.findUnique({
      where: { id: createDto.driverId },
    })

    if (!driver) {
      throw new NotFoundException(
        `Driver with ID ${createDto.driverId} not found`,
      )
    }

    if (driver.assignedVehicleId !== createDto.vehicleId) {
      throw new BadRequestException(
        `Driver ID ${createDto.driverId} is not assigned to Vehicle ID ${createDto.vehicleId}`,
      )
    }

    return this.prisma.vehicleIssueReport.create({
      data: {
        vehicle: {
          connect: { id: createDto.vehicleId },
        },
        driver: {
          connect: { id: createDto.driverId },
        },
        issueTitle: createDto.issueTitle,
        description: createDto.description,
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
      },
    })
  }

  async update(id: number, updateDto: UpdateVehicleIssueReportDto) {
    await this.findOne(id)

    if (updateDto.vehicleId) {
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: updateDto.vehicleId },
      })

      if (!vehicle) {
        throw new NotFoundException(
          `Vehicle with ID ${updateDto.vehicleId} not found`,
        )
      }
    }

    if (updateDto.driverId) {
      const driver = await this.prisma.driver.findUnique({
        where: { id: updateDto.driverId },
      })

      if (!driver) {
        throw new NotFoundException(
          `Driver with ID ${updateDto.driverId} not found`,
        )
      }
    }

    return this.prisma.vehicleIssueReport.update({
      where: { id },
      data: {
        vehicle: updateDto.vehicleId
          ? {
              connect: { id: updateDto.vehicleId },
            }
          : undefined,
        driver: updateDto.driverId
          ? {
              connect: { id: updateDto.driverId },
            }
          : undefined,
        issueTitle: updateDto.issueTitle,
        description: updateDto.description,
        status: updateDto.status,
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
      },
    })
  }

  async remove(id: number) {
    await this.findOne(id)

    return this.prisma.vehicleIssueReport.delete({
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
      },
    })
  }
}