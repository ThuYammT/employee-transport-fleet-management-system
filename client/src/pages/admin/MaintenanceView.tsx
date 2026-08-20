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
  getMaintenanceLogs,
} from '../../services/maintenance-log.service'

import {
  getVehicles,
} from '../../services/vehicle.service'

import type {
  MaintenanceLog,
} from '../../types/maintenance-log'

import type {
  Vehicle,
} from '../../types/vehicle'

function MaintenanceView() {
  const navigate = useNavigate()

  const [
    maintenanceLogs,
    setMaintenanceLogs,
  ] =
    useState<MaintenanceLog[]>([])

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
        logs,
        vehiclesData,
      ] = await Promise.all([
        getMaintenanceLogs(),
        getVehicles(),
      ])

      setMaintenanceLogs(logs)
      setVehicles(vehiclesData)
    } catch (error) {
      console.error(error)

      setError(
        getApiErrorMessage(
          error,
          'Failed to load maintenance records.',
        ),
      )
    } finally {
      setLoading(false)
    }
  }

  const pending =
    maintenanceLogs.filter(
      (record) =>
        record.status ===
        'PENDING',
    ).length

  const inProgress =
    maintenanceLogs.filter(
      (record) =>
        record.status ===
        'IN_PROGRESS',
    ).length

  const completed =
    maintenanceLogs.filter(
      (record) =>
        record.status ===
        'COMPLETED',
    ).length

  const totalCost =
    maintenanceLogs.reduce(
      (sum, record) =>
        sum + record.cost,
      0,
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
            Maintenance
          </h1>

          <p className="mt-0.5 text-sm text-slate-500">
            Review maintenance status
            and service history by
            vehicle.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            void fetchData()
          }
          disabled={loading}
          className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Refresh
        </button>
      </header>

      <section className="mx-auto max-w-[1600px] p-8">
        <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 px-7 py-7 text-white">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />

          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-200">
              Service operations
            </p>

            <h2 className="mt-2 text-2xl font-semibold">
              Vehicle Maintenance
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Select a fleet vehicle to
              inspect maintenance
              activity, repair history,
              cost and scheduled service.
            </p>
          </div>
        </div>

        <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Pending"
            value={
              pending.toString()
            }
            helper="Awaiting service"
            tone="blue"
          />

          <SummaryCard
            label="In progress"
            value={
              inProgress.toString()
            }
            helper="Currently being serviced"
            tone="amber"
          />

          <SummaryCard
            label="Completed"
            value={
              completed.toString()
            }
            helper="Finished services"
            tone="green"
          />

          <SummaryCard
            label="Maintenance cost"
            value={`${totalCost.toLocaleString()} MMK`}
            helper="Recorded fleet spending"
            tone="slate"
          />
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold text-slate-950">
                Vehicle maintenance
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Select a vehicle to
                inspect its maintenance
                profile.
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
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-72"
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
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredVehicles.map(
                  (vehicle) => {
                    const records =
                      maintenanceLogs.filter(
                        (record) =>
                          record.vehicleId ===
                          vehicle.id,
                      )

                    const vehiclePending =
                      records.filter(
                        (record) =>
                          record.status ===
                          'PENDING',
                      ).length

                    const vehicleInProgress =
                      records.filter(
                        (record) =>
                          record.status ===
                          'IN_PROGRESS',
                      ).length

                    const vehicleCost =
                      records.reduce(
                        (
                          sum,
                          record,
                        ) =>
                          sum +
                          record.cost,
                        0,
                      )

                    const nextService =
                      getNextServiceDate(
                        records,
                      )

                    return (
                      <VehicleMaintenanceCard
                        key={
                          vehicle.id
                        }
                        vehicle={
                          vehicle
                        }
                        recordCount={
                          records.length
                        }
                        pending={
                          vehiclePending
                        }
                        inProgress={
                          vehicleInProgress
                        }
                        totalCost={
                          vehicleCost
                        }
                        nextService={
                          nextService
                        }
                        onClick={() =>
                          navigate(
                            `/admin/maintenance/${vehicle.id}`,
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

function VehicleMaintenanceCard({
  vehicle,
  recordCount,
  pending,
  inProgress,
  totalCost,
  nextService,
  onClick,
}: {
  vehicle: Vehicle
  recordCount: number
  pending: number
  inProgress: number
  totalCost: number
  nextService: string | null
  onClick: () => void
}) {
  const needsAttention =
    pending > 0 ||
    inProgress > 0

  return (
    <button
      type="button"
      onClick={onClick}
      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
    >
      <div className="h-1 bg-gradient-to-r from-slate-950 via-blue-800 to-indigo-700 opacity-0 group-hover:opacity-100" />

      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="text-lg font-semibold text-slate-950">
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

        <div className="mt-5">
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              needsAttention
                ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
            }`}
          >
            {inProgress > 0
              ? `${inProgress} in progress`
              : pending > 0
                ? `${pending} pending`
                : 'No active maintenance'}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4">
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
                ? `${totalCost.toLocaleString()} MMK`
                : '—'
            }
          />

          <CardMetric
            label="Next service"
            value={
              nextService
                ? formatDate(
                    nextService,
                  )
                : 'Not scheduled'
            }
          />

          <CardMetric
            label="Mileage"
            value={`${vehicle.currentMileage.toLocaleString()} km`}
          />
        </div>

        <div className="mt-5 flex justify-end border-t border-slate-100 pt-4">
          <span className="text-sm font-semibold text-blue-600">
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
      <p className="text-[11px] uppercase tracking-wide text-slate-400">
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
      <div className="flex justify-between">
        <div>
          <p className="text-sm text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-2xl font-semibold text-slate-950">
            {value}
          </p>

          <p className="mt-2 text-xs text-slate-400">
            {helper}
          </p>
        </div>

        <span
          className={`mt-1 h-3 w-3 rounded-full ${dots[tone]}`}
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
      'bg-emerald-50 text-emerald-700',

    IN_USE:
      'bg-blue-50 text-blue-700',

    MAINTENANCE:
      'bg-amber-50 text-amber-700',

    INACTIVE:
      'bg-slate-100 text-slate-600',
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

function getNextServiceDate(
  records: MaintenanceLog[],
) {
  const dates =
    records
      .map(
        (record) =>
          record.nextServiceDate,
      )
      .filter(
        (
          value,
        ): value is string =>
          Boolean(value),
      )
      .sort(
        (a, b) =>
          new Date(
            a,
          ).getTime() -
          new Date(
            b,
          ).getTime(),
      )

  return (
    dates[0] ??
    null
  )
}

function formatDate(
  value: string,
) {
  return new Date(
    value,
  ).toLocaleDateString()
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

  return fallback
}

export default MaintenanceView