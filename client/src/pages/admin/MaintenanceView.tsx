import { useEffect, useState } from 'react'
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
import { getVehicles } from '../../services/vehicle.service'
import type {
  CreateMaintenanceLogData,
  MaintenanceLog,
  MaintenanceStatus,
} from '../../types/maintenance-log'
import type { Vehicle } from '../../types/vehicle'

const emptyForm: CreateMaintenanceLogData = {
  vehicleId: 0,
  serviceDate: new Date().toISOString().split('T')[0],
  description: '',
  cost: 0,
  nextServiceDate: '',
}

function toDateInputValue(value: string) {
  return value.split('T')[0]
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString()
}

function getApiErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  if (!axios.isAxiosError(error)) {
    return fallbackMessage
  }

  const message = error.response?.data?.message

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

function MaintenanceView() {
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [statusFilter, setStatusFilter] = useState<'All' | MaintenanceStatus>(
    'All',
  )
  const [formData, setFormData] = useState<CreateMaintenanceLogData>(emptyForm)
  const [editingRecord, setEditingRecord] = useState<MaintenanceLog | null>(
    null,
  )
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      setLoading(true)
      setError('')
      const [logsData, vehiclesData] = await Promise.all([
        getMaintenanceLogs(),
        getVehicles(),
      ])
      setMaintenanceLogs(logsData)
      setVehicles(vehiclesData)
    } catch (fetchError) {
      console.error(fetchError)
      setError(
        getApiErrorMessage(fetchError, 'Failed to load maintenance logs'),
      )
    } finally {
      setLoading(false)
    }
  }

  const eligibleVehicles = vehicles.filter(
    (vehicle) => vehicle.status === 'AVAILABLE',
  )

  function openAddModal() {
    const defaultVehicle = eligibleVehicles[0]

    setEditingRecord(null)
    setError('')
    setFormData({
      vehicleId: defaultVehicle?.id ?? 0,
      serviceDate: new Date().toISOString().split('T')[0],
      description: '',
      cost: 0,
      nextServiceDate: '',
    })
    setIsModalOpen(true)
  }

  function openEditModal(record: MaintenanceLog) {
    setEditingRecord(record)
    setError('')
    setFormData({
      vehicleId: record.vehicleId,
      serviceDate: toDateInputValue(record.serviceDate),
      description: record.description,
      cost: record.cost,
      nextServiceDate: record.nextServiceDate
        ? toDateInputValue(record.nextServiceDate)
        : '',
    })
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setEditingRecord(null)
    setFormData(emptyForm)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!formData.vehicleId || !formData.description.trim()) {
      setError('Please select a vehicle and enter a description.')
      return
    }

    if (formData.description.trim().length < 3) {
      setError('Description must be at least 3 characters.')
      return
    }

    if (formData.cost < 0) {
      setError('Cost cannot be negative.')
      return
    }

    try {
      setSaving(true)
      setError('')

      const payload: CreateMaintenanceLogData = {
        vehicleId: formData.vehicleId,
        serviceDate: formData.serviceDate,
        description: formData.description.trim(),
        cost: Number(formData.cost),
        nextServiceDate: formData.nextServiceDate?.trim() || undefined,
      }

      if (editingRecord) {
        await updateMaintenanceLog(editingRecord.id, payload)
      } else {
        await createMaintenanceLog(payload)
      }

      closeModal()
      await fetchData()
    } catch (submitError) {
      console.error(submitError)
      setError(
        getApiErrorMessage(submitError, 'Failed to save maintenance log'),
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleStatusAction(
    record: MaintenanceLog,
    action: 'start' | 'complete' | 'reopen',
  ) {
    try {
      setError('')

      if (action === 'start') {
        await startMaintenanceLog(record.id)
      } else if (action === 'complete') {
        await completeMaintenanceLog(record.id)
      } else {
        await reopenMaintenanceLog(record.id)
      }

      await fetchData()
    } catch (statusError) {
      console.error(statusError)
      setError(
        getApiErrorMessage(statusError, 'Failed to update maintenance status'),
      )
    }
  }

  async function handleDelete(id: number) {
    const confirmed = confirm(
      'Are you sure you want to delete this maintenance record?',
    )
    if (!confirmed) return

    try {
      setError('')
      await deleteMaintenanceLog(id)
      await fetchData()
    } catch (deleteError) {
      console.error(deleteError)
      setError(
        getApiErrorMessage(deleteError, 'Failed to delete maintenance log'),
      )
    }
  }

  const filteredRecords = maintenanceLogs.filter((record) => {
    return statusFilter === 'All' || record.status === statusFilter
  })

  return (
    <>
      <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Maintenance Scheduling</h2>
          <p className="text-sm text-slate-500">
            Plan service work, track repair status, and record maintenance costs.
          </p>
        </div>

        <button
          onClick={openAddModal}
          disabled={eligibleVehicles.length === 0}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-3 rounded-xl font-semibold transition"
        >
          + Schedule Maintenance
        </button>
      </header>

      <section className="p-8">
        <div className="bg-white rounded-2xl shadow border border-slate-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold">Maintenance Logs</h3>
              <p className="text-sm text-slate-500">
                Total records: {maintenanceLogs.length}
              </p>
              {eligibleVehicles.length === 0 && !loading && (
                <p className="text-sm text-amber-600 mt-1">
                  No available vehicles can be scheduled right now.
                </p>
              )}
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as 'All' | MaintenanceStatus)
              }
              className="bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none w-full sm:w-auto"
            >
              <option value="All">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          {loading && <p className="text-slate-500">Loading maintenance logs...</p>}

          {error && <p className="text-red-500 mb-4">{error}</p>}

          {!loading && !error && filteredRecords.length === 0 && (
            <p className="text-slate-500">No maintenance records found.</p>
          )}

          {!loading && filteredRecords.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-4">Service Date</th>
                  <th className="py-4">Vehicle</th>
                  <th className="py-4">Description</th>
                  <th className="py-4">Status</th>
                  <th className="py-4">Cost</th>
                  <th className="py-4">Next Service</th>
                  <th className="py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredRecords.map((record) => (
                  <tr
                    key={record.id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="py-4 font-medium">
                      {formatDate(record.serviceDate)}
                    </td>

                    <td className="py-4">
                      <div className="font-semibold">
                        {record.vehicle?.plateNumber ??
                          `Vehicle #${record.vehicleId}`}
                      </div>
                      <div className="text-xs text-slate-500">
                        {record.vehicle?.vehicleType ?? '—'}
                      </div>
                    </td>

                    <td className="py-4 max-w-xs truncate" title={record.description}>
                      {record.description}
                    </td>

                    <td className="py-4">
                      <StatusBadge status={record.status} />
                    </td>

                    <td className="py-4 font-semibold">
                      {record.cost.toLocaleString()} MMK
                    </td>

                    <td className="py-4 text-slate-500">
                      {record.nextServiceDate ? (
                        formatDate(record.nextServiceDate)
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-3 flex-wrap">
                        {record.status === 'PENDING' && (
                          <button
                            onClick={() => handleStatusAction(record, 'start')}
                            className="text-amber-600 font-semibold"
                          >
                            Start
                          </button>
                        )}

                        {record.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() =>
                              handleStatusAction(record, 'complete')
                            }
                            className="text-green-600 font-semibold"
                          >
                            Complete
                          </button>
                        )}

                        {record.status === 'COMPLETED' && (
                          <button
                            onClick={() => handleStatusAction(record, 'reopen')}
                            className="text-slate-600 font-semibold"
                          >
                            Reopen
                          </button>
                        )}

                        {record.status !== 'COMPLETED' && (
                          <button
                            onClick={() => openEditModal(record)}
                            className="text-blue-600 font-semibold"
                          >
                            Edit
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(record.id)}
                          className="text-red-500 font-semibold"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold">
                  {editingRecord
                    ? 'Edit Maintenance Log'
                    : 'Schedule Maintenance'}
                </h3>
                <p className="text-sm text-slate-500">
                  {editingRecord
                    ? 'Update service details for this maintenance record.'
                    : 'Only vehicles with AVAILABLE status can be scheduled.'}
                </p>
              </div>

              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-700 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Vehicle
                </label>
                <select
                  value={formData.vehicleId || ''}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      vehicleId: Number(event.target.value),
                    })
                  }
                  className="mt-2 w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none"
                  required
                  disabled={Boolean(editingRecord)}
                >
                  {(editingRecord ? vehicles : eligibleVehicles).map(
                    (vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.plateNumber} ({vehicle.vehicleType})
                        {!editingRecord ? '' : ` - ${vehicle.status}`}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Description
                </label>
                <input
                  value={formData.description}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      description: event.target.value,
                    })
                  }
                  className="mt-2 w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none"
                  placeholder="e.g. Oil change and brake inspection"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Service Date
                  </label>
                  <input
                    type="date"
                    value={formData.serviceDate}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        serviceDate: event.target.value,
                      })
                    }
                    className="mt-2 w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Cost (MMK)
                  </label>
                  <input
                    type="number"
                    step="1000"
                    min="0"
                    value={formData.cost || ''}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        cost: Number(event.target.value),
                      })
                    }
                    className="mt-2 w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Next Service Date
                </label>
                <input
                  type="date"
                  value={formData.nextServiceDate ?? ''}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      nextServiceDate: event.target.value,
                    })
                  }
                  className="mt-2 w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="bg-slate-200 text-slate-700 px-5 py-3 rounded-xl font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold"
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

function StatusBadge({ status }: { status: MaintenanceStatus }) {
  const baseClass = 'px-3 py-1 rounded-lg text-xs font-semibold'

  const statusClass =
    status === 'COMPLETED'
      ? 'bg-green-100 text-green-700'
      : status === 'IN_PROGRESS'
        ? 'bg-amber-100 text-amber-700'
        : 'bg-blue-100 text-blue-700'

  return (
    <span className={`${baseClass} ${statusClass}`}>
      {status.replaceAll('_', ' ')}
    </span>
  )
}

export default MaintenanceView
