import axios from 'axios'
import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  cancelTrip,
  completeTrip,
  getTripsByDriverId,
  startTrip,
} from '../../services/trip.service'

import {
  getDriverByUserId,
} from '../../services/driver.service'

import {
  getCurrentUser,
} from '../../utils/user-session'

import type {
  Trip,
  TripStatus,
} from '../../types/trip'

type TripFilter = 'ALL' | TripStatus

function MyTripsPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [filter, setFilter] =
    useState<TripFilter>('ALL')

  const [loading, setLoading] =
    useState(true)

  const [actionTripId, setActionTripId] =
    useState<number | null>(null)

  const [selectedTrip, setSelectedTrip] =
    useState<Trip | null>(null)

  const [error, setError] = useState('')

  useEffect(() => {
    void loadTrips()
  }, [])

  async function loadTrips() {
    const currentUser = getCurrentUser()

    if (!currentUser) {
      setError('Your login session was not found.')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError('')

      const driver = await getDriverByUserId(
        currentUser.id,
      )

      const tripData =
        await getTripsByDriverId(driver.id)

      setTrips(tripData)

      setSelectedTrip((currentTrip) => {
        if (!currentTrip) {
          return null
        }

        return (
          tripData.find(
            (trip) =>
              trip.id === currentTrip.id,
          ) ?? null
        )
      })
    } catch (error) {
      console.error(error)

      setError(
        getApiErrorMessage(
          error,
          'Failed to load your trips.',
        ),
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleStart(trip: Trip) {
    const confirmed = window.confirm(
      `Start trip TRIP-${trip.id}?`,
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

  async function handleComplete(trip: Trip) {
    const confirmed = window.confirm(
      `Complete trip TRIP-${trip.id}?`,
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

  async function handleCancel(trip: Trip) {
    const confirmed = window.confirm(
      `Cancel trip TRIP-${trip.id}?`,
    )

    if (!confirmed) {
      return
    }

    await performTripAction(
      trip.id,
      cancelTrip,
      'Failed to cancel the trip.',
    )
  }

  async function performTripAction(
    tripId: number,
    action: (id: number) => Promise<Trip>,
    fallbackMessage: string,
  ) {
    try {
      setActionTripId(tripId)
      setError('')

      const updatedTrip = await action(tripId)

      setTrips((currentTrips) =>
        currentTrips.map((trip) =>
          trip.id === updatedTrip.id
            ? updatedTrip
            : trip,
        ),
      )

      setSelectedTrip((currentTrip) =>
        currentTrip?.id === updatedTrip.id
          ? updatedTrip
          : currentTrip,
      )
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

  const filteredTrips = useMemo(() => {
    if (filter === 'ALL') {
      return trips
    }

    return trips.filter(
      (trip) => trip.status === filter,
    )
  }, [trips, filter])

  const filters: TripFilter[] = [
    'ALL',
    'SCHEDULED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
  ]

  return (
    <>
      <header className="flex min-h-20 items-center justify-between border-b border-slate-200 bg-white px-8 py-4">
        <div>
          <h1 className="text-xl font-bold">
            My Trips
          </h1>

          <p className="text-sm text-slate-500">
            View and manage trips assigned to you.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadTrips()}
          disabled={loading}
          className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
        >
          Refresh
        </button>
      </header>

      <section className="p-8">
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Scheduled"
            value={
              trips.filter(
                (trip) =>
                  trip.status === 'SCHEDULED',
              ).length
            }
          />

          <StatCard
            title="In Progress"
            value={
              trips.filter(
                (trip) =>
                  trip.status === 'IN_PROGRESS',
              ).length
            }
          />

          <StatCard
            title="Completed"
            value={
              trips.filter(
                (trip) =>
                  trip.status === 'COMPLETED',
              ).length
            }
          />

          <StatCard
            title="Cancelled"
            value={
              trips.filter(
                (trip) =>
                  trip.status === 'CANCELLED',
              ).length
            }
          />
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap gap-2 border-b border-slate-200 p-6">
            {filters.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFilter(status)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status.replaceAll('_', ' ')}
              </button>
            ))}
          </div>

          {loading && (
            <div className="p-8 text-slate-500">
              Loading your trips...
            </div>
          )}

          {!loading &&
            filteredTrips.length === 0 && (
              <div className="p-12 text-center">
                <p className="font-semibold text-slate-700">
                  No trips found.
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Assigned trips will appear here.
                </p>
              </div>
            )}

          {!loading &&
            filteredTrips.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] text-left text-sm">
                  <thead className="border-b bg-slate-50 text-slate-500">
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

                      <th className="py-4 pr-6">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredTrips.map((trip) => {
                      const isProcessing =
                        actionTripId === trip.id

                      return (
                        <tr
                          key={trip.id}
                          className="border-b border-slate-100 hover:bg-slate-50"
                        >
                          <td className="px-6 py-4 font-semibold">
                            TRIP-{trip.id}
                          </td>

                          <td className="py-4 pr-6">
                            <p className="font-semibold">
                              {trip.request?.employee
                                ?.name ?? 'Unknown'}
                            </p>

                            <p className="text-xs text-slate-500">
                              {trip.request?.employee
                                ?.email ?? 'Unavailable'}
                            </p>
                          </td>

                          <td className="py-4 pr-6">
                            <p className="font-medium">
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
                            <p className="font-medium">
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
                            <p className="font-semibold">
                              {trip.vehicle
                                ?.plateNumber ??
                                `Vehicle ${trip.vehicleId}`}
                            </p>

                            <p className="text-xs text-slate-500">
                              {trip.vehicle
                                ?.vehicleType ?? ''}
                            </p>
                          </td>

                          <td className="py-4 pr-6">
                            <TripStatusBadge
                              status={trip.status}
                            />
                          </td>

                          <td className="py-4 pr-6">
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedTrip(trip)
                                }
                                className="font-semibold text-blue-600"
                              >
                                View
                              </button>

                              {trip.status ===
                                'SCHEDULED' && (
                                <button
                                  type="button"
                                  disabled={isProcessing}
                                  onClick={() =>
                                    void handleStart(
                                      trip,
                                    )
                                  }
                                  className="font-semibold text-green-600 disabled:opacity-50"
                                >
                                  {isProcessing
                                    ? 'Starting...'
                                    : 'Start'}
                                </button>
                              )}

                              {trip.status ===
                                'IN_PROGRESS' && (
                                <button
                                  type="button"
                                  disabled={isProcessing}
                                  onClick={() =>
                                    void handleComplete(
                                      trip,
                                    )
                                  }
                                  className="font-semibold text-green-600 disabled:opacity-50"
                                >
                                  {isProcessing
                                    ? 'Completing...'
                                    : 'Complete'}
                                </button>
                              )}

                              {(trip.status ===
                                'SCHEDULED' ||
                                trip.status ===
                                  'IN_PROGRESS') && (
                                <button
                                  type="button"
                                  disabled={isProcessing}
                                  onClick={() =>
                                    void handleCancel(
                                      trip,
                                    )
                                  }
                                  className="font-semibold text-red-600 disabled:opacity-50"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      </section>

      {selectedTrip && (
        <TripDetailsModal
          trip={selectedTrip}
          processing={
            actionTripId === selectedTrip.id
          }
          onClose={() =>
            setSelectedTrip(null)
          }
          onStart={() =>
            void handleStart(selectedTrip)
          }
          onComplete={() =>
            void handleComplete(selectedTrip)
          }
          onCancel={() =>
            void handleCancel(selectedTrip)
          }
        />
      )}
    </>
  )
}

function TripDetailsModal({
  trip,
  processing,
  onClose,
  onStart,
  onComplete,
  onCancel,
}: {
  trip: Trip
  processing: boolean
  onClose: () => void
  onStart: () => void
  onComplete: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b p-6">
          <div>
            <p className="text-sm text-slate-500">
              Assigned Trip
            </p>

            <h2 className="text-2xl font-bold">
              TRIP-{trip.id}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-2xl text-slate-400"
          >
            ×
          </button>
        </div>

        <div className="space-y-6 p-6">
          <TripStatusBadge
            status={trip.status}
          />

          <div className="grid gap-5 md:grid-cols-2">
            <DetailItem
              label="Passenger"
              value={
                trip.request?.employee?.name ??
                'Unknown'
              }
            />

            <DetailItem
              label="Passenger Email"
              value={
                trip.request?.employee?.email ??
                'Unavailable'
              }
            />

            <DetailItem
              label="Pickup"
              value={
                trip.request?.pickupLocation ??
                'Unavailable'
              }
            />

            <DetailItem
              label="Destination"
              value={
                trip.request?.destination ??
                'Unavailable'
              }
            />

            <DetailItem
              label="Vehicle"
              value={
                trip.vehicle?.plateNumber ??
                `Vehicle ${trip.vehicleId}`
              }
            />

            <DetailItem
              label="Schedule"
              value={
                trip.request
                  ? `${formatDate(
                      trip.request.requestDate,
                    )} ${formatTime(
                      trip.request.requestTime,
                    )}`
                  : 'Unavailable'
              }
            />

            <DetailItem
              label="Started"
              value={
                trip.startTime
                  ? formatDateTime(
                      trip.startTime,
                    )
                  : 'Not started'
              }
            />

            <DetailItem
              label="Ended"
              value={
                trip.endTime
                  ? formatDateTime(
                      trip.endTime,
                    )
                  : 'Not ended'
              }
            />
          </div>

          <div className="rounded-xl bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-500">
              Purpose
            </p>

            <p className="mt-2">
              {trip.request?.purpose ??
                'No purpose provided'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t p-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-5 py-3 font-semibold"
          >
            Close
          </button>

          {trip.status === 'SCHEDULED' && (
            <button
              type="button"
              disabled={processing}
              onClick={onStart}
              className="rounded-xl bg-green-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
            >
              Start Trip
            </button>
          )}

          {trip.status === 'IN_PROGRESS' && (
            <button
              type="button"
              disabled={processing}
              onClick={onComplete}
              className="rounded-xl bg-green-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
            >
              Complete Trip
            </button>
          )}

          {(trip.status === 'SCHEDULED' ||
            trip.status === 'IN_PROGRESS') && (
            <button
              type="button"
              disabled={processing}
              onClick={onCancel}
              className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
            >
              Cancel Trip
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
}: {
  title: string
  value: number
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">
        {title}
      </p>

      <h3 className="mt-1 text-2xl font-bold">
        {value}
      </h3>
    </div>
  )
}

function TripStatusBadge({
  status,
}: {
  status: TripStatus
}) {
  const styles: Record<TripStatus, string> = {
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

function DetailItem({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div>
      <p className="text-sm text-slate-500">
        {label}
      </p>

      <p className="mt-1 font-semibold">
        {value}
      </p>
    </div>
  )
}

function formatDate(value: string) {
  const date = new Date(value)

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString()
}

function formatDateTime(value: string) {
  const date = new Date(value)

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString()
}

function formatTime(value: string) {
  const [hours, minutes] = value
    .split(':')
    .map(Number)

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    return value
  }

  const date = new Date()
  date.setHours(hours, minutes, 0, 0)

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getApiErrorMessage(
  error: unknown,
  fallback: string,
) {
  if (!axios.isAxiosError(error)) {
    return fallback
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

  return fallback
}

export default MyTripsPage