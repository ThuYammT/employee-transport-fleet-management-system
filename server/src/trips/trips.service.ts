import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'

import {
  DriverAvailabilityStatus,
  Prisma,
  TripStatus,
  VehicleStatus,
} from '@prisma/client'

import {
  deleteFuelLogsForTrips,
} from '../prisma/cascade-delete'

import {
  PrismaService,
} from '../prisma/prisma.service'

import {
  CreateTripDto,
} from './dto/create-trip.dto'

import {
  UpdateTripDto,
} from './dto/update-trip.dto'

const tripInclude = {
  request: {
    include: {
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
    },
  },

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
          capacity: true,
          status: true,
          currentMileage: true,
        },
      },
    },
  },

  vehicle: true,
} satisfies Prisma.TripInclude

@Injectable()
export class TripsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  findAll() {
    return this.prisma.trip.findMany({
      include: tripInclude,

      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  async findOne(id: number) {
    const trip =
      await this.prisma.trip.findUnique({
        where: {
          id,
        },

        include: tripInclude,
      })

    if (!trip) {
      throw new NotFoundException(
        `Trip with ID ${id} was not found`,
      )
    }

    return trip
  }

  async findByDriverId(
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

    return this.prisma.trip.findMany({
      where: {
        driverId,
      },

      include: tripInclude,

      orderBy: [
        {
          request: {
            requestDate: 'asc',
          },
        },

        {
          createdAt: 'desc',
        },
      ],
    })
  }

  async create(
    createTripDto: CreateTripDto,
  ) {
    const existingTrip =
      await this.prisma.trip.findUnique({
        where: {
          requestId:
            createTripDto.requestId,
        },

        select: {
          id: true,
        },
      })

    if (existingTrip) {
      throw new ConflictException(
        `Transport request ${createTripDto.requestId} already has a trip assignment`,
      )
    }

    const request =
      await this.prisma.transportRequest.findUnique({
        where: {
          id:
            createTripDto.requestId,
        },

        include: {
          employee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

    if (!request) {
      throw new NotFoundException(
        `Transport request with ID ${createTripDto.requestId} was not found`,
      )
    }

    if (
      request.status !==
      'APPROVED'
    ) {
      throw new BadRequestException(
        'The transport request must be approved before assigning a trip',
      )
    }

    const driver =
      await this.prisma.driver.findUnique({
        where: {
          id:
            createTripDto.driverId,
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

          assignedVehicle: {
            select: {
              id: true,
              plateNumber: true,
              vehicleType: true,
              status: true,
            },
          },
        },
      })

    if (!driver) {
      throw new NotFoundException(
        `Driver with ID ${createTripDto.driverId} was not found`,
      )
    }

    if (
      driver.user.role !==
      'DRIVER'
    ) {
      throw new BadRequestException(
        'The selected account is not a driver',
      )
    }

    if (
      driver.user.status !==
      'ACTIVE'
    ) {
      throw new BadRequestException(
        'The selected driver account is inactive',
      )
    }

    if (
      driver.availabilityStatus !==
      DriverAvailabilityStatus.AVAILABLE
    ) {
      throw new BadRequestException(
        `${driver.user.name} is not currently available`,
      )
    }

    if (
      !driver.assignedVehicleId
    ) {
      throw new BadRequestException(
        `${driver.user.name} does not have an assigned vehicle`,
      )
    }

    if (
      !driver.assignedVehicle
    ) {
      throw new BadRequestException(
        `The assigned vehicle for ${driver.user.name} could not be found`,
      )
    }

    if (
      driver.assignedVehicleId !==
      createTripDto.vehicleId
    ) {
      throw new BadRequestException(
        `Vehicle ${createTripDto.vehicleId} is not assigned to ${driver.user.name}`,
      )
    }

    if (
      driver.assignedVehicle.status !==
      VehicleStatus.AVAILABLE
    ) {
      throw new BadRequestException(
        `Vehicle ${driver.assignedVehicle.plateNumber} is not currently available`,
      )
    }

    try {
      return await this.prisma.$transaction(
        async (transaction) => {
          const currentDriver =
            await transaction.driver.findUnique({
              where: {
                id:
                  createTripDto.driverId,
              },

              select: {
                availabilityStatus:
                  true,
                assignedVehicleId:
                  true,
              },
            })

          const currentVehicle =
            await transaction.vehicle.findUnique({
              where: {
                id:
                  createTripDto.vehicleId,
              },

              select: {
                status: true,
              },
            })

          const currentRequest =
            await transaction.transportRequest.findUnique({
              where: {
                id:
                  createTripDto.requestId,
              },

              select: {
                status: true,

                trip: {
                  select: {
                    id: true,
                  },
                },
              },
            })

          if (!currentRequest) {
            throw new NotFoundException(
              'The transport request no longer exists',
            )
          }

          if (
            currentRequest.status !==
            'APPROVED'
          ) {
            throw new BadRequestException(
              'The request is no longer approved',
            )
          }

          if (
            currentRequest.trip
          ) {
            throw new ConflictException(
              'This request already has a trip assignment',
            )
          }

          if (
            currentDriver
              ?.availabilityStatus !==
            DriverAvailabilityStatus.AVAILABLE
          ) {
            throw new BadRequestException(
              'The selected driver is no longer available',
            )
          }

          if (
            !currentDriver
              ?.assignedVehicleId
          ) {
            throw new BadRequestException(
              'The selected driver no longer has an assigned vehicle',
            )
          }

          if (
            currentDriver.assignedVehicleId !==
            createTripDto.vehicleId
          ) {
            throw new BadRequestException(
              'The selected vehicle is no longer assigned to this driver',
            )
          }

          if (
            currentVehicle?.status !==
            VehicleStatus.AVAILABLE
          ) {
            throw new BadRequestException(
              'The selected vehicle is no longer available',
            )
          }

          const trip =
            await transaction.trip.create({
              data: {
                requestId:
                  createTripDto.requestId,

                driverId:
                  createTripDto.driverId,

                vehicleId:
                  createTripDto.vehicleId,

                status:
                  TripStatus.SCHEDULED,
              },

              include: tripInclude,
            })

          await transaction.driver.update({
            where: {
              id:
                createTripDto.driverId,
            },

            data: {
              availabilityStatus:
                DriverAvailabilityStatus.ON_TRIP,
            },
          })

          await transaction.vehicle.update({
            where: {
              id:
                createTripDto.vehicleId,
            },

            data: {
              status:
                VehicleStatus.IN_USE,
            },
          })

          return trip
        },
      )
    } catch (error) {
      this.handlePrismaError(
        error,
      )

      throw error
    }
  }

  async update(
    id: number,
    updateTripDto: UpdateTripDto,
  ) {
    const existingTrip =
      await this.findOne(id)

    if (
      updateTripDto.requestId &&
      updateTripDto.requestId !==
        existingTrip.requestId
    ) {
      const request =
        await this.prisma.transportRequest.findUnique({
          where: {
            id:
              updateTripDto.requestId,
          },
        })

      if (!request) {
        throw new NotFoundException(
          `Transport request with ID ${updateTripDto.requestId} was not found`,
        )
      }

      if (
        request.status !==
        'APPROVED'
      ) {
        throw new BadRequestException(
          'The replacement request must be approved',
        )
      }
    }

    const nextDriverId =
      updateTripDto.driverId ??
      existingTrip.driverId

    const selectedDriver =
      await this.prisma.driver.findUnique({
        where: {
          id: nextDriverId,
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

          assignedVehicle: {
            select: {
              id: true,
              plateNumber: true,
              vehicleType: true,
              status: true,
            },
          },
        },
      })

    if (!selectedDriver) {
      throw new NotFoundException(
        `Driver with ID ${nextDriverId} was not found`,
      )
    }

    if (
      selectedDriver.user.role !==
      'DRIVER'
    ) {
      throw new BadRequestException(
        'The selected account is not a driver',
      )
    }

    if (
      selectedDriver.user.status !==
      'ACTIVE'
    ) {
      throw new BadRequestException(
        'The selected driver account is inactive',
      )
    }

    if (
      nextDriverId !==
        existingTrip.driverId &&
      selectedDriver.availabilityStatus !==
        DriverAvailabilityStatus.AVAILABLE
    ) {
      throw new BadRequestException(
        'The replacement driver is not available',
      )
    }

    if (
      !selectedDriver.assignedVehicleId
    ) {
      throw new BadRequestException(
        `${selectedDriver.user.name} does not have an assigned vehicle`,
      )
    }

    if (
      !selectedDriver.assignedVehicle
    ) {
      throw new BadRequestException(
        `The assigned vehicle for ${selectedDriver.user.name} could not be found`,
      )
    }

    const requiredVehicleId =
      selectedDriver.assignedVehicleId

    if (
      updateTripDto.vehicleId !==
        undefined &&
      updateTripDto.vehicleId !==
        requiredVehicleId
    ) {
      throw new BadRequestException(
        `The trip vehicle must be the vehicle assigned to ${selectedDriver.user.name}`,
      )
    }

    if (
      requiredVehicleId !==
        existingTrip.vehicleId &&
      selectedDriver.assignedVehicle.status !==
        VehicleStatus.AVAILABLE
    ) {
      throw new BadRequestException(
        `Vehicle ${selectedDriver.assignedVehicle.plateNumber} is not currently available`,
      )
    }

    try {
      return await this.prisma.$transaction(
        async (transaction) => {
          const driverChanged =
            nextDriverId !==
            existingTrip.driverId

          const vehicleChanged =
            requiredVehicleId !==
            existingTrip.vehicleId

          if (driverChanged) {
            await transaction.driver.update({
              where: {
                id:
                  existingTrip.driverId,
              },

              data: {
                availabilityStatus:
                  DriverAvailabilityStatus.AVAILABLE,
              },
            })

            await transaction.driver.update({
              where: {
                id:
                  nextDriverId,
              },

              data: {
                availabilityStatus:
                  DriverAvailabilityStatus.ON_TRIP,
              },
            })
          }

          if (vehicleChanged) {
            await transaction.vehicle.update({
              where: {
                id:
                  existingTrip.vehicleId,
              },

              data: {
                status:
                  VehicleStatus.AVAILABLE,
              },
            })

            await transaction.vehicle.update({
              where: {
                id:
                  requiredVehicleId,
              },

              data: {
                status:
                  VehicleStatus.IN_USE,
              },
            })
          }

          return transaction.trip.update({
            where: {
              id,
            },

            data: {
              requestId:
                updateTripDto.requestId,

              driverId:
                nextDriverId,

              vehicleId:
                requiredVehicleId,
            },

            include: tripInclude,
          })
        },
      )
    } catch (error) {
      this.handlePrismaError(
        error,
      )

      throw error
    }
  }

  async startTrip(
    id: number,
  ) {
    const trip =
      await this.findOne(id)

    if (
      trip.status !==
      TripStatus.SCHEDULED
    ) {
      throw new BadRequestException(
        'Only a scheduled trip can be started',
      )
    }

    return this.prisma.$transaction(
      async (transaction) => {
        await transaction.driver.update({
          where: {
            id:
              trip.driverId,
          },

          data: {
            availabilityStatus:
              DriverAvailabilityStatus.ON_TRIP,
          },
        })

        await transaction.vehicle.update({
          where: {
            id:
              trip.vehicleId,
          },

          data: {
            status:
              VehicleStatus.IN_USE,
          },
        })

        return transaction.trip.update({
          where: {
            id,
          },

          data: {
            status:
              TripStatus.IN_PROGRESS,

            startTime:
              new Date(),

            endTime:
              null,
          },

          include: tripInclude,
        })
      },
    )
  }

  async completeTrip(
    id: number,
  ) {
    const trip =
      await this.findOne(id)

    if (
      trip.status !==
      TripStatus.IN_PROGRESS
    ) {
      throw new BadRequestException(
        'Only an in-progress trip can be completed',
      )
    }

    return this.prisma.$transaction(
      async (transaction) => {
        const completedTrip =
          await transaction.trip.update({
            where: {
              id,
            },

            data: {
              status:
                TripStatus.COMPLETED,

              endTime:
                new Date(),
            },

            include: tripInclude,
          })

        await transaction.driver.update({
          where: {
            id:
              trip.driverId,
          },

          data: {
            availabilityStatus:
              DriverAvailabilityStatus.AVAILABLE,
          },
        })

        await transaction.vehicle.update({
          where: {
            id:
              trip.vehicleId,
          },

          data: {
            status:
              VehicleStatus.AVAILABLE,
          },
        })

        return completedTrip
      },
    )
  }

  async cancelTrip(
    id: number,
  ) {
    const trip =
      await this.findOne(id)

    if (
      trip.status ===
        TripStatus.COMPLETED ||
      trip.status ===
        TripStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'This trip can no longer be cancelled',
      )
    }

    return this.prisma.$transaction(
      async (transaction) => {
        const cancelledTrip =
          await transaction.trip.update({
            where: {
              id,
            },

            data: {
              status:
                TripStatus.CANCELLED,

              endTime:
                new Date(),
            },

            include: tripInclude,
          })

        await transaction.driver.update({
          where: {
            id:
              trip.driverId,
          },

          data: {
            availabilityStatus:
              DriverAvailabilityStatus.AVAILABLE,
          },
        })

        await transaction.vehicle.update({
          where: {
            id:
              trip.vehicleId,
          },

          data: {
            status:
              VehicleStatus.AVAILABLE,
          },
        })

        return cancelledTrip
      },
    )
  }

  async remove(
    id: number,
  ) {
    const trip =
      await this.findOne(id)

    if (
      trip.status ===
      TripStatus.IN_PROGRESS
    ) {
      throw new BadRequestException(
        'An in-progress trip cannot be deleted',
      )
    }

    return this.prisma.$transaction(
      async (transaction) => {
        await deleteFuelLogsForTrips(
          transaction,
          [id],
        )

        const deletedTrip =
          await transaction.trip.delete({
            where: {
              id,
            },

            include: tripInclude,
          })

        await transaction.driver.update({
          where: {
            id:
              trip.driverId,
          },

          data: {
            availabilityStatus:
              DriverAvailabilityStatus.AVAILABLE,
          },
        })

        await transaction.vehicle.update({
          where: {
            id:
              trip.vehicleId,
          },

          data: {
            status:
              VehicleStatus.AVAILABLE,
          },
        })

        return deletedTrip
      },
    )
  }

  private handlePrismaError(
    error: unknown,
  ): void {
    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(
        'This transport request already has a trip assignment',
      )
    }
  }
}