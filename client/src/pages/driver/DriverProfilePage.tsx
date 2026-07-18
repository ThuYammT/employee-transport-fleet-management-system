import axios from 'axios'
import {
  useEffect,
  useState,
} from 'react'

import type {
  ReactNode,
  SyntheticEvent,
} from 'react'

import {
  getDriverByUserId,
  updateDriver,
} from '../../services/driver.service'

import {
  getCurrentUser,
  saveCurrentUser,
} from '../../utils/user-session'

import type {
  Driver,
  DriverAvailabilityStatus,
} from '../../types/driver'

type ProfileFormData = {
  name: string
  email: string
  phone: string
  licenseNumber: string
  password: string
  confirmPassword: string
}

const emptyForm: ProfileFormData = {
  name: '',
  email: '',
  phone: '',
  licenseNumber: '',
  password: '',
  confirmPassword: '',
}

function DriverProfilePage() {
  const [driver, setDriver] =
    useState<Driver | null>(null)

  const [formData, setFormData] =
    useState<ProfileFormData>(
      emptyForm,
    )

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [editing, setEditing] =
    useState(false)

  const [error, setError] =
    useState('')

  const [success, setSuccess] =
    useState('')

  useEffect(() => {
    void loadProfile()
  }, [])

  async function loadProfile() {
    const currentUser = getCurrentUser()

    if (!currentUser) {
      setError(
        'Your login session was not found. Please sign in again.',
      )
      setLoading(false)
      return
    }

    if (currentUser.role !== 'DRIVER') {
      setError(
        'This page is only available for driver accounts.',
      )
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError('')

      const driverData =
        await getDriverByUserId(
          currentUser.id,
        )

      setDriver(driverData)
      setFormData(
        createFormData(driverData),
      )
    } catch (error) {
      console.error(error)

      setError(
        getApiErrorMessage(
          error,
          'Failed to load your profile.',
        ),
      )
    } finally {
      setLoading(false)
    }
  }

  function handleChange(
    field: keyof ProfileFormData,
    value: string,
  ) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }))

    setError('')
    setSuccess('')
  }

  function handleEdit() {
    if (!driver) {
      return
    }

    setFormData(
      createFormData(driver),
    )

    setEditing(true)
    setError('')
    setSuccess('')
  }

  function handleCancel() {
    if (driver) {
      setFormData(
        createFormData(driver),
      )
    }

    setEditing(false)
    setError('')
    setSuccess('')
  }

  async function handleSubmit(
  event: SyntheticEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (!driver) {
      return
    }

    const validationError =
      validateForm(formData)

    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const updatedDriver =
        await updateDriver(
          driver.id,
          {
            name: formData.name.trim(),
            email:
              formData.email
                .trim()
                .toLowerCase(),
            phone:
              formData.phone.trim(),
            licenseNumber:
              formData.licenseNumber.trim(),

            ...(formData.password.trim()
              ? {
                  password:
                    formData.password,
                }
              : {}),
          },
        )

      setDriver(updatedDriver)

      setFormData(
        createFormData(updatedDriver),
      )

      const currentUser =
        getCurrentUser()

      if (currentUser) {
        saveCurrentUser({
          ...currentUser,
          name: updatedDriver.user.name,
          email:
            updatedDriver.user.email,
          status:
            updatedDriver.user.status,
        })
      }

      setEditing(false)

      setSuccess(
        'Your profile was updated successfully.',
      )
    } catch (error) {
      console.error(error)

      setError(
        getApiErrorMessage(
          error,
          'Failed to update your profile.',
        ),
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <ProfileLoadingState />
  }

  return (
    <>
      <header className="border-b border-slate-200 bg-white px-6 py-4 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Driver Profile
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              View and update your personal
              information.
            </p>
          </div>

          {!editing && driver && (
            <button
              type="button"
              onClick={handleEdit}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Edit Profile
            </button>
          )}
        </div>
      </header>

      <main className="bg-slate-50 p-6 lg:p-8">
        {error && (
          <AlertMessage
            type="error"
            message={error}
          />
        )}

        {success && (
          <AlertMessage
            type="success"
            message={success}
          />
        )}

        {!driver ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              Driver profile unavailable
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              We could not find a driver
              profile connected to this
              account.
            </p>

            <button
              type="button"
              onClick={() =>
                void loadProfile()
              }
              className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[320px_1fr]">
            <ProfileSummaryCard
              driver={driver}
            />

            {editing ? (
              <ProfileEditForm
                formData={formData}
                saving={saving}
                onChange={handleChange}
                onCancel={handleCancel}
                onSubmit={handleSubmit}
              />
            ) : (
              <ProfileDetails
                driver={driver}
              />
            )}
          </div>
        )}
      </main>
    </>
  )
}

