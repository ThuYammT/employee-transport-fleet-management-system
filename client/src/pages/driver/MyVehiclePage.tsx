import axios from 'axios'
import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import { Link } from 'react-router-dom'

import {
  getDriverByUserId,
} from '../../services/driver.service'

import {
  getTripsByDriverId,
} from '../../services/trip.service'

import {
  getCurrentUser,
} from '../../utils/user-session'

import type {
  Driver,
  DriverVehicle,
} from '../../types/driver'

import type {
  Trip,
} from '../../types/trip'

import type {
  Vehicle,
} from '../../types/vehicle'

type DisplayVehicle =
  | Vehicle
  | DriverVehicle

function MyVehiclePage() {
  const [driver, setDriver] =
    useState<Driver | null>(null)

  const [trips, setTrips] =
    useState<Trip[]>([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  useEffect(() => {
    void loadVehiclePage()
  }, [])

  async function loadVehiclePage() {
    const currentUser = getCurrentUser()

    if (!currentUser) {
      setError(
        'Your login session was not found. Please sign in again.',
      )
      setLoading(false)
      return
    }

    if (currentUser.role !== 'DRIVER') {
      setError(
        'This page is only available for driver accounts.',
      )
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError('')

      const driverData =
        await getDriverByUserId(
          currentUser.id,
        )

      const driverTrips =
        await getTripsByDriverId(
          driverData.id,
        )

      setDriver(driverData)
      setTrips(driverTrips)
    } catch (error) {
      console.error(error)

      setError(
        getApiErrorMessage(
          error,
          'Failed to load your vehicle information.',
        ),
      )
    } finally {
      setLoading(false)
    }
  }

  const activeTrip = useMemo(() => {
    const inProgressTrip =
      trips.find(
        (trip) =>
          trip.status ===
          'IN_PROGRESS',
      )

    if (inProgressTrip) {
      return inProgressTrip
    }

    return (
      trips.find(
        (trip) =>
          trip.status ===
          'SCHEDULED',
      ) ?? null
    )
  }, [trips])

  const displayedVehicle =
    useMemo<DisplayVehicle | null>(
      () =>
        activeTrip?.vehicle ??
        driver?.assignedVehicle ??
        null,
      [
        activeTrip,
        driver?.assignedVehicle,
      ],
    )

  const vehicleSource =
    activeTrip?.vehicle
      ? 'CURRENT_TRIP'
      : driver?.assignedVehicle
        ? 'PERMANENT'
        : 'NONE'

  if (loading) {
    return <LoadingState />
  }

  return (
    <>
      <header className="border-b border-slate-200 bg-white px-6 py-4 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              My Vehicle
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              View the vehicle currently
              assigned to you.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadVehiclePage()
            }
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>
      </header>

      <main className="bg-slate-50 p-6 lg:p-8">
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!displayedVehicle ? (
          <NoVehicleState
            driver={driver}
          />
        ) : (
          <div className="space-y-5">
            <VehicleOverview
              vehicle={displayedVehicle}
              source={vehicleSource}
            />

            <div className="grid gap-5 xl:grid-cols-3">
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-slate-900">
                    Vehicle Details
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    General information
                    about your vehicle.
                  </p>
                </div>

                <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                  <DetailRow
                    label="Plate Number"
                    value={
                      displayedVehicle
                        .plateNumber
                    }
                  />

                  <DetailRow
                    label="Vehicle Type"
                    value={
                      displayedVehicle
                        .vehicleType
                    }
                  />

                  <DetailRow
                    label="Capacity"
                    value={`${displayedVehicle.capacity} passengers`}
                  />

                  <DetailRow
                    label="Current Mileage"
                    value={`${displayedVehicle.currentMileage.toLocaleString()} km`}
                  />

                  <DetailRow
                    label="Vehicle Status"
                    value={formatStatus(
                      displayedVehicle.status,
                    )}
                  />

                  <DetailRow
                    label="Assignment"
                    value={
                      vehicleSource ===
                      'CURRENT_TRIP'
                        ? 'Current trip vehicle'
                        : 'Permanent assigned vehicle'
                    }
                  />
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900">
                  Quick Actions
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Manage vehicle-related
                  activities.
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <ActionLink
                    to="/driver/fuel-logs"
                    title="Add Fuel Log"
                    description="Record fuel and mileage"
                  />

                  <ActionLink
                    to="/driver/vehicle-issues"
                    title="Report an Issue"
                    description="Notify admin about a problem"
                  />

                  <ActionLink
                    to="/driver/my-trips"
                    title="View My Trips"
                    description="Review your assignments"
                  />
                </div>
              </section>
            </div>

            <CurrentAssignment
              trip={activeTrip}
              vehicle={displayedVehicle}
            />
          </div>
        )}
      </main>
    </>
  )
}

