import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  createVehicle,
  deleteVehicle,
  getVehicles,
  updateVehicle,
} from '../../services/vehicle.service'

import type {
  CreateVehicleData,
  Vehicle,
} from '../../types/vehicle'

const emptyForm: CreateVehicleData = {
  plateNumber: '',
  vehicleType: '',
  capacity: 1,
}

function VehiclesView() {
  const [vehicles, setVehicles] = useState<
    Vehicle[]
  >([])

  const [searchTerm, setSearchTerm] =
    useState('')

  const [statusFilter, setStatusFilter] =
    useState('ALL')

  const [formData, setFormData] =
    useState<CreateVehicleData>(emptyForm)

  const [
    editingVehicleId,
    setEditingVehicleId,
  ] = useState<number | null>(null)

  const [isModalOpen, setIsModalOpen] =
    useState(false)

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState('')

  useEffect(() => {
    void fetchVehicles()
  }, [])

  async function fetchVehicles() {
    try {
      setLoading(true)
      setError('')

      const data = await getVehicles()

      setVehicles(data)
    } catch (error) {
      console.error(error)

      setError(
        'Failed to load vehicles.',
      )
    } finally {
      setLoading(false)
    }
  }

  function openAddModal() {
    setEditingVehicleId(null)
    setFormData(emptyForm)
    setError('')
    setIsModalOpen(true)
  }

  function openEditModal(
    vehicle: Vehicle,
  ) {
    setEditingVehicleId(vehicle.id)

    setFormData({
      plateNumber:
        vehicle.plateNumber,
      vehicleType:
        vehicle.vehicleType,
      capacity: vehicle.capacity,
    })

    setError('')
    setIsModalOpen(true)
  }

  function closeModal() {
    if (saving) return

    setIsModalOpen(false)
    setEditingVehicleId(null)
    setFormData(emptyForm)
  }

  async function handleSubmit(
    event: React.FormEvent,
  ) {
    event.preventDefault()

    try {
      setSaving(true)
      setError('')

      if (editingVehicleId) {
        await updateVehicle(
          editingVehicleId,
          formData,
        )
      } else {
        await createVehicle(formData)
      }

      closeModal()
      await fetchVehicles()
    } catch (error) {
      console.error(error)

      setError(
        'Failed to save vehicle.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(
    id: number,
  ) {
    const confirmed =
      window.confirm(
        'Are you sure you want to delete this vehicle?',
      )

    if (!confirmed) return

    try {
      setError('')

      await deleteVehicle(id)
      await fetchVehicles()
    } catch (error) {
      console.error(error)

      setError(
        'Failed to delete vehicle.',
      )
    }
  }

  const filteredVehicles =
    useMemo(() => {
      const keyword =
        searchTerm
          .trim()
          .toLowerCase()

      return vehicles.filter(
        (vehicle) => {
          const matchesSearch =
            vehicle.plateNumber
              .toLowerCase()
              .includes(keyword) ||
            vehicle.vehicleType
              .toLowerCase()
              .includes(keyword)

          const matchesStatus =
            statusFilter === 'ALL' ||
            vehicle.status ===
              statusFilter

          return (
            matchesSearch &&
            matchesStatus
          )
        },
      )
    }, [
      vehicles,
      searchTerm,
      statusFilter,
    ])

  const vehicleCounts =
    useMemo(
      () => ({
        available:
          vehicles.filter(
            (vehicle) =>
              vehicle.status ===
              'AVAILABLE',
          ).length,

        inUse:
          vehicles.filter(
            (vehicle) =>
              vehicle.status ===
              'IN_USE',
          ).length,

        maintenance:
          vehicles.filter(
            (vehicle) =>
              vehicle.status ===
              'MAINTENANCE',
          ).length,

        inactive:
          vehicles.filter(
            (vehicle) =>
              vehicle.status ===
              'INACTIVE',
          ).length,
      }),
      [vehicles],
    )

  return (
    <>
      <header className="flex min-h-[72px] items-center justify-between border-b border-slate-200 bg-white px-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-950">
            Vehicles
          </h1>

          <p className="mt-0.5 text-sm text-slate-500">
            Manage fleet vehicles and
            availability.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="rounded-xl bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
        >
          + Add Vehicle
        </button>
      </header>

      <section className="mx-auto max-w-[1600px] p-8">
        {/* =====================
            PAGE INTRO
        ====================== */}

        <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 px-7 py-6 text-white shadow-sm">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />

          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-200">
              Fleet management
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Vehicle inventory
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
              Track vehicle status,
              mileage, passenger capacity
              and fleet availability.
            </p>
          </div>
        </div>

        {/* =====================
            SUMMARY CARDS
        ====================== */}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MiniStatCard
            label="Available"
            value={vehicleCounts.available}
            tone="green"
          />

          <MiniStatCard
            label="In use"
            value={vehicleCounts.inUse}
            tone="blue"
          />

          <MiniStatCard
            label="Maintenance"
            value={
              vehicleCounts.maintenance
            }
            tone="amber"
          />

          <MiniStatCard
            label="Inactive"
            value={vehicleCounts.inactive}
            tone="slate"
          />
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* =====================
            TABLE CARD
        ====================== */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h3 className="font-semibold text-slate-950">
                Fleet vehicles
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {vehicles.length}{' '}
                registered vehicles
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
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

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value,
                  )
                }
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500"
              >
                <option value="ALL">
                  All statuses
                </option>

                <option value="AVAILABLE">
                  Available
                </option>

                <option value="IN_USE">
                  In use
                </option>

                <option value="MAINTENANCE">
                  Maintenance
                </option>

                <option value="INACTIVE">
                  Inactive
                </option>
              </select>
            </div>
          </div>

          {loading && (
            <div className="p-10 text-center text-sm text-slate-500">
              Loading vehicles...
            </div>
          )}

          {!loading &&
            filteredVehicles.length ===
              0 && (
              <div className="p-12 text-center">
                

                <p className="mt-4 font-semibold text-slate-700">
                  No vehicles found
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Try changing your search
                  or status filter.
                </p>
              </div>
            )}

          {!loading &&
            filteredVehicles.length >
              0 && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-6 py-4">
                        Vehicle
                      </th>

                      <th className="py-4 pr-6">
                        Capacity
                      </th>

                      <th className="py-4 pr-6">
                        Mileage
                      </th>

                      <th className="py-4 pr-6">
                        Status
                      </th>

                      <th className="py-4 pr-6 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredVehicles.map(
                      (vehicle) => (
                        <tr
                          key={vehicle.id}
                          className="border-b border-slate-100 transition last:border-b-0 hover:bg-slate-50/80"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              

                              <div>
                                <p className="font-semibold text-slate-900">
                                  {
                                    vehicle.plateNumber
                                  }
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                  {
                                    vehicle.vehicleType
                                  }
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 pr-6">
                            <span className="font-medium text-slate-700">
                              {
                                vehicle.capacity
                              }
                            </span>

                            <span className="ml-1 text-slate-400">
                              passengers
                            </span>
                          </td>

                          <td className="py-4 pr-6 font-medium text-slate-700">
                            {vehicle.currentMileage.toLocaleString()}{' '}
                            km
                          </td>

                          <td className="py-4 pr-6">
                            <StatusBadge
                              status={
                                vehicle.status
                              }
                            />
                          </td>

                          <td className="py-4 pr-6">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  openEditModal(
                                    vehicle,
                                  )
                                }
                                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  void handleDelete(
                                    vehicle.id,
                                  )
                                }
                                className="rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      </section>

      {/* =====================
          MODAL
      ====================== */}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 px-6 py-5 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-200">
                    Vehicle record
                  </p>

                  <h3 className="mt-1 text-xl font-semibold">
                    {editingVehicleId
                      ? 'Edit Vehicle'
                      : 'Add Vehicle'}
                  </h3>

                  <p className="mt-1 text-sm text-slate-300">
                    {editingVehicleId
                      ? 'Update vehicle information.'
                      : 'Register a new fleet vehicle.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xl text-slate-200 transition hover:bg-white/20"
                >
                  ×
                </button>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >
              <FormInput
                label="Plate number"
                value={
                  formData.plateNumber
                }
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    plateNumber: value,
                  })
                }
                placeholder="e.g. MDY-1999"
              />

              <FormInput
                label="Vehicle type"
                value={
                  formData.vehicleType
                }
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    vehicleType: value,
                  })
                }
                placeholder="e.g. Toyota Hiace"
              />

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Capacity
                </label>

                <input
                  type="number"
                  min={1}
                  value={
                    formData.capacity
                  }
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      capacity: Number(
                        event.target
                          .value,
                      ),
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:opacity-50"
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

function FormInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (
    value: string,
  ) => void
  placeholder: string
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <input
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        required
      />
    </div>
  )
}

function MiniStatCard({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone:
    | 'green'
    | 'blue'
    | 'amber'
    | 'slate'
}) {
  const styles = {
    green:
      'bg-emerald-50 text-emerald-700',
    blue:
      'bg-blue-50 text-blue-700',
    amber:
      'bg-amber-50 text-amber-700',
    slate:
      'bg-slate-100 text-slate-700',
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {value}
          </p>
        </div>

        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold ${styles[tone]}`}
        >
          {value}
        </div>
      </div>
    </div>
  )
}

function StatusBadge({
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
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        styles[status] ??
        'bg-slate-100 text-slate-600'
      }`}
    >
      {status.replaceAll('_', ' ')}
    </span>
  )
}

export default VehiclesView