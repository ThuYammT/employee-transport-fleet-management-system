import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { getTransportRequests } from '../../services/transport-request.service'
import type { TransportRequest } from '../../types/transport-request'
import { getEmployeeId } from '../../utils/employee-session'

function EmployeeDashboard() {
  const navigate = useNavigate()

  const [requests, setRequests] = useState<TransportRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchRequests() {
      const employeeId = getEmployeeId()

      if (!employeeId) {
        navigate('/employee/setup', { replace: true })
        return
      }

      try {
        setLoading(true)
        setError('')

        const data = await getTransportRequests()

        const employeeRequests = data
          .filter((request) => request.employeeId === employeeId)
          .sort(
            (firstRequest, secondRequest) =>
              new Date(secondRequest.createdAt).getTime() -
              new Date(firstRequest.createdAt).getTime(),
          )

        setRequests(employeeRequests)
      } catch (error) {
        console.error(error)
        setError('Failed to load your transport requests.')
      } finally {
        setLoading(false)
      }
    }

    void fetchRequests()
  }, [navigate])

  const pendingRequests = requests.filter(
    (request) => request.status === 'PENDING',
  ).length

  const approvedRequests = requests.filter(
    (request) => request.status === 'APPROVED',
  ).length

  const rejectedRequests = requests.filter(
    (request) => request.status === 'REJECTED',
  ).length

  const recentRequests = requests.slice(0, 5)

  return (
    <>
      <header className="flex min-h-20 items-center justify-between border-b border-slate-200 bg-white px-8 py-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Employee Dashboard
          </h1>

          <p className="text-sm text-slate-500">
            Submit and monitor your transport requests.
          </p>
        </div>

        <Link
          to="/employee/new-request"
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          New Transport Request
        </Link>
      </header>

      <section className="p-8">
        <div className="mb-8 rounded-2xl bg-slate-950 p-8 text-white shadow">
          <h2 className="mb-3 text-4xl font-bold">
            Employee Transport Portal
          </h2>

          <p className="max-w-2xl leading-7 text-slate-400">
            Request company transportation, monitor approval progress
            and review your previous request activity.
          </p>
        </div>

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-slate-500">
              Loading dashboard information...
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-600">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Total Requests"
                value={requests.length}
                label="All requests"
              />

              <StatCard
                title="Pending"
                value={pendingRequests}
                label="Awaiting review"
              />

              <StatCard
                title="Approved"
                value={approvedRequests}
                label="Approved requests"
              />

              <StatCard
                title="Rejected"
                value={rejectedRequests}
                label="Rejected requests"
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Recent Requests
                  </h2>

                  <p className="text-sm text-slate-500">
                    Your latest transport request activity.
                  </p>
                </div>

                <Link
                  to="/employee/my-requests"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  View all
                </Link>
              </div>

              {recentRequests.length === 0 ? (
                <div className="rounded-xl bg-slate-50 p-10 text-center">
                  <p className="font-semibold text-slate-700">
                    You have not submitted any requests yet.
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Create your first transport request to get started.
                  </p>

                  <Link
                    to="/employee/new-request"
                    className="mt-4 inline-block rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Create Request
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[850px] text-left text-sm">
                    <thead className="border-b border-slate-200 text-slate-500">
                      <tr>
                        <th className="py-3 pr-4">Request ID</th>
                        <th className="py-3 pr-4">Route</th>
                        <th className="py-3 pr-4">Date</th>
                        <th className="py-3 pr-4">Time</th>
                        <th className="py-3 pr-4">Status</th>
                        <th className="py-3">Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {recentRequests.map((request) => (
                        <tr
                          key={request.id}
                          className="border-b border-slate-100"
                        >
                          <td className="py-4 pr-4 font-semibold text-slate-900">
                            REQ-{request.id}
                          </td>

                          <td className="py-4 pr-4">
                            <p className="font-medium text-slate-800">
                              {request.pickupLocation}
                            </p>

                            <p className="text-xs text-slate-500">
                              to {request.destination}
                            </p>
                          </td>

                          <td className="py-4 pr-4">
                            {formatDate(request.requestDate)}
                          </td>

                          <td className="py-4 pr-4">
                            {formatTime(request.requestTime)}
                          </td>

                          <td className="py-4 pr-4">
                            <StatusBadge status={request.status} />
                          </td>

                          <td className="py-4">
                            <Link
                              to={`/employee/requests/${request.id}`}
                              className="font-semibold text-blue-600 hover:text-blue-700"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </>
  )
}

function StatCard({
  title,
  value,
  label,
}: {
  title: string
  value: number
  label: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="mb-3 text-sm text-slate-500">{title}</p>

      <h3 className="text-4xl font-bold text-slate-900">{value}</h3>

      <p className="mt-3 text-xs text-slate-400">{label}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700',
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
    CANCELLED: 'bg-slate-200 text-slate-700',
  }

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        styles[status] ?? 'bg-slate-100 text-slate-700'
      }`}
    >
      {status}
    </span>
  )
}

function formatDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString()
}

function formatTime(value: string) {
  if (!value) {
    return '-'
  }

  const [hours, minutes] = value.split(':').map(Number)

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    return value
  }

  const date = new Date()
  date.setHours(hours, minutes, 0, 0)

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default EmployeeDashboard