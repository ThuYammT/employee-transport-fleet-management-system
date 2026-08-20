import {
  useEffect,
  useState,
} from 'react'

import {
  Link,
  useNavigate,
  useParams,
} from 'react-router-dom'

import RouteMap from '../../components/maps/RouteMap'

import {
  estimateRoute,
  getTransportRequestById,
  updateTransportRequest,
} from '../../services/transport-request.service'

import type {
  RouteEstimate,
  TransportRequest,
} from '../../types/transport-request'

import {
  getCurrentUser,
} from '../../utils/user-session'

function RequestDetailsPage() {
  const { requestId } =
    useParams()

  const navigate =
    useNavigate()

  const [
    request,
    setRequest,
  ] =
    useState<TransportRequest | null>(
      null,
    )

  const [
    route,
    setRoute,
  ] =
    useState<RouteEstimate | null>(
      null,
    )

  const [
    loading,
    setLoading,
  ] =
    useState(true)

  const [
    routeLoading,
    setRouteLoading,
  ] =
    useState(false)

  const [
    error,
    setError,
  ] =
    useState('')

  useEffect(() => {
    async function loadRequestDetails() {
      const currentUser =
        getCurrentUser()

      if (
        !currentUser ||
        currentUser.role !==
          'EMPLOYEE'
      ) {
        navigate(
          '/login',
          {
            replace: true,
          },
        )

        return
      }

      const parsedId =
        Number(requestId)

      if (
        !Number.isInteger(parsedId)
      ) {
        setError(
          'Invalid transport request ID.',
        )

        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError('')

        const requestData =
          await getTransportRequestById(
            parsedId,
          )

        if (
          requestData.employeeId !==
          currentUser.id
        ) {
          setError(
            'You are not allowed to view this transport request.',
          )

          return
        }

        setRequest(requestData)

        const hasCoordinates =
          requestData.pickupLatitude !=
            null &&
          requestData.pickupLongitude !=
            null &&
          requestData
            .destinationLatitude !=
            null &&
          requestData
            .destinationLongitude !=
            null

        if (hasCoordinates) {
          try {
            setRouteLoading(true)

            const routeData =
              await estimateRoute({
                pickupLatitude:
                  requestData
                    .pickupLatitude!,

                pickupLongitude:
                  requestData
                    .pickupLongitude!,

                destinationLatitude:
                  requestData
                    .destinationLatitude!,

                destinationLongitude:
                  requestData
                    .destinationLongitude!,
              })

            setRoute(routeData)
          } catch (routeError) {
            console.error(
              routeError,
            )

            // The rest of the details page can still work
            // even when the external route service is unavailable.
            setRoute(null)
          } finally {
            setRouteLoading(false)
          }
        }
      } catch (requestError) {
        console.error(
          requestError,
        )

        setError(
          'Failed to load the transport request details.',
        )
      } finally {
        setLoading(false)
      }
    }

    void loadRequestDetails()
  }, [
    navigate,
    requestId,
  ])

  async function handleCancel() {
    if (!request) {
      return
    }

    const confirmed =
      window.confirm(
        'Are you sure you want to cancel this request?',
      )

    if (!confirmed) {
      return
    }

    try {
      await updateTransportRequest(
        request.id,
        {
          status: 'CANCELLED',
        },
      )

      navigate(
        '/employee/my-requests',
      )
    } catch (cancelError) {
      console.error(
        cancelError,
      )

      window.alert(
        'Failed to cancel the transport request.',
      )
    }
  }

  const pickupPosition:
    [number, number] | null =
    request?.pickupLatitude !=
      null &&
    request.pickupLongitude !=
      null
      ? [
          request.pickupLatitude,
          request.pickupLongitude,
        ]
      : null

  const destinationPosition:
    [number, number] | null =
    request?.destinationLatitude !=
      null &&
    request.destinationLongitude !=
      null
      ? [
          request.destinationLatitude,
          request.destinationLongitude,
        ]
      : null

  const distanceKm =
    route?.estimatedDistanceKm ??
    request?.estimatedDistanceKm ??
    null

  const distanceMiles =
    route?.estimatedDistanceMiles ??
    (distanceKm != null
      ? Number(
          (
            distanceKm *
            0.621371
          ).toFixed(2),
        )
      : null)

  const durationMinutes =
    route?.estimatedDurationMinutes ??
    request?.estimatedDurationMinutes ??
    null

  return (
    <>
      <header className="border-b border-slate-200 bg-white px-8 py-5">
        <h1 className="text-xl font-bold text-slate-900">
          Transport Request Details
        </h1>

        <p className="text-sm text-slate-500">
          Review the route, schedule and current request status.
        </p>
      </header>

      <section className="p-8">
        <div className="mx-auto max-w-6xl">
          <Link
            to="/employee/my-requests"
            className="mb-5 inline-flex items-center text-sm font-semibold text-blue-600 transition hover:text-blue-700"
          >
            ← Back to My Requests
          </Link>

          {loading && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-slate-500">
                Loading request details...
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-600">
              {error}
            </div>
          )}

          {!loading &&
            !error &&
            request && (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm text-slate-500">
                      Request ID
                    </p>

                    <h2 className="text-2xl font-bold text-slate-900">
                      REQ-
                      {request.id}
                    </h2>
                  </div>

                  <StatusBadge
                    status={
                      request.status
                    }
                  />
                </div>

                <div className="grid grid-cols-1 gap-6 py-8 md:grid-cols-2">
                  <DetailItem
                    label="Pickup Location"
                    value={
                      request.pickupLocation
                    }
                  />

                  <DetailItem
                    label="Destination"
                    value={
                      request.destination
                    }
                  />

                  <DetailItem
                    label="Request Date"
                    value={formatDate(
                      request.requestDate,
                    )}
                  />

                  <DetailItem
                    label="Request Time"
                    value={formatTime(
                      request.requestTime,
                    )}
                  />

                  <DetailItem
                    label="Employee ID"
                    value={`EMP-${request.employeeId
                      .toString()
                      .padStart(
                        4,
                        '0',
                      )}`}
                  />

                  <DetailItem
                    label="Created At"
                    value={formatDateTime(
                      request.createdAt,
                    )}
                  />
                </div>

                <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <RouteStat
                    label="Distance"
                    value={
                      distanceKm != null
                        ? `${distanceKm.toFixed(
                            2,
                          )} km`
                        : 'Not available'
                    }
                  />

                  <RouteStat
                    label="Distance in miles"
                    value={
                      distanceMiles !=
                      null
                        ? `${distanceMiles.toFixed(
                            2,
                          )} mi`
                        : 'Not available'
                    }
                  />

                  <RouteStat
                    label="Estimated time"
                    value={
                      durationMinutes !=
                      null
                        ? formatDuration(
                            durationMinutes,
                          )
                        : 'Not available'
                    }
                  />
                </div>

                {routeLoading && (
                  <div className="mb-8 rounded-xl border border-blue-200 bg-blue-50 p-5 text-blue-700">
                    Loading the saved route map...
                  </div>
                )}

                {!routeLoading &&
                  pickupPosition &&
                  destinationPosition &&
                  route && (
                    <div className="mb-8">
                      <div className="mb-4">
                        <h3 className="text-lg font-bold text-slate-900">
                          Route Map
                        </h3>

                        <p className="text-sm text-slate-500">
                          The route between the selected pickup location and destination.
                        </p>
                      </div>

                      <RouteMap
                        pickup={
                          pickupPosition
                        }
                        destination={
                          destinationPosition
                        }
                        routeCoordinates={
                          route.routeCoordinates
                        }
                      />
                    </div>
                  )}

                {!routeLoading &&
                  pickupPosition &&
                  destinationPosition &&
                  !route && (
                    <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-5">
                      <p className="font-semibold text-amber-800">
                        Route map temporarily unavailable
                      </p>

                      <p className="mt-1 text-sm text-amber-700">
                        The pickup and destination are saved, but the route service could not load the route line.
                      </p>
                    </div>
                  )}

                {!pickupPosition ||
                !destinationPosition ? (
                  <div className="mb-8 rounded-xl border border-slate-200 bg-slate-50 p-5">
                    <p className="font-semibold text-slate-700">
                      No map available for this request
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      This request was created before map coordinates were added to the system.
                    </p>
                  </div>
                ) : null}

                <div className="rounded-xl bg-slate-50 p-5">
                  <p className="mb-2 text-sm font-semibold text-slate-500">
                    Purpose
                  </p>

                  <p className="leading-7 text-slate-800">
                    {request.purpose}
                  </p>
                </div>

                {request.status ===
                  'PENDING' && (
                  <div className="mt-8 flex justify-end">
                    <button
                      type="button"
                      onClick={
                        handleCancel
                      }
                      className="rounded-xl border border-red-300 px-6 py-3 font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      Cancel Request
                    </button>
                  </div>
                )}
              </div>
            )}
        </div>
      </section>
    </>
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
      <p className="mb-1 text-sm text-slate-500">
        {label}
      </p>

      <p className="font-semibold leading-6 text-slate-900">
        {value}
      </p>
    </div>
  )
}

