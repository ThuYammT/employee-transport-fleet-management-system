import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  useNavigate,
} from 'react-router-dom'

import {
  getDashboardStats,
} from '../../services/dashboard.service'

import {
  getTransportRequests,
} from '../../services/transport-request.service'

import {
  getVehicles,
} from '../../services/vehicle.service'

import {
  getDrivers,
} from '../../services/driver.service'

import {
  getMaintenanceLogs,
} from '../../services/maintenance-log.service'

import type {
  TransportRequest,
} from '../../types/transport-request'

import type {
  Vehicle,
} from '../../types/vehicle'

import type {
  Driver,
} from '../../types/driver'

import type {
  MaintenanceLog,
} from '../../types/maintenance-log'

function DashboardHome() {
  const navigate = useNavigate()

  const [stats, setStats] = useState({
    totalVehicles: 0,
    totalDrivers: 0,
    totalFuelLogs: 0,
    totalMaintenanceLogs: 0,
    totalUsers: 0,
  })

  const [requests, setRequests] = useState<
    TransportRequest[]
  >([])

  const [vehicles, setVehicles] = useState<
    Vehicle[]
  >([])

  const [drivers, setDrivers] = useState<
    Driver[]
  >([])

  const [
    maintenanceLogs,
    setMaintenanceLogs,
  ] = useState<MaintenanceLog[]>([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  useEffect(() => {
    void fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      setLoading(true)
      setError('')

      const [
        statsData,
        requestData,
        vehicleData,
        driverData,
        maintenanceData,
      ] = await Promise.all([
        getDashboardStats(),
        getTransportRequests(),
        getVehicles(),
        getDrivers(),
        getMaintenanceLogs(),
      ])

      setStats(statsData)
      setRequests(requestData)
      setVehicles(vehicleData)
      setDrivers(driverData)
      setMaintenanceLogs(
        maintenanceData,
      )
    } catch (error) {
      console.error(error)

      setError(
        'Failed to load dashboard data.',
      )
    } finally {
      setLoading(false)
    }
  }

  const recentRequests = useMemo(() => {
    return [...requests]
      .sort((a, b) => {
        const dateA = new Date(
          a.requestDate,
        ).getTime()

        const dateB = new Date(
          b.requestDate,
        ).getTime()

        return dateB - dateA
      })
      .slice(0, 5)
  }, [requests])

  const vehicleStats = useMemo(
    () => ({
      available: vehicles.filter(
        (vehicle) =>
          vehicle.status === 'AVAILABLE',
      ).length,

      inUse: vehicles.filter(
        (vehicle) =>
          vehicle.status === 'IN_USE',
      ).length,

      maintenance: vehicles.filter(
        (vehicle) =>
          vehicle.status === 'MAINTENANCE',
      ).length,

      inactive: vehicles.filter(
        (vehicle) =>
          vehicle.status === 'INACTIVE',
      ).length,
    }),
    [vehicles],
  )

  const driverStats = useMemo(
    () => ({
      available: drivers.filter(
        (driver) =>
          driver.availabilityStatus ===
          'AVAILABLE',
      ).length,

      onTrip: drivers.filter(
        (driver) =>
          driver.availabilityStatus ===
          'ON_TRIP',
      ).length,

      offDuty: drivers.filter(
        (driver) =>
          driver.availabilityStatus ===
          'OFF_DUTY',
      ).length,

      inactive: drivers.filter(
        (driver) =>
          driver.availabilityStatus ===
          'INACTIVE',
      ).length,
    }),
    [drivers],
  )

  const pendingRequests =
    requests.filter(
      (request) =>
        request.status === 'PENDING',
    ).length

  const approvedUnassigned =
    requests.filter(
      (request) =>
        request.status === 'APPROVED' &&
        !request.trip,
    ).length

  const pendingMaintenance =
    maintenanceLogs.filter(
      (record) =>
        record.status === 'PENDING',
    ).length

  const maintenanceInProgress =
    maintenanceLogs.filter(
      (record) =>
        record.status === 'IN_PROGRESS',
    ).length

  const unassignedDrivers =
    drivers.filter(
      (driver) =>
        driver.availabilityStatus !==
          'INACTIVE' &&
        !driver.assignedVehicleId,
    ).length

  const attentionItems = [
    {
      label:
        'Transport requests awaiting approval',
      value: pendingRequests,
      action: () =>
        navigate(
          '/admin/transport-requests',
        ),
    },
    {
      label:
        'Approved requests waiting for assignment',
      value: approvedUnassigned,
      action: () =>
        navigate(
          '/admin/transport-requests',
        ),
    },
    {
      label:
        'Pending maintenance records',
      value: pendingMaintenance,
      action: () =>
        navigate('/admin/maintenance'),
    },
    {
      label:
        'Maintenance currently in progress',
      value: maintenanceInProgress,
      action: () =>
        navigate('/admin/maintenance'),
    },
    {
      label:
        'Drivers without assigned vehicles',
      value: unassignedDrivers,
      action: () =>
        navigate('/admin/drivers'),
    },
  ].filter(
    (item) => item.value > 0,
  )

  const today = new Date()

  return (
    <>
      {/* =========================
          TOP HEADER
      ========================== */}

      <header className="flex min-h-[72px] items-center justify-between border-b border-slate-200 bg-white px-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-950">
            Overview
          </h1>

          <p className="mt-0.5 text-sm text-slate-500">
            Monitor your fleet operations
            and daily activity.
          </p>
        </div>

        <div className="text-right">
          <p className="text-sm font-medium text-slate-700">
            {today.toLocaleDateString(
              undefined,
              {
                weekday: 'long',
              },
            )}
          </p>

          <p className="text-xs text-slate-400">
            {today.toLocaleDateString(
              undefined,
              {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              },
            )}
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-[1600px] p-8">
        {/* =========================
            BUSINESS GRADIENT HEADER
        ========================== */}

        <div className="relative mb-7 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 px-7 py-7 text-white shadow-sm">
          {/* Decorative glow */}

          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                <span className="mr-2 h-1.5 w-1.5 rounded-full bg-blue-400" />

                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-100">
                  Admin workspace
                </span>
              </div>

              <h2 className="text-2xl font-semibold tracking-tight text-white">
                Fleet at a glance
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Key operational figures across
                vehicles, drivers, transport
                activity, fuel records and
                maintenance.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-5 py-4 backdrop-blur-sm">
              <div>
                <p className="text-xs font-medium text-slate-400">
                  Fleet status
                </p>

                <div className="mt-1 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />

                  <p className="text-sm font-semibold text-white">
                    Operations active
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                void fetchDashboardData()
              }
              className="text-sm font-semibold text-red-700 hover:text-red-900"
            >
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* =========================
                KPI CARDS
            ========================== */}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <StatCard
                title="Fleet vehicles"
                value={
                  stats.totalVehicles
                }
                abbreviation="VH"
              />

              <StatCard
                title="Drivers"
                value={
                  stats.totalDrivers
                }
                abbreviation="DR"
              />

              <StatCard
                title="Fuel records"
                value={
                  stats.totalFuelLogs
                }
                abbreviation="FL"
              />

              <StatCard
                title="Maintenance"
                value={
                  stats.totalMaintenanceLogs
                }
                abbreviation="MT"
              />

              <StatCard
                title="System users"
                value={stats.totalUsers}
                abbreviation="US"
              />
            </div>

            {/* =========================
                MAIN DASHBOARD
            ========================== */}

            <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
              {/* =========================
                  RECENT REQUESTS
              ========================== */}

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-1 rounded-full bg-gradient-to-b from-blue-500 to-indigo-700" />

                      <div>
                        <h3 className="font-semibold text-slate-950">
                          Recent transport requests
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          Latest employee transport
                          activity.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        '/admin/transport-requests',
                      )
                    }
                    className="rounded-lg px-3 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 hover:text-blue-700"
                  >
                    View all →
                  </button>
                </div>

                {recentRequests.length ===
                0 ? (
                  <div className="px-6 py-12 text-center">
                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-500">
                      TR
                    </div>

                    <p className="mt-4 text-sm font-semibold text-slate-700">
                      No transport requests yet
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      New employee requests will
                      appear here.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {recentRequests.map(
                      (request) => (
                        <button
                          key={request.id}
                          type="button"
                          onClick={() =>
                            navigate(
                              '/admin/transport-requests',
                            )
                          }
                          className="group flex w-full items-center gap-5 px-6 py-4 text-left transition hover:bg-slate-50"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 to-blue-900 text-[11px] font-bold text-white shadow-sm">
                            R{request.id}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-slate-900">
                                REQ-
                                {request.id}
                              </p>

                              <RequestStatusBadge
                                status={
                                  request.status
                                }
                              />
                            </div>

                            <p className="mt-1 truncate text-sm text-slate-600">
                              {request
                                .employee
                                ?.name ??
                                `Employee ${request.employeeId}`}
                            </p>

                            <p className="mt-1 truncate text-xs text-slate-400">
                              {
                                request.pickupLocation
                              }
                              {' → '}
                              {
                                request.destination
                              }
                            </p>
                          </div>

                          <div className="shrink-0 text-right">
                            <p className="text-sm font-medium text-slate-700">
                              {formatDate(
                                request.requestDate,
                              )}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {formatTime(
                                request.requestTime,
                              )}
                            </p>
                          </div>
                        </button>
                      ),
                    )}
                  </div>
                )}
              </div>

              {/* =========================
                  FLEET AVAILABILITY
              ========================== */}

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 bg-gradient-to-r from-slate-950 via-blue-950 to-slate-950 px-6 py-5">
                  <h3 className="font-semibold text-white">
                    Fleet availability
                  </h3>

                  <p className="mt-1 text-sm text-slate-300">
                    Current vehicle and driver
                    availability.
                  </p>
                </div>

                <div className="p-6">
                  <AvailabilitySection
                    title="Vehicles"
                    total={vehicles.length}
                    items={[
                      {
                        label:
                          'Available',
                        value:
                          vehicleStats.available,
                        tone: 'green',
                      },
                      {
                        label: 'In use',
                        value:
                          vehicleStats.inUse,
                        tone: 'blue',
                      },
                      {
                        label:
                          'Maintenance',
                        value:
                          vehicleStats.maintenance,
                        tone: 'amber',
                      },
                      {
                        label:
                          'Inactive',
                        value:
                          vehicleStats.inactive,
                        tone: 'slate',
                      },
                    ]}
                  />

                  <div className="my-6 border-t border-slate-100" />

                  <AvailabilitySection
                    title="Drivers"
                    total={drivers.length}
                    items={[
                      {
                        label:
                          'Available',
                        value:
                          driverStats.available,
                        tone: 'green',
                      },
                      {
                        label:
                          'On trip',
                        value:
                          driverStats.onTrip,
                        tone: 'blue',
                      },
                      {
                        label:
                          'Off duty',
                        value:
                          driverStats.offDuty,
                        tone: 'amber',
                      },
                      {
                        label:
                          'Inactive',
                        value:
                          driverStats.inactive,
                        tone: 'slate',
                      },
                    ]}
                  />
                </div>
              </div>
            </div>

            {/* =========================
                NEEDS ATTENTION
            ========================== */}

            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-1 rounded-full bg-gradient-to-b from-amber-400 to-orange-500" />

                  <div>
                    <h3 className="font-semibold text-slate-950">
                      Needs attention
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Items that may require
                      administrative action.
                    </p>
                  </div>
                </div>

                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    attentionItems.length >
                    0
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {attentionItems.length >
                  0
                    ? `${attentionItems.length} items`
                    : 'All clear'}
                </span>
              </div>

              {attentionItems.length ===
              0 ? (
                <div className="flex items-center gap-4 px-6 py-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-sm font-bold text-emerald-600">
                    ✓
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      No urgent actions
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      There are currently no
                      outstanding operational
                      items requiring attention.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3">
                  {attentionItems.map(
                    (item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={
                          item.action
                        }
                        className="group flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5 text-left transition last:border-b-0 hover:bg-slate-50 sm:border-r"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-700 group-hover:text-slate-950">
                            {item.label}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            Click to review
                          </p>
                        </div>

                        <div className="flex h-10 min-w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-50 to-orange-100 px-3 text-sm font-bold text-amber-700">
                          {item.value}
                        </div>
                      </button>
                    ),
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </>
  )
}

/* ==========================================
   KPI CARD
========================================== */

function StatCard({
  title,
  value,
  abbreviation,
}: {
  title: string
  value: number
  abbreviation: string
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-slate-950 via-blue-700 to-indigo-600 opacity-0 transition group-hover:opacity-100" />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {value.toLocaleString()}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 to-blue-900 text-[11px] font-bold text-white shadow-sm">
          {abbreviation}
        </div>
      </div>

      <div className="mt-5 border-t border-slate-100 pt-3">
        <p className="text-xs text-slate-400">
          Current system total
        </p>
      </div>
    </div>
  )
}

/* ==========================================
   AVAILABILITY
========================================== */

type AvailabilityTone =
  | 'green'
  | 'blue'
  | 'amber'
  | 'slate'

type AvailabilityItem = {
  label: string
  value: number
  tone: AvailabilityTone
}

function AvailabilitySection({
  title,
  total,
  items,
}: {
  title: string
  total: number
  items: AvailabilityItem[]
}) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-800">
          {title}
        </p>

        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
          {total} total
        </span>
      </div>

      <div className="space-y-3.5">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <StatusDot
                tone={item.tone}
              />

              <span className="text-sm text-slate-600">
                {item.label}
              </span>
            </div>

            <span className="text-sm font-semibold text-slate-900">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatusDot({
  tone,
}: {
  tone: AvailabilityTone
}) {
  const styles: Record<
    AvailabilityTone,
    string
  > = {
    green:
      'bg-emerald-500 ring-4 ring-emerald-50',
    blue:
      'bg-blue-500 ring-4 ring-blue-50',
    amber:
      'bg-amber-500 ring-4 ring-amber-50',
    slate:
      'bg-slate-400 ring-4 ring-slate-100',
  }

  return (
    <span
      className={`h-2 w-2 rounded-full ${styles[tone]}`}
    />
  )
}

/* ==========================================
   REQUEST STATUS BADGE
========================================== */

function RequestStatusBadge({
  status,
}: {
  status:
    | 'PENDING'
    | 'APPROVED'
    | 'REJECTED'
    | 'CANCELLED'
}) {
  const styles = {
    PENDING:
      'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    APPROVED:
      'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    REJECTED:
      'bg-red-50 text-red-700 ring-1 ring-red-200',
    CANCELLED:
      'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  }

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${styles[status]}`}
    >
      {status}
    </span>
  )
}

/* ==========================================
   LOADING SKELETON
========================================== */

function DashboardSkeleton() {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({
          length: 5,
        }).map((_, index) => (
          <div
            key={index}
            className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white p-5"
          >
            <div className="h-3 w-24 rounded bg-slate-100" />

            <div className="mt-5 h-8 w-14 rounded bg-slate-100" />

            <div className="mt-7 h-px bg-slate-100" />

            <div className="mt-3 h-2.5 w-28 rounded bg-slate-100" />
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="h-[390px] animate-pulse rounded-2xl border border-slate-200 bg-white" />

        <div className="h-[390px] animate-pulse rounded-2xl border border-slate-200 bg-white" />
      </div>
    </>
  )
}

/* ==========================================
   FORMATTERS
========================================== */

function formatDate(
  value: string,
) {
  const date = new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value
  }

  return date.toLocaleDateString(
    undefined,
    {
      day: 'numeric',
      month: 'short',
    },
  )
}

function formatTime(
  value: string,
) {
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
  )

  return date.toLocaleTimeString(
    [],
    {
      hour: '2-digit',
      minute: '2-digit',
    },
  )
}

export default DashboardHome