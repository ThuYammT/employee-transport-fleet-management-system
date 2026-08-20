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
  ] = useState(true)

  const [
    routeLoading,
    setRouteLoading,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState('')

  useEffect(() => {
    void loadRequestDetails()
  }, [requestId])

  async function loadRequestDetails() {
    const currentUser =
      getCurrentUser()

    if (
      !currentUser ||
      currentUser.role !==
        'EMPLOYEE'
    ) {
      navigate('/login', {
        replace: true,
      })

      return
    }

    const parsedId =
      Number(requestId)

    if (
      !Number.isInteger(
        parsedId,
      )
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

      setRequest(
        requestData,
      )

      const hasCoordinates =
        requestData.pickupLatitude !=
          null &&
        requestData.pickupLongitude !=
          null &&
        requestData.destinationLatitude !=
          null &&
        requestData.destinationLongitude !=
          null

      if (
        hasCoordinates
      ) {
        try {
          setRouteLoading(
            true,
          )

          const routeData =
            await estimateRoute({
              pickupLatitude:
                requestData.pickupLatitude!,

              pickupLongitude:
                requestData.pickupLongitude!,

              destinationLatitude:
                requestData.destinationLatitude!,

              destinationLongitude:
                requestData.destinationLongitude!,
            })

          setRoute(
            routeData,
          )
        } catch (error) {
          console.error(error)
          setRoute(null)
        } finally {
          setRouteLoading(
            false,
          )
        }
      }
    } catch (error) {
      console.error(error)

      setError(
        'Failed to load the transport request details.',
      )
    } finally {
      setLoading(false)
    }
  }

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
          status:
            'CANCELLED',
        },
      )

      navigate(
        '/employee/my-requests',
      )
    } catch (error) {
      console.error(error)

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
      ? distanceKm *
        0.621371
      : null)

  const duration =
    route?.estimatedDurationMinutes ??
    request?.estimatedDurationMinutes ??
    null

  return (
    <>
      <header className="flex min-h-[72px] items-center border-b border-slate-200 bg-white px-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-950">
            Request Details
          </h1>

          <p className="mt-0.5 text-sm text-slate-500">
            Review the route,
            schedule and request
            status.
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-[1400px] p-8">
        <Link
          to="/employee/my-requests"
          className="mb-5 inline-flex text-sm font-semibold text-slate-600 hover:text-slate-950"
        >
          ← Back to My Requests
        </Link>

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <p className="text-sm text-slate-500">
              Loading request
              details...
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          request && (
            <div className="space-y-6">
              {/* HERO */}

              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 px-7 py-6 text-white">
                <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />

                <div className="relative z-10 flex flex-wrap items-center justify-between gap-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-200">
                      Transport request
                    </p>

                    <h2 className="mt-2 text-3xl font-semibold">
                      REQ-
                      {request.id}
                    </h2>

                    <p className="mt-2 text-sm text-slate-300">
                      Created{' '}
                      {formatDateTime(
                        request.createdAt,
                      )}
                    </p>
                  </div>

                  <StatusBadge
                    status={
                      request.status
                    }
                  />
                </div>
              </div>

              {/* DETAILS */}

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Request information
                </p>

                <h3 className="mt-1 text-lg font-semibold text-slate-950">
                  Journey Details
                </h3>

                <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
                </div>

                <div className="mt-6 grid gap-5 rounded-xl border border-slate-200 bg-slate-50 p-5 md:grid-cols-2">
                  <RoutePoint
                    label="Pickup"
                    value={
                      request.pickupLocation
                    }
                    tone="blue"
                  />

                  <RoutePoint
                    label="Destination"
                    value={
                      request.destination
                    }
                    tone="indigo"
                  />
                </div>
              </section>

              {/* ROUTE METRICS */}

              <div className="grid gap-4 sm:grid-cols-3">
                <Metric
                  label="Distance"
                  value={
                    distanceKm !=
                    null
                      ? `${distanceKm.toFixed(
                          2,
                        )} km`
                      : 'Not available'
                  }
                />

                <Metric
                  label="Distance"
                  value={
                    distanceMiles !=
                    null
                      ? `${distanceMiles.toFixed(
                          2,
                        )} mi`
                      : 'Not available'
                  }
                />

                <Metric
                  label="Estimated Time"
                  value={
                    duration !=
                    null
                      ? formatDuration(
                          duration,
                        )
                      : 'Not available'
                  }
                />
              </div>

              {/* MAP */}

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Saved route
                </p>

                <h3 className="mt-1 text-lg font-semibold text-slate-950">
                  Route Map
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Requested pickup
                  and destination.
                </p>

                {routeLoading ? (
                  <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-5 text-sm text-blue-700">
                    Loading route...
                  </div>
                ) : pickupPosition &&
                  destinationPosition &&
                  route ? (
                  <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
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
                ) : pickupPosition &&
                  destinationPosition ? (
                  <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-5">
                    <p className="font-semibold text-amber-800">
                      Route temporarily
                      unavailable
                    </p>

                    <p className="mt-1 text-sm text-amber-700">
                      The selected
                      locations are
                      saved, but the
                      route service
                      could not load
                      the route line.
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                    This request was
                    created before map
                    coordinates were
                    stored.
                  </div>
                )}
              </section>

              {/* PURPOSE */}

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Request purpose
                </p>

                <p className="mt-3 leading-7 text-slate-700">
                  {request.purpose}
                </p>
              </section>

              {request.status ===
                'PENDING' && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      void handleCancel()
                    }
                    className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-600 hover:bg-red-100"
                  >
                    Cancel Request
                  </button>
                </div>
              )}
            </div>
          )}
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
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  )
}

function Metric({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-xl font-semibold text-slate-950">
        {value}
      </p>
    </div>
  )
}

function RoutePoint({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone:
    | 'blue'
    | 'indigo'
}) {
  const style =
    tone === 'blue'
      ? 'bg-blue-500 ring-blue-100'
      : 'bg-indigo-500 ring-indigo-100'

  return (
    <div className="flex items-start gap-3">
      <span
        className={`mt-1.5 h-3 w-3 shrink-0 rounded-full ring-4 ${style}`}
      />

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>

        <p className="mt-1 text-sm font-semibold leading-6 text-slate-800">
          {value}
        </p>
      </div>
    </div>
  )
}

function StatusBadge({
  status,
}: {
  status: string
}) {
  const styles:
    Record<
      string,
      string
    > = {
    PENDING:
      'bg-amber-400/15 text-amber-200 ring-1 ring-amber-400/30',

    APPROVED:
      'bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-400/30',

    REJECTED:
      'bg-red-400/15 text-red-200 ring-1 ring-red-400/30',

    CANCELLED:
      'bg-slate-400/15 text-slate-300 ring-1 ring-slate-400/30',
  }

  return (
    <span
      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
        styles[status] ??
        styles.CANCELLED
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

  return Number.isNaN(
    date.getTime(),
  )
    ? value
    : date.toLocaleDateString(
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
) {
  const date =
    new Date(value)

  return Number.isNaN(
    date.getTime(),
  )
    ? value
    : date.toLocaleString()
}

function formatTime(
  value: string,
) {
  if (!value) {
    return '—'
  }

  const [
    hours,
    minutes,
  ] = value
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

  if (!hours) {
    return `${minutes} min`
  }

  if (!minutes) {
    return `${hours} hr`
  }

  return `${hours} hr ${minutes} min`
}

export default RequestDetailsPage