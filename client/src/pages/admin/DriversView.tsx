import { useEffect, useState } from 'react'
import {
  createDriver,
  deleteDriver,
  getDrivers,
  updateDriver,
} from '../../services/driver.service'
import { getUsers } from '../../services/user.service'
import { getVehicles } from '../../services/vehicle.service'
import type {
  CreateDriverData,
  Driver,
  DriverAvailabilityStatus,
} from '../../types/driver'
import type { User } from '../../types/user'
import type { Vehicle } from '../../types/vehicle'

const emptyForm: CreateDriverData = {
  userId: 0,
  licenseNumber: '',
}

function DriversView() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | DriverAvailabilityStatus>(
    'All',
  )
  const [formData, setFormData] = useState<CreateDriverData>(emptyForm)
  const [editingDriverId, setEditingDriverId] = useState<number | null>(null)
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
      const [driversData, usersData, vehiclesData] = await Promise.all([
        getDrivers(),
        getUsers(),
        getVehicles(),
      ])
      setDrivers(driversData)
      setUsers(usersData)
      setVehicles(vehiclesData)
    } catch (fetchError) {
      console.error(fetchError)
      setError('Failed to load drivers')
    } finally {
      setLoading(false)
    }
  }

  const assignedUserIds = new Set(drivers.map((driver) => driver.userId))

  const availableDriverUsers = users.filter((user) => {
    if (user.role !== 'DRIVER') return false
    if (editingDriverId) {
      const editingDriver = drivers.find((driver) => driver.id === editingDriverId)
      if (editingDriver?.userId === user.id) return true
    }
    return !assignedUserIds.has(user.id)
  })

  function openAddModal() {
    setEditingDriverId(null)
    setFormData(emptyForm)
    setIsModalOpen(true)
  }

  function openEditModal(driver: Driver) {
    setEditingDriverId(driver.id)
    setFormData({
      userId: driver.userId,
      licenseNumber: driver.licenseNumber,
      assignedVehicleId: driver.assignedVehicleId ?? undefined,
    })
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setEditingDriverId(null)
    setFormData(emptyForm)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!formData.userId || !formData.licenseNumber.trim()) {
      setError('Please select a driver user and enter a license number.')
      return
    }

    try {
      setSaving(true)
      setError('')

      const payload: CreateDriverData = {
        userId: formData.userId,
        licenseNumber: formData.licenseNumber.trim(),
        assignedVehicleId: formData.assignedVehicleId || undefined,
      }

      if (editingDriverId) {
        await updateDriver(editingDriverId, payload)
      } else {
        await createDriver(payload)
      }

      closeModal()
      await fetchData()
    } catch (submitError) {
      console.error(submitError)
      setError('Failed to save driver')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    const confirmed = confirm('Are you sure you want to delete this driver profile?')
    if (!confirmed) return

    try {
      setError('')
      await deleteDriver(id)
      await fetchData()
    } catch (deleteError) {
      console.error(deleteError)
      setError('Failed to delete driver')
    }
  }

  const filteredDrivers = drivers.filter((driver) => {
    const keyword = searchTerm.toLowerCase()
    const matchesSearch =
      (driver.user?.name ?? '').toLowerCase().includes(keyword) ||
      driver.licenseNumber.toLowerCase().includes(keyword) ||
      (driver.user?.phone ?? '').toLowerCase().includes(keyword) ||
      (driver.assignedVehicle?.plateNumber ?? '').toLowerCase().includes(keyword)

    const matchesStatus =
      statusFilter === 'All' || driver.availabilityStatus === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <>
      <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Driver Management</h2>
          <p className="text-sm text-slate-500">
            Link driver accounts to license records and fleet assignments.
          </p>
        </div>

        <button
          onClick={openAddModal}
          // disabled={availableDriverUsers.length === 0 && !editingDriverId}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-3 rounded-xl font-semibold transition"
        >
          + Add Driver
        </button>
      </header>

      <section className="p-8">
        <div className="bg-white rounded-2xl shadow border border-slate-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold">Drivers</h3>
              <p className="text-sm text-slate-500">
                Total drivers: {drivers.length}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none w-full sm:w-72"
                placeholder="Search driver..."
              />

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as 'All' | DriverAvailabilityStatus,
                  )
                }
                className="bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="AVAILABLE">Available</option>
                <option value="ON_TRIP">On Trip</option>
                <option value="OFF_DUTY">Off Duty</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          {loading && <p className="text-slate-500">Loading drivers...</p>}

          {error && <p className="text-red-500 mb-4">{error}</p>}

          {!loading && !error && filteredDrivers.length === 0 && (
            <p className="text-slate-500">No drivers found.</p>
          )}

          {!loading && filteredDrivers.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-4">Driver</th>
                  <th className="py-4">License Number</th>
                  <th className="py-4">Phone</th>
                  <th className="py-4">Assigned Vehicle</th>
                  <th className="py-4">Status</th>
                  <th className="py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredDrivers.map((driver) => (
                  <tr
                    key={driver.id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="py-4">
                      <div className="font-semibold">
                        {driver.user?.name ?? `User #${driver.userId}`}
                      </div>
                      <div className="text-xs text-slate-400">
                        {driver.user?.email ?? 'No email'}
                      </div>
                    </td>

                    <td className="py-4 font-mono">{driver.licenseNumber}</td>

                    <td className="py-4">
                      {driver.user?.phone ?? <span className="text-slate-400">—</span>}
                    </td>

                    <td className="py-4">
                      {driver.assignedVehicle ? (
                        <>
                          <div className="font-semibold">
                            {driver.assignedVehicle.plateNumber}
                          </div>
                          <div className="text-xs text-slate-500">
                            {driver.assignedVehicle.vehicleType}
                          </div>
                        </>
                      ) : (
                        <span className="text-slate-400">Unassigned</span>
                      )}
                    </td>

                    <td className="py-4">
                      <StatusBadge status={driver.availabilityStatus} />
                    </td>

                    <td className="py-4 text-right">
                      <button
                        onClick={() => openEditModal(driver)}
                        className="text-blue-600 font-semibold mr-4"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDelete(driver.id)}
                        className="text-red-500 font-semibold"
                      >
                        Delete
                      </button>
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
                  {editingDriverId ? 'Edit Driver' : 'Add Driver'}
                </h3>
                <p className="text-sm text-slate-500">
                  Driver profiles must be linked to an existing user with the
                  DRIVER role.
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
                  Driver User
                </label>
                <select
                  value={formData.userId || ''}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      userId: Number(event.target.value),
                    })
                  }
                  className="mt-2 w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none"
                  required
                  disabled={Boolean(editingDriverId)}
                >
                  <option value="">Select a driver user</option>
                  {availableDriverUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  License Number
                </label>
                <input
                  value={formData.licenseNumber}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      licenseNumber: event.target.value,
                    })
                  }
                  className="mt-2 w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none"
                  placeholder="e.g. DL-98234125"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Assigned Vehicle
                </label>
                <select
                  value={formData.assignedVehicleId ?? ''}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      assignedVehicleId: event.target.value
                        ? Number(event.target.value)
                        : undefined,
                    })
                  }
                  className="mt-2 w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none"
                >
                  <option value="">No vehicle assigned</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.plateNumber} ({vehicle.vehicleType})
                    </option>
                  ))}
                </select>
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
                    : editingDriverId
                      ? 'Update Driver'
                      : 'Create Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

function StatusBadge({ status }: { status: DriverAvailabilityStatus }) {
  const baseClass = 'px-3 py-1 rounded-lg text-xs font-semibold'

  const statusClass =
    status === 'AVAILABLE'
      ? 'bg-green-100 text-green-700'
      : status === 'ON_TRIP'
        ? 'bg-blue-100 text-blue-700'
        : status === 'OFF_DUTY'
          ? 'bg-slate-100 text-slate-700'
          : 'bg-red-100 text-red-700'

  return (
    <span className={`${baseClass} ${statusClass}`}>
      {status.replaceAll('_', ' ')}
    </span>
  )
}

export default DriversView
