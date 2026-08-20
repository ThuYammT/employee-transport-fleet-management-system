import {
  useEffect,
  useState,
} from 'react'

import {
  useNavigate,
} from 'react-router-dom'

import {
  getUserById,
} from '../../services/user.service'

import type {
  User,
} from '../../types/user'

import {
  clearCurrentUser,
  getCurrentUser,
  saveCurrentUser,
} from '../../utils/user-session'

function EmployeeProfilePage() {
  const navigate =
    useNavigate()

  const [
    employee,
    setEmployee,
  ] =
    useState<User | null>(
      null,
    )

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    error,
    setError,
  ] = useState('')

  useEffect(() => {
    void loadProfile()
  }, [])

  async function loadProfile() {
    const currentUser =
      getCurrentUser()

    if (
      !currentUser ||
      currentUser.role !==
        'EMPLOYEE'
    ) {
      navigate('/login', {
        replace: true,
      })

      return
    }

    try {
      setLoading(true)
      setError('')

      const employeeData =
        await getUserById(
          currentUser.id,
        )

      if (
        employeeData.role !==
          'EMPLOYEE' ||
        employeeData.status !==
          'ACTIVE'
      ) {
        clearCurrentUser()

        navigate('/login', {
          replace: true,
        })

        return
      }

      setEmployee(
        employeeData,
      )

      saveCurrentUser({
        ...currentUser,
        ...employeeData,
        phone:
          employeeData.phone ?? undefined,
      })
    } catch (error) {
      console.error(error)

      setError(
        'Failed to load employee profile.',
      )
    } finally {
      setLoading(false)
    }
  }

  function handleLogout() {
    const confirmed =
      window.confirm(
        'Do you want to sign out of your account?',
      )

    if (!confirmed) {
      return
    }

    clearCurrentUser()

    navigate('/login', {
      replace: true,
    })
  }

  return (
    <>
      <header className="flex min-h-[72px] items-center justify-between border-b border-slate-200 bg-white px-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-950">
            Employee Profile
          </h1>

          <p className="mt-0.5 text-sm text-slate-500">
            Review your Fleet Pulse
            employee account.
          </p>
        </div>

        <button
          type="button"
          onClick={
            handleLogout
          }
          className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
        >
          Sign out
        </button>
      </header>

      <section className="mx-auto max-w-[1300px] p-8">
        {loading && (
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

              <p className="mt-4 text-sm text-slate-500">
                Loading profile...
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          employee && (
            <div className="space-y-6">
              {/* HERO */}

              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 px-7 py-7 text-white">
                <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />

                <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-5">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-xl font-bold ring-1 ring-white/10">
                      {getInitials(
                        employee.name,
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-200">
                        Employee account
                      </p>

                      <h2 className="mt-1 text-2xl font-semibold">
                        {
                          employee.name
                        }
                      </h2>

                      <p className="mt-1 text-sm text-slate-300">
                        {
                          employee.email
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <span className="rounded-full bg-blue-400/15 px-3 py-1.5 text-xs font-semibold text-blue-200 ring-1 ring-blue-400/30">
                      EMPLOYEE
                    </span>

                    <span className="rounded-full bg-emerald-400/15 px-3 py-1.5 text-xs font-semibold text-emerald-200 ring-1 ring-emerald-400/30">
                      {
                        employee.status
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* PROFILE */}

              <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
                <section className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Account summary
                  </p>

                  <div className="mt-5 space-y-4">
                    <SummaryRow
                      label="Employee ID"
                      value={`EMP-${employee.id
                        .toString()
                        .padStart(
                          4,
                          '0',
                        )}`}
                    />

                    <SummaryRow
                      label="Role"
                      value={
                        employee.role
                      }
                    />

                    <SummaryRow
                      label="Status"
                      value={
                        employee.status
                      }
                    />

                    <SummaryRow
                      label="Joined"
                      value={formatDate(
                        employee.createdAt,
                      )}
                    />
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Employee information
                  </p>

                  <h3 className="mt-1 text-lg font-semibold text-slate-950">
                    Account Details
                  </h3>

                  <div className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2">
                    <ProfileField
                      label="Full Name"
                      value={
                        employee.name
                      }
                    />

                    <ProfileField
                      label="Email Address"
                      value={
                        employee.email
                      }
                    />

                    <ProfileField
                      label="Phone Number"
                      value={
                        employee.phone ||
                        'Not provided'
                      }
                    />

                    <ProfileField
                      label="Account Role"
                      value={
                        employee.role
                      }
                    />

                    <ProfileField
                      label="Account Status"
                      value={
                        employee.status
                      }
                    />

                    <ProfileField
                      label="Last Updated"
                      value={formatDateTime(
                        employee.updatedAt,
                      )}
                    />
                  </div>
                </section>
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
      <p className="text-sm text-slate-500">
        {label}
      </p>

      <p className="text-right text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  )
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
    'EM'
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

export default EmployeeProfilePage