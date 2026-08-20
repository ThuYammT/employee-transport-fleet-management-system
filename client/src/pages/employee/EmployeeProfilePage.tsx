import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

import { getUserById, updateUser } from '../../services/user.service'
import type { User } from '../../types/user'
import {
  clearCurrentUser,
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

function EmployeeProfilePage() {
  const navigate = useNavigate()

  const [employee, setEmployee] = useState<User | null>(null)
  const [formData, setFormData] = useState<ProfileFormData>(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    async function fetchEmployeeProfile() {
      const currentUser = getCurrentUser()

      if (!currentUser || currentUser.role !== 'EMPLOYEE') {
        navigate('/login', { replace: true })
        return
      }

      try {
        setLoading(true)
        setError('')

        const employeeData = await getUserById(currentUser.id)

        if (employeeData.role !== 'EMPLOYEE' || employeeData.status !== 'ACTIVE') {
          clearCurrentUser()
          navigate('/login', { replace: true })
          return
        }

        setEmployee(employeeData)
        setFormData(createFormData(employeeData))

        saveCurrentUser({
          ...currentUser,
          ...employeeData,
        })
      } catch (error) {
        console.error(error)
        setError('Failed to load employee profile.')
      } finally {
        setLoading(false)
      }
    }

    void fetchEmployeeProfile()
  }, [navigate])

  function handleLogout() {
    const confirmed = window.confirm(
      'Do you want to sign out of your account?',
    )

    if (!confirmed) {
      return
    }

    clearCurrentUser()
    navigate('/login', { replace: true })
  }

  function handleChange(field: keyof ProfileFormData, value: string) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }))
    setError('')
    setSuccess('')
  }

  function handleEdit() {
    if (!employee) return
    setFormData(createFormData(employee))
    setEditing(true)
    setError('')
    setSuccess('')
  }

  function handleCancel() {
    if (employee) {
      setFormData(createFormData(employee))
    }
    setEditing(false)
    setError('')
    setSuccess('')
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!employee) return

    const validationError = validateForm(formData)
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const updatedEmployee = await updateUser(employee.id, {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        ...(formData.password.trim() ? { password: formData.password } : {}),
      })

      setEmployee(updatedEmployee)
      setFormData(createFormData(updatedEmployee))

      const currentUser = getCurrentUser()
      if (currentUser) {
        saveCurrentUser({
          ...currentUser,
          name: updatedEmployee.name,
          email: updatedEmployee.email,
          status: updatedEmployee.status,
        })
      }

      setEditing(false)
      setSuccess('Your profile was updated successfully.')
    } catch (error) {
      console.error(error)
      setError(getApiErrorMessage(error, 'Failed to update your profile.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <header className="flex min-h-20 items-center justify-between border-b border-slate-200 bg-white px-8 py-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Employee Profile
          </h1>

          <p className="text-sm text-slate-500">
            View and update your account information.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!editing && employee && (
            <button
              type="button"
              onClick={handleEdit}
              className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Edit Profile
            </button>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            Sign out
          </button>
        </div>
      </header>

      <section className="p-8">
        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-slate-500">
              Loading employee profile...
            </p>
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-600">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">
            {success}
          </div>
        )}

        {!loading && !error && employee && !editing && (
          <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-8 flex flex-col gap-5 border-b border-slate-200 pb-8 sm:flex-row sm:items-center">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-blue-100 text-3xl font-bold text-blue-700">
                {getInitials(employee.name)}
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {employee.name}
                </h2>

                <p className="mt-1 text-slate-500">
                  {employee.email}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                    {employee.role}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      employee.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {employee.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <ProfileField
                label="Full Name"
                value={employee.name}
              />

              <ProfileField
                label="Employee ID"
                value={`EMP-${employee.id
                  .toString()
                  .padStart(4, '0')}`}
              />

              <ProfileField
                label="Email Address"
                value={employee.email}
              />

              <ProfileField
                label="Phone Number"
                value={
                  employee.phone ||
                  'Not provided'
                }
              />

              <ProfileField
                label="Role"
                value={employee.role}
              />

              <ProfileField
                label="Account Status"
                value={employee.status}
              />

              <ProfileField
                label="Created At"
                value={formatDateTime(
                  employee.createdAt,
                )}
              />

              <ProfileField
                label="Last Updated"
                value={formatDateTime(
                  employee.updatedAt,
                )}
              />
            </div>

            <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-5">
              <p className="font-semibold text-blue-900">
                Signed-in account
              </p>

              <p className="mt-1 text-sm leading-6 text-blue-700">
                Your account was loaded from the
                deployed backend. A local session is
                currently used until JWT authentication
                is added.
              </p>
            </div>
          </div>
        )}

        {!loading && !error && employee && editing && (
          <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <form onSubmit={handleSubmit}>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900">
                  Edit Profile
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Update your personal information.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Full Name
                    <span className="ml-1 text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(event) => handleChange('name', event.target.value)}
                    placeholder="Enter your full name"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Email Address
                    <span className="ml-1 text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(event) => handleChange('email', event.target.value)}
                    placeholder="Enter your email"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(event) => handleChange('phone', event.target.value)}
                    placeholder="Enter your phone number"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(event) => handleChange('password', event.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(event) => handleChange('confirmPassword', event.target.value)}
                    placeholder="Repeat new password"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="mt-8 flex items-center justify-end gap-3 border-t border-slate-200 pt-6">
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
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? 'Saving Changes...' : 'Save Changes'}
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

function createFormData(user: User): ProfileFormData {
  return {
    name: user.name,
    email: user.email,
    phone: user.phone ?? '',
    password: '',
    confirmPassword: '',
  }
}

function validateForm(formData: ProfileFormData): string | null {
  if (!formData.name.trim()) {
    return 'Full name is required.'
  }

  if (formData.name.trim().length < 2) {
    return 'Full name must contain at least 2 characters.'
  }

  if (!formData.email.trim()) {
    return 'Email address is required.'
  }

  if (!isValidEmail(formData.email.trim())) {
    return 'Please enter a valid email address.'
  }

  if (formData.password && formData.password.length < 8) {
    return 'New password must contain at least 8 characters.'
  }

  if (formData.password !== formData.confirmPassword) {
    return 'The password confirmation does not match.'
  }

  return null
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function getApiErrorMessage(error: unknown, fallbackMessage: string): string {
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

function getInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) =>
      part.charAt(0).toUpperCase(),
    )
    .join('')

  return initials || 'EM'
}

function formatDateTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString()
}

export default EmployeeProfilePage