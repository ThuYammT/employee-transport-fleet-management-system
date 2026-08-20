import {
  useEffect,
  useState,
} from 'react'

import axios from 'axios'

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

const emptyForm: ProfileFormData = {
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
}

function AdminProfilePage() {
  const [admin, setAdmin] =
    useState<User | null>(null)

  const [formData, setFormData] =
    useState<ProfileFormData>(emptyForm)

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
    void loadAdminProfile()
  }, [])

  async function loadAdminProfile() {
    const currentUser = getCurrentUser()

    if (
      !currentUser ||
      currentUser.role !== 'ADMIN'
    ) {
      setError(
        'Your login session was not found. Please sign in again.',
      )
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError('')

      const adminData = await getUserById(
        currentUser.id,
      )

      setAdmin(adminData)
      setFormData(
        createFormData(adminData),
      )
    } catch (error) {
      console.error(error)

      setError(
        'Failed to load admin profile.',
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
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (!admin) {
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

      const updatedAdmin =
        await updateUser(
          admin.id,
          {
            name: formData.name.trim(),
            email: formData.email
              .trim()
              .toLowerCase(),
            phone:
              formData.phone.trim(),

            ...(formData.password.trim()
              ? {
                  password:
                    formData.password,
                }
              : {}),
          },
        )

      setAdmin(updatedAdmin)

      setFormData(
        createFormData(updatedAdmin),
      )

      const currentUser =
        getCurrentUser()

      if (currentUser) {
        saveCurrentUser({
          ...currentUser,
          name: updatedAdmin.name,
          email:
            updatedAdmin.email,
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-950" />

          <p className="mt-4 text-sm text-slate-500">
            Loading admin profile...
          </p>
        </div>
      </div>
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
            View and update your account
            information.
          </p>
        </div>

        {!editing && admin && (
          <button
            type="button"
            onClick={handleEdit}
            className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Edit Profile
          </button>
        )}
      </header>

      <section className="p-8">
        {error && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">
              {error}
            </p>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-4 py-3">
            <p className="text-sm text-green-700">
              {success}
            </p>
          </div>
        )}

        {!loading && !error && admin && !editing && (
          <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-8 flex flex-col gap-5 border-b border-slate-100 pb-8 sm:flex-row sm:items-center">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-950 to-blue-950 text-3xl font-bold text-white">
                {getInitials(admin.name)}
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-950">
                  {admin.name}
                </h2>

                <p className="mt-1 text-slate-500">
                  {admin.email}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                    {admin.role}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      admin.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {admin.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <ProfileField
                label="Full Name"
                value={admin.name}
              />

              <ProfileField
                label="Admin ID"
                value={`ADM-${admin.id
                  .toString()
                  .padStart(4, '0')}`}
              />

              <ProfileField
                label="Email Address"
                value={admin.email}
              />

              <ProfileField
                label="Phone Number"
                value={
                  admin.phone ||
                  'Not provided'
                }
              />

              <ProfileField
                label="Role"
                value={admin.role}
              />

              <ProfileField
                label="Account Status"
                value={admin.status}
              />

              <ProfileField
                label="Created At"
                value={formatDateTime(
                  admin.createdAt,
                )}
              />

              <ProfileField
                label="Last Updated"
                value={formatDateTime(
                  admin.updatedAt,
                )}
              />
            </div>

            <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-5">
              <p className="font-semibold text-slate-900">
                Administrator account
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                You have administrative privileges.
                Keep your account information up to
                date to maintain secure access to
                the fleet management system.
              </p>
            </div>
          </div>
        )}

        {!loading && !error && admin && editing && (
          <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <form onSubmit={handleSubmit}>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-950">
                  Edit Profile
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Update your personal
                  information.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Full Name
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    type="text"
                    value={formData.name}
                    onChange={(event) =>
                      handleChange(
                        'name',
                        event.target.value,
                      )
                    }
                    placeholder="Enter your full name"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Email Address
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    type="email"
                    value={formData.email}
                    onChange={(event) =>
                      handleChange(
                        'email',
                        event.target.value,
                      )
                    }
                    placeholder="Enter your email"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Phone Number
                  </label>

                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(event) =>
                      handleChange(
                        'phone',
                        event.target.value,
                      )
                    }
                    placeholder="Enter your phone number"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    New Password
                  </label>

                  <input
                    type="password"
                    value={formData.password}
                    onChange={(event) =>
                      handleChange(
                        'password',
                        event.target.value,
                      )
                    }
                    placeholder="At least 8 characters"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Confirm Password
                  </label>

                  <input
                    type="password"
                    value={
                      formData.confirmPassword
                    }
                    onChange={(event) =>
                      handleChange(
                        'confirmPassword',
                        event.target.value,
                      )
                    }
                    placeholder="Repeat new password"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
                  />
                </div>
              </div>

              <div className="mt-8 flex items-center justify-end gap-3 border-t border-slate-100 pt-6">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? 'Saving Changes...'
                    : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
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
    <div>
      <p className="mb-2 text-sm font-medium text-slate-500">
        {label}
      </p>

      <div className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-800">
        {value}
      </div>
    </div>
  )
}

function createFormData(
  user: User,
): ProfileFormData {
  return {
    name: user.name,
    email: user.email,
    phone: user.phone ?? '',
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

function getInitials(
  name: string,
) {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) =>
      part.charAt(0).toUpperCase(),
    )
    .join('')

  return initials || 'AD'
}

function formatDateTime(
  value: string,
) {
  const date = new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value
  }

  return date.toLocaleString()
}

export default AdminProfilePage