function RouteStat({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
      <p className="text-sm font-medium text-blue-700">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-blue-950">
        {value}
      </p>
    </div>
  )
}

function StatusBadge({
  status,
}: {
  status: string
}) {
  const styles:
    Record<string, string> = {
    PENDING:
      'bg-amber-100 text-amber-700',

    APPROVED:
      'bg-green-100 text-green-700',

    REJECTED:
      'bg-red-100 text-red-700',

    CANCELLED:
      'bg-slate-200 text-slate-700',
  }

  return (
    <span
      className={`w-fit rounded-full px-4 py-2 text-sm font-semibold ${
        styles[status] ??
        'bg-slate-100 text-slate-700'
      }`}
    >
      {status}
    </span>
  )
}

function formatDate(
  value: string,
) {
  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value
  }

  return date.toLocaleDateString()
}

function formatDateTime(
  value: string,
) {
  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value
  }

  return date.toLocaleString()
}

function formatTime(
  value: string,
) {
  if (!value) {
    return '-'
  }

  const [
    hours,
    minutes,
  ] =
    value
      .split(':')
      .map(Number)

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    return value
  }

  const date =
    new Date()

  date.setHours(
    hours,
    minutes,
    0,
    0,
  )

  return date.toLocaleTimeString(
    [],
    {
      hour: '2-digit',
      minute: '2-digit',
    },
  )
}

function formatDuration(
  totalMinutes: number,
) {
  const hours =
    Math.floor(
      totalMinutes / 60,
    )

  const minutes =
    totalMinutes % 60

  if (hours === 0) {
    return `${minutes} min`
  }

  if (minutes === 0) {
    return `${hours} hr`
  }

  return `${hours} hr ${minutes} min`
}

export default RequestDetailsPage