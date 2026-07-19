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
  completeTrip,
  getTripsByDriverId,
  startTrip,
} from '../../services/trip.service'

import {
  getCurrentUser,
} from '../../utils/user-session'

import type {
  Driver,
  DriverAvailabilityStatus,
} from '../../types/driver'

import type {
  Trip,
  TripStatus,
} from '../../types/trip'

function DriverDashboard() {
  const [driver, setDriver] =
    useState<Driver | null>(null)

  const [trips, setTrips] =
    useState<Trip[]>([])

  const [loading, setLoading] =
    useState(true)

  const [actionTripId, setActionTripId] =
    useState<number | null>(null)

  const [error, setError] =
    useState('')

  useEffect(() => {
    void loadDashboard()
  }, [])

  async function loadDashboard() {
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
        'This dashboard is only available for driver accounts.',
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

      const tripData =
        await getTripsByDriverId(
          driverData.id,
        )

      setDriver(driverData)
      setTrips(sortTrips(tripData))
    } catch (error) {
      console.error(error)

      setError(
        getApiErrorMessage(
          error,
          'Failed to load the driver dashboard.',
        ),
      )
    } finally {
      setLoading(false)
    }
  }

  const scheduledTrips = useMemo(
    () =>
      trips.filter(
        (trip) =>
          trip.status === 'SCHEDULED',
      ),
    [trips],
  )

  const inProgressTrips = useMemo(
    () =>
      trips.filter(
        (trip) =>
          trip.status === 'IN_PROGRESS',
      ),
    [trips],
  )

  const completedTrips = useMemo(
    () =>
      trips.filter(
        (trip) =>
          trip.status === 'COMPLETED',
      ),
    [trips],
  )

  const cancelledTrips = useMemo(
    () =>
      trips.filter(
        (trip) =>
          trip.status === 'CANCELLED',
      ),
    [trips],
  )

  const activeTrip = useMemo(() => {
    const inProgressTrip =
      trips.find(
        (trip) =>
          trip.status === 'IN_PROGRESS',
      )

    if (inProgressTrip) {
      return inProgressTrip
    }

    return scheduledTrips[0] ?? null
  }, [trips, scheduledTrips])

  const upcomingTrips = useMemo(
    () =>
      scheduledTrips
        .filter(
          (trip) =>
            trip.id !== activeTrip?.id,
        )
        .slice(0, 5),
    [scheduledTrips, activeTrip],
  )

  async function handleStartTrip(
    trip: Trip,
  ) {
    const confirmed = window.confirm(
      `Start TRIP-${trip.id}?`,
    )

    if (!confirmed) {
      return
    }

    await performTripAction(
      trip.id,
      startTrip,
      'Failed to start the trip.',
    )
  }

  async function handleCompleteTrip(
    trip: Trip,
  ) {
    const confirmed = window.confirm(
      `Complete TRIP-${trip.id}?`,
    )

    if (!confirmed) {
      return
    }

    await performTripAction(
      trip.id,
      completeTrip,
      'Failed to complete the trip.',
    )
  }

  async function performTripAction(
    tripId: number,
    action: (
      id: number,
    ) => Promise<Trip>,
    fallbackMessage: string,
  ) {
    try {
      setActionTripId(tripId)
      setError('')

      const updatedTrip =
        await action(tripId)

      setTrips((currentTrips) =>
        sortTrips(
          currentTrips.map((trip) =>
            trip.id === updatedTrip.id
              ? updatedTrip
              : trip,
          ),
        ),
      )

      if (driver) {
        setDriver({
          ...driver,

          availabilityStatus:
            updatedTrip.status ===
            'COMPLETED'
              ? 'AVAILABLE'
              : 'ON_TRIP',
        })
      }
    } catch (error) {
      console.error(error)

      setError(
        getApiErrorMessage(
          error,
          fallbackMessage,
        ),
      )
    } finally {
      setActionTripId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-8">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="mt-4 text-slate-500">
            Loading your dashboard...
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <header className="border-b border-slate-200 bg-white px-8 py-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Driver Dashboard
            </h1>

            <p className="mt-1 text-slate-500">
              Welcome back,{' '}
              <span className="font-semibold text-slate-700">
                {driver?.user.name ??
                  'Driver'}
              </span>
              .
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadDashboard()
            }
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>
      </header>

      <main className="bg-slate-50 p-8">
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        <section className="mb-6 grid gap-4 md:grid-cols-2">
          <DriverInfoCard
            label="Availability"
            value={
              driver?.availabilityStatus.replaceAll(
                '_',
                ' ',
              ) ?? 'Unavailable'
            }
            badge={
              driver?.availabilityStatus
            }
          />

          <DriverInfoCard
            label="Assigned Vehicle"
            value={
              driver?.assignedVehicle
                ?.plateNumber ??
              'No permanent vehicle assigned'
            }
            description={
              driver?.assignedVehicle
                ? `${driver.assignedVehicle.vehicleType} • ${driver.assignedVehicle.currentMileage.toLocaleString()} km`
                : undefined
            }
          />
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardCard
            title="Scheduled Trips"
            value={scheduledTrips.length}
          />

          <DashboardCard
            title="In Progress"
            value={inProgressTrips.length}
          />

          <DashboardCard
            title="Completed Trips"
            value={completedTrips.length}
          />

          <DashboardCard
            title="Cancelled Trips"
            value={cancelledTrips.length}
          />
        </section>

        <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Current Trip
                </h2>

                <p className="text-sm text-slate-500">
                  Your next scheduled or
                  currently active trip.
                </p>
              </div>

              {activeTrip && (
                <TripStatusBadge
                  status={activeTrip.status}
                />
              )}
            </div>

            {!activeTrip ? (
              <EmptyCurrentTrip />
            ) : (
              <CurrentTripCard
                trip={activeTrip}
              />
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              Quick Actions
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Common driver actions.
            </p>

            <div className="mt-5 space-y-3">
              {activeTrip?.status ===
                'SCHEDULED' && (
                <button
                  type="button"
                  disabled={
                    actionTripId ===
                    activeTrip.id
                  }
                  onClick={() =>
                    void handleStartTrip(
                      activeTrip,
                    )
                  }
                  className="w-full rounded-xl bg-green-600 px-4 py-3 text-left font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {actionTripId ===
                  activeTrip.id
                    ? 'Starting Trip...'
                    : 'Start Current Trip'}
                </button>
              )}

              {activeTrip?.status ===
                'IN_PROGRESS' && (
                <button
                  type="button"
                  disabled={
                    actionTripId ===
                    activeTrip.id
                  }
                  onClick={() =>
                    void handleCompleteTrip(
                      activeTrip,
                    )
                  }
                  className="w-full rounded-xl bg-green-600 px-4 py-3 text-left font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {actionTripId ===
                  activeTrip.id
                    ? 'Completing Trip...'
                    : 'Complete Current Trip'}
                </button>
              )}

              <QuickActionLink
                to="/driver/my-trips"
                label="View All Trips"
              />

              <QuickActionLink
                to="/driver/fuel-logs"
                label="Add Fuel Log"
              />

              <QuickActionLink
                to="/driver/vehicle-issues"
                label="Report Vehicle Issue"
              />

              <QuickActionLink
                to="/driver/my-vehicle"
                label="View My Vehicle"
              />
            </div>
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Upcoming Trips
              </h2>

              <p className="text-sm text-slate-500">
                Your next scheduled
                assignments.
              </p>
            </div>

            <Link
              to="/driver/my-trips"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              View all
            </Link>
          </div>

          {upcomingTrips.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-semibold text-slate-700">
                No additional upcoming
                trips.
              </p>

              <p className="mt-1 text-sm text-slate-500">
                New assignments will
                appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-6 py-4">
                      Trip
                    </th>

                    <th className="py-4 pr-6">
                      Passenger
                    </th>

                    <th className="py-4 pr-6">
                      Route
                    </th>

                    <th className="py-4 pr-6">
                      Schedule
                    </th>

                    <th className="py-4 pr-6">
                      Vehicle
                    </th>

                    <th className="py-4 pr-6">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {upcomingTrips.map(
                    (trip) => (
                      <tr
                        key={trip.id}
                        className="border-b border-slate-100 last:border-none hover:bg-slate-50"
                      >
                        <td className="px-6 py-4 font-semibold text-slate-900">
                          TRIP-{trip.id}
                        </td>

                        <td className="py-4 pr-6">
                          <p className="font-medium text-slate-800">
                            {trip.request
                              ?.employee
                              ?.name ??
                              'Unknown'}
                          </p>

                          <p className="text-xs text-slate-500">
                            {trip.request
                              ?.employee
                              ?.email ??
                              'No email'}
                          </p>
                        </td>

                        <td className="py-4 pr-6">
                          <p className="font-medium text-slate-800">
                            {trip.request
                              ?.pickupLocation ??
                              'Unavailable'}
                          </p>

                          <p className="text-xs text-slate-500">
                            to{' '}
                            {trip.request
                              ?.destination ??
                              'Unavailable'}
                          </p>
                        </td>

                        <td className="py-4 pr-6">
                          <p className="font-medium text-slate-800">
                            {trip.request
                              ? formatDate(
                                  trip.request
                                    .requestDate,
                                )
                              : '-'}
                          </p>

                          <p className="text-xs text-slate-500">
                            {trip.request
                              ? formatTime(
                                  trip.request
                                    .requestTime,
                                )
                              : '-'}
                          </p>
                        </td>

                        <td className="py-4 pr-6">
                          <p className="font-medium text-slate-800">
                            {trip.vehicle
                              ?.plateNumber ??
                              `Vehicle ${trip.vehicleId}`}
                          </p>

                          <p className="text-xs text-slate-500">
                            {trip.vehicle
                              ?.vehicleType ??
                              ''}
                          </p>
                        </td>

                        <td className="py-4 pr-6">
                          <TripStatusBadge
                            status={
                              trip.status
                            }
                          />
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </>
  )
}

function CurrentTripCard({
  trip,
}: {
  trip: Trip
}) {
  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2">
        <TripDetail
          label="Trip ID"
          value={`TRIP-${trip.id}`}
        />

        <TripDetail
          label="Passenger"
          value={
            trip.request?.employee
              ?.name ?? 'Unknown'
          }
          secondaryValue={
            trip.request?.employee
              ?.email
          }
        />

        <TripDetail
          label="Pickup Location"
          value={
            trip.request
              ?.pickupLocation ??
            'Unavailable'
          }
        />

        <TripDetail
          label="Destination"
          value={
            trip.request
              ?.destination ??
            'Unavailable'
          }
        />

        <TripDetail
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

        <TripDetail
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

        <TripDetail
          label="Vehicle"
          value={
            trip.vehicle
              ?.plateNumber ??
            `Vehicle ${trip.vehicleId}`
          }
          secondaryValue={
            trip.vehicle?.vehicleType
          }
        />

        <TripDetail
          label="Trip Started"
          value={
            trip.startTime
              ? formatDateTime(
                  trip.startTime,
                )
              : 'Not started'
          }
        />
      </div>

      <div className="mt-5 rounded-xl bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-500">
          Purpose
        </p>

        <p className="mt-2 text-slate-800">
          {trip.request?.purpose ??
            'No purpose provided'}
        </p>
      </div>
    </div>
  )
}

function EmptyCurrentTrip() {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center">
      <p className="font-semibold text-slate-700">
        You do not have an active trip.
      </p>

      <p className="mt-1 text-sm text-slate-500">
        Your next approved assignment
        will appear here.
      </p>
    </div>
  )
}

function DriverInfoCard({
  label,
  value,
  description,
  badge,
}: {
  label: string
  value: string
  description?: string
  badge?: DriverAvailabilityStatus
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
      <p className="text-sm text-slate-500">
        {label}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-bold text-slate-900">
          {value}
        </h2>

        {badge && (
          <DriverStatusBadge
            status={badge}
          />
        )}
      </div>

      {description && (
        <p className="mt-2 text-sm text-slate-500">
          {description}
        </p>
      )}
    </div>
  )
}

function DashboardCard({
  title,
  value,
}: {
  title: string
  value: number
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
      <p className="text-sm text-slate-500">
        {title}
      </p>

      <h3 className="mt-2 text-3xl font-bold text-slate-900">
        {value}
      </h3>

      <Link
        to="/driver/my-trips"
        className="mt-3 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700"
      >
      </Link>
    </div>
  )
}

function TripDetail({
  label,
  value,
  secondaryValue,
}: {
  label: string
  value: string
  secondaryValue?: string | null
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <p className="text-sm text-slate-500">
        {label}
      </p>

      <p className="mt-1 font-semibold text-slate-900">
        {value}
      </p>

      {secondaryValue && (
        <p className="mt-1 text-xs text-slate-500">
          {secondaryValue}
        </p>
      )}
    </div>
  )
}

function QuickActionLink({
  to,
  label,
}: {
  to: string
  label: string
}) {
  return (
    <Link
      to={to}
      className="block w-full rounded-xl border border-slate-200 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
    >
      {label}
    </Link>
  )
}

function TripStatusBadge({
  status,
}: {
  status: TripStatus
}) {
  const styles: Record<
    TripStatus,
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
      {status.replaceAll('_', ' ')}
    </span>
  )
}

