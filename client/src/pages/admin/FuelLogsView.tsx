import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  useNavigate,
} from 'react-router-dom'

import axios from 'axios'

import {
  getFuelLogs,
} from '../../services/fuel-log.service'

import {
  getVehicles,
} from '../../services/vehicle.service'

import type {
  FuelLog,
} from '../../types/fuel-log'

import type {
  Vehicle,
} from '../../types/vehicle'

function FuelLogsView() {
  const navigate = useNavigate()

  const [fuelLogs, setFuelLogs] =
    useState<FuelLog[]>([])

  const [vehicles, setVehicles] =
    useState<Vehicle[]>([])

  const [searchTerm, setSearchTerm] =
    useState('')

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  useEffect(() => {
    void fetchData()
  }, [])

  async function fetchData() {
    try {
      setLoading(true)
      setError('')

      const [
        logsData,
        vehiclesData,
      ] = await Promise.all([
        getFuelLogs(),
        getVehicles(),
      ])

      setFuelLogs(logsData)
      setVehicles(vehiclesData)
    } catch (error) {
      console.error(error)

      setError(
        getApiErrorMessage(
          error,
          'Failed to load fuel records.',
        ),
      )
    } finally {
      setLoading(false)
    }
  }

  const totalFuel =
    useMemo(
      () =>
        fuelLogs.reduce(
          (sum, log) =>
            sum + log.liters,
          0,
        ),
      [fuelLogs],
    )

  const totalCost =
    useMemo(
      () =>
        fuelLogs.reduce(
          (sum, log) =>
            sum + log.cost,
          0,
        ),
      [fuelLogs],
    )

  const vehiclesWithFuelRecords =
    useMemo(
      () =>
        new Set(
          fuelLogs.map(
            (log) =>
              log.vehicleId,
          ),
        ).size,
      [fuelLogs],
    )

  const filteredVehicles =
    useMemo(() => {
      const keyword =
        searchTerm
          .trim()
          .toLowerCase()

      if (!keyword) {
        return vehicles
      }

      return vehicles.filter(
        (vehicle) =>
          vehicle.plateNumber
            .toLowerCase()
            .includes(keyword) ||
          vehicle.vehicleType
            .toLowerCase()
            .includes(keyword) ||
          vehicle.status
            .toLowerCase()
            .includes(keyword),
      )
    }, [
      vehicles,
      searchTerm,
    ])

  return (
    <>
      <header className="flex min-h-[72px] items-center justify-between border-b border-slate-200 bg-white px-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-950">
            Fuel Logs
          </h1>

          <p className="mt-0.5 text-sm text-slate-500">
            Review fuel consumption and
            spending by vehicle.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            void fetchData()
          }
          disabled={loading}
          className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
        >
          {loading
            ? 'Refreshing...'
            : 'Refresh'}
        </button>
      </header>

      <section className="mx-auto max-w-[1600px] p-8">
        {/* INTRO */}

        <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 px-7 py-7 text-white shadow-sm">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-200">
              Fuel operations
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Vehicle Fuel Management
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Select a vehicle to review
              its fuel usage, cost history,
              and individual
              refueling records.
            </p>
          </div>
        </div>

        {/* STATS */}

        <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Fuel records"
            value={
              fuelLogs.length.toLocaleString()
            }
            helper="Recorded transactions"
            tone="blue"
          />

          <SummaryCard
            label="Total fuel"
            value={`${formatNumber(
              totalFuel,
              1,
            )} L`}
            helper="Fleet consumption"
            tone="green"
          />

          <SummaryCard
            label="Fuel spending"
            value={`${formatNumber(
              totalCost,
            )} MMK`}
            helper="Total recorded cost"
            tone="amber"
          />

          <SummaryCard
            label="Vehicles fueled"
            value={
              vehiclesWithFuelRecords.toLocaleString()
            }
            helper={`${vehicles.length} registered vehicles`}
            tone="slate"
          />
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* VEHICLE SECTION */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold text-slate-950">
                Vehicle fuel records
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Select a vehicle to open
                its detailed fuel profile.
              </p>
            </div>

            <input
              type="search"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value,
                )
              }
              placeholder="Search vehicle..."
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-72"
            />
          </div>

          <div className="p-6">
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({
                  length: 6,
                }).map(
                  (_, index) => (
                    <div
                      key={index}
                      className="h-52 animate-pulse rounded-2xl border border-slate-200 bg-slate-50"
                    />
                  ),
                )}
              </div>
            ) : filteredVehicles.length ===
              0 ? (
              <div className="py-14 text-center">
                <p className="font-semibold text-slate-700">
                  No vehicles found
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Try changing your
                  search keyword.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredVehicles.map(
                  (vehicle) => {
                    const vehicleLogs =
                      fuelLogs.filter(
                        (log) =>
                          log.vehicleId ===
                          vehicle.id,
                      )

                    const vehicleFuel =
                      vehicleLogs.reduce(
                        (
                          sum,
                          log,
                        ) =>
                          sum +
                          log.liters,
                        0,
                      )

                    const vehicleCost =
                      vehicleLogs.reduce(
                        (
                          sum,
                          log,
                        ) =>
                          sum +
                          log.cost,
                        0,
                      )

                    const latestLog =
                      [...vehicleLogs]
                        .sort(
                          (a, b) =>
                            new Date(
                              b.fuelDate,
                            ).getTime() -
                            new Date(
                              a.fuelDate,
                            ).getTime(),
                        )[0] ?? null

                    return (
                      <VehicleFuelCard
                        key={
                          vehicle.id
                        }
                        vehicle={
                          vehicle
                        }
                        recordCount={
                          vehicleLogs.length
                        }
                        totalFuel={
                          vehicleFuel
                        }
                        totalCost={
                          vehicleCost
                        }
                        lastRefuel={
                          latestLog
                            ?.fuelDate ??
                          null
                        }
                        onClick={() =>
                          navigate(
                            `/admin/fuel-logs/${vehicle.id}`,
                          )
                        }
                      />
                    )
                  },
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  )
}