function ProfileSummaryCard({
  driver,
}: {
  driver: Driver
}) {
  const initials =
    getInitials(driver.user.name)

  return (
    <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-700">
          {initials}
        </div>

        <h2 className="mt-4 text-xl font-bold text-slate-900">
          {driver.user.name}
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {driver.user.email}
        </p>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <StatusBadge
            label={formatStatus(
              driver.availabilityStatus,
            )}
            type={getDriverStatusType(
              driver.availabilityStatus,
            )}
          />

          <StatusBadge
            label={formatStatus(
              driver.user.status,
            )}
            type={
              driver.user.status ===
              'ACTIVE'
                ? 'success'
                : 'neutral'
            }
          />
        </div>
      </div>

      <div className="mt-6 space-y-4 border-t border-slate-200 pt-5">
        <SummaryItem
          label="Driver ID"
          value={`DRV-${driver.id}`}
        />

        <SummaryItem
          label="License Number"
          value={driver.licenseNumber}
        />

        <SummaryItem
          label="Assigned Vehicle"
          value={
            driver.assignedVehicle
              ?.plateNumber ??
            'Not assigned'
          }
        />

        <SummaryItem
          label="Member Since"
          value={formatDate(
            driver.createdAt,
          )}
        />
      </div>
    </aside>
  )
}

function ProfileDetails({
  driver,
}: {
  driver: Driver
}) {
  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-900">
            Personal Information
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Information connected to your
            user account.
          </p>
        </div>

        <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          <InformationItem
            label="Full Name"
            value={driver.user.name}
          />

          <InformationItem
            label="Email Address"
            value={driver.user.email}
          />

          <InformationItem
            label="Phone Number"
            value={
              driver.user.phone ||
              'Not provided'
            }
          />

          <InformationItem
            label="Account Role"
            value={formatStatus(
              driver.user.role,
            )}
          />

          <InformationItem
            label="Account Status"
            value={formatStatus(
              driver.user.status,
            )}
          />

          <InformationItem
            label="Last Updated"
            value={formatDateTime(
              driver.updatedAt,
            )}
          />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-900">
            Driver Information
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Driving and fleet-related
            information.
          </p>
        </div>

        <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          <InformationItem
            label="Driver Profile ID"
            value={`DRV-${driver.id}`}
          />

          <InformationItem
            label="License Number"
            value={driver.licenseNumber}
          />

          <InformationItem
            label="Availability"
            value={formatStatus(
              driver.availabilityStatus,
            )}
          />

          <InformationItem
            label="Assigned Vehicle"
            value={
              driver.assignedVehicle
                ?.plateNumber ??
              'No vehicle assigned'
            }
          />

          <InformationItem
            label="Vehicle Type"
            value={
              driver.assignedVehicle
                ?.vehicleType ??
              'Unavailable'
            }
          />

          <InformationItem
            label="Vehicle Status"
            value={
              driver.assignedVehicle
                ? formatStatus(
                    driver.assignedVehicle
                      .status,
                  )
                : 'Unavailable'
            }
          />
        </div>
      </section>
    </div>
  )
}

