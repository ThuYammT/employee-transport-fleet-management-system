import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'

import {
  MaintenanceStatus,
  Prisma,
  TripStatus,
  VehicleStatus,
} from '@prisma/client'

import { PrismaService } from '../prisma/prisma.service'
import { CreateMaintenanceLogDto } from './dto/create-maintenance-log.dto'
import { UpdateMaintenanceLogDto } from './dto/update-maintenance-log.dto'

const maintenanceLogInclude = {
  vehicle: {
    include: {
      assignedDrivers: {
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
    },
  },
} satisfies Prisma.MaintenanceLogInclude

@Injectable()
export class MaintenanceLogsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  findAll() {
    return this.prisma.maintenanceLog.findMany({
      include: maintenanceLogInclude,

      orderBy: [
        {
          serviceDate: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
    })
  }

  async findOne(id: number) {
    const maintenanceLog =
      await this.prisma.maintenanceLog.findUnique({
        where: {
          id,
        },

        include: maintenanceLogInclude,
      })

    if (!maintenanceLog) {
      throw new NotFoundException(
        `Maintenance log with ID ${id} was not found`,
      )
    }

    return maintenanceLog
  }

  async findByVehicleId(
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

    return this.prisma.maintenanceLog.findMany({
      where: {
        vehicleId,
      },

      include: maintenanceLogInclude,

      orderBy: [
        {
          serviceDate: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
    })
  }

  async create(
    createMaintenanceLogDto: CreateMaintenanceLogDto,
  ) {
    const vehicle =
      await this.prisma.vehicle.findUnique({
        where: {
          id: createMaintenanceLogDto.vehicleId,
        },

        include: {
          trips: {
            where: {
              status: {
                in: [
                  TripStatus.SCHEDULED,
                  TripStatus.IN_PROGRESS,
                ],
              },
            },

            select: {
              id: true,
              status: true,
            },

            take: 1,
          },
        },
      })

    if (!vehicle) {
      throw new NotFoundException(
        `Vehicle with ID ${createMaintenanceLogDto.vehicleId} was not found`,
      )
    }

    if (
      vehicle.status ===
      VehicleStatus.INACTIVE
    ) {
      throw new BadRequestException(
        'An inactive vehicle cannot be placed under maintenance',
      )
    }

    if (
      vehicle.status ===
      VehicleStatus.IN_USE
    ) {
      throw new BadRequestException(
        'A vehicle currently in use cannot be placed under maintenance',
      )
    }

    if (vehicle.trips.length > 0) {
      throw new BadRequestException(
        'This vehicle has a scheduled or active trip and cannot be placed under maintenance',
      )
    }

    const activeMaintenance =
      await this.prisma.maintenanceLog.findFirst({
        where: {
          vehicleId:
            createMaintenanceLogDto.vehicleId,

          status: {
            in: [
              MaintenanceStatus.PENDING,
              MaintenanceStatus.IN_PROGRESS,
            ],
          },
        },

        select: {
          id: true,
          status: true,
        },
      })

    if (activeMaintenance) {
      throw new BadRequestException(
        `Vehicle already has an active maintenance record with ID ${activeMaintenance.id}`,
      )
    }

    const serviceDate = this.parseDate(
      createMaintenanceLogDto.serviceDate,
      'Service date',
    )

    const nextServiceDate =
      createMaintenanceLogDto.nextServiceDate
        ? this.parseDate(
            createMaintenanceLogDto.nextServiceDate,
            'Next service date',
          )
        : null

    this.validateNextServiceDate(
      serviceDate,
      nextServiceDate,
    )

    return this.prisma.$transaction(
      async (transaction) => {
        const currentVehicle =
          await transaction.vehicle.findUnique({
            where: {
              id: createMaintenanceLogDto.vehicleId,
            },

            select: {
              id: true,
              status: true,
            },
          })

        if (!currentVehicle) {
          throw new NotFoundException(
            'The selected vehicle no longer exists',
          )
        }

        if (
          currentVehicle.status !==
          VehicleStatus.AVAILABLE
        ) {
          throw new BadRequestException(
            'Only an available vehicle can be placed under maintenance',
          )
        }

        const duplicateActiveMaintenance =
          await transaction.maintenanceLog.findFirst({
            where: {
              vehicleId:
                createMaintenanceLogDto.vehicleId,

              status: {
                in: [
                  MaintenanceStatus.PENDING,
                  MaintenanceStatus.IN_PROGRESS,
                ],
              },
            },

            select: {
              id: true,
            },
          })

        if (duplicateActiveMaintenance) {
          throw new BadRequestException(
            'This vehicle already has an active maintenance record',
          )
        }

        const maintenanceLog =
          await transaction.maintenanceLog.create({
            data: {
              vehicleId:
                createMaintenanceLogDto.vehicleId,

              serviceDate,

              description:
                createMaintenanceLogDto.description.trim(),

              cost:
                createMaintenanceLogDto.cost,

              nextServiceDate,

              status:
                MaintenanceStatus.PENDING,
            },
          })

        await transaction.vehicle.update({
          where: {
            id: createMaintenanceLogDto.vehicleId,
          },

          data: {
            status:
              VehicleStatus.MAINTENANCE,
          },
        })

        return transaction.maintenanceLog.findUnique({
          where: {
            id: maintenanceLog.id,
          },

          include: maintenanceLogInclude,
        })
      },
    )
  }

  async update(
    id: number,
    updateMaintenanceLogDto: UpdateMaintenanceLogDto,
  ) {
    const maintenanceLog =
      await this.findOne(id)

    if (
      maintenanceLog.status ===
      MaintenanceStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'A completed maintenance record cannot be edited',
      )
    }

    const serviceDate =
      updateMaintenanceLogDto.serviceDate !==
      undefined
        ? this.parseDate(
            updateMaintenanceLogDto.serviceDate,
            'Service date',
          )
        : maintenanceLog.serviceDate

    let nextServiceDate:
      | Date
      | null
      | undefined

    if (
      updateMaintenanceLogDto.nextServiceDate ===
      null
    ) {
      nextServiceDate = null
    } else if (
      updateMaintenanceLogDto.nextServiceDate !==
      undefined
    ) {
      nextServiceDate = this.parseDate(
        updateMaintenanceLogDto.nextServiceDate,
        'Next service date',
      )
    } else {
      nextServiceDate =
        maintenanceLog.nextServiceDate
    }

    this.validateNextServiceDate(
      serviceDate,
      nextServiceDate ?? null,
    )

    return this.prisma.maintenanceLog.update({
      where: {
        id,
      },

      data: {
        serviceDate:
          updateMaintenanceLogDto.serviceDate !==
          undefined
            ? serviceDate
            : undefined,

        description:
          updateMaintenanceLogDto.description !==
          undefined
            ? updateMaintenanceLogDto.description.trim()
            : undefined,

        cost:
          updateMaintenanceLogDto.cost,

        nextServiceDate:
          updateMaintenanceLogDto.nextServiceDate !==
          undefined
            ? nextServiceDate
            : undefined,
      },

      include: maintenanceLogInclude,
    })
  }

  async start(id: number) {
    const maintenanceLog =
      await this.findOne(id)

    if (
      maintenanceLog.status !==
      MaintenanceStatus.PENDING
    ) {
      throw new BadRequestException(
        'Only pending maintenance can be started',
      )
    }

    if (
      maintenanceLog.vehicle.status !==
      VehicleStatus.MAINTENANCE
    ) {
      throw new BadRequestException(
        'The vehicle must be in maintenance status before work can begin',
      )
    }

    return this.prisma.maintenanceLog.update({
      where: {
        id,
      },

      data: {
        status:
          MaintenanceStatus.IN_PROGRESS,
      },

      include: maintenanceLogInclude,
    })
  }

  async complete(id: number) {
    const maintenanceLog =
      await this.findOne(id)

    if (
      maintenanceLog.status ===
      MaintenanceStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'This maintenance record is already completed',
      )
    }

    if (
      maintenanceLog.status !==
      MaintenanceStatus.IN_PROGRESS
    ) {
      throw new BadRequestException(
        'Maintenance must be started before it can be completed',
      )
    }

    return this.prisma.$transaction(
      async (transaction) => {
        await transaction.maintenanceLog.update({
          where: {
            id,
          },

          data: {
            status:
              MaintenanceStatus.COMPLETED,
          },
        })

        const otherActiveMaintenance =
          await transaction.maintenanceLog.findFirst({
            where: {
              vehicleId:
                maintenanceLog.vehicleId,

              id: {
                not: id,
              },

              status: {
                in: [
                  MaintenanceStatus.PENDING,
                  MaintenanceStatus.IN_PROGRESS,
                ],
              },
            },

            select: {
              id: true,
            },
          })

        if (!otherActiveMaintenance) {
          await transaction.vehicle.update({
            where: {
              id: maintenanceLog.vehicleId,
            },

            data: {
              status:
                VehicleStatus.AVAILABLE,
            },
          })
        }

        return transaction.maintenanceLog.findUnique({
          where: {
            id,
          },

          include: maintenanceLogInclude,
        })
      },
    )
  }

  async reopen(id: number) {
    const maintenanceLog =
      await this.findOne(id)

    if (
      maintenanceLog.status !==
      MaintenanceStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'Only completed maintenance can be reopened',
      )
    }

    const vehicle =
      await this.prisma.vehicle.findUnique({
        where: {
          id: maintenanceLog.vehicleId,
        },

        include: {
          trips: {
            where: {
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

            take: 1,
          },
        },
      })

    if (!vehicle) {
      throw new NotFoundException(
        'The vehicle connected to this maintenance record no longer exists',
      )
    }

    if (
      vehicle.status !==
      VehicleStatus.AVAILABLE
    ) {
      throw new BadRequestException(
        'Only an available vehicle can have maintenance reopened',
      )
    }

    if (vehicle.trips.length > 0) {
      throw new BadRequestException(
        'Maintenance cannot be reopened while the vehicle has a scheduled or active trip',
      )
    }

    const otherActiveMaintenance =
      await this.prisma.maintenanceLog.findFirst({
        where: {
          vehicleId:
            maintenanceLog.vehicleId,

          id: {
            not: id,
          },

          status: {
            in: [
              MaintenanceStatus.PENDING,
              MaintenanceStatus.IN_PROGRESS,
            ],
          },
        },

        select: {
          id: true,
        },
      })

    if (otherActiveMaintenance) {
      throw new BadRequestException(
        'Another active maintenance record already exists for this vehicle',
      )
    }

    return this.prisma.$transaction(
      async (transaction) => {
        await transaction.vehicle.update({
          where: {
            id: maintenanceLog.vehicleId,
          },

          data: {
            status:
              VehicleStatus.MAINTENANCE,
          },
        })

        return transaction.maintenanceLog.update({
          where: {
            id,
          },

          data: {
            status:
              MaintenanceStatus.PENDING,
          },

          include: maintenanceLogInclude,
        })
      },
    )
  }

  async remove(id: number) {
    const maintenanceLog =
      await this.findOne(id)

    if (
      maintenanceLog.status ===
      MaintenanceStatus.IN_PROGRESS
    ) {
      throw new BadRequestException(
        'Maintenance currently in progress cannot be deleted',
      )
    }

    return this.prisma.$transaction(
      async (transaction) => {
        const deletedLog =
          await transaction.maintenanceLog.delete({
            where: {
              id,
            },

            include: maintenanceLogInclude,
          })

        if (
          maintenanceLog.status ===
          MaintenanceStatus.PENDING
        ) {
          const otherActiveMaintenance =
            await transaction.maintenanceLog.findFirst({
              where: {
                vehicleId:
                  maintenanceLog.vehicleId,

                status: {
                  in: [
                    MaintenanceStatus.PENDING,
                    MaintenanceStatus.IN_PROGRESS,
                  ],
                },
              },

              select: {
                id: true,
              },
            })

          if (!otherActiveMaintenance) {
            await transaction.vehicle.update({
              where: {
                id: maintenanceLog.vehicleId,
              },

              data: {
                status:
                  VehicleStatus.AVAILABLE,
              },
            })
          }
        }

        return deletedLog
      },
    )
  }

  private parseDate(
    value: string,
    fieldName: string,
  ): Date {
    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(
        `${fieldName} is invalid`,
      )
    }

    return date
  }

  private validateNextServiceDate(
    serviceDate: Date,
    nextServiceDate: Date | null,
  ) {
    if (
      nextServiceDate &&
      nextServiceDate <= serviceDate
    ) {
      throw new BadRequestException(
        'Next service date must be later than the service date',
      )
    }
  }
}