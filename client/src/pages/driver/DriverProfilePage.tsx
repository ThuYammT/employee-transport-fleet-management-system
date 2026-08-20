import axios from 'axios'

import {
  useEffect,
  useState,
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

const emptyForm:
  ProfileFormData = {
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
  ] =
    useState(true)

  const [
    saving,
    setSaving,
  ] =
    useState(false)

  const [
    editing,
    setEditing,
  ] =
    useState(false)

  const [
    error,
    setError,
  ] =
    useState('')

  const [
    success,
    setSuccess,
  ] =
    useState('')

  useEffect(() => {
    void loadProfile()
  }, [])

  async function loadProfile() {
    const currentUser =
      getCurrentUser()

    if (
      !currentUser ||
      currentUser.role !==
        'DRIVER'
    ) {
      setError(
        'Driver session not found.',
      )

      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError('')

      const data =
        await getDriverByUserId(
          currentUser.id,
        )

      setDriver(data)

      setFormData(
        createFormData(data),
      )
    } catch (error) {
      console.error(error)

      setError(
        getApiErrorMessage(
          error,
          'Failed to load your driver profile.',
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
        [field]: value,
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
    event:
      React.FormEvent<HTMLFormElement>,
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
            updatedDriver.user
              .name,

          email:
            updatedDriver.user
              .email,

          phone:
            updatedDriver.user
              .phone ?? undefined,

          status:
            updatedDriver.user
              .status,
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
      <LoadingState />
    )
  }

  return (
    <>
      <header className="flex min-h-[72px] items-center justify-between border-b border-slate-200 bg-white px-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-950">
            Driver Profile
          </h1>

          <p className="mt-0.5 text-sm text-slate-500">
            Review and update
            your Fleet Pulse
            driver account.
          </p>
        </div>

        {!editing &&
          driver && (
            <button
              type="button"
              onClick={
                handleEdit
              }
              className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Edit Profile
            </button>
          )}
      </header>

      <section className="mx-auto max-w-[1400px] p-8">
        {error && (
          <Alert
            type="error"
            message={
              error
            }
          />
        )}

        {success && (
          <Alert
            type="success"
            message={
              success
            }
          />
        )}

        {!driver ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="font-semibold text-slate-900">
              Driver profile
              unavailable
            </p>

            <button
              type="button"
              onClick={() =>
                void loadProfile()
              }
              className="mt-4 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            <section className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 px-7 py-7 text-white">
              <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />

              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-5">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-xl font-bold ring-1 ring-white/10">
                    {getInitials(
                      driver.user.name,
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-200">
                      Fleet Driver
                    </p>

                    <h2 className="mt-1 text-2xl font-semibold">
                      {
                        driver.user.name
                      }
                    </h2>

                    <p className="mt-1 text-sm text-slate-300">
                      {
                        driver.user.email
                      }
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <StatusBadge
                    status={
                      driver.availabilityStatus
                    }
                  />

                  <span className="rounded-full bg-emerald-400/15 px-3 py-1.5 text-xs font-semibold text-emerald-200 ring-1 ring-emerald-400/30">
                    {
                      driver.user.status
                    }
                  </span>
                </div>
              </div>
            </section>

            {!editing ? (
              <div className="grid gap-6 xl:grid-cols-[310px_1fr]">
                <section className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Driver Summary
                  </p>

                  <div className="mt-5 space-y-4">
                    <SummaryRow
                      label="Driver ID"
                      value={`DRV-${driver.id
                        .toString()
                        .padStart(
                          4,
                          '0',
                        )}`}
                    />

                    <SummaryRow
                      label="License"
                      value={
                        driver.licenseNumber
                      }
                    />

                    <SummaryRow
                      label="Availability"
                      value={formatStatus(
                        driver.availabilityStatus,
                      )}
                    />

                    <SummaryRow
                      label="Assigned Vehicle"
                      value={
                        driver.assignedVehicle
                          ?.plateNumber ??
                        'Not assigned'
                      }
                    />
                  </div>
                </section>

                <div className="space-y-6">
                  <InformationCard
                    title="Personal Information"
                  >
                    <Info
                      label="Full Name"
                      value={
                        driver.user.name
                      }
                    />

                    <Info
                      label="Email Address"
                      value={
                        driver.user.email
                      }
                    />

                    <Info
                      label="Phone Number"
                      value={
                        driver.user.phone ||
                        'Not provided'
                      }
                    />

                    <Info
                      label="Account Status"
                      value={
                        driver.user.status
                      }
                    />
                  </InformationCard>

                  <InformationCard
                    title="Driver & Vehicle"
                  >
                    <Info
                      label="License Number"
                      value={
                        driver.licenseNumber
                      }
                    />

                    <Info
                      label="Availability"
                      value={formatStatus(
                        driver.availabilityStatus,
                      )}
                    />

                    <Info
                      label="Vehicle"
                      value={
                        driver.assignedVehicle
                          ?.plateNumber ??
                        'Not assigned'
                      }
                    />

                    <Info
                      label="Vehicle Type"
                      value={
                        driver.assignedVehicle
                          ?.vehicleType ??
                        'Unavailable'
                      }
                    />
                  </InformationCard>
                </div>
              </div>
            ) : (
              <form
                onSubmit={
                  handleSubmit
                }
                className="space-y-6"
              >
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Profile Settings
                  </p>

                  <h3 className="mt-1 text-lg font-semibold text-slate-950">
                    Personal & Driver
                    Information
                  </h3>

                  <div className="mt-6 grid gap-5 sm:grid-cols-2">
                    <FormField label="Full Name">
                      <input
                        value={
                          formData.name
                        }
                        onChange={(
                          event,
                        ) =>
                          handleChange(
                            'name',
                            event
                              .target
                              .value,
                          )
                        }
                        className={
                          inputClass
                        }
                      />
                    </FormField>

                    <FormField label="Email Address">
                      <input
                        type="email"
                        value={
                          formData.email
                        }
                        onChange={(
                          event,
                        ) =>
                          handleChange(
                            'email',
                            event
                              .target
                              .value,
                          )
                        }
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
                          handleChange(
                            'phone',
                            event
                              .target
                              .value,
                          )
                        }
                        className={
                          inputClass
                        }
                      />
                    </FormField>

                    <FormField label="License Number">
                      <input
                        value={
                          formData.licenseNumber
                        }
                        onChange={(
                          event,
                        ) =>
                          handleChange(
                            'licenseNumber',
                            event
                              .target
                              .value,
                          )
                        }
                        className={
                          inputClass
                        }
                      />
                    </FormField>
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Security
                  </p>

                  <h3 className="mt-1 text-lg font-semibold text-slate-950">
                    Change Password
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Leave both
                    password fields
                    empty to keep
                    your current
                    password.
                  </p>

                  <div className="mt-6 grid gap-5 sm:grid-cols-2">
                    <FormField label="New Password">
                      <input
                        type="password"
                        value={
                          formData.password
                        }
                        onChange={(
                          event,
                        ) =>
                          handleChange(
                            'password',
                            event
                              .target
                              .value,
                          )
                        }
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
                          handleChange(
                            'confirmPassword',
                            event
                              .target
                              .value,
                          )
                        }
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
                      handleCancel
                    }
                    className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      saving
                    }
                    className="rounded-xl bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {saving
                      ? 'Saving...'
                      : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </section>
    </>
  )
}

function InformationCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-950">
        {title}
      </h3>

      <div className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2">
        {children}
      </div>
    </section>
  )
}

function Info({
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

      <p className="mt-1 text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  )
}

function SummaryRow({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span className="max-w-[165px] text-right text-sm font-semibold text-slate-800">
        {value}
      </span>
    </div>
  )
}

function StatusBadge({
  status,
}: {
  status: DriverAvailabilityStatus
}) {
  const styles:
    Record<
      DriverAvailabilityStatus,
      string
    > = {
    AVAILABLE:
      'bg-emerald-400/15 text-emerald-200 ring-emerald-400/30',

    ON_TRIP:
      'bg-blue-400/15 text-blue-200 ring-blue-400/30',

    OFF_DUTY:
      'bg-amber-400/15 text-amber-200 ring-amber-400/30',

    INACTIVE:
      'bg-slate-400/15 text-slate-300 ring-slate-400/30',
  }

  return (
    <span
      className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${styles[status]}`}
    >
      {formatStatus(
        status,
      )}
    </span>
  )
}

function FormField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>

      {children}
    </label>
  )
}

function Alert({
  type,
  message,
}: {
  type: 'error' | 'success'
  message: string
}) {
  const classes =
    type === 'error'
      ? 'border-red-200 bg-red-50 text-red-700'
      : 'border-emerald-200 bg-emerald-50 text-emerald-700'

  return (
    <div
      className={`mb-6 rounded-xl border px-4 py-3 text-sm ${classes}`}
    >
      {message}
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

        <p className="mt-4 text-sm text-slate-500">
          Loading driver
          profile...
        </p>
      </div>
    </div>
  )
}

const inputClass =
  'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

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
  data: ProfileFormData,
) {
  if (
    data.name.trim().length <
    2
  ) {
    return 'Full name must contain at least 2 characters.'
  }

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      data.email.trim(),
    )
  ) {
    return 'Please enter a valid email address.'
  }

  if (
    !data.licenseNumber.trim()
  ) {
    return 'License number is required.'
  }

  if (
    data.password &&
    data.password.length <
      8
  ) {
    return 'New password must contain at least 8 characters.'
  }

  if (
    data.password !==
    data.confirmPassword
  ) {
    return 'Password confirmation does not match.'
  }

  return null
}

function getInitials(
  name: string,
) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(
        (part) =>
          part[0]
            ?.toUpperCase(),
      )
      .join('') ||
    'DR'
  )
}

function formatStatus(
  value: string,
) {
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

function getApiErrorMessage(
  error: unknown,
  fallback: string,
) {
  if (
    !axios.isAxiosError(
      error,
    )
  ) {
    return fallback
  }

  const message =
    error.response?.data
      ?.message

  if (
    Array.isArray(message)
  ) {
    return message.join(', ')
  }

  if (
    typeof message ===
    'string'
  ) {
    return message
  }

  return fallback
}

export default DriverProfilePage