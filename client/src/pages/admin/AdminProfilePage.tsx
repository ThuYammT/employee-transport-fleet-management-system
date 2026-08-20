import axios from 'axios'

import {
  useEffect,
  useState,
} from 'react'

import {
  getUserById,
  updateUser,
} from '../../services/user.service'

import type {
  User,
} from '../../types/user'

import {
  getCurrentUser,
  saveCurrentUser,
} from '../../utils/user-session'

type ProfileFormData = {
  name: string
  email: string
  phone: string
  password: string
  confirmPassword: string
}

const emptyForm:
  ProfileFormData = {
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
}

function AdminProfilePage() {
  const [
    admin,
    setAdmin,
  ] =
    useState<User | null>(
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
    void loadAdminProfile()
  }, [])

  async function loadAdminProfile() {
    const currentUser =
      getCurrentUser()

    if (
      !currentUser ||
      currentUser.role !==
        'ADMIN'
    ) {
      setError(
        'Administrator session not found.',
      )

      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError('')

      const adminData =
        await getUserById(
          currentUser.id,
        )

      setAdmin(
        adminData,
      )

      setFormData(
        createFormData(
          adminData,
        ),
      )
    } catch (error) {
      console.error(error)

      setError(
        getApiErrorMessage(
          error,
          'Failed to load administrator profile.',
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
    if (!admin) {
      return
    }

    setFormData(
      createFormData(admin),
    )

    setEditing(true)
    setError('')
    setSuccess('')
  }

  function handleCancel() {
    if (admin) {
      setFormData(
        createFormData(admin),
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

    if (!admin) {
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

      const updatedAdmin =
        await updateUser(
          admin.id,
          {
            name:
              formData.name.trim(),

            email:
              formData.email
                .trim()
                .toLowerCase(),

            phone:
              formData.phone
                .trim(),

            ...(formData.password.trim()
              ? {
                  password:
                    formData.password,
                }
              : {}),
          },
        )

      setAdmin(
        updatedAdmin,
      )

      setFormData(
        createFormData(
          updatedAdmin,
        ),
      )

      const currentUser =
        getCurrentUser()

      if (currentUser) {
        saveCurrentUser({
          ...currentUser,

          name:
            updatedAdmin.name,

          email:
            updatedAdmin.email,

          phone:
            updatedAdmin.phone ?? undefined,

          status:
            updatedAdmin.status,
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
            Admin Profile
          </h1>

          <p className="mt-0.5 text-sm text-slate-500">
            Manage your Fleet
            Pulse administrator
            account.
          </p>
        </div>

        {!editing &&
          admin && (
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

        {admin && (
          <>
            <section className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 px-7 py-7 text-white">
              <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />

              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-5">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-xl font-bold ring-1 ring-white/10">
                    {getInitials(
                      admin.name,
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-200">
                      Administrator
                    </p>

                    <h2 className="mt-1 text-2xl font-semibold">
                      {
                        admin.name
                      }
                    </h2>

                    <p className="mt-1 text-sm text-slate-300">
                      {
                        admin.email
                      }
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <span className="rounded-full bg-violet-400/15 px-3 py-1.5 text-xs font-semibold text-violet-200 ring-1 ring-violet-400/30">
                    ADMIN
                  </span>

                  <span className="rounded-full bg-emerald-400/15 px-3 py-1.5 text-xs font-semibold text-emerald-200 ring-1 ring-emerald-400/30">
                    {
                      admin.status
                    }
                  </span>
                </div>
              </div>
            </section>

            {!editing ? (
              <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
                <section className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Account Summary
                  </p>

                  <div className="mt-5 space-y-4">
                    <SummaryRow
                      label="Admin ID"
                      value={`ADM-${admin.id
                        .toString()
                        .padStart(
                          4,
                          '0',
                        )}`}
                    />

                    <SummaryRow
                      label="Role"
                      value="Administrator"
                    />

                    <SummaryRow
                      label="Status"
                      value={
                        admin.status
                      }
                    />

                    <SummaryRow
                      label="Created"
                      value={formatDate(
                        admin.createdAt,
                      )}
                    />
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Account Information
                  </p>

                  <h3 className="mt-1 text-lg font-semibold text-slate-950">
                    Profile Details
                  </h3>

                  <div className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2">
                    <ProfileField
                      label="Full Name"
                      value={
                        admin.name
                      }
                    />

                    <ProfileField
                      label="Email Address"
                      value={
                        admin.email
                      }
                    />

                    <ProfileField
                      label="Phone Number"
                      value={
                        admin.phone ||
                        'Not provided'
                      }
                    />

                    <ProfileField
                      label="Account Role"
                      value="Administrator"
                    />

                    <ProfileField
                      label="Account Status"
                      value={
                        admin.status
                      }
                    />

                    <ProfileField
                      label="Last Updated"
                      value={formatDateTime(
                        admin.updatedAt,
                      )}
                    />
                  </div>
                </section>
              </div>
            ) : (
              <form
                onSubmit={
                  handleSubmit
                }
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Profile Settings
                  </p>

                  <h3 className="mt-1 text-lg font-semibold text-slate-950">
                    Edit Profile
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Update your
                    personal and
                    login information.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
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

                  <div>
                    <p className="mb-2 text-sm font-semibold text-slate-700">
                      Role
                    </p>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
                      Administrator
                    </div>
                  </div>

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
                      placeholder="Leave blank to keep current password"
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
                      placeholder="Repeat new password"
                      className={
                        inputClass
                      }
                    />
                  </FormField>
                </div>

                <div className="mt-7 flex justify-end gap-3 border-t border-slate-100 pt-5">
                  <button
                    type="button"
                    disabled={
                      saving
                    }
                    onClick={
                      handleCancel
                    }
                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
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

function ProfileField({
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

      <span className="text-right text-sm font-semibold text-slate-800">
        {value}
      </span>
    </div>
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
          Loading administrator
          profile...
        </p>
      </div>
    </div>
  )
}

const inputClass =
  'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

function createFormData(
  user: User,
): ProfileFormData {
  return {
    name: user.name,
    email: user.email,
    phone:
      user.phone ?? '',
    password: '',
    confirmPassword: '',
  }
}

function validateForm(
  formData: ProfileFormData,
): string | null {
  if (
    formData.name.trim().length <
    2
  ) {
    return 'Full name must contain at least 2 characters.'
  }

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      formData.email.trim(),
    )
  ) {
    return 'Please enter a valid email address.'
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
    'AD'
  )
}

function formatDate(
  value: string,
) {
  const date =
    new Date(value)

  return Number.isNaN(
    date.getTime(),
  )
    ? value
    : date.toLocaleDateString(
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
) {
  const date =
    new Date(value)

  return Number.isNaN(
    date.getTime(),
  )
    ? value
    : date.toLocaleString()
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

export default AdminProfilePage