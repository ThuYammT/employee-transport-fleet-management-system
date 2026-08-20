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
  const [
    driver,
    setDriver,
  ] =
    useState<Driver | null>(
      null,
    )

  const [
    formData,
    setFormData,
  ] =
    useState<ProfileFormData>(
      emptyForm,
    )

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    saving,
    setSaving,
  ] = useState(false)

  const [
    editing,
    setEditing,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState('')

  const [
    success,
    setSuccess,
  ] = useState('')

  useEffect(() => {
    void loadProfile()
  }, [])

  async function loadProfile() {
    const currentUser =
      getCurrentUser()

    if (!currentUser) {
      setError(
        'Your login session was not found. Please sign in again.',
      )

      setLoading(false)
      return
    }

    if (
      currentUser.role !==
      'DRIVER'
    ) {
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

      setDriver(
        driverData,
      )

      setFormData(
        createFormData(
          driverData,
        ),
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
    field:
      keyof ProfileFormData,

    value: string,
  ) {
    setFormData(
      (current) => ({
        ...current,
        [field]:
          value,
      }),
    )

    setError('')
    setSuccess('')
  }

  function handleEdit() {
    if (!driver) {
      return
    }

    setFormData(
      createFormData(
        driver,
      ),
    )

    setEditing(true)
    setError('')
    setSuccess('')
  }

  function handleCancel() {
    if (driver) {
      setFormData(
        createFormData(
          driver,
        ),
      )
    }

    setEditing(false)
    setError('')
    setSuccess('')
  }

  async function handleSubmit(
    event:
      SyntheticEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (!driver) {
      return
    }

    const validationError =
      validateForm(
        formData,
      )

    if (validationError) {
      setError(
        validationError,
      )

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
            name:
              formData.name.trim(),

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

      setDriver(
        updatedDriver,
      )

      setFormData(
        createFormData(
          updatedDriver,
        ),
      )

      const currentUser =
        getCurrentUser()

      if (currentUser) {
        saveCurrentUser({
          ...currentUser,

          name:
            updatedDriver
              .user.name,

          email:
            updatedDriver
              .user.email,

          status:
            updatedDriver
              .user.status,
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
    return (
      <ProfileLoadingState />
    )
  }

  return (
    <>
      {/* HEADER */}

      <header className="flex min-h-[72px] items-center justify-between border-b border-slate-200 bg-white px-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-950">
            Driver Profile
          </h1>

          <p className="mt-0.5 text-sm text-slate-500">
            Review your account,
            contact and driver
            information.
          </p>
        </div>

        {!editing &&
          driver && (
            <button
              type="button"
              onClick={
                handleEdit
              }
              className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Edit Profile
            </button>
          )}
      </header>

      <section className="mx-auto max-w-[1600px] p-8">
        {error && (
          <AlertMessage
            type="error"
            message={error}
          />
        )}

        {success && (
          <AlertMessage
            type="success"
            message={
              success
            }
          />
        )}

        {!driver ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Driver profile
              unavailable
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              We could not find a
              driver profile connected
              to this account.
            </p>

            <button
              type="button"
              onClick={() =>
                void loadProfile()
              }
              className="mt-5 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            {/* HERO */}

            <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 px-7 py-7 text-white shadow-sm">
              <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />

              <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-5">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-xl font-bold text-white ring-1 ring-white/10">
                    {getInitials(
                      driver
                        .user.name,
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-200">
                      Driver account
                    </p>

                    <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                      {
                        driver
                          .user
                          .name
                      }
                    </h2>

                    <p className="mt-1 text-sm text-slate-300">
                      {
                        driver
                          .user
                          .email
                      }
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <HeroStatus
                    label="Availability"
                    value={formatStatus(
                      driver.availabilityStatus,
                    )}
                  />

                  <HeroStatus
                    label="Vehicle"
                    value={
                      driver
                        .assignedVehicle
                        ?.plateNumber ??
                      'None'
                    }
                  />
                </div>
              </div>
            </div>

            {editing ? (
              <ProfileEditForm
                formData={
                  formData
                }
                saving={
                  saving
                }
                onChange={
                  handleChange
                }
                onCancel={
                  handleCancel
                }
                onSubmit={
                  handleSubmit
                }
              />
            ) : (
              <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
                <ProfileSummaryCard
                  driver={
                    driver
                  }
                />

                <ProfileDetails
                  driver={
                    driver
                  }
                />
              </div>
            )}
          </>
        )}
      </section>
    </>
  )
}

/* =========================================================
   SUMMARY
========================================================= */

function ProfileSummaryCard({
  driver,
}: {
  driver: Driver
}) {
  return (
    <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        Driver summary
      </p>

      <div className="mt-5 flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-sm font-bold text-white">
          {getInitials(
            driver.user.name,
          )}
        </div>

        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-950">
            {
              driver.user
                .name
            }
          </p>

          <p className="mt-0.5 truncate text-xs text-slate-500">
            {
              driver.user
                .email
            }
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <DriverStatusBadge
          status={
            driver.availabilityStatus
          }
        />

        <AccountStatusBadge
          status={
            driver.user.status
          }
        />
      </div>

      <div className="mt-6 space-y-4 border-t border-slate-100 pt-5">
        <SummaryItem
          label="Driver ID"
          value={`DRV-${driver.id}`}
        />

        <SummaryItem
          label="License"
          value={
            driver.licenseNumber
          }
        />

        <SummaryItem
          label="Vehicle"
          value={
            driver
              .assignedVehicle
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

/* =========================================================
   DETAILS
========================================================= */

function ProfileDetails({
  driver,
}: {
  driver: Driver
}) {
  return (
    <div className="space-y-6">
      <InformationSection
        title="Personal Information"
        description="Information connected to your user account."
      >
        <InformationItem
          label="Full Name"
          value={
            driver.user.name
          }
        />

        <InformationItem
          label="Email Address"
          value={
            driver.user.email
          }
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
      </InformationSection>

      <InformationSection
        title="Driver & Fleet Information"
        description="Driving credentials and current vehicle assignment."
      >
        <InformationItem
          label="Driver Profile ID"
          value={`DRV-${driver.id}`}
        />

        <InformationItem
          label="License Number"
          value={
            driver.licenseNumber
          }
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
            driver
              .assignedVehicle
              ?.plateNumber ??
            'No vehicle assigned'
          }
        />

        <InformationItem
          label="Vehicle Type"
          value={
            driver
              .assignedVehicle
              ?.vehicleType ??
            'Unavailable'
          }
        />

        <InformationItem
          label="Vehicle Status"
          value={
            driver
              .assignedVehicle
              ? formatStatus(
                  driver
                    .assignedVehicle
                    .status,
                )
              : 'Unavailable'
          }
        />
      </InformationSection>
    </div>
  )
}

function InformationSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Profile
        </p>

        <h3 className="mt-1 text-lg font-semibold text-slate-950">
          {title}
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          {description}
        </p>
      </div>

      <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
        {children}
      </div>
    </section>
  )
}

/* =========================================================
   EDIT
========================================================= */

function ProfileEditForm({
  formData,
  saving,
  onChange,
  onCancel,
  onSubmit,
}: {
  formData:
    ProfileFormData

  saving:
    boolean

  onChange: (
    field:
      keyof ProfileFormData,

    value:
      string,
  ) => void

  onCancel:
    () => void

  onSubmit: (
    event:
      SyntheticEvent<HTMLFormElement>,
  ) => void
}) {
  return (
    <form
      onSubmit={
        onSubmit
      }
      className="space-y-6"
    >
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Account details
          </p>

          <h3 className="mt-1 text-lg font-semibold text-slate-950">
            Edit Personal
            Information
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Update your name,
            contact information and
            driver license.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            label="Full Name"
            required
          >
            <input
              type="text"
              value={
                formData.name
              }
              onChange={(
                event,
              ) =>
                onChange(
                  'name',
                  event
                    .target
                    .value,
                )
              }
              placeholder="Enter your full name"
              className={
                inputClass
              }
            />
          </FormField>

          <FormField
            label="Email Address"
            required
          >
            <input
              type="email"
              value={
                formData.email
              }
              onChange={(
                event,
              ) =>
                onChange(
                  'email',
                  event
                    .target
                    .value,
                )
              }
              placeholder="Enter your email"
              className={
                inputClass
              }
            />
          </FormField>

          <FormField label="Phone Number">
            <input
              type="tel"
              value={
                formData.phone
              }
              onChange={(
                event,
              ) =>
                onChange(
                  'phone',
                  event
                    .target
                    .value,
                )
              }
              placeholder="Enter your phone number"
              className={
                inputClass
              }
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
              onChange={(
                event,
              ) =>
                onChange(
                  'licenseNumber',
                  event
                    .target
                    .value,
                )
              }
              placeholder="Enter license number"
              className={
                inputClass
              }
            />
          </FormField>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Account security
          </p>

          <h3 className="mt-1 text-lg font-semibold text-slate-950">
            Change Password
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Leave both password
            fields empty to keep your
            current password.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="New Password">
            <input
              type="password"
              value={
                formData.password
              }
              onChange={(
                event,
              ) =>
                onChange(
                  'password',
                  event
                    .target
                    .value,
                )
              }
              placeholder="At least 8 characters"
              className={
                inputClass
              }
            />
          </FormField>

          <FormField label="Confirm Password">
            <input
              type="password"
              value={
                formData.confirmPassword
              }
              onChange={(
                event,
              ) =>
                onChange(
                  'confirmPassword',
                  event
                    .target
                    .value,
                )
              }
              placeholder="Repeat new password"
              className={
                inputClass
              }
            />
          </FormField>
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          disabled={
            saving
          }
          onClick={
            onCancel
          }
          className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={
            saving
          }
          className="rounded-xl bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving
            ? 'Saving Changes...'
            : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}

/* =========================================================
   COMPONENTS
========================================================= */

function HeroStatus({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="min-w-[140px] rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3">
      <p className="text-xs text-slate-400">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-semibold text-white">
        {value}
      </p>
    </div>
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
    <div className="border-b border-slate-100 pb-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-slate-800">
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

function DriverStatusBadge({
  status,
}: {
  status:
    DriverAvailabilityStatus
}) {
  const styles:
    Record<
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
      {formatStatus(
        status,
      )}
    </span>
  )
}

function AccountStatusBadge({
  status,
}: {
  status:
    string
}) {
  const active =
    status ===
    'ACTIVE'

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${
        active
          ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
          : 'bg-slate-100 text-slate-600 ring-slate-200'
      }`}
    >
      {formatStatus(
        status,
      )}
    </span>
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
      <span className="mb-2 block text-sm font-semibold text-slate-700">
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

function AlertMessage({
  type,
  message,
}: {
  type:
    | 'error'
    | 'success'

  message:
    string
}) {
  const style =
    type === 'error'
      ? 'border-red-200 bg-red-50 text-red-700'
      : 'border-emerald-200 bg-emerald-50 text-emerald-700'

  return (
    <div
      className={`mb-6 rounded-xl border px-4 py-3 text-sm font-medium ${style}`}
    >
      {message}
    </div>
  )
}

function ProfileLoadingState() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-[#f6f7f9] p-8">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

        <p className="mt-4 text-sm text-slate-500">
          Loading your
          profile...
        </p>
      </div>
    </div>
  )
}

const inputClass =
  'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

/* =========================================================
   FORM HELPERS
========================================================= */

function createFormData(
  driver: Driver,
): ProfileFormData {
  return {
    name:
      driver.user.name,

    email:
      driver.user.email,

    phone:
      driver.user.phone ??
      '',

    licenseNumber:
      driver.licenseNumber,

    password: '',

    confirmPassword: '',
  }
}

function validateForm(
  formData:
    ProfileFormData,
): string | null {
  if (
    !formData.name.trim()
  ) {
    return 'Full name is required.'
  }

  if (
    formData.name
      .trim()
      .length < 2
  ) {
    return 'Full name must contain at least 2 characters.'
  }

  if (
    !formData.email.trim()
  ) {
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
    formData.password.length <
      8
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
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(
        (part) =>
          part
            .charAt(0)
            .toUpperCase(),
      )
      .join('')

  return (
    initials ||
    'DR'
  )
}

/* =========================================================
   FORMATTERS
========================================================= */

function formatStatus(
  value: string,
): string {
  return value
    .replaceAll(
      '_',
      ' ',
    )
    .toLowerCase()
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
    )
}

function formatDate(
  value: string,
): string {
  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
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
  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
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

/* =========================================================
   API ERROR
========================================================= */

function getApiErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  if (
    !axios.isAxiosError(
      error,
    )
  ) {
    return fallbackMessage
  }

  const message =
    error.response?.data
      ?.message

  if (
    Array.isArray(
      message,
    )
  ) {
    return message.join(
      ', ',
    )
  }

  if (
    typeof message ===
    'string'
  ) {
    return message
  }

  if (
    !error.response
  ) {
    return 'Unable to connect to the server.'
  }

  return fallbackMessage
}

export default DriverProfilePage