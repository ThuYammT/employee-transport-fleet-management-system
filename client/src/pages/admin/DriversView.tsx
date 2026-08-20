import axios from 'axios'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  createDriver,
  deactivateDriver,
  deleteDriver,
  getDrivers,
  updateDriver,
} from '../../services/driver.service'

import {
  getVehicles,
} from '../../services/vehicle.service'

import type {
  CreateDriverData,
  Driver,
  DriverAvailabilityStatus,
  UpdateDriverData,
} from '../../types/driver'

import type {
  Vehicle,
} from '../../types/vehicle'

type DriverFormData = {
  name: string
  email: string
  phone: string
  password: string
  licenseNumber: string
  assignedVehicleId: string
}

const emptyForm: DriverFormData = {
  name: '',
  email: '',
  phone: '',
  password: '',
  licenseNumber: '',
  assignedVehicleId: '',
}

function DriversView() {
  const [drivers, setDrivers] =
    useState<Driver[]>([])

  const [vehicles, setVehicles] =
    useState<Vehicle[]>([])

  const [searchTerm, setSearchTerm] =
    useState('')

  const [statusFilter, setStatusFilter] =
    useState<
      'ALL' | DriverAvailabilityStatus
    >('ALL')

  const [formData, setFormData] =
    useState<DriverFormData>(
      emptyForm,
    )

  const [
    editingDriverId,
    setEditingDriverId,
  ] = useState<number | null>(null)

  const [isModalOpen, setIsModalOpen] =
    useState(false)

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [
    deletingDriverId,
    setDeletingDriverId,
  ] = useState<number | null>(null)

  const [error, setError] =
    useState('')

  const [
    modalError,
    setModalError,
  ] = useState('')

  useEffect(() => {
    void fetchData()
  }, [])

  async function fetchData(
    silent = false,
  ) {
    try {
      if (!silent) {
        setLoading(true)
      }

      setError('')

      const [
        driversData,
        vehiclesData,
      ] = await Promise.all([
        getDrivers(),
        getVehicles(),
      ])

      setDrivers(driversData)
      setVehicles(vehiclesData)
    } catch (error) {
      console.error(error)

      setError(
        getApiErrorMessage(
          error,
          'Failed to load drivers.',
        ),
      )
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }

  function openAddModal() {
    setEditingDriverId(null)
    setFormData(emptyForm)
    setModalError('')
    setIsModalOpen(true)
  }

  function openEditModal(
    driver: Driver,
  ) {
    setEditingDriverId(driver.id)

    setFormData({
      name: driver.user.name,
      email: driver.user.email,
      phone:
        driver.user.phone ?? '',
      password: '',
      licenseNumber:
        driver.licenseNumber,
      assignedVehicleId:
        driver.assignedVehicleId?.toString() ??
        '',
    })

    setModalError('')
    setIsModalOpen(true)
  }

  function closeModal() {
    if (saving) return

    setIsModalOpen(false)
    setEditingDriverId(null)
    setFormData(emptyForm)
    setModalError('')
  }

  function resetModal() {
    setIsModalOpen(false)
    setEditingDriverId(null)
    setFormData(emptyForm)
    setModalError('')
  }

  function handleInputChange(
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLSelectElement>,
  ) {
    const {
      name,
      value,
    } = event.target

    setFormData((current) => ({
      ...current,
      [name]: value,
    }))

    if (modalError) {
      setModalError('')
    }
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    const name =
      formData.name.trim()

    const email =
      formData.email
        .trim()
        .toLowerCase()

    const licenseNumber =
      formData.licenseNumber.trim()

    if (
      !name ||
      !email ||
      !licenseNumber
    ) {
      setModalError(
        'Name, email and licence number are required.',
      )

      return
    }

    if (
      !editingDriverId &&
      formData.password.length < 8
    ) {
      setModalError(
        'The temporary password must contain at least 8 characters.',
      )

      return
    }

    if (
      editingDriverId &&
      formData.password &&
      formData.password.length < 8
    ) {
      setModalError(
        'A new password must contain at least 8 characters.',
      )

      return
    }

    try {
      setSaving(true)
      setModalError('')

      const assignedVehicleId =
        formData.assignedVehicleId
          ? Number(
              formData.assignedVehicleId,
            )
          : undefined

      if (editingDriverId) {
        const payload: UpdateDriverData = {
          name,
          email,
          phone:
            formData.phone.trim() ||
            undefined,
          licenseNumber,

          assignedVehicleId:
            assignedVehicleId ??
            null,
        }

        if (formData.password) {
          payload.password =
            formData.password
        }

        await updateDriver(
          editingDriverId,
          payload,
        )
      } else {
        const payload: CreateDriverData = {
          name,
          email,
          password:
            formData.password,
          phone:
            formData.phone.trim() ||
            undefined,
          licenseNumber,
          assignedVehicleId,
        }

        await createDriver(payload)
      }

      resetModal()
      await fetchData(true)
    } catch (error) {
      console.error(error)

      setModalError(
        getApiErrorMessage(
          error,
          'Failed to save the driver.',
        ),
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(
    driver: Driver,
  ) {
    if (
      driver.availabilityStatus ===
      'ON_TRIP'
    ) {
      setError(
        `${driver.user.name} cannot be deleted while on a trip.`,
      )

      return
    }

    const confirmed =
      window.confirm(
        `Permanently delete ${driver.user.name}?\n\nTheir account, trips, fuel logs and issue reports will also be removed.`,
      )

    if (!confirmed) return

    try {
      setDeletingDriverId(
        driver.id,
      )

      setError('')

      await deleteDriver(
        driver.id,
      )

      setDrivers((current) =>
        current.filter(
          (item) =>
            item.id !== driver.id,
        ),
      )
    } catch (error) {
      console.error(error)

      setError(
        getApiErrorMessage(
          error,
          'Failed to delete the driver.',
        ),
      )
    } finally {
      setDeletingDriverId(
        null,
      )
    }
  }

  async function handleDeactivate(
    driver: Driver,
  ) {
    if (
      driver.availabilityStatus ===
      'ON_TRIP'
    ) {
      setError(
        `${driver.user.name} cannot be deactivated while on a trip.`,
      )

      return
    }

    const confirmed =
      window.confirm(
        `Deactivate ${driver.user.name}?\n\nThey will be marked as inactive and unassigned from their vehicle. Their history will be preserved.`,
      )

    if (!confirmed) return

    try {
      setDeletingDriverId(
        driver.id,
      )

      setError('')

      await deactivateDriver(
        driver.id,
      )

      await fetchData(true)
    } catch (error) {
      console.error(error)

      setError(
        getApiErrorMessage(
          error,
          'Failed to deactivate the driver.',
        ),
      )
    } finally {
      setDeletingDriverId(
        null,
      )
    }
  }

  const availableVehicles =
    useMemo(() => {
      const assignedVehicleIds =
        new Set(
          drivers
            .filter(
              (driver) =>
                driver.id !==
                editingDriverId,
            )
            .map(
              (driver) =>
                driver.assignedVehicleId,
            )
            .filter(
              (
                vehicleId,
              ): vehicleId is number =>
                typeof vehicleId ===
                'number',
            ),
        )

      return vehicles.filter(
        (vehicle) =>
          !assignedVehicleIds.has(
            vehicle.id,
          ),
      )
    }, [
      drivers,
      vehicles,
      editingDriverId,
    ])

  const filteredDrivers =
    useMemo(() => {
      const keyword =
        searchTerm
          .trim()
          .toLowerCase()

      return drivers.filter(
        (driver) => {
          const matchesSearch =
            driver.user.name
              .toLowerCase()
              .includes(keyword) ||
            driver.user.email
              .toLowerCase()
              .includes(keyword) ||
            driver.licenseNumber
              .toLowerCase()
              .includes(keyword) ||
            (
              driver.user.phone ??
              ''
            )
              .toLowerCase()
              .includes(keyword) ||
            (
              driver.assignedVehicle
                ?.plateNumber ?? ''
            )
              .toLowerCase()
              .includes(keyword)

          const matchesStatus =
            statusFilter === 'ALL' ||
            driver.availabilityStatus ===
              statusFilter

          return (
            matchesSearch &&
            matchesStatus
          )
        },
      )
    }, [
      drivers,
      searchTerm,
      statusFilter,
    ])

  const driverCounts =
    useMemo(
      () => ({
        available:
          drivers.filter(
            (driver) =>
              driver.availabilityStatus ===
              'AVAILABLE',
          ).length,

        onTrip:
          drivers.filter(
            (driver) =>
              driver.availabilityStatus ===
              'ON_TRIP',
          ).length,

        offDuty:
          drivers.filter(
            (driver) =>
              driver.availabilityStatus ===
              'OFF_DUTY',
          ).length,

        inactive:
          drivers.filter(
            (driver) =>
              driver.availabilityStatus ===
              'INACTIVE',
          ).length,
      }),
      [drivers],
    )

  return (
    <>
      <header className="flex min-h-[72px] items-center justify-between border-b border-slate-200 bg-white px-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-950">
            Drivers
          </h1>

          <p className="mt-0.5 text-sm text-slate-500">
            Manage driver accounts,
            licences and vehicle
            assignments.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="rounded-xl bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
        >
          + Add Driver
        </button>
      </header>

      <section className="mx-auto max-w-[1600px] p-8">
        {/* Gradient intro */}

        <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 px-7 py-6 text-white shadow-sm">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />

          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-200">
              Workforce management
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Driver operations
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
              Monitor driver availability,
              contact information, licences
              and assigned vehicles.
            </p>
          </div>
        </div>

        {/* Stats */}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MiniStatCard
            label="Available"
            value={
              driverCounts.available
            }
            tone="green"
          />

          <MiniStatCard
            label="On trip"
            value={driverCounts.onTrip}
            tone="blue"
          />

          <MiniStatCard
            label="Off duty"
            value={
              driverCounts.offDuty
            }
            tone="amber"
          />

          <MiniStatCard
            label="Inactive"
            value={
              driverCounts.inactive
            }
            tone="slate"
          />
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Table */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h3 className="font-semibold text-slate-950">
                Driver directory
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {drivers.length}{' '}
                registered drivers
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
                placeholder="Search driver..."
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-72"
              />

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target
                      .value as
                      | 'ALL'
                      | DriverAvailabilityStatus,
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

                <option value="ON_TRIP">
                  On trip
                </option>

                <option value="OFF_DUTY">
                  Off duty
                </option>

                <option value="INACTIVE">
                  Inactive
                </option>
              </select>
            </div>
          </div>

          {loading && (
            <div className="p-10 text-center text-sm text-slate-500">
              Loading drivers...
            </div>
          )}

          {!loading &&
            filteredDrivers.length ===
              0 && (
              <div className="p-12 text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-500">
                  DR
                </div>

                <p className="mt-4 font-semibold text-slate-700">
                  No drivers found
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Try changing the search
                  or status filter.
                </p>
              </div>
            )}

          {!loading &&
            filteredDrivers.length >
              0 && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-6 py-4">
                        Driver
                      </th>

                      <th className="py-4 pr-6">
                        Licence
                      </th>

                      <th className="py-4 pr-6">
                        Phone
                      </th>

                      <th className="py-4 pr-6">
                        Vehicle
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
                    {filteredDrivers.map(
                      (driver) => (
                        <tr
                          key={driver.id}
                          className="border-b border-slate-100 transition last:border-b-0 hover:bg-slate-50/80"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <DriverAvatar
                                name={
                                  driver.user
                                    .name
                                }
                              />

                              <div>
                                <p className="font-semibold text-slate-900">
                                  {
                                    driver.user
                                      .name
                                  }
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                  {
                                    driver.user
                                      .email
                                  }
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 pr-6">
                            <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs font-medium text-slate-700">
                              {
                                driver.licenseNumber
                              }
                            </span>
                          </td>

                          <td className="py-4 pr-6 text-slate-600">
                            {driver.user
                              .phone ?? (
                              <span className="text-slate-400">
                                —
                              </span>
                            )}
                          </td>

                          <td className="py-4 pr-6">
                            {driver.assignedVehicle ? (
                              <>
                                <p className="font-semibold text-slate-800">
                                  {
                                    driver
                                      .assignedVehicle
                                      .plateNumber
                                  }
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                  {
                                    driver
                                      .assignedVehicle
                                      .vehicleType
                                  }
                                </p>
                              </>
                            ) : (
                              <span className="text-sm text-slate-400">
                                Unassigned
                              </span>
                            )}
                          </td>

                          <td className="py-4 pr-6">
                            <StatusBadge
                              status={
                                driver.availabilityStatus
                              }
                            />
                          </td>

                          <td className="py-4 pr-6">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  openEditModal(
                                    driver,
                                  )
                                }
                                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                              >
                                Edit
                              </button>

                              {driver.availabilityStatus !== 'INACTIVE' && (
                                <button
                                  type="button"
                                  disabled={
                                    driver.availabilityStatus ===
                                      'ON_TRIP' ||
                                    deletingDriverId ===
                                      driver.id
                                  }
                                  onClick={() =>
                                    void handleDeactivate(
                                      driver,
                                    )
                                  }
                                  className="rounded-lg border border-amber-100 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300"
                                >
                                  {deletingDriverId ===
                                  driver.id
                                    ? 'Deactivating...'
                                    : 'Deactivate'}
                                </button>
                              )}

                              <button
                                type="button"
                                disabled={
                                  driver.availabilityStatus ===
                                    'ON_TRIP' ||
                                  deletingDriverId ===
                                    driver.id
                                }
                                onClick={() =>
                                  void handleDelete(
                                    driver,
                                  )
                                }
                                className="rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300"
                              >
                                {deletingDriverId ===
                                driver.id
                                  ? 'Deleting...'
                                  : 'Delete'}
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

      {/* Modal */}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-[2px]">
          <div className="my-8 w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 px-6 py-5 text-white">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-200">
                    Driver profile
                  </p>

                  <h3 className="mt-1 text-xl font-semibold">
                    {editingDriverId
                      ? 'Edit Driver'
                      : 'Create Driver Account'}
                  </h3>

                  <p className="mt-1 text-sm text-slate-300">
                    {editingDriverId
                      ? 'Update driver information and vehicle assignment.'
                      : 'Create the account and driver profile together.'}
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

            <div className="p-6">
              {modalError && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {modalError}
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <FormInput
                    label="Full name"
                    name="name"
                    value={formData.name}
                    onChange={
                      handleInputChange
                    }
                    placeholder="Enter driver name"
                    autoComplete="name"
                    required
                  />

                  <FormInput
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={
                      handleInputChange
                    }
                    placeholder="driver@company.com"
                    autoComplete="email"
                    required
                  />

                  <FormInput
                    label="Phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={
                      handleInputChange
                    }
                    placeholder="Optional"
                    autoComplete="tel"
                  />

                  <FormInput
                    label={
                      editingDriverId
                        ? 'New password'
                        : 'Temporary password'
                    }
                    name="password"
                    type="password"
                    value={
                      formData.password
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder={
                      editingDriverId
                        ? 'Leave blank to keep current'
                        : 'At least 8 characters'
                    }
                    autoComplete="new-password"
                    required={
                      !editingDriverId
                    }
                  />

                  <FormInput
                    label="Licence number"
                    name="licenseNumber"
                    value={
                      formData.licenseNumber
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder="Enter licence number"
                    autoComplete="off"
                    required
                  />

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Assigned vehicle
                    </label>

                    <select
                      id="assignedVehicleId"
                      name="assignedVehicleId"
                      value={
                        formData.assignedVehicleId
                      }
                      onChange={
                        handleInputChange
                      }
                      disabled={
                        editingDriverId !== null &&
                        drivers.find(
                          (driver) =>
                            driver.id ===
                            editingDriverId,
                        )?.availabilityStatus ===
                          'ON_TRIP'
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                    >
                      <option value="">
                        No vehicle assigned
                      </option>

                      {availableVehicles.map(
                        (vehicle) => (
                          <option
                            key={
                              vehicle.id
                            }
                            value={
                              vehicle.id
                            }
                          >
                            {
                              vehicle.plateNumber
                            }{' '}
                            —{' '}
                            {
                              vehicle.vehicleType
                            }
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                </div>

                {!editingDriverId && (
                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-800">
                    Give the temporary
                    password securely to the
                    driver. They can use the
                    normal login page to enter
                    the driver portal.
                  </div>
                )}

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
                      : editingDriverId
                        ? 'Update Driver'
                        : 'Create Driver'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function DriverAvatar({
  name,
}: {
  name: string
}) {
  const initials =
    name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-950 to-blue-900 text-xs font-bold text-white">
      {initials || 'DR'}
    </div>
  )
}

function FormInput({
  label,
  name,
  value,
  onChange,
  placeholder,
  autoComplete,
  type = 'text',
  required = false,
}: {
  label: string
  name: string
  value: string
  onChange: React.ChangeEventHandler<HTMLInputElement>
  placeholder: string
  autoComplete: string
  type?: string
  required?: boolean
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-semibold text-slate-700"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
  status: DriverAvailabilityStatus
}) {
  const styles: Record<
    DriverAvailabilityStatus,
    string
  > = {
    AVAILABLE:
      'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',

    ON_TRIP:
      'bg-blue-50 text-blue-700 ring-1 ring-blue-200',

    OFF_DUTY:
      'bg-amber-50 text-amber-700 ring-1 ring-amber-200',

    INACTIVE:
      'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  }

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${styles[status]}`}
    >
      {status.replaceAll('_', ' ')}
    </span>
  )
}

function getApiErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  if (!axios.isAxiosError(error)) {
    return fallbackMessage
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

  return fallbackMessage
}

export default DriversView