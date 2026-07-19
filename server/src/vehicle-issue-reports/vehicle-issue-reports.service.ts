import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {
  Prisma,
  TripStatus,
  UserStatus,
  VehicleIssueStatus,
} from '@prisma/client'

import {
  PrismaService,
} from '../prisma/prisma.service'

import {
  CreateVehicleIssueReportDto,
} from './dto/create-vehicle-issue-report.dto'

import {
  UpdateVehicleIssueReportDto,
} from './dto/update-vehicle-issue-report.dto'

const issueReportInclude = {
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
} satisfies Prisma.VehicleIssueReportInclude

@Injectable()
export class VehicleIssueReportsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  findAll() {
    return this.prisma.vehicleIssueReport
      .findMany({
        include: issueReportInclude,

        orderBy: {
          reportedAt: 'desc',
        },
      })
  }

  async findOne(id: number) {
    const report =
      await this.prisma.vehicleIssueReport
        .findUnique({
          where: {
            id,
          },

          include: issueReportInclude,
        })

    if (!report) {
      throw new NotFoundException(
        `Vehicle issue report with ID ${id} was not found`,
      )
    }

    return report
  }

  async findByDriverId(
    driverId: number,
  ) {
    await this.ensureDriverExists(driverId)

    return this.prisma.vehicleIssueReport
      .findMany({
        where: {
          driverId,
        },

        include: issueReportInclude,

        orderBy: {
          reportedAt: 'desc',
        },
      })
  }

  async findByVehicleId(
    vehicleId: number,
  ) {
    await this.ensureVehicleExists(
      vehicleId,
    )

    return this.prisma.vehicleIssueReport
      .findMany({
        where: {
          vehicleId,
        },

        include: issueReportInclude,

        orderBy: {
          reportedAt: 'desc',
        },
      })
  }

  async create(
    createDto:
      CreateVehicleIssueReportDto,
  ) {
    const driver =
      await this.prisma.driver.findUnique({
        where: {
          id: createDto.driverId,
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
        `Driver with ID ${createDto.driverId} was not found`,
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
        'An inactive driver cannot report a vehicle issue',
      )
    }

    const vehicle =
      await this.prisma.vehicle.findUnique({
        where: {
          id: createDto.vehicleId,
        },

        select: {
          id: true,
          plateNumber: true,
        },
      })

    if (!vehicle) {
      throw new NotFoundException(
        `Vehicle with ID ${createDto.vehicleId} was not found`,
      )
    }

    const hasPermanentAssignment =
      driver.assignedVehicleId ===
      createDto.vehicleId

    const relatedTrip =
      await this.prisma.trip.findFirst({
        where: {
          driverId: createDto.driverId,
          vehicleId: createDto.vehicleId,

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

    if (
      !hasPermanentAssignment &&
      !relatedTrip
    ) {
      throw new BadRequestException(
        `Vehicle ${vehicle.plateNumber} is not assigned to this driver`,
      )
    }

    const existingOpenReport =
      await this.prisma.vehicleIssueReport
        .findFirst({
          where: {
            vehicleId: createDto.vehicleId,

            driverId: createDto.driverId,

            issueTitle: {
              equals:
                createDto.issueTitle.trim(),

              mode: 'insensitive',
            },

            status: {
              in: [
                VehicleIssueStatus.REPORTED,
                VehicleIssueStatus.IN_PROGRESS,
              ],
            },
          },

          select: {
            id: true,
          },
        })

    if (existingOpenReport) {
      throw new BadRequestException(
        'A matching unresolved issue report already exists',
      )
    }

    return this.prisma.vehicleIssueReport
      .create({
        data: {
          vehicleId: createDto.vehicleId,
          driverId: createDto.driverId,

          issueTitle:
            createDto.issueTitle.trim(),

          description:
            createDto.description.trim(),

          status:
            VehicleIssueStatus.REPORTED,
        },

        include: issueReportInclude,
      })
  }

  async update(
    id: number,

    updateDto:
      UpdateVehicleIssueReportDto,
  ) {
    const report = await this.findOne(id)

    if (
      updateDto.status !== undefined
    ) {
      this.validateStatusTransition(
        report.status,
        updateDto.status,
      )
    }

    return this.prisma.vehicleIssueReport
      .update({
        where: {
          id,
        },

        data: {
          issueTitle:
            updateDto.issueTitle !==
            undefined
              ? updateDto.issueTitle.trim()
              : undefined,

          description:
            updateDto.description !==
            undefined
              ? updateDto.description.trim()
              : undefined,

          status: updateDto.status,
        },

        include: issueReportInclude,
      })
  }

  async startInvestigation(id: number) {
    const report = await this.findOne(id)

    if (
      report.status !==
      VehicleIssueStatus.REPORTED
    ) {
      throw new BadRequestException(
        'Only a reported issue can be moved to in progress',
      )
    }

    return this.prisma.vehicleIssueReport
      .update({
        where: {
          id,
        },

        data: {
          status:
            VehicleIssueStatus.IN_PROGRESS,
        },

        include: issueReportInclude,
      })
  }

  async resolve(id: number) {
    const report = await this.findOne(id)

    if (
      report.status ===
      VehicleIssueStatus.RESOLVED
    ) {
      throw new BadRequestException(
        'This vehicle issue is already resolved',
      )
    }

    return this.prisma.vehicleIssueReport
      .update({
        where: {
          id,
        },

        data: {
          status:
            VehicleIssueStatus.RESOLVED,
        },

        include: issueReportInclude,
      })
  }

  async reopen(id: number) {
    const report = await this.findOne(id)

    if (
      report.status !==
      VehicleIssueStatus.RESOLVED
    ) {
      throw new BadRequestException(
        'Only a resolved issue can be reopened',
      )
    }

    return this.prisma.vehicleIssueReport
      .update({
        where: {
          id,
        },

        data: {
          status:
            VehicleIssueStatus.REPORTED,
        },

        include: issueReportInclude,
      })
  }

  async remove(id: number) {
    const report = await this.findOne(id)

    if (
      report.status ===
      VehicleIssueStatus.IN_PROGRESS
    ) {
      throw new BadRequestException(
        'An issue under investigation cannot be deleted',
      )
    }

    return this.prisma.vehicleIssueReport
      .delete({
        where: {
          id,
        },

        include: issueReportInclude,
      })
  }

  private validateStatusTransition(
    currentStatus: VehicleIssueStatus,
    nextStatus: VehicleIssueStatus,
  ) {
    if (currentStatus === nextStatus) {
      return
    }

    const allowedTransitions: Record<
      VehicleIssueStatus,
      VehicleIssueStatus[]
    > = {
      REPORTED: [
        VehicleIssueStatus.IN_PROGRESS,
        VehicleIssueStatus.RESOLVED,
      ],

      IN_PROGRESS: [
        VehicleIssueStatus.RESOLVED,
      ],

      RESOLVED: [
        VehicleIssueStatus.REPORTED,
      ],
    }

    if (
      !allowedTransitions[
        currentStatus
      ].includes(nextStatus)
    ) {
      throw new BadRequestException(
        `Issue status cannot change from ${currentStatus} to ${nextStatus}`,
      )
    }
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