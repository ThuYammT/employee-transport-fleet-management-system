import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import {
  deleteTransportRequest,
  getTransportRequests,
  updateTransportRequest,
} from '../../services/transport-request.service'

import type {
  TransportRequest,
  TransportRequestStatus,
} from '../../types/transport-request'

import { getEmployeeId } from '../../utils/employee-session'

type StatusFilter = 'ALL' | TransportRequestStatus

function MyRequestsPage() {
  const navigate = useNavigate()

  const [requests, setRequests] = useState<TransportRequest[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>('ALL')

  const [loading, setLoading] = useState(true)
  const [actionLoadingId, setActionLoadingId] =
    useState<number | null>(null)

  const [error, setError] = useState('')

  useEffect(() => {
    async function loadRequests() {
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

    void loadRequests()
  }, [navigate])

  async function refreshRequests() {
    const employeeId = getEmployeeId()

    if (!employeeId) {
      navigate('/employee/setup', { replace: true })
      return
    }

    const data = await getTransportRequests()

    const employeeRequests = data
      .filter((request) => request.employeeId === employeeId)
      .sort(
        (firstRequest, secondRequest) =>
          new Date(secondRequest.createdAt).getTime() -
          new Date(firstRequest.createdAt).getTime(),
      )

    setRequests(employeeRequests)
  }

  async function handleCancel(request: TransportRequest) {
    if (request.status !== 'PENDING') {
      window.alert('Only pending requests can be cancelled.')
      return
    }

    const confirmed = window.confirm(
      `Cancel transport request REQ-${request.id}?`,
    )

    if (!confirmed) {
      return
    }

    try {
      setActionLoadingId(request.id)

      await updateTransportRequest(request.id, {
        status: 'CANCELLED',
      })

      await refreshRequests()
    } catch (error) {
      console.error(error)
      window.alert('Failed to cancel the request.')
    } finally {
      setActionLoadingId(null)
    }
  }

  async function handleDelete(request: TransportRequest) {
    if (request.status !== 'CANCELLED') {
      window.alert('Only cancelled requests can be deleted.')
      return
    }

    const confirmed = window.confirm(
      `Permanently delete request REQ-${request.id}?`,
    )

    if (!confirmed) {
      return
    }

    try {
      setActionLoadingId(request.id)

      await deleteTransportRequest(request.id)
      await refreshRequests()
    } catch (error) {
      console.error(error)
      window.alert('Failed to delete the request.')
    } finally {
      setActionLoadingId(null)
    }
  }

  const filteredRequests = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return requests.filter((request) => {
      const matchesStatus =
        statusFilter === 'ALL' ||
        request.status === statusFilter

      const matchesSearch =
        normalizedSearch.length === 0 ||
        request.id.toString().includes(normalizedSearch) ||
        request.pickupLocation
          .toLowerCase()
          .includes(normalizedSearch) ||
        request.destination
          .toLowerCase()
          .includes(normalizedSearch) ||
        request.purpose
          .toLowerCase()
          .includes(normalizedSearch)

      return matchesStatus && matchesSearch
    })
  }, [requests, searchTerm, statusFilter])

  const filters: StatusFilter[] = [
    'ALL',
    'PENDING',
    'APPROVED',
    'REJECTED',
    'CANCELLED',
  ]

  return (
    <>
      <header className="flex min-h-20 items-center justify-between border-b border-slate-200 bg-white px-8 py-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            My Requests
          </h1>

          <p className="text-sm text-slate-500">
            Review and manage your transport requests.
          </p>
        </div>

        <Link
          to="/employee/new-request"
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          New Request
        </Link>
      </header>

      <section className="p-8">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-2">
              {filters.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    statusFilter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <input
              type="search"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              placeholder="Search ID, route or purpose..."
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 xl:w-80"
            />
          </div>

          {loading && (
            <p className="p-6 text-slate-500">
              Loading transport requests...
            </p>
          )}

          {error && (
            <div className="m-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-600">
              {error}
            </div>
          )}

          {!loading &&
            !error &&
            filteredRequests.length === 0 && (
              <div className="p-12 text-center">
                <p className="font-semibold text-slate-700">
                  No matching requests found.
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Create a request or change your search filters.
                </p>

                <Link
                  to="/employee/new-request"
                  className="mt-5 inline-block rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Create Request
                </Link>
              </div>
            )}

          {!loading &&
            !error &&
            filteredRequests.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-6 py-4">Request ID</th>
                      <th className="py-4 pr-6">Route</th>
                      <th className="py-4 pr-6">Date</th>
                      <th className="py-4 pr-6">Time</th>
                      <th className="py-4 pr-6">Purpose</th>
                      <th className="py-4 pr-6">Status</th>
                      <th className="py-4 pr-6">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredRequests.map((request) => {
                      const isProcessing =
                        actionLoadingId === request.id

                      return (
                        <tr
                          key={request.id}
                          className="border-b border-slate-100"
                        >
                          <td className="px-6 py-4 font-semibold text-slate-900">
                            REQ-{request.id}
                          </td>

                          <td className="py-4 pr-6">
                            <p className="font-medium text-slate-800">
                              {request.pickupLocation}
                            </p>

                            <p className="text-xs text-slate-500">
                              to {request.destination}
                            </p>
                          </td>

                          <td className="py-4 pr-6">
                            {formatDate(request.requestDate)}
                          </td>

                          <td className="py-4 pr-6">
                            {formatTime(request.requestTime)}
                          </td>

                          <td className="max-w-56 py-4 pr-6">
                            <p
                              className="truncate"
                              title={request.purpose}
                            >
                              {request.purpose}
                            </p>
                          </td>

                          <td className="py-4 pr-6">
                            <StatusBadge status={request.status} />
                          </td>

                          <td className="py-4 pr-6">
                            <div className="flex items-center gap-3">
                              <Link
                                to={`/employee/requests/${request.id}`}
                                className="font-semibold text-blue-600 hover:text-blue-700"
                              >
                                View
                              </Link>

                              {request.status === 'PENDING' && (
                                <button
                                  type="button"
                                  disabled={isProcessing}
                                  onClick={() =>
                                    handleCancel(request)
                                  }
                                  className="font-semibold text-amber-600 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {isProcessing
                                    ? 'Cancelling...'
                                    : 'Cancel'}
                                </button>
                              )}

                              {request.status === 'CANCELLED' && (
                                <button
                                  type="button"
                                  disabled={isProcessing}
                                  onClick={() =>
                                    handleDelete(request)
                                  }
                                  className="font-semibold text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {isProcessing
                                    ? 'Deleting...'
                                    : 'Delete'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      </section>
    </>
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

export default MyRequestsPage