function DriverStatusBadge({
  status,
}: {
  status: DriverAvailabilityStatus
}) {
  const styles: Record<
    DriverAvailabilityStatus,
    string
  > = {
    AVAILABLE:
      'bg-green-100 text-green-700',
    ON_TRIP:
      'bg-blue-100 text-blue-700',
    OFF_DUTY:
      'bg-amber-100 text-amber-700',
    INACTIVE:
      'bg-slate-200 text-slate-700',
  }

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {status.replaceAll('_', ' ')}
    </span>
  )
}

function sortTrips(
  trips: Trip[],
): Trip[] {
  return [...trips].sort(
    (firstTrip, secondTrip) => {
      const firstDate =
        getTripScheduleDate(firstTrip)

      const secondDate =
        getTripScheduleDate(secondTrip)

      return (
        firstDate.getTime() -
        secondDate.getTime()
      )
    },
  )
}

function getTripScheduleDate(
  trip: Trip,
): Date {
  const requestDate =
    trip.request?.requestDate

  const requestTime =
    trip.request?.requestTime

  if (!requestDate) {
    return new Date(
      trip.createdAt,
    )
  }

  const datePart =
    requestDate.split('T')[0]

  const timePart =
    requestTime || '00:00'

  const combinedDate = new Date(
    `${datePart}T${timePart}`,
  )

  if (
    Number.isNaN(
      combinedDate.getTime(),
    )
  ) {
    return new Date(
      trip.createdAt,
    )
  }

  return combinedDate
}

function formatDate(
  value: string,
): string {
  const date = new Date(value)

  if (
    Number.isNaN(date.getTime())
  ) {
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

  if (
    Number.isNaN(date.getTime())
  ) {
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

  if (
    typeof message === 'string'
  ) {
    return message
  }

  if (!error.response) {
    return 'Unable to connect to the server.'
  }

  return fallbackMessage
}

export default DriverDashboard