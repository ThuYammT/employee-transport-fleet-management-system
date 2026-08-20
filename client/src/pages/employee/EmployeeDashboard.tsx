import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  Link,
  useNavigate,
} from 'react-router-dom'

import {
  getTransportRequests,
} from '../../services/transport-request.service'

import type {
  TransportRequest,
} from '../../types/transport-request'

import {
  getCurrentUser,
} from '../../utils/user-session'

function EmployeeDashboard() {
  const navigate = useNavigate()

  const [
    requests,
    setRequests,
  ] =
    useState<TransportRequest[]>([])

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    error,
    setError,
  ] = useState('')

  useEffect(() => {
    void loadDashboard()
  }, [])

  async function loadDashboard() {
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

      const data =
        await getTransportRequests()

      const employeeRequests =
        data
          .filter(
            (request) =>
              request.employeeId ===
              currentUser.id,
          )
          .sort(
            (
              first,
              second,
            ) =>
              new Date(
                second.createdAt,
              ).getTime() -
              new Date(
                first.createdAt,
              ).getTime(),
          )

      setRequests(
        employeeRequests,
      )
    } catch (error) {
      console.error(error)

      setError(
        'Failed to load your transport requests.',
      )
    } finally {
      setLoading(false)
    }
  }

  const pendingRequests =
    useMemo(
      () =>
        requests.filter(
          (request) =>
            request.status ===
            'PENDING',
        ).length,
      [requests],
    )

  const approvedRequests =
    useMemo(
      () =>
        requests.filter(
          (request) =>
            request.status ===
            'APPROVED',
        ).length,
      [requests],
    )

  const rejectedRequests =
    useMemo(
      () =>
        requests.filter(
          (request) =>
            request.status ===
            'REJECTED',
        ).length,
      [requests],
    )

  const recentRequests =
    requests.slice(0, 5)

  const currentUser =
    getCurrentUser()

  return (
    <>
      {/* HEADER */}

      <header className="flex min-h-[72px] items-center justify-between border-b border-slate-200 bg-white px-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-950">
            Employee Dashboard
          </h1>

          <p className="mt-0.5 text-sm text-slate-500">
            Create and monitor your
            workplace transport
            requests.
          </p>
        </div>

        <Link
          to="/employee/new-request"
          className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          + New Request
        </Link>
      </header>

      <section className="mx-auto max-w-[1600px] p-8">
        {/* HERO */}

        <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 px-7 py-7 text-white shadow-sm">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-200">
                Employee transport
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Welcome back,{' '}
                {currentUser?.name ??
                  'Employee'}
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Request company
                transportation, monitor
                approval progress and
                review your transport
                activity from Fleet
                Pulse.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <HeroItem
                label="Total Requests"
                value={`${requests.length}`}
              />

              <HeroItem
                label="Awaiting Review"
                value={`${pendingRequests}`}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* STATS */}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Requests"
            value={
              requests.length
            }
            tone="slate"
          />

          <StatCard
            label="Pending"
            value={
              pendingRequests
            }
            tone="amber"
          />

          <StatCard
            label="Approved"
            value={
              approvedRequests
            }
            tone="green"
          />

          <StatCard
            label="Rejected"
            value={
              rejectedRequests
            }
            tone="red"
          />
        </div>

        {/* QUICK START */}

        <div className="mb-6 grid gap-4 lg:grid-cols-3">
          <QuickCard
            number="01"
            title="Create Request"
            description="Choose your pickup and destination using location search or the map."
            to="/employee/new-request"
          />

          <QuickCard
            number="02"
            title="Track Approval"
            description="Follow pending, approved, rejected and cancelled requests."
            to="/employee/my-requests"
          />

          <QuickCard
            number="03"
            title="Review Route"
            description="Open request details to see route, distance and estimated travel time."
            to="/employee/my-requests"
          />
        </div>

        {/* RECENT REQUESTS */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-6 py-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Request activity
              </p>

              <h3 className="mt-1 text-lg font-semibold text-slate-950">
                Recent Requests
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Your latest five
                transport requests.
              </p>
            </div>

            <Link
              to="/employee/my-requests"
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              View All
            </Link>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

              <p className="mt-4 text-sm text-slate-500">
                Loading dashboard...
              </p>
            </div>
          ) : recentRequests.length ===
            0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-500">
                TR
              </div>

              <p className="mt-4 font-semibold text-slate-700">
                No requests yet
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Create your first
                transport request to
                get started.
              </p>

              <Link
                to="/employee/new-request"
                className="mt-5 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
              >
                Create Request
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-4">
                      Request
                    </th>

                    <th className="py-4 pr-6">
                      Route
                    </th>

                    <th className="py-4 pr-6">
                      Schedule
                    </th>

                    <th className="py-4 pr-6">
                      Status
                    </th>

                    <th className="py-4 pr-6 text-right">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {recentRequests.map(
                    (request) => (
                      <tr
                        key={
                          request.id
                        }
                        className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/80"
                      >
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-900">
                            REQ-
                            {request.id}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            Transport request
                          </p>
                        </td>

                        <td className="max-w-[300px] py-4 pr-6">
                          <p
                            className="truncate font-semibold text-slate-800"
                            title={
                              request.pickupLocation
                            }
                          >
                            {
                              request.pickupLocation
                            }
                          </p>

                          <p
                            className="mt-1 truncate text-xs text-slate-500"
                            title={
                              request.destination
                            }
                          >
                            to{' '}
                            {
                              request.destination
                            }
                          </p>
                        </td>

                        <td className="whitespace-nowrap py-4 pr-6">
                          <p className="font-medium text-slate-700">
                            {formatDate(
                              request.requestDate,
                            )}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {formatTime(
                              request.requestTime,
                            )}
                          </p>
                        </td>

                        <td className="py-4 pr-6">
                          <StatusBadge
                            status={
                              request.status
                            }
                          />
                        </td>

                        <td className="py-4 pr-6 text-right">
                          <Link
                            to={`/employee/requests/${request.id}`}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                          >
                            View Details
                          </Link>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </>
  )
}

function HeroItem({
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

      <p className="mt-1 text-lg font-semibold text-white">
        {value}
      </p>
    </div>
  )
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string
  value: number

  tone:
    | 'slate'
    | 'amber'
    | 'green'
    | 'red'
}) {
  const styles = {
    slate:
      'bg-slate-100 text-slate-700',

    amber:
      'bg-amber-50 text-amber-700',

    green:
      'bg-emerald-50 text-emerald-700',

    red:
      'bg-red-50 text-red-700',
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-2xl font-semibold text-slate-950">
            {value}
          </p>
        </div>

        <div
          className={`flex h-9 min-w-9 items-center justify-center rounded-xl px-3 text-xs font-bold ${styles[tone]}`}
        >
          {value}
        </div>
      </div>
    </div>
  )
}

