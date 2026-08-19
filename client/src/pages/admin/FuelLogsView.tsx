import { useEffect, useState } from 'react'
import axios from 'axios'
import {
  createFuelLog,
  deleteFuelLog,
  getFuelLogs,
} from '../../services/fuel-log.service'
import { getDrivers } from '../../services/driver.service'
import { getVehicles } from '../../services/vehicle.service'
import type { CreateFuelLogData, FuelLog } from '../../types/fuel-log'
import type { Driver } from '../../types/driver'
import type { Vehicle } from '../../types/vehicle'

const emptyForm: CreateFuelLogData = {
  vehicleId: 0,
  driverId: 0,
  fuelDate: new Date().toISOString().split('T')[0],
  liters: 0,
  cost: 0,
  mileage: 0,
  fuelStation: '',
  photoUrl: '',
}

function formatFuelDate(value: string) {
  return new Date(value).toLocaleDateString()
}

function getAssignedDriverForVehicle(
  drivers: Driver[],
  vehicleId: number,
) {
  return drivers.find(
    (driver) => driver.assignedVehicleId === vehicleId,
  )
}

function getDefaultFuelLogSelection(
  vehicles: Vehicle[],
  drivers: Driver[],
) {
  const vehicleWithDriver = vehicles.find((vehicle) =>
    getAssignedDriverForVehicle(drivers, vehicle.id),
  )

  const vehicle = vehicleWithDriver ?? vehicles[0]
  const driver = vehicle
    ? getAssignedDriverForVehicle(drivers, vehicle.id)
    : undefined

  return { vehicle, driver }
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

function FuelLogsView() {
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [selectedVehicleId, setSelectedVehicleId] = useState('All')
  const [formData, setFormData] = useState<CreateFuelLogData>(emptyForm)
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
      const [logsData, vehiclesData, driversData] = await Promise.all([
        getFuelLogs(),
        getVehicles(),
        getDrivers(),
      ])
      setFuelLogs(logsData)
      setVehicles(vehiclesData)
      setDrivers(driversData)
    } catch (fetchError) {
      console.error(fetchError)
      setError(
        getApiErrorMessage(fetchError, 'Failed to load fuel logs'),
      )
    } finally {
      setLoading(false)
    }
  }

  const selectedVehicle = vehicles.find(
    (vehicle) => vehicle.id === formData.vehicleId,
  )

  const eligibleDrivers = formData.vehicleId
    ? drivers.filter(
        (driver) => driver.assignedVehicleId === formData.vehicleId,
      )
    : []

  const canCreateFuelLog = vehicles.some((vehicle) =>
    getAssignedDriverForVehicle(drivers, vehicle.id),
  )

  function openAddModal() {
    const { vehicle, driver } = getDefaultFuelLogSelection(
      vehicles,
      drivers,
    )

    setError('')
    setFormData({
      vehicleId: vehicle?.id ?? 0,
      driverId: driver?.id ?? 0,
      fuelDate: new Date().toISOString().split('T')[0],
      liters: 0,
      cost: 0,
      mileage: vehicle?.currentMileage ?? 0,
      fuelStation: '',
      photoUrl: '',
    })
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setFormData(emptyForm)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!formData.vehicleId || !formData.driverId) {
      setError(
        'Please select a vehicle with an assigned driver. Fuel logs require a matching driver-vehicle pair.',
      )
      return
    }

    if (formData.liters <= 0 || formData.cost < 0 || formData.mileage < 0) {
      setError('Please enter valid fuel amount, cost, and mileage.')
      return
    }

    if (
      selectedVehicle &&
      formData.mileage < selectedVehicle.currentMileage
    ) {
      setError(
        `Mileage must be at least ${selectedVehicle.currentMileage.toLocaleString()} km.`,
      )
      return
    }

    try {
      setSaving(true)
      setError('')

      const photoUrl =
        formData.photoUrl && !formData.photoUrl.startsWith('data:')
          ? formData.photoUrl
          : undefined

      await createFuelLog({
        vehicleId: formData.vehicleId,
        driverId: formData.driverId,
        fuelDate: formData.fuelDate,
        liters: Number(formData.liters),
        cost: Number(formData.cost),
        mileage: Number(formData.mileage),
        fuelStation: formData.fuelStation,
        photoUrl,
      })

      closeModal()
      await fetchData()
    } catch (submitError) {
      console.error(submitError)
      setError(
        getApiErrorMessage(submitError, 'Failed to save fuel log'),
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    const confirmed = confirm('Are you sure you want to delete this fuel log?')
    if (!confirmed) return

    try {
      setError('')
      await deleteFuelLog(id)
      await fetchData()
    } catch (deleteError) {
      console.error(deleteError)
      setError(
        getApiErrorMessage(deleteError, 'Failed to delete fuel log'),
      )
    }
  }

  const filteredLogs = fuelLogs.filter((log) => {
    return (
      selectedVehicleId === 'All' ||
      log.vehicleId === Number(selectedVehicleId)
    )
  })

  return (
    <>
      <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Fuel Consumption Logs</h2>
          <p className="text-sm text-slate-500">
            Track refueling records, costs, and vehicle mileage updates.
          </p>
        </div>

        <button
          onClick={openAddModal}
          disabled={!canCreateFuelLog}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-3 rounded-xl font-semibold transition"
        >
          + Log Fuel Consumption
        </button>
      </header>

      <section className="p-8">
        <div className="bg-white rounded-2xl shadow border border-slate-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold">Fuel Logs</h3>
              <p className="text-sm text-slate-500">
                Total logs: {fuelLogs.length}
              </p>
            </div>

            <select
              value={selectedVehicleId}
              onChange={(event) => setSelectedVehicleId(event.target.value)}
              className="bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none w-full sm:w-auto"
            >
              <option value="All">All Vehicles</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.plateNumber} ({vehicle.vehicleType})
                </option>
              ))}
            </select>
          </div>

          {loading && <p className="text-slate-500">Loading fuel logs...</p>}

          {error && <p className="text-red-500 mb-4">{error}</p>}

          {!loading && !error && filteredLogs.length === 0 && (
            <p className="text-slate-500">No fuel logs found.</p>
          )}

          {!loading && filteredLogs.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-4">Date</th>
                  <th className="py-4">Vehicle</th>
                  <th className="py-4">Driver</th>
                  <th className="py-4">Liters</th>
                  <th className="py-4">Cost</th>
                  <th className="py-4">Mileage</th>
                  <th className="py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="py-4 font-medium">
                      {formatFuelDate(log.fuelDate)}
                    </td>

                    <td className="py-4">
                      <div className="font-semibold">
                        {log.vehicle?.plateNumber ?? `Vehicle #${log.vehicleId}`}
                      </div>
                      <div className="text-xs text-slate-500">
                        {log.vehicle?.vehicleType ?? '—'}
                      </div>
                    </td>

                    <td className="py-4">
                      {log.driver?.user?.name ?? `Driver #${log.driverId}`}
                    </td>

                    <td className="py-4">{log.liters} L</td>

                    <td className="py-4 font-semibold">
                      {log.cost.toLocaleString()} MMK
                    </td>

                    <td className="py-4">
                      {log.mileage.toLocaleString()} km
                    </td>

                    <td className="py-4 text-right">
                      <button
                        onClick={() => handleDelete(log.id)}
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
                <h3 className="text-xl font-bold">Log Fuel Consumption</h3>
                <p className="text-sm text-slate-500">
                  Select a vehicle and its assigned driver. Mileage must be at
                  or above the vehicle&apos;s current mileage.
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
                  onChange={(event) => {
                    const nextVehicleId = Number(event.target.value)
                    const nextVehicle = vehicles.find(
                      (vehicle) => vehicle.id === nextVehicleId,
                    )
                    const assignedDriver = getAssignedDriverForVehicle(
                      drivers,
                      nextVehicleId,
                    )

                    setFormData({
                      ...formData,
                      vehicleId: nextVehicleId,
                      driverId: assignedDriver?.id ?? 0,
                      mileage:
                        nextVehicle?.currentMileage ?? formData.mileage,
                    })
                  }}
                  className="mt-2 w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none"
                  required
                >
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.plateNumber} ({vehicle.vehicleType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Assigned Driver
                </label>
                <select
                  value={formData.driverId || ''}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      driverId: Number(event.target.value),
                    })
                  }
                  className="mt-2 w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none"
                  required
                  disabled={eligibleDrivers.length <= 1}
                >
                  {eligibleDrivers.length === 0 ? (
                    <option value="">No assigned driver for this vehicle</option>
                  ) : (
                    eligibleDrivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.user?.name ?? `Driver #${driver.id}`}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Fuel Date
                  </label>
                  <input
                    type="date"
                    value={formData.fuelDate}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        fuelDate: event.target.value,
                      })
                    }
                    className="mt-2 w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Mileage (km)
                  </label>
                  <input
                    type="number"
                    min={selectedVehicle?.currentMileage ?? 0}
                    value={formData.mileage || ''}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        mileage: Number(event.target.value),
                      })
                    }
                    className="mt-2 w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none"
                    required
                  />
                  {selectedVehicle && (
                    <p className="text-xs text-slate-500 mt-1">
                      Current vehicle mileage:{' '}
                      {selectedVehicle.currentMileage.toLocaleString()} km
                    </p>
                  )}
                </div>
              </div>
              
              <div>
          <label className="text-sm font-semibold text-slate-700">
            Fuel Station
          </label>

                <input
                  type="text"
                  value={formData.fuelStation ?? ''}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      fuelStation: event.target.value,
                    })
                  }
                  placeholder="Enter fuel station"
                  className="mt-2 w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Liters
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={formData.liters || ''}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        liters: Number(event.target.value),
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
                  disabled={saving || eligibleDrivers.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-3 rounded-xl font-semibold"
                >
                  {saving ? 'Saving...' : 'Create Fuel Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default FuelLogsView
