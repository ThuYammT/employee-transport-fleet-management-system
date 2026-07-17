import axios from 'axios'
import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  createDriver,
  deactivateDriver,
  getDrivers,
  updateDriver,
} from '../../services/driver.service'

import { getVehicles } from '../../services/vehicle.service'

import type {
  CreateDriverData,
  Driver,
  DriverAvailabilityStatus,
  UpdateDriverData,
} from '../../types/driver'

import type { Vehicle } from '../../types/vehicle'

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
  const [drivers, setDrivers] = useState<
    Driver[]
  >([])

  const [vehicles, setVehicles] = useState<
    Vehicle[]
  >([])

  const [searchTerm, setSearchTerm] =
    useState('')

  const [statusFilter, setStatusFilter] =
    useState<
      'ALL' | DriverAvailabilityStatus
    >('ALL')

  const [formData, setFormData] =
    useState<DriverFormData>(emptyForm)

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
    deactivatingDriverId,
    setDeactivatingDriverId,
  ] = useState<number | null>(null)

  const [error, setError] = useState('')
  const [modalError, setModalError] =
    useState('')

  useEffect(() => {
    void fetchData()
  }, [])

  async function fetchData() {
    try {
      setLoading(true)
      setError('')

      const [driversData, vehiclesData] =
        await Promise.all([
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
      setLoading(false)
    }
  }

  function openAddModal() {
    setEditingDriverId(null)
    setFormData(emptyForm)
    setModalError('')
    setIsModalOpen(true)
  }

  function openEditModal(driver: Driver) {
    setEditingDriverId(driver.id)

    setFormData({
      name: driver.user.name,
      email: driver.user.email,
      phone: driver.user.phone ?? '',
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
    if (saving) {
      return
    }

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
    const { name, value } = event.target

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

    const name = formData.name.trim()
    const email = formData.email
      .trim()
      .toLowerCase()

    const licenseNumber =
      formData.licenseNumber.trim()

    if (!name || !email || !licenseNumber) {
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
            assignedVehicleId ?? null,
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

      closeModal()
      await fetchData()
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

  async function handleDeactivate(
    driver: Driver,
  ) {
    if (
      driver.availabilityStatus ===
      'INACTIVE'
    ) {
      return
    }

    const confirmed = window.confirm(
      `Deactivate ${driver.user.name}?\n\nThe driver will no longer be able to log in, but their trip history will be preserved.`,
    )

    if (!confirmed) {
      return
    }

    try {
      setDeactivatingDriverId(driver.id)
      setError('')

      await deactivateDriver(driver.id)
      await fetchData()
    } catch (error) {
      console.error(error)

      setError(
        getApiErrorMessage(
          error,
          'Failed to deactivate the driver.',
        ),
      )
    } finally {
      setDeactivatingDriverId(null)
    }
  }

  const availableVehicles = useMemo(() => {
    const assignedVehicleIds = new Set(
      drivers
        .filter(
          (driver) =>
            driver.id !== editingDriverId,
        )
        .map(
          (driver) =>
            driver.assignedVehicleId,
        )
        .filter(
          (
            vehicleId,
          ): vehicleId is number =>
            typeof vehicleId === 'number',
        ),
    )

    return vehicles.filter(
      (vehicle) =>
        !assignedVehicleIds.has(vehicle.id),
    )
  }, [
    drivers,
    vehicles,
    editingDriverId,
  ])

  const filteredDrivers = useMemo(() => {
    const keyword = searchTerm
      .trim()
      .toLowerCase()

    return drivers.filter((driver) => {
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
        (driver.user.phone ?? '')
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

      return matchesSearch && matchesStatus
    })
  }, [
    drivers,
    searchTerm,
    statusFilter,
  ])

  return (
    <>
      <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-8">
        <div>
          <h2 className="text-xl font-bold">
            Driver Management
          </h2>

          <p className="text-sm text-slate-500">
            Create driver accounts, manage
            licences and assign vehicles.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
        >
          + Add Driver
        </button>
      </header>

      <section className="p-8">
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-lg font-bold">
                Drivers
              </h3>

              <p className="text-sm text-slate-500">
                Total drivers: {drivers.length}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm outline-none focus:border-blue-500 sm:w-72"
                placeholder="Search drivers..."
              />

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as
                      | 'ALL'
                      | DriverAvailabilityStatus,
                  )
                }
                className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm outline-none focus:border-blue-500"
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
            <p className="py-8 text-center text-slate-500">
              Loading drivers...
            </p>
          )}

          {!loading &&
            filteredDrivers.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center">
                <p className="font-semibold text-slate-700">
                  No drivers found
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Create a driver account or
                  change the search filters.
                </p>
              </div>
            )}

          {!loading &&
            filteredDrivers.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-500">
                      <th className="py-4 pr-4">
                        Driver
                      </th>

                      <th className="py-4 pr-4">
                        Licence
                      </th>

                      <th className="py-4 pr-4">
                        Phone
                      </th>

                      <th className="py-4 pr-4">
                        Vehicle
                      </th>

                      <th className="py-4 pr-4">
                        Status
                      </th>

                      <th className="py-4 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredDrivers.map(
                      (driver) => (
                        <tr
                          key={driver.id}
                          className="border-b border-slate-100 transition hover:bg-slate-50"
                        >
                          <td className="py-4 pr-4">
                            <div className="font-semibold">
                              {
                                driver.user
                                  .name
                              }
                            </div>

                            <div className="mt-1 text-xs text-slate-400">
                              {
                                driver.user
                                  .email
                              }
                            </div>
                          </td>

                          <td className="py-4 pr-4 font-mono">
                            {
                              driver.licenseNumber
                            }
                          </td>

                          <td className="py-4 pr-4">
                            {driver.user
                              .phone ?? (
                              <span className="text-slate-400">
                                —
                              </span>
                            )}
                          </td>

                          <td className="py-4 pr-4">
                            {driver.assignedVehicle ? (
                              <>
                                <div className="font-semibold">
                                  {
                                    driver
                                      .assignedVehicle
                                      .plateNumber
                                  }
                                </div>

                                <div className="mt-1 text-xs text-slate-500">
                                  {
                                    driver
                                      .assignedVehicle
                                      .vehicleType
                                  }
                                </div>
                              </>
                            ) : (
                              <span className="text-slate-400">
                                Unassigned
                              </span>
                            )}
                          </td>

                          <td className="py-4 pr-4">
                            <StatusBadge
                              status={
                                driver.availabilityStatus
                              }
                            />
                          </td>

                          <td className="py-4 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(
                                  driver,
                                )
                              }
                              className="mr-4 font-semibold text-blue-600 hover:text-blue-700"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              disabled={
                                driver.availabilityStatus ===
                                  'INACTIVE' ||
                                deactivatingDriverId ===
                                  driver.id
                              }
                              onClick={() =>
                                void handleDeactivate(
                                  driver,
                                )
                              }
                              className="font-semibold text-red-500 hover:text-red-600 disabled:cursor-not-allowed disabled:text-slate-300"
                            >
                              {deactivatingDriverId ===
                              driver.id
                                ? 'Deactivating...'
                                : driver.availabilityStatus ===
                                    'INACTIVE'
                                  ? 'Inactive'
                                  : 'Deactivate'}
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
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-8 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-start justify-between gap-5">
              <div>
                <h3 className="text-xl font-bold">
                  {editingDriverId
                    ? 'Edit Driver'
                    : 'Create Driver Account'}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {editingDriverId
                    ? 'Update the driver account, licence and vehicle assignment.'
                    : 'Create the login account and driver profile together.'}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="text-2xl text-slate-400 transition hover:text-slate-700 disabled:opacity-50"
                aria-label="Close"
              >
                ×
              </button>
            </div>

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
                  placeholder="e.g. DL-98234125"
                  autoComplete="off"
                  required
                />

                <div>
                  <label
                    htmlFor="assignedVehicleId"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
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
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">
                      No vehicle assigned
                    </option>

                    {availableVehicles.map(
                      (vehicle) => (
                        <option
                          key={vehicle.id}
                          value={vehicle.id}
                        >
                          {
                            vehicle.plateNumber
                          }{' '}
                          (
                          {
                            vehicle.vehicleType
                          }
                          )
                        </option>
                      ),
                    )}
                  </select>
                </div>
              </div>

              {!editingDriverId && (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-800">
                  Give the temporary password
                  securely to the driver. The
                  driver will use the normal login
                  page and will automatically be
                  redirected to the driver portal.
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl bg-slate-200 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-300 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
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
        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  )
}

function StatusBadge({
  status,
}: {
  status: DriverAvailabilityStatus
}) {
  const statusClasses: Record<
    DriverAvailabilityStatus,
    string
  > = {
    AVAILABLE:
      'bg-green-100 text-green-700',
    ON_TRIP:
      'bg-blue-100 text-blue-700',
    OFF_DUTY:
      'bg-amber-100 text-amber-700',
    INACTIVE:
      'bg-red-100 text-red-700',
  }

  return (
    <span
      className={`inline-flex rounded-lg px-3 py-1 text-xs font-semibold ${statusClasses[status]}`}
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

  if (typeof message === 'string') {
    return message
  }

  if (!error.response) {
    return 'Unable to connect to the server.'
  }

  return fallbackMessage
}

export default DriversView