function QuickCard({
  number,
  title,
  description,
  to,
}: {
  number: string
  title: string
  description: string
  to: string
}) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:bg-blue-50/40"
    >
      <div className="flex items-start justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-xs font-bold text-white">
          {number}
        </div>

        <span className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-500">
          →
        </span>
      </div>

      <p className="mt-5 font-semibold text-slate-900">
        {title}
      </p>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </Link>
  )
}

function StatusBadge({
  status,
}: {
  status: string
}) {
  const styles:
    Record<
      string,
      string
    > = {
    PENDING:
      'bg-amber-50 text-amber-700 ring-1 ring-amber-200',

    APPROVED:
      'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',

    REJECTED:
      'bg-red-50 text-red-700 ring-1 ring-red-200',

    CANCELLED:
      'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  }

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        styles[status] ??
        'bg-slate-100 text-slate-600'
      }`}
    >
      {status.replaceAll(
        '_',
        ' ',
      )}
    </span>
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

function formatTime(
  value: string,
) {
  if (!value) {
    return '—'
  }

  const [
    hours,
    minutes,
  ] = value
    .split(':')
    .map(Number)

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    return value
  }

  const date = new Date()

  date.setHours(
    hours,
    minutes,
    0,
    0,
  )

  return date.toLocaleTimeString(
    [],
    {
      hour: '2-digit',
      minute: '2-digit',
    },
  )
}

export default EmployeeDashboard