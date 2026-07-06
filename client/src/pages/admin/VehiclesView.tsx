import { useEffect, useState } from 'react'
import {
  createVehicle,
  deleteVehicle,
  getVehicles,
  updateVehicle,
} from '../../services/vehicle.service'
import type { CreateVehicleData, Vehicle } from '../../types/vehicle'

const emptyForm: CreateVehicleData = {
  plateNumber: '',
  vehicleType: '',
  capacity: 1,
}

function VehiclesView() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState<CreateVehicleData>(emptyForm)
  const [editingVehicleId, setEditingVehicleId] = useState<number | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchVehicles()
  }, [])

  async function fetchVehicles() {
    try {
      setLoading(true)
      setError('')
      const data = await getVehicles()
      setVehicles(data)
    } catch (error) {
      console.error(error)
      setError('Failed to load vehicles')
    } finally {
      setLoading(false)
    }
  }

  function openAddModal() {
    setEditingVehicleId(null)
    setFormData(emptyForm)
    setIsModalOpen(true)
  }

  function openEditModal(vehicle: Vehicle) {
    setEditingVehicleId(vehicle.id)

    setFormData({
      plateNumber: vehicle.plateNumber,
      vehicleType: vehicle.vehicleType,
      capacity: vehicle.capacity,
    })

    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setEditingVehicleId(null)
    setFormData(emptyForm)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    try {
      setSaving(true)
      setError('')

      if (editingVehicleId) {
        await updateVehicle(editingVehicleId, formData)
      } else {
        await createVehicle(formData)
      }

      closeModal()
      await fetchVehicles()
    } catch (error) {
      console.error(error)
      setError('Failed to save vehicle')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    const confirmed = confirm('Are you sure you want to delete this vehicle?')

    if (!confirmed) return

    try {
      setError('')
      await deleteVehicle(id)
      await fetchVehicles()
    } catch (error) {
      console.error(error)
      setError('Failed to delete vehicle')
    }
  }

  const filteredVehicles = vehicles.filter((vehicle) => {
    const keyword = searchTerm.toLowerCase()

    return (
      vehicle.plateNumber.toLowerCase().includes(keyword) ||
      vehicle.vehicleType.toLowerCase().includes(keyword) ||
      vehicle.status.toLowerCase().includes(keyword)
    )
  })

  return (
    <>
      <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Fleet Vehicles</h2>
          <p className="text-sm text-slate-500">
            Manage and monitor company vehicles.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold transition"
        >
          + Add Vehicle
        </button>
      </header>

      <section className="p-8">
        <div className="bg-white rounded-2xl shadow border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold">Vehicles</h3>
              <p className="text-sm text-slate-500">
                Total vehicles: {vehicles.length}
              </p>
            </div>

            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none w-72"
              placeholder="Search vehicle..."
            />
          </div>

          {loading && <p className="text-slate-500">Loading vehicles...</p>}

          {error && <p className="text-red-500 mb-4">{error}</p>}

          {!loading && !error && filteredVehicles.length === 0 && (
            <p className="text-slate-500">No vehicles found.</p>
          )}

          {!loading && filteredVehicles.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-4">Plate Number</th>
                  <th className="py-4">Vehicle Type</th>
                  <th className="py-4">Capacity</th>
                  <th className="py-4">Mileage</th>
                  <th className="py-4">Status</th>
                  <th className="py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredVehicles.map((vehicle) => (
                  <tr
                    key={vehicle.id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="py-4 font-semibold">
                      {vehicle.plateNumber}
                    </td>

                    <td className="py-4">{vehicle.vehicleType}</td>

                    <td className="py-4">{vehicle.capacity}</td>

                    <td className="py-4">
                      {vehicle.currentMileage.toLocaleString()} km
                    </td>

                    <td className="py-4">
                      <StatusBadge status={vehicle.status} />
                    </td>

                    <td className="py-4 text-right">
                      <button
                        onClick={() => openEditModal(vehicle)}
                        className="text-blue-600 font-semibold mr-4"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDelete(vehicle.id)}
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
                  {editingVehicleId ? 'Edit Vehicle' : 'Add Vehicle'}
                </h3>
                <p className="text-sm text-slate-500">
                  Enter vehicle information below.
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
                  Plate Number
                </label>
                <input
                  value={formData.plateNumber}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      plateNumber: event.target.value,
                    })
                  }
                  className="mt-2 w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none"
                  placeholder="e.g. MDY-1999"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Vehicle Type
                </label>
                <input
                  value={formData.vehicleType}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      vehicleType: event.target.value,
                    })
                  }
                  className="mt-2 w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none"
                  placeholder="e.g. Toyota Hiace"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Capacity
                </label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      capacity: Number(event.target.value),
                    })
                  }
                  className="mt-2 w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none"
                  min={1}
                  required
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
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold"
                >
                  {saving
                    ? 'Saving...'
                    : editingVehicleId
                      ? 'Update Vehicle'
                      : 'Create Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

function StatusBadge({ status }: { status: string }) {
  const baseClass = 'px-3 py-1 rounded-lg text-xs font-semibold'

  const statusClass =
    status === 'AVAILABLE'
      ? 'bg-green-100 text-green-700'
      : status === 'IN_USE'
        ? 'bg-blue-100 text-blue-700'
        : status === 'UNDER_MAINTENANCE'
          ? 'bg-orange-100 text-orange-700'
          : 'bg-slate-100 text-slate-700'

  return (
    <span className={`${baseClass} ${statusClass}`}>
      {status.replaceAll('_', ' ')}
    </span>
  )
}

export default VehiclesView