function ProfileEditForm({
  formData,
  saving,
  onChange,
  onCancel,
  onSubmit,
}: {
  formData: ProfileFormData
  saving: boolean

  onChange: (
    field: keyof ProfileFormData,
    value: string,
  ) => void

  onCancel: () => void

  onSubmit: (
  event: SyntheticEvent<HTMLFormElement>,
  ) => void
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5"
    >
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-900">
            Edit Personal Information
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Update your name, email and
            contact information.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Full Name"
            required
          >
            <input
              type="text"
              value={formData.name}
              onChange={(event) =>
                onChange(
                  'name',
                  event.target.value,
                )
              }
              placeholder="Enter your full name"
              className={inputClassName}
            />
          </FormField>

          <FormField
            label="Email Address"
            required
          >
            <input
              type="email"
              value={formData.email}
              onChange={(event) =>
                onChange(
                  'email',
                  event.target.value,
                )
              }
              placeholder="Enter your email"
              className={inputClassName}
            />
          </FormField>

          <FormField label="Phone Number">
            <input
              type="tel"
              value={formData.phone}
              onChange={(event) =>
                onChange(
                  'phone',
                  event.target.value,
                )
              }
              placeholder="Enter your phone number"
              className={inputClassName}
            />
          </FormField>

          <FormField
            label="License Number"
            required
          >
            <input
              type="text"
              value={
                formData.licenseNumber
              }
              onChange={(event) =>
                onChange(
                  'licenseNumber',
                  event.target.value,
                )
              }
              placeholder="Enter license number"
              className={inputClassName}
            />
          </FormField>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-900">
            Change Password
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Leave these fields empty to
            keep your current password.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="New Password">
            <input
              type="password"
              value={formData.password}
              onChange={(event) =>
                onChange(
                  'password',
                  event.target.value,
                )
              }
              placeholder="At least 8 characters"
              className={inputClassName}
            />
          </FormField>

          <FormField label="Confirm Password">
            <input
              type="password"
              value={
                formData.confirmPassword
              }
              onChange={(event) =>
                onChange(
                  'confirmPassword',
                  event.target.value,
                )
              }
              placeholder="Repeat new password"
              className={inputClassName}
            />
          </FormField>
        </div>
      </section>

      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={onCancel}
          className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving
            ? 'Saving Changes...'
            : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}

function FormField({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </span>

      {children}
    </label>
  )
}

function InformationItem({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="border-b border-slate-100 pb-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 font-semibold text-slate-800">
        {value}
      </p>
    </div>
  )
}

function SummaryItem({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <p className="text-sm text-slate-500">
        {label}
      </p>

      <p className="max-w-[160px] text-right text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  )
}

function StatusBadge({
  label,
  type,
}: {
  label: string
  type:
    | 'success'
    | 'warning'
    | 'info'
    | 'neutral'
}) {
  const styles = {
    success:
      'bg-green-100 text-green-700',

    warning:
      'bg-amber-100 text-amber-700',

    info:
      'bg-blue-100 text-blue-700',

    neutral:
      'bg-slate-200 text-slate-700',
  }

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles[type]}`}
    >
      {label}
    </span>
  )
}

function AlertMessage({
  type,
  message,
}: {
  type: 'error' | 'success'
  message: string
}) {
  const style =
    type === 'error'
      ? 'border-red-200 bg-red-50 text-red-700'
      : 'border-green-200 bg-green-50 text-green-700'

  return (
    <div
      className={`mb-5 rounded-xl border px-4 py-3 text-sm font-medium ${style}`}
    >
      {message}
    </div>
  )
}

function ProfileLoadingState() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-slate-50 p-8">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

        <p className="mt-4 text-sm text-slate-500">
          Loading your profile...
        </p>
      </div>
    </div>
  )
}

const inputClassName =
  'w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

function createFormData(
  driver: Driver,
): ProfileFormData {
  return {
    name: driver.user.name,
    email: driver.user.email,
    phone:
      driver.user.phone ?? '',
    licenseNumber:
      driver.licenseNumber,
    password: '',
    confirmPassword: '',
  }
}

function validateForm(
  formData: ProfileFormData,
): string | null {
  if (!formData.name.trim()) {
    return 'Full name is required.'
  }

  if (
    formData.name.trim().length < 2
  ) {
    return 'Full name must contain at least 2 characters.'
  }

  if (!formData.email.trim()) {
    return 'Email address is required.'
  }

  if (
    !isValidEmail(
      formData.email.trim(),
    )
  ) {
    return 'Please enter a valid email address.'
  }

  if (
    !formData.licenseNumber.trim()
  ) {
    return 'License number is required.'
  }

  if (
    formData.password &&
    formData.password.length < 8
  ) {
    return 'New password must contain at least 8 characters.'
  }

  if (
    formData.password !==
    formData.confirmPassword
  ) {
    return 'The password confirmation does not match.'
  }

  return null
}

function isValidEmail(
  value: string,
): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value,
  )
}

function getInitials(
  name: string,
): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) =>
      part.charAt(0).toUpperCase(),
    )
    .join('')

  return initials || 'DR'
}

function getDriverStatusType(
  status: DriverAvailabilityStatus,
):
  | 'success'
  | 'warning'
  | 'info'
  | 'neutral' {
  switch (status) {
    case 'AVAILABLE':
      return 'success'

    case 'ON_TRIP':
      return 'info'

    case 'OFF_DUTY':
      return 'warning'

    case 'INACTIVE':
      return 'neutral'
  }
}

function formatStatus(
  value: string,
): string {
  return value
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    )
}

function formatDate(
  value: string,
): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString(
    undefined,
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    },
  )
}

function formatDateTime(
  value: string,
): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString(
    undefined,
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
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

export default DriverProfilePage