import { useEffect, useState } from 'react'
import axios from 'axios'
import {
  createFuelLog,
  getFuelLogsByDriverId,
} from '../../services/fuel-log.service'
import { getDriverByUserId } from '../../services/driver.service'
import { getVehicles } from '../../services/vehicle.service'
import type { CreateFuelLogData, FuelLog } from '../../types/fuel-log'
import type { Driver } from '../../types/driver'
import type { Vehicle } from '../../types/vehicle'
import { getCurrentUser } from '../../utils/user-session'

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

function FuelLogsPage() {
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([])
  const [driver, setDriver] = useState<Driver | null>(null)
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [formData, setFormData] = useState<CreateFuelLogData>(emptyForm)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDriverAndLogs()
  }, [])

  async function fetchDriverAndLogs() {
    try {
      setLoading(true)
      setError('')

      const currentUser = getCurrentUser()
      if (!currentUser || currentUser.role !== 'DRIVER') {
        setError('You must be logged in as a driver to access this page.')
        return
      }

      const driverData = await getDriverByUserId(currentUser.id)
      setDriver(driverData)

      if (driverData.assignedVehicleId) {
        const vehicles = await getVehicles()
        const assignedVehicle = vehicles.find(
          (v) => v.id === driverData.assignedVehicleId,
        )
        if (assignedVehicle) {
          setVehicle(assignedVehicle)
        }
      }

      const logsData = await getFuelLogsByDriverId(driverData.id)
      setFuelLogs(logsData)
    } catch (fetchError) {
      console.error(fetchError)
      setError(getApiErrorMessage(fetchError, 'Failed to load fuel logs'))
    } finally {
      setLoading(false)
    }
  }

  function openAddModal() {
    if (!driver || !vehicle) {
      setError('No vehicle assigned to your profile. Please contact admin.')
      return
    }

    setError('')
    setFormData({
      vehicleId: vehicle.id,
      driverId: driver.id,
      fuelDate: new Date().toISOString().split('T')[0],
      liters: 0,
      cost: 0,
      mileage: vehicle.currentMileage,
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
      setError('Please select a vehicle and driver.')
      return
    }

    if (formData.liters <= 0 || formData.cost < 0 || formData.mileage < 0) {
      setError('Please enter valid fuel amount, cost, and mileage.')
      return
    }

    if (vehicle && formData.mileage < vehicle.currentMileage) {
      setError(
        `Mileage must be at least ${vehicle.currentMileage.toLocaleString()} km.`,
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
      await fetchDriverAndLogs()
    } catch (submitError) {
      console.error(submitError)
      setError(getApiErrorMessage(submitError, 'Failed to save fuel log'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="page-section">

      {error && (
        <div
          className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700"
          role="alert"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl shadow border border-slate-200 p-8 text-center">
          <p className="text-slate-500">Loading fuel records...</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl shadow border border-slate-200 p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold">Fuel Records</h3>
                <p className="text-sm text-slate-500">
                  Total logs: {fuelLogs.length}
                </p>
              </div>

              {driver && vehicle && (
                <button
                  onClick={openAddModal}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold transition w-full sm:w-auto"
                >
                  + Log Fuel
                </button>
              )}
            </div>

            {(!driver || !vehicle) && (
              <div className="text-center py-8 text-slate-500">
                <p className="font-medium">No vehicle assigned</p>
                <p className="text-sm mt-1">
                  Please contact your administrator to assign a vehicle to your
                  profile before logging fuel.
                </p>
              </div>
            )}

            {driver && vehicle && fuelLogs.length === 0 && (
              <p className="text-slate-500 text-center py-8">
                No fuel logs recorded yet. Click "Log Fuel" to add your
                first record.
              </p>
            )}

            {driver && vehicle && fuelLogs.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-500">
                      <th className="py-4">Date</th>
                      <th className="py-4">Vehicle</th>
                      <th className="py-4">Liters</th>
                      <th className="py-4">Cost</th>
                      <th className="py-4">Mileage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fuelLogs.map((log) => (
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
                        <td className="py-4">{log.liters} L</td>
                        <td className="py-4 font-semibold">
                          {log.cost.toLocaleString()} MMK
                        </td>
                        <td className="py-4">
                          {log.mileage.toLocaleString()} km
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {isModalOpen && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-bold">Log Fuel Consumption</h3>
                    <p className="text-sm text-slate-500">
                      Record your refueling details. Mileage must be at or above
                      the vehicle&apos;s current mileage.
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
                    <div className="mt-2 px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm">
                      {vehicle
                        ? `${vehicle.plateNumber} (${vehicle.vehicleType})`
                        : 'No vehicle assigned'}
                    </div>
                  </div>

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

                  <div>
                    <label className="text-sm font-semibold text-slate-700">
                      Mileage (km)
                    </label>
                    <input
                      type="number"
                      min={vehicle?.currentMileage ?? 0}
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
                    {vehicle && (
                      <p className="text-xs text-slate-500 mt-1">
                        Current vehicle mileage:{' '}
                        {vehicle.currentMileage.toLocaleString()} km
                      </p>
                    )}
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
      )}
    </section>
  )
}

export default FuelLogsPage