import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {
  DriverAvailabilityStatus,
  Prisma,
  UserRole,
  UserStatus,
} from '@prisma/client'
import * as bcrypt from 'bcrypt'

import {
  assertNoInProgressTrip,
  restoreVehicleIfIdle,
} from '../prisma/cascade-delete'
import { PrismaService } from '../prisma/prisma.service'
import { CreateDriverDto } from './dto/create-driver.dto'
import { UpdateDriverDto } from './dto/update-driver.dto'

@Injectable()
export class DriversService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

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
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  async findOne(id: number) {
    const driver = await this.prisma.driver.findUnique({
      where: {
        id,
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

    if (!driver) {
      throw new NotFoundException(
        `Driver with ID ${id} was not found`,
      )
    }

    return driver
  }

  async findByUserId(userId: number) {
    const driver = await this.prisma.driver.findUnique({
      where: {
        userId,
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

    if (!driver) {
      throw new NotFoundException(
        `No driver profile exists for user ID ${userId}`,
      )
    }

    return driver
  }

  async create(
    createDriverDto: CreateDriverDto,
  ) {
    const normalizedEmail =
      createDriverDto.email.trim().toLowerCase()

    const existingUser =
      await this.prisma.user.findUnique({
        where: {
          email: normalizedEmail,
        },
        select: {
          id: true,
        },
      })

    if (existingUser) {
      throw new ConflictException(
        'An account with this email already exists',
      )
    }

    if (createDriverDto.assignedVehicleId) {
      await this.validateVehicleAssignment(
        createDriverDto.assignedVehicleId,
      )
    }

    const passwordHash = await bcrypt.hash(
      createDriverDto.password,
      12,
    )

    try {
      return await this.prisma.$transaction(
        async (transaction) => {
          const user = await transaction.user.create({
            data: {
              name: createDriverDto.name.trim(),
              email: normalizedEmail,
              passwordHash,
              phone:
                createDriverDto.phone?.trim() || null,
              role: UserRole.DRIVER,
              status: UserStatus.ACTIVE,
            },
          })

          return transaction.driver.create({
            data: {
              user: {
                connect: {
                  id: user.id,
                },
              },
              licenseNumber:
                createDriverDto.licenseNumber.trim(),
              availabilityStatus:
                DriverAvailabilityStatus.AVAILABLE,
              assignedVehicle:
                createDriverDto.assignedVehicleId
                  ? {
                      connect: {
                        id: createDriverDto.assignedVehicleId,
                      },
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
        },
      )
    } catch (error) {
      this.handlePrismaError(error)
      throw error
    }
  }

  async update(
    id: number,
    updateDriverDto: UpdateDriverDto,
  ) {
    const existingDriver = await this.findOne(id)
    const vehicleAssignmentIsChanging =
      updateDriverDto.assignedVehicleId !== undefined &&
      updateDriverDto.assignedVehicleId !==
        existingDriver.assignedVehicleId

    if (
      vehicleAssignmentIsChanging &&
      existingDriver.availabilityStatus ===
        DriverAvailabilityStatus.ON_TRIP
    ) {
      throw new BadRequestException(
        'Vehicle assignment cannot be changed while the driver has an active trip',
      )
    }

    let normalizedEmail: string | undefined

    if (updateDriverDto.email !== undefined) {
      normalizedEmail =
        updateDriverDto.email.trim().toLowerCase()

      const userWithEmail =
        await this.prisma.user.findUnique({
          where: {
            email: normalizedEmail,
          },
          select: {
            id: true,
          },
        })

      if (
        userWithEmail &&
        userWithEmail.id !== existingDriver.userId
      ) {
        throw new ConflictException(
          'An account with this email already exists',
        )
      }
    }

    if (
      typeof updateDriverDto.assignedVehicleId ===
      'number'
    ) {
      await this.validateVehicleAssignment(
        updateDriverDto.assignedVehicleId,
        id,
      )
    }

    const passwordHash =
      updateDriverDto.password?.trim()
        ? await bcrypt.hash(
            updateDriverDto.password,
            12,
          )
        : undefined

    try {
      return await this.prisma.$transaction(
        async (transaction) => {
          await transaction.user.update({
            where: {
              id: existingDriver.userId,
            },
            data: {
              name:
                updateDriverDto.name !== undefined
                  ? updateDriverDto.name.trim()
                  : undefined,

              email: normalizedEmail,

              phone:
                updateDriverDto.phone !== undefined
                  ? updateDriverDto.phone.trim() ||
                    null
                  : undefined,

              passwordHash,
            },
          })

          return transaction.driver.update({
            where: {
              id,
            },
            data: {
              licenseNumber:
                updateDriverDto.licenseNumber !==
                undefined
                  ? updateDriverDto.licenseNumber.trim()
                  : undefined,

              assignedVehicle:
                updateDriverDto.assignedVehicleId ===
                undefined
                  ? undefined
                  : updateDriverDto.assignedVehicleId ===
                      null
                    ? {
                        disconnect: true,
                      }
                    : {
                        connect: {
                          id: updateDriverDto.assignedVehicleId,
                        },
                      },
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
        },
      )
    } catch (error) {
      this.handlePrismaError(error)
      throw error
    }
  }

  async deactivate(id: number) {
    const existingDriver = await this.findOne(id)

    if (
      existingDriver.availabilityStatus ===
      DriverAvailabilityStatus.ON_TRIP
    ) {
      throw new BadRequestException(
        'A driver currently on a trip cannot be deactivated',
      )
    }

    return this.prisma.$transaction(
      async (transaction) => {
        await transaction.user.update({
          where: {
            id: existingDriver.userId,
          },
          data: {
            status: UserStatus.INACTIVE,
          },
        })

        return transaction.driver.update({
          where: {
            id,
          },
          data: {
            availabilityStatus:
              DriverAvailabilityStatus.INACTIVE,

            assignedVehicle: {
              disconnect: true,
            },
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
      },
    )
  }

  async remove(id: number) {
    const existingDriver = await this.prisma.driver.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        userId: true,
        trips: {
          select: {
            id: true,
            vehicleId: true,
            status: true,
          },
        },
      },
    })

    if (!existingDriver) {
      throw new NotFoundException(
        `Driver with ID ${id} was not found`,
      )
    }

    assertNoInProgressTrip(
      existingDriver.trips,
      'A driver currently on a trip cannot be deleted',
    )

    return this.prisma.$transaction(async (transaction) => {
      await transaction.fuelLog.deleteMany({
        where: {
          driverId: id,
        },
      })

      await transaction.vehicleIssueReport.deleteMany({
        where: {
          driverId: id,
        },
      })

      await transaction.trip.deleteMany({
        where: {
          driverId: id,
        },
      })

      for (const trip of existingDriver.trips) {
        await restoreVehicleIfIdle(transaction, trip.vehicleId)
      }

      await transaction.driver.delete({
        where: {
          id,
        },
      })

      return transaction.user.delete({
        where: {
          id: existingDriver.userId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          status: true,
        },
      })
    })
  }

  private async validateVehicleAssignment(
    vehicleId: number,
    currentDriverId?: number,
  ) {
    const vehicle =
      await this.prisma.vehicle.findUnique({
        where: {
          id: vehicleId,
        },
        select: {
          id: true,
          status: true,
          plateNumber: true,
        },
      })

    if (!vehicle) {
      throw new NotFoundException(
        `Vehicle with ID ${vehicleId} was not found`,
      )
    }

    const assignedDriver =
      await this.prisma.driver.findFirst({
        where: {
          assignedVehicleId: vehicleId,

          ...(currentDriverId
            ? {
                id: {
                  not: currentDriverId,
                },
              }
            : {}),
        },
        select: {
          id: true,
        },
      })

    if (assignedDriver) {
      throw new BadRequestException(
        `Vehicle ${vehicle.plateNumber} is already assigned to another driver`,
      )
    }
  }

  private handlePrismaError(error: unknown) {
    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(
        'The email, licence number, or vehicle assignment already exists',
      )
    }
  }
}