import { BadRequestException } from '@nestjs/common'
import {
  DriverAvailabilityStatus,
  Prisma,
  TripStatus,
  VehicleStatus,
} from '@prisma/client'

export function assertNoInProgressTrip(
  trips: Array<{ status: TripStatus }>,
  message: string,
) {
  if (
    trips.some(
      (trip) => trip.status === TripStatus.IN_PROGRESS,
    )
  ) {
    throw new BadRequestException(message)
  }
}

export async function deleteFuelLogsForTrips(
  transaction: Prisma.TransactionClient,
  tripIds: number[],
) {
  if (tripIds.length === 0) {
    return
  }

  await transaction.fuelLog.deleteMany({
    where: {
      tripId: {
        in: tripIds,
      },
    },
  })
}

export async function restoreDriverIfIdle(
  transaction: Prisma.TransactionClient,
  driverId: number,
) {
  const activeTrip = await transaction.trip.findFirst({
    where: {
      driverId,
      status: {
        in: [TripStatus.SCHEDULED, TripStatus.IN_PROGRESS],
      },
    },
    select: {
      id: true,
    },
  })

  if (activeTrip) {
    return
  }

  await transaction.driver.update({
    where: {
      id: driverId,
    },
    data: {
      availabilityStatus: DriverAvailabilityStatus.AVAILABLE,
    },
  })
}

export async function restoreVehicleIfIdle(
  transaction: Prisma.TransactionClient,
  vehicleId: number,
) {
  const activeTrip = await transaction.trip.findFirst({
    where: {
      vehicleId,
      status: {
        in: [TripStatus.SCHEDULED, TripStatus.IN_PROGRESS],
      },
    },
    select: {
      id: true,
    },
  })

  if (activeTrip) {
    return
  }

  await transaction.vehicle.update({
    where: {
      id: vehicleId,
    },
    data: {
      status: VehicleStatus.AVAILABLE,
    },
  })
}

export async function deleteTripGraph(
  transaction: Prisma.TransactionClient,
  trip: {
    id: number
    driverId: number
    vehicleId: number
  },
) {
  await transaction.fuelLog.deleteMany({
    where: {
      tripId: trip.id,
    },
  })

  await transaction.trip.delete({
    where: {
      id: trip.id,
    },
  })

  await restoreDriverIfIdle(transaction, trip.driverId)
  await restoreVehicleIfIdle(transaction, trip.vehicleId)
}
