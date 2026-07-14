import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { getUserById } from '../../services/user.service'
import type { User } from '../../types/user'
import {
  clearEmployeeId,
  getEmployeeId,
} from '../../utils/employee-session'

function EmployeeProfilePage() {
  const navigate = useNavigate()

  const [employee, setEmployee] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchEmployeeProfile() {
      const employeeId = getEmployeeId()

      if (!employeeId) {
        navigate('/employee/setup', { replace: true })
        return
      }

      try {
        setLoading(true)
        setError('')

        const employeeData = await getUserById(employeeId)

        if (employeeData.role !== 'EMPLOYEE') {
          clearEmployeeId()
          navigate('/employee/setup', { replace: true })
          return
        }

        setEmployee(employeeData)
      } catch (error) {
        console.error(error)
        setError('Failed to load employee profile.')
      } finally {
        setLoading(false)
      }
    }

    void fetchEmployeeProfile()
  }, [navigate])

  function handleResetEmployee() {
    const confirmed = window.confirm(
      'Do you want to remove this test employee from the current browser?',
    )

    if (!confirmed) {
      return
    }

    clearEmployeeId()
    navigate('/employee/setup', { replace: true })
  }

  return (
    <>
      <header className="flex min-h-20 items-center justify-between border-b border-slate-200 bg-white px-8 py-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Employee Profile
          </h1>

          <p className="text-sm text-slate-500">
            View your employee account information.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetEmployee}
          className="rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
        >
          Reset Test Employee
        </button>
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
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-600">
            {error}
          </div>
        )}

        {!loading && !error && employee && (
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
                value={employee.phone || 'Not provided'}
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
                value={formatDateTime(employee.createdAt)}
              />

              <ProfileField
                label="Last Updated"
                value={formatDateTime(employee.updatedAt)}
              />
            </div>

            <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-5">
              <p className="font-semibold text-blue-900">
                Development employee session
              </p>

              <p className="mt-1 text-sm leading-6 text-blue-700">
                This profile is loaded from your deployed backend using
                the employee ID stored in this browser. JWT
                authentication will replace this temporary session
                later.
              </p>
            </div>
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

function getInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
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