function VehicleOverview({
  vehicle,
  source,
}: {
  vehicle: DisplayVehicle
  source:
    | 'CURRENT_TRIP'
    | 'PERMANENT'
    | 'NONE'
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="grid lg:grid-cols-[1fr_auto]">
        <div className="p-5 lg:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold text-slate-900">
                  {vehicle.plateNumber}
                </h2>


              </div>

              <p className="mt-1 text-slate-500">
                {vehicle.vehicleType}
              </p>
            </div>

            <AssignmentBadge
              source={source}
            />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Metric
              label="Capacity"
              value={`${vehicle.capacity}`}
              suffix="passengers"
            />

            <Metric
              label="Mileage"
              value={vehicle.currentMileage.toLocaleString()}
              suffix="kilometres"
            />

            <Metric
              label="Vehicle ID"
              value={`#${vehicle.id}`}
              suffix="fleet record"
            />
          </div>
        </div>

        <div className="flex min-h-36 items-center justify-center border-t border-slate-200 bg-slate-50 px-10 lg:border-l lg:border-t-0">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-3xl">
              🚐
            </div>

            <p className="mt-3 text-sm font-semibold text-slate-600">
              Fleet Vehicle
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function CurrentAssignment({
  trip,
  vehicle,
}: {
  trip: Trip | null
  vehicle: DisplayVehicle
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Current Assignment
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Trip information connected to
            this vehicle.
          </p>
        </div>

        {trip && (
          <TripStatusBadge
            status={trip.status}
          />
        )}
      </div>

      {!trip ? (
        <div className="rounded-lg border border-dashed border-slate-300 px-5 py-6 text-center">
          <p className="font-semibold text-slate-700">
            No active trip assignment
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {vehicle.plateNumber} is not
            currently connected to a
            scheduled or in-progress trip.
          </p>
        </div>
      ) : (
        <div className="grid gap-x-8 gap-y-4 md:grid-cols-2 xl:grid-cols-4">
          <DetailRow
            label="Trip"
            value={`TRIP-${trip.id}`}
          />

          <DetailRow
            label="Passenger"
            value={
              trip.request?.employee
                ?.name ?? 'Unknown'
            }
          />

          <DetailRow
            label="Pickup"
            value={
              trip.request
                ?.pickupLocation ??
              'Unavailable'
            }
          />

          <DetailRow
            label="Destination"
            value={
              trip.request
                ?.destination ??
              'Unavailable'
            }
          />

          <DetailRow
            label="Scheduled Date"
            value={
              trip.request
                ? formatDate(
                    trip.request
                      .requestDate,
                  )
                : 'Unavailable'
            }
          />

          <DetailRow
            label="Scheduled Time"
            value={
              trip.request
                ? formatTime(
                    trip.request
                      .requestTime,
                  )
                : 'Unavailable'
            }
          />

          <DetailRow
            label="Start Time"
            value={
              trip.startTime
                ? formatDateTime(
                    trip.startTime,
                  )
                : 'Not started'
            }
          />

          <DetailRow
            label="Vehicle"
            value={
              trip.vehicle?.plateNumber ??
              vehicle.plateNumber
            }
          />
        </div>
      )}
    </section>
  )
}

function NoVehicleState({
  driver,
}: {
  driver: Driver | null
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl">
        🚐
      </div>

      <h2 className="mt-4 text-xl font-bold text-slate-900">
        No vehicle currently assigned
      </h2>

      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
        You do not have a permanent
        vehicle or an active trip vehicle
        at the moment. A vehicle will
        appear here when an administrator
        assigns one to you.
      </p>

      {driver && (
        <div className="mx-auto mt-5 inline-flex rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
          Driver status:{' '}
          {formatStatus(
            driver.availabilityStatus,
          )}
        </div>
      )}

      <div className="mt-6">
        <Link
          to="/driver/my-trips"
          className="inline-flex rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          View My Trips
        </Link>
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-8">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

        <p className="mt-4 text-sm text-slate-500">
          Loading vehicle information...
        </p>
      </div>
    </div>
  )
}

function DetailRow({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="border-b border-slate-100 pb-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 font-semibold text-slate-800">
        {value}
      </p>
    </div>
  )
}

function Metric({
  label,
  value,
  suffix,
}: {
  label: string
  value: string
  suffix: string
}) {
  return (
    <div className="rounded-lg bg-slate-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-xl font-bold text-slate-900">
        {value}
      </p>

      <p className="text-xs text-slate-500">
        {suffix}
      </p>
    </div>
  )
}

function ActionLink({
  to,
  title,
  description,
}: {
  to: string
  title: string
  description: string
}) {
  return (
    <Link
      to={to}
      className="block rounded-lg border border-slate-200 px-4 py-3 transition hover:border-blue-300 hover:bg-blue-50"
    >
      <p className="font-semibold text-slate-800">
        {title}
      </p>

      <p className="mt-0.5 text-xs text-slate-500">
        {description}
      </p>
    </Link>
  )
}

function AssignmentBadge({
  source,
}: {
  source:
    | 'CURRENT_TRIP'
    | 'PERMANENT'
    | 'NONE'
}) {
  const label =
    source === 'CURRENT_TRIP'
      ? 'Current Trip Vehicle'
      : 'Permanent Vehicle'

  return (
    <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
      {label}
    </span>
  )
}


function TripStatusBadge({
  status,
}: {
  status: Trip['status']
}) {
  const styles: Record<
    Trip['status'],
    string
  > = {
    SCHEDULED:
      'bg-blue-100 text-blue-700',

    IN_PROGRESS:
      'bg-amber-100 text-amber-700',

    COMPLETED:
      'bg-green-100 text-green-700',

    CANCELLED:
      'bg-red-100 text-red-700',
  }

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {formatStatus(status)}
    </span>
  )
}

function formatStatus(
  value: string,
): string {
  return value
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    )
}

function formatDate(
  value: string,
): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString(
    undefined,
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    },
  )
}

function formatDateTime(
  value: string,
): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString()
}

function formatTime(
  value: string,
): string {
  const [hours, minutes] =
    value.split(':').map(Number)

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    return value
  }

  const date = new Date()

  date.setHours(
    hours,
    minutes,
    0,
    0,
  )

  return date.toLocaleTimeString(
    undefined,
    {
      hour: '2-digit',
      minute: '2-digit',
    },
  )
}

function getApiErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  if (!axios.isAxiosError(error)) {
    return fallbackMessage
  }

  const message =
    error.response?.data?.message

  if (Array.isArray(message)) {
    return message.join(', ')
  }

  if (typeof message === 'string') {
    return message
  }

  if (!error.response) {
    return 'Unable to connect to the server.'
  }

  return fallbackMessage
}

export default MyVehiclePage