function VehicleFuelCard({
  vehicle,
  recordCount,
  totalFuel,
  totalCost,
  lastRefuel,
  onClick,
}: {
  vehicle: Vehicle
  recordCount: number
  totalFuel: number
  totalCost: number
  lastRefuel: string | null
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
    >
      <div className="h-1 bg-gradient-to-r from-slate-950 via-blue-800 to-indigo-700 opacity-0 transition group-hover:opacity-100" />

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h4 className="text-lg font-semibold tracking-tight text-slate-950">
              {vehicle.plateNumber}
            </h4>

            <p className="mt-1 text-sm text-slate-500">
              {vehicle.vehicleType}
            </p>
          </div>

          <VehicleStatusBadge
            status={
              vehicle.status
            }
          />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4">
          <CardMetric
            label="Fuel used"
            value={`${formatNumber(
              totalFuel,
              1,
            )} L`}
          />

          <CardMetric
            label="Records"
            value={
              recordCount.toString()
            }
          />

          <CardMetric
            label="Total cost"
            value={
              totalCost > 0
                ? `${formatNumber(
                    totalCost,
                  )} MMK`
                : '—'
            }
          />

          <CardMetric
            label="Last refuel"
            value={
              lastRefuel
                ? formatDate(
                    lastRefuel,
                  )
                : 'No records'
            }
          />
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
          <span className="text-sm font-semibold text-blue-600 transition group-hover:text-blue-700">
            View details →
          </span>
        </div>
      </div>
    </button>
  )
}

function CardMetric({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  helper,
  tone,
}: {
  label: string
  value: string
  helper: string
  tone:
    | 'blue'
    | 'green'
    | 'amber'
    | 'slate'
}) {
  const dots = {
    blue: 'bg-blue-500',
    green: 'bg-emerald-500',
    amber: 'bg-amber-500',
    slate: 'bg-slate-400',
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {value}
          </p>

          <p className="mt-2 text-xs text-slate-400">
            {helper}
          </p>
        </div>

        <span
          className={`mt-1 h-3 w-3 rounded-full ring-4 ring-slate-50 ${dots[tone]}`}
        />
      </div>
    </div>
  )
}

function VehicleStatusBadge({
  status,
}: {
  status: string
}) {
  const styles: Record<
    string,
    string
  > = {
    AVAILABLE:
      'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',

    IN_USE:
      'bg-blue-50 text-blue-700 ring-1 ring-blue-200',

    MAINTENANCE:
      'bg-amber-50 text-amber-700 ring-1 ring-amber-200',

    INACTIVE:
      'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  }

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
        styles[status] ??
        styles.INACTIVE
      }`}
    >
      {status.replaceAll(
        '_',
        ' ',
      )}
    </span>
  )
}

function formatDate(
  value: string,
) {
  const date = new Date(value)

  return Number.isNaN(
    date.getTime(),
  )
    ? value
    : date.toLocaleDateString()
}

function formatNumber(
  value: number,
  decimals = 0,
) {
  return value.toLocaleString(
    undefined,
    {
      maximumFractionDigits:
        decimals,
    },
  )
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

  if (
    typeof message === 'string'
  ) {
    return message
  }

  if (!error.response) {
    return 'Unable to connect to the server.'
  }

  return fallback
}

export default FuelLogsView