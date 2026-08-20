import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  useNavigate,
  useParams,
} from 'react-router-dom'

import axios from 'axios'

import {
  createFuelLog,
  deleteFuelLog,
  getFuelLogs,
} from '../../services/fuel-log.service'

import {
  getDrivers,
} from '../../services/driver.service'

import {
  getVehicles,
} from '../../services/vehicle.service'

import type {
  CreateFuelLogData,
  FuelLog,
} from '../../types/fuel-log'

import type {
  Driver,
} from '../../types/driver'

import type {
  Vehicle,
} from '../../types/vehicle'

function FuelVehicleDetailsView() {
  const navigate = useNavigate()

  const {
    vehicleId,
  } = useParams()

  const id =
    Number(vehicleId)

  const [vehicle, setVehicle] =
    useState<Vehicle | null>(
      null,
    )

  const [logs, setLogs] =
    useState<FuelLog[]>([])

  const [drivers, setDrivers] =
    useState<Driver[]>([])

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState('')

  const [isModalOpen, setIsModalOpen] =
    useState(false)

  const [formData, setFormData] =
    useState<CreateFuelLogData>({
      vehicleId: id,
      driverId: 0,
      fuelDate:
        new Date()
          .toISOString()
          .split('T')[0],
      liters: 0,
      cost: 0,
      fuelStation: '',
      photoUrl: '',
    })

  useEffect(() => {
    void fetchData()
  }, [id])

  async function fetchData() {
    try {
      setLoading(true)
      setError('')

      const [
        allLogs,
        vehicles,
        driverData,
      ] = await Promise.all([
        getFuelLogs(),
        getVehicles(),
        getDrivers(),
      ])

      const selectedVehicle =
        vehicles.find(
          (item) =>
            item.id === id,
        )

      if (!selectedVehicle) {
        setVehicle(null)
        setError(
          'Vehicle not found.',
        )
        return
      }

      setVehicle(
        selectedVehicle,
      )

      setDrivers(
        driverData,
      )

      setLogs(
        allLogs.filter(
          (log) =>
            log.vehicleId === id,
        ),
      )
    } catch (error) {
      console.error(error)

      setError(
        getApiErrorMessage(
          error,
          'Failed to load vehicle fuel data.',
        ),
      )
    } finally {
      setLoading(false)
    }
  }

  const assignedDriver =
    useMemo(
      () =>
        drivers.find(
          (driver) =>
            driver.assignedVehicleId ===
            id,
        ),
      [drivers, id],
    )

  const totalFuel =
    logs.reduce(
      (sum, log) =>
        sum + log.liters,
      0,
    )

  const totalCost =
    logs.reduce(
      (sum, log) =>
        sum + log.cost,
      0,
    )

  const averageCost =
    logs.length > 0
      ? totalCost /
        logs.length
      : 0

  const latestLog =
    [...logs].sort(
      (a, b) =>
        new Date(
          b.fuelDate,
        ).getTime() -
        new Date(
          a.fuelDate,
        ).getTime(),
    )[0] ?? null

  function openAddModal() {
    if (!vehicle) {
      return
    }

    setFormData({
      vehicleId:
        vehicle.id,

      driverId:
        assignedDriver?.id ??
        0,

      fuelDate:
        new Date()
          .toISOString()
          .split('T')[0],

      liters: 0,
      cost: 0,

      fuelStation: '',
      photoUrl: '',
    })

    setError('')
    setIsModalOpen(true)
  }

  function closeModal() {
    if (saving) {
      return
    }

    setIsModalOpen(false)
  }

  async function handleSubmit(
    event: React.FormEvent,
  ) {
    event.preventDefault()

    if (
      !vehicle ||
      !formData.driverId
    ) {
      setError(
        'This vehicle must have an assigned driver before adding fuel.',
      )

      return
    }

    try {
      setSaving(true)
      setError('')

      await createFuelLog({
        vehicleId:
          vehicle.id,

        driverId:
          formData.driverId,

        fuelDate:
          formData.fuelDate,

        liters:
          Number(
            formData.liters,
          ),

        cost:
          Number(
            formData.cost,
          ),

        fuelStation:
          formData.fuelStation,

        photoUrl:
          formData.photoUrl,
      })

      closeModal()

      await fetchData()
    } catch (error) {
      console.error(error)

      setError(
        getApiErrorMessage(
          error,
          'Failed to create fuel log.',
        ),
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(
    logId: number,
  ) {
    const confirmed =
      window.confirm(
        'Delete this fuel record?',
      )

    if (!confirmed) {
      return
    }

    try {
      await deleteFuelLog(
        logId,
      )

      await fetchData()
    } catch (error) {
      console.error(error)

      setError(
        getApiErrorMessage(
          error,
          'Failed to delete fuel log.',
        ),
      )
    }
  }

  if (
    !loading &&
    !vehicle
  ) {
    return (
      <section className="p-8">
        <button
          onClick={() =>
            navigate(
              '/admin/fuel-logs',
            )
          }
          className="text-sm font-semibold text-blue-600"
        >
          ← Back to Fuel Logs
        </button>

        <p className="mt-8 text-red-600">
          {error ||
            'Vehicle not found.'}
        </p>
      </section>
    )
  }

  return (
    <>
      <header className="flex min-h-[72px] items-center justify-between border-b border-slate-200 bg-white px-8">
        <div>
          <button
            type="button"
            onClick={() =>
              navigate(
                '/admin/fuel-logs',
              )
            }
            className="mb-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            ← Fuel Logs
          </button>

          <h1 className="text-xl font-semibold tracking-tight text-slate-950">
            Vehicle Fuel Profile
          </h1>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          disabled={
            !assignedDriver
          }
          className="rounded-xl bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:opacity-40"
        >
          + Log Fuel
        </button>
      </header>

      <section className="mx-auto max-w-[1500px] p-8">
        {loading ? (
          <p className="text-sm text-slate-500">
            Loading vehicle data...
          </p>
        ) : (
          <>
            {/* VEHICLE HEADER */}

            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 p-7 text-white">
              <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />

              <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-200">
                    Vehicle
                  </p>

                  <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                    {vehicle?.plateNumber}
                  </h2>

                  <p className="mt-2 text-sm text-slate-300">
                    {vehicle?.vehicleType}
                  </p>
                </div>

                {vehicle && (
                  <VehicleStatusBadge
                    status={
                      vehicle.status
                    }
                  />
                )}
              </div>
            </div>

            {/* KPI */}

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Total fuel"
                value={`${formatNumber(
                  totalFuel,
                  1,
                )} L`}
              />

              <MetricCard
                label="Total cost"
                value={`${formatNumber(
                  totalCost,
                )} MMK`}
              />

              <MetricCard
                label="Average cost / log"
                value={`${formatNumber(
                  averageCost,
                )} MMK`}
              />

              <MetricCard
                label="Last refuel"
                value={
                  latestLog
                    ? formatDate(
                        latestLog.fuelDate,
                      )
                    : 'No records'
                }
              />
            </div>

            {error && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* VEHICLE INFORMATION */}

            <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_2fr]">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="font-semibold text-slate-950">
                  Vehicle information
                </h3>

                <div className="mt-5 space-y-5">
                  <InformationRow
                    label="Plate number"
                    value={
                      vehicle?.plateNumber ??
                      '—'
                    }
                  />

                  <InformationRow
                    label="Vehicle type"
                    value={
                      vehicle?.vehicleType ??
                      '—'
                    }
                  />

                  <InformationRow
                    label="Assigned driver"
                    value={
                      assignedDriver
                        ?.user?.name ??
                      'No assigned driver'
                    }
                  />
                </div>
              </div>

              {/* HISTORY */}

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-5">
                  <h3 className="font-semibold text-slate-950">
                    Fuel history
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {logs.length}{' '}
                    recorded transactions
                  </p>
                </div>

                {logs.length === 0 ? (
                  <div className="p-12 text-center text-sm text-slate-500">
                    No fuel records exist
                    for this vehicle.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px] text-left text-sm">
                      <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-6 py-4">
                            Date
                          </th>

                          <th className="py-4 pr-6">
                            Driver
                          </th>

                          <th className="py-4 pr-6">
                            Station
                          </th>

                          <th className="py-4 pr-6">
                            Fuel
                          </th>

                          <th className="py-4 pr-6">
                            Cost
                          </th>

                          <th className="py-4 pr-6 text-right">
                            Action
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {logs.map(
                          (log) => (
                            <tr
                              key={
                                log.id
                              }
                              className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/80"
                            >
                              <td className="px-6 py-4 font-medium text-slate-700">
                                {formatDate(
                                  log.fuelDate,
                                )}
                              </td>

                              <td className="py-4 pr-6">
                                {log.driver
                                  ?.user
                                  ?.name ??
                                  `Driver #${log.driverId}`}
                              </td>

                              <td className="py-4 pr-6 text-slate-600">
                                {log.fuelStation ||
                                  '—'}
                              </td>

                              <td className="py-4 pr-6 font-semibold text-slate-900">
                                {
                                  log.liters
                                }{' '}
                                L
                              </td>

                              <td className="py-4 pr-6 font-semibold text-slate-900">
                                {log.cost.toLocaleString()}{' '}
                                MMK
                              </td>

                              <td className="py-4 pr-6 text-right">
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleDelete(
                                      log.id,
                                    )
                                  }
                                  className="rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </section>

      {/* ADD MODAL */}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 px-6 py-5 text-white">
              <div className="flex justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-200">
                    Fuel record
                  </p>

                  <h3 className="mt-1 text-xl font-semibold">
                    Log Fuel for{' '}
                    {
                      vehicle?.plateNumber
                    }
                  </h3>
                </div>

                <button
                  onClick={closeModal}
                  className="text-xl text-slate-300"
                >
                  ×
                </button>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >
              <ReadOnlyField
                label="Vehicle"
                value={`${vehicle?.plateNumber} — ${vehicle?.vehicleType}`}
              />

              <ReadOnlyField
                label="Driver"
                value={
                  assignedDriver
                    ?.user?.name ??
                  'No assigned driver'
                }
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <FormInput
                  label="Fuel date"
                  type="date"
                  value={
                    formData.fuelDate
                  }
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      fuelDate: value,
                    })
                  }
                />

                <FormInput
                  label="Fuel station"
                  value={
                    formData.fuelStation ??
                    ''
                  }
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      fuelStation: value,
                    })
                  }
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <FormInput
                  label="Liters"
                  type="number"
                  value={
                    formData.liters
                  }
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      liters:
                        Number(value),
                    })
                  }
                />

                <FormInput
                  label="Cost (MMK)"
                  type="number"
                  value={
                    formData.cost
                  }
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      cost:
                        Number(value),
                    })
                  }
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold"
                >
                  Cancel
                </button>

                <button
                  disabled={saving}
                  className="rounded-xl bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-40"
                >
                  {saving
                    ? 'Saving...'
                    : 'Create Fuel Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

function MetricCard({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
        {value}
      </p>
    </div>
  )
}

function InformationRow({
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

function ReadOnlyField({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
        {value}
      </div>
    </div>
  )
}

function FormInput({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string
  value: string | number
  onChange: (
    value: string,
  ) => void
  type?: string
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        required={
          label !==
          'Fuel station'
        }
      />
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
      'bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-400/30',

    IN_USE:
      'bg-blue-400/15 text-blue-200 ring-1 ring-blue-400/30',

    MAINTENANCE:
      'bg-amber-400/15 text-amber-200 ring-1 ring-amber-400/30',

    INACTIVE:
      'bg-white/10 text-slate-300 ring-1 ring-white/15',
  }

  return (
    <span
      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
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
  return new Date(
    value,
  ).toLocaleDateString()
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

export default FuelVehicleDetailsView