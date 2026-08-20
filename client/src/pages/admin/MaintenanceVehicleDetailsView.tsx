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
  completeMaintenanceLog,
  createMaintenanceLog,
  deleteMaintenanceLog,
  getMaintenanceLogs,
  reopenMaintenanceLog,
  startMaintenanceLog,
  updateMaintenanceLog,
} from '../../services/maintenance-log.service'

import {
  getVehicles,
} from '../../services/vehicle.service'

import type {
  CreateMaintenanceLogData,
  MaintenanceLog,
  MaintenanceStatus,
} from '../../types/maintenance-log'

import type {
  Vehicle,
} from '../../types/vehicle'

function MaintenanceVehicleDetailsView() {
  const navigate =
    useNavigate()

  const {
    vehicleId,
  } = useParams()

  const id =
    Number(vehicleId)

  const [vehicle, setVehicle] =
    useState<Vehicle | null>(
      null,
    )

  const [records, setRecords] =
    useState<MaintenanceLog[]>([])

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState('')

  const [
    actionLoadingId,
    setActionLoadingId,
  ] =
    useState<number | null>(null)

  const [
    editingRecord,
    setEditingRecord,
  ] =
    useState<MaintenanceLog | null>(
      null,
    )

  const [isModalOpen, setIsModalOpen] =
    useState(false)

  const [formData, setFormData] =
    useState<CreateMaintenanceLogData>({
      vehicleId: id,

      serviceDate:
        new Date()
          .toISOString()
          .split('T')[0],

      description: '',
      cost: 0,
      nextServiceDate: '',
    })

  useEffect(() => {
    void fetchData()
  }, [id])

  async function fetchData() {
    try {
      setLoading(true)
      setError('')

      const [
        allRecords,
        vehicles,
      ] = await Promise.all([
        getMaintenanceLogs(),
        getVehicles(),
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

      setRecords(
        allRecords.filter(
          (record) =>
            record.vehicleId ===
            id,
        ),
      )
    } catch (error) {
      console.error(error)

      setError(
        getApiErrorMessage(
          error,
          'Failed to load maintenance data.',
        ),
      )
    } finally {
      setLoading(false)
    }
  }

  const stats =
    useMemo(
      () => ({
        pending:
          records.filter(
            (record) =>
              record.status ===
              'PENDING',
          ).length,

        inProgress:
          records.filter(
            (record) =>
              record.status ===
              'IN_PROGRESS',
          ).length,

        completed:
          records.filter(
            (record) =>
              record.status ===
              'COMPLETED',
          ).length,

        totalCost:
          records.reduce(
            (sum, record) =>
              sum + record.cost,
            0,
          ),
      }),
      [records],
    )

  const nextService =
    getNextServiceDate(
      records,
    )

  function openAddModal() {
    if (!vehicle) {
      return
    }

    setEditingRecord(null)

    setFormData({
      vehicleId:
        vehicle.id,

      serviceDate:
        new Date()
          .toISOString()
          .split('T')[0],

      description: '',
      cost: 0,
      nextServiceDate: '',
    })

    setIsModalOpen(true)
  }

  function openEditModal(
    record: MaintenanceLog,
  ) {
    setEditingRecord(record)

    setFormData({
      vehicleId:
        record.vehicleId,

      serviceDate:
        record.serviceDate.split(
          'T',
        )[0],

      description:
        record.description,

      cost: record.cost,

      nextServiceDate:
        record.nextServiceDate
          ? record.nextServiceDate.split(
              'T',
            )[0]
          : '',
    })

    setIsModalOpen(true)
  }

  function closeModal() {
    if (saving) {
      return
    }

    setIsModalOpen(false)
    setEditingRecord(null)
  }

  async function handleSubmit(
    event: React.FormEvent,
  ) {
    event.preventDefault()

    if (!vehicle) {
      return
    }

    try {
      setSaving(true)
      setError('')

      const payload: CreateMaintenanceLogData =
        {
          vehicleId:
            vehicle.id,

          serviceDate:
            formData.serviceDate,

          description:
            formData.description.trim(),

          cost:
            Number(
              formData.cost,
            ),

          nextServiceDate:
            formData.nextServiceDate ||
            undefined,
        }

      if (editingRecord) {
        await updateMaintenanceLog(
          editingRecord.id,
          payload,
        )
      } else {
        await createMaintenanceLog(
          payload,
        )
      }

      closeModal()

      await fetchData()
    } catch (error) {
      console.error(error)

      setError(
        getApiErrorMessage(
          error,
          'Failed to save maintenance record.',
        ),
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleStatus(
    record: MaintenanceLog,
    action:
      | 'start'
      | 'complete'
      | 'reopen',
  ) {
    try {
      setActionLoadingId(
        record.id,
      )

      if (action === 'start') {
        await startMaintenanceLog(
          record.id,
        )
      }

      if (
        action === 'complete'
      ) {
        await completeMaintenanceLog(
          record.id,
        )
      }

      if (
        action === 'reopen'
      ) {
        await reopenMaintenanceLog(
          record.id,
        )
      }

      await fetchData()
    } catch (error) {
      console.error(error)

      setError(
        getApiErrorMessage(
          error,
          'Failed to update maintenance status.',
        ),
      )
    } finally {
      setActionLoadingId(null)
    }
  }

  async function handleDelete(
    recordId: number,
  ) {
    const confirmed =
      window.confirm(
        'Delete this maintenance record?',
      )

    if (!confirmed) {
      return
    }

    try {
      await deleteMaintenanceLog(
        recordId,
      )

      await fetchData()
    } catch (error) {
      console.error(error)

      setError(
        getApiErrorMessage(
          error,
          'Failed to delete maintenance record.',
        ),
      )
    }
  }

  return (
    <>
      <header className="flex min-h-[72px] items-center justify-between border-b border-slate-200 bg-white px-8">
        <div>
          <button
            onClick={() =>
              navigate(
                '/admin/maintenance',
              )
            }
            className="mb-1 text-xs font-semibold text-blue-600"
          >
            ← Maintenance
          </button>

          <h1 className="text-xl font-semibold text-slate-950">
            Vehicle Maintenance Profile
          </h1>
        </div>

        <button
          onClick={openAddModal}
          disabled={
            vehicle?.status !==
            'AVAILABLE'
          }
          className="rounded-xl bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-40"
        >
          + Schedule Maintenance
        </button>
      </header>

      <section className="mx-auto max-w-[1500px] p-8">
        {loading ? (
          <p className="text-slate-500">
            Loading maintenance
            profile...
          </p>
        ) : (
          <>
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 p-7 text-white">
              <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />

              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-200">
                    Vehicle
                  </p>

                  <h2 className="mt-2 text-3xl font-semibold">
                    {
                      vehicle?.plateNumber
                    }
                  </h2>

                  <p className="mt-2 text-sm text-slate-300">
                    {
                      vehicle?.vehicleType
                    }
                    {' • '}
                    {vehicle?.currentMileage.toLocaleString()}{' '}
                    km
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

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <MetricCard
                label="Pending"
                value={
                  stats.pending.toString()
                }
              />

              <MetricCard
                label="In progress"
                value={
                  stats.inProgress.toString()
                }
              />

              <MetricCard
                label="Completed"
                value={
                  stats.completed.toString()
                }
              />

              <MetricCard
                label="Total cost"
                value={`${stats.totalCost.toLocaleString()} MMK`}
              />

              <MetricCard
                label="Next service"
                value={
                  nextService
                    ? formatDate(
                        nextService,
                      )
                    : 'Not scheduled'
                }
              />
            </div>

            {error && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-5">
                <h3 className="font-semibold text-slate-950">
                  Maintenance history
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {records.length}{' '}
                  recorded services
                </p>
              </div>

              {records.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  No maintenance records
                  exist for this vehicle.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-6 py-4">
                          Service date
                        </th>

                        <th className="py-4 pr-6">
                          Description
                        </th>

                        <th className="py-4 pr-6">
                          Status
                        </th>

                        <th className="py-4 pr-6">
                          Cost
                        </th>

                        <th className="py-4 pr-6">
                          Next service
                        </th>

                        <th className="py-4 pr-6 text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {records.map(
                        (record) => {
                          const working =
                            actionLoadingId ===
                            record.id

                          return (
                            <tr
                              key={
                                record.id
                              }
                              className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/80"
                            >
                              <td className="px-6 py-4">
                                {formatDate(
                                  record.serviceDate,
                                )}
                              </td>

                              <td className="py-4 pr-6">
                                {
                                  record.description
                                }
                              </td>

                              <td className="py-4 pr-6">
                                <MaintenanceBadge
                                  status={
                                    record.status
                                  }
                                />
                              </td>

                              <td className="py-4 pr-6 font-semibold">
                                {record.cost.toLocaleString()}{' '}
                                MMK
                              </td>

                              <td className="py-4 pr-6">
                                {record.nextServiceDate
                                  ? formatDate(
                                      record.nextServiceDate,
                                    )
                                  : '—'}
                              </td>

                              <td className="py-4 pr-6">
                                <div className="flex justify-end gap-2">
                                  {record.status ===
                                    'PENDING' && (
                                    <button
                                      disabled={
                                        working
                                      }
                                      onClick={() =>
                                        void handleStatus(
                                          record,
                                          'start',
                                        )
                                      }
                                      className="rounded-lg border border-amber-100 px-3 py-2 text-xs font-semibold text-amber-700"
                                    >
                                      Start
                                    </button>
                                  )}

                                  {record.status ===
                                    'IN_PROGRESS' && (
                                    <button
                                      disabled={
                                        working
                                      }
                                      onClick={() =>
                                        void handleStatus(
                                          record,
                                          'complete',
                                        )
                                      }
                                      className="rounded-lg border border-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-700"
                                    >
                                      Complete
                                    </button>
                                  )}

                                  {record.status ===
                                    'COMPLETED' && (
                                    <button
                                      disabled={
                                        working
                                      }
                                      onClick={() =>
                                        void handleStatus(
                                          record,
                                          'reopen',
                                        )
                                      }
                                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold"
                                    >
                                      Reopen
                                    </button>
                                  )}

                                  {record.status !==
                                    'COMPLETED' && (
                                    <button
                                      onClick={() =>
                                        openEditModal(
                                          record,
                                        )
                                      }
                                      className="rounded-lg border border-blue-100 px-3 py-2 text-xs font-semibold text-blue-600"
                                    >
                                      Edit
                                    </button>
                                  )}

                                  <button
                                    onClick={() =>
                                      void handleDelete(
                                        record.id,
                                      )
                                    }
                                    className="rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-600"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        },
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 px-6 py-5 text-white">
              <h3 className="text-xl font-semibold">
                {editingRecord
                  ? 'Edit Maintenance'
                  : 'Schedule Maintenance'}
              </h3>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >
              <ReadOnlyField
                label="Vehicle"
                value={`${vehicle?.plateNumber} — ${vehicle?.vehicleType}`}
              />

              <FormInput
                label="Description"
                value={
                  formData.description
                }
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    description: value,
                  })
                }
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <FormInput
                  label="Service date"
                  type="date"
                  value={
                    formData.serviceDate
                  }
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      serviceDate: value,
                    })
                  }
                />

                <FormInput
                  label="Cost"
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

              <FormInput
                label="Next service date"
                type="date"
                value={
                  formData.nextServiceDate ??
                  ''
                }
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    nextServiceDate:
                      value,
                  })
                }
              />

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-slate-200 px-5 py-3"
                >
                  Cancel
                </button>

                <button
                  disabled={saving}
                  className="rounded-xl bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 px-5 py-3 font-semibold text-white"
                >
                  {saving
                    ? 'Saving...'
                    : editingRecord
                      ? 'Update Maintenance'
                      : 'Create Maintenance'}
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
      <p className="text-sm text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-xl font-semibold text-slate-950">
        {value}
      </p>
    </div>
  )
}

function MaintenanceBadge({
  status,
}: {
  status: MaintenanceStatus
}) {
  const styles: Record<
    MaintenanceStatus,
    string
  > = {
    PENDING:
      'bg-blue-50 text-blue-700',

    IN_PROGRESS:
      'bg-amber-50 text-amber-700',

    COMPLETED:
      'bg-emerald-50 text-emerald-700',
  }

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${styles[status]}`}
    >
      {status.replaceAll(
        '_',
        ' ',
      )}
    </span>
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

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
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
        className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        required={
          label !==
          'Next service date'
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
  return (
    <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/20">
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
  const values =
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

  return values[0] ?? null
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

export default MaintenanceVehicleDetailsView