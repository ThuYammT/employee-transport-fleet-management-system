import axios from 'axios'
import { useEffect, useMemo, useState } from 'react'

import {
  getTransportRequests,
  updateTransportRequest,
} from '../../services/transport-request.service'

import { getUsers } from '../../services/user.service'

import type {
  TransportRequest,
  TransportRequestStatus,
} from '../../types/transport-request'

import type { User } from '../../types/user'

type StatusFilter = 'ALL' | TransportRequestStatus

function TransportRequestsView() {
  const [requests, setRequests] = useState<TransportRequest[]>([])
  const [users, setUsers] = useState<User[]>([])

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>('ALL')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoadingId, setActionLoadingId] =
    useState<number | null>(null)

  const [selectedRequest, setSelectedRequest] =
    useState<TransportRequest | null>(null)

  useEffect(() => {
    void loadPageData()
  }, [])

  async function loadPageData() {
    try {
      setLoading(true)
      setError('')

      const [requestData, userData] = await Promise.all([
        getTransportRequests(),
        getUsers(),
      ])

      const sortedRequests = [...requestData].sort(
        (firstRequest, secondRequest) =>
          new Date(secondRequest.createdAt).getTime() -
          new Date(firstRequest.createdAt).getTime(),
      )

      setRequests(sortedRequests)
      setUsers(userData)
    } catch (error) {
      console.error(error)
      setError('Failed to load transport requests.')
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusUpdate(
    request: TransportRequest,
    status: TransportRequestStatus,
  ) {
    const actionLabel =
      status === 'APPROVED' ? 'approve' : 'reject'

    const confirmed = window.confirm(
      `Are you sure you want to ${actionLabel} request REQ-${request.id}?`,
    )

    if (!confirmed) {
      return
    }

    try {
      setActionLoadingId(request.id)
      setError('')

      const updatedRequest = await updateTransportRequest(
        request.id,
        {
          status,
        },
      )

      setRequests((currentRequests) =>
        currentRequests.map((currentRequest) =>
          currentRequest.id === updatedRequest.id
            ? updatedRequest
            : currentRequest,
        ),
      )

      setSelectedRequest((currentRequest) =>
        currentRequest?.id === updatedRequest.id
          ? updatedRequest
          : currentRequest,
      )
    } catch (error) {
      console.error(error)

      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message

        if (Array.isArray(message)) {
          setError(message.join(', '))
        } else if (typeof message === 'string') {
          setError(message)
        } else {
          setError('Failed to update request status.')
        }
      } else {
        setError('Failed to update request status.')
      }
    } finally {
      setActionLoadingId(null)
    }
  }

  function getEmployee(employeeId: number) {
    return users.find((user) => user.id === employeeId)
  }

  const filteredRequests = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return requests.filter((request) => {
      const employee = users.find(
        (user) => user.id === request.employeeId,
      )

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
          .includes(normalizedSearch) ||
        employee?.name
          .toLowerCase()
          .includes(normalizedSearch) ||
        employee?.email
          .toLowerCase()
          .includes(normalizedSearch)

      return matchesStatus && matchesSearch
    })
  }, [requests, users, searchTerm, statusFilter])

  const pendingCount = requests.filter(
    (request) => request.status === 'PENDING',
  ).length

  const approvedCount = requests.filter(
    (request) => request.status === 'APPROVED',
  ).length

  const rejectedCount = requests.filter(
    (request) => request.status === 'REJECTED',
  ).length

  const cancelledCount = requests.filter(
    (request) => request.status === 'CANCELLED',
  ).length

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
            Transport Requests
          </h1>

          <p className="text-sm text-slate-500">
            Review employee requests and manage approval status.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadPageData()}
          disabled={loading}
          className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Refresh
        </button>
      </header>

      <section className="p-8">
        <div className="mb-8 rounded-2xl bg-slate-950 p-8 text-white shadow">
          <h2 className="text-4xl font-bold">
            Request Approval Center
          </h2>

          <p className="mt-3 max-w-2xl leading-7 text-slate-400">
            Review employee travel requirements before assigning a
            suitable driver and vehicle.
          </p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            title="Total Requests"
            value={requests.length}
          />

          <StatCard
            title="Pending"
            value={pendingCount}
          />

          <StatCard
            title="Approved"
            value={approvedCount}
          />

          <StatCard
            title="Rejected"
            value={rejectedCount}
          />

          <StatCard
            title="Cancelled"
            value={cancelledCount}
          />
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-600">
            {error}
          </div>
        )}

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
              placeholder="Search employee, route or purpose..."
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 xl:w-96"
            />
          </div>

          {loading && (
            <div className="p-8 text-slate-500">
              Loading transport requests...
            </div>
          )}

          {!loading && filteredRequests.length === 0 && (
            <div className="p-12 text-center">
              <p className="font-semibold text-slate-700">
                No transport requests found.
              </p>

              <p className="mt-1 text-sm text-slate-500">
                New employee requests will appear here.
              </p>
            </div>
          )}

          {!loading && filteredRequests.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1250px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Request ID</th>
                    <th className="py-4 pr-6">Employee</th>
                    <th className="py-4 pr-6">Route</th>
                    <th className="py-4 pr-6">Schedule</th>
                    <th className="py-4 pr-6">Purpose</th>
                    <th className="py-4 pr-6">Status</th>
                    <th className="py-4 pr-6">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRequests.map((request) => {
                    const employee = getEmployee(
                      request.employeeId,
                    )

                    const isProcessing =
                      actionLoadingId === request.id

                    return (
                      <tr
                        key={request.id}
                        className="border-b border-slate-100 transition hover:bg-slate-50"
                      >
                        <td className="px-6 py-4 font-semibold text-slate-900">
                          REQ-{request.id}
                        </td>

                        <td className="py-4 pr-6">
                          <p className="font-semibold text-slate-800">
                            {employee?.name ??
                              `Employee ${request.employeeId}`}
                          </p>

                          <p className="text-xs text-slate-500">
                            {employee?.email ?? 'Email unavailable'}
                          </p>
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
                          <p className="font-medium text-slate-800">
                            {formatDate(request.requestDate)}
                          </p>

                          <p className="text-xs text-slate-500">
                            {formatTime(request.requestTime)}
                          </p>
                        </td>

                        <td className="max-w-64 py-4 pr-6">
                          <p
                            className="truncate"
                            title={request.purpose}
                          >
                            {request.purpose}
                          </p>
                        </td>

                        <td className="py-4 pr-6">
                          <StatusBadge
                            status={request.status}
                          />
                        </td>

                        <td className="py-4 pr-6">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedRequest(request)
                              }
                              className="font-semibold text-blue-600 hover:text-blue-700"
                            >
                              View
                            </button>

                            {request.status === 'PENDING' && (
                              <>
                                <button
                                  type="button"
                                  disabled={isProcessing}
                                  onClick={() =>
                                    void handleStatusUpdate(
                                      request,
                                      'APPROVED',
                                    )
                                  }
                                  className="font-semibold text-green-600 hover:text-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {isProcessing
                                    ? 'Updating...'
                                    : 'Approve'}
                                </button>

                                <button
                                  type="button"
                                  disabled={isProcessing}
                                  onClick={() =>
                                    void handleStatusUpdate(
                                      request,
                                      'REJECTED',
                                    )
                                  }
                                  className="font-semibold text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {request.status === 'APPROVED' && (
                              <span className="text-xs font-semibold text-slate-400">
                                Assignment pending
                              </span>
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

      {selectedRequest && (
        <RequestDetailsModal
          request={selectedRequest}
          employee={getEmployee(
            selectedRequest.employeeId,
          )}
          actionLoading={
            actionLoadingId === selectedRequest.id
          }
          onClose={() => setSelectedRequest(null)}
          onApprove={() =>
            void handleStatusUpdate(
              selectedRequest,
              'APPROVED',
            )
          }
          onReject={() =>
            void handleStatusUpdate(
              selectedRequest,
              'REJECTED',
            )
          }
        />
      )}
    </>
  )
}

function RequestDetailsModal({
  request,
  employee,
  actionLoading,
  onClose,
  onApprove,
  onReject,
}: {
  request: TransportRequest
  employee?: User
  actionLoading: boolean
  onClose: () => void
  onApprove: () => void
  onReject: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-200 p-6">
          <div>
            <p className="text-sm text-slate-500">
              Transport Request
            </p>

            <h2 className="text-2xl font-bold text-slate-900">
              REQ-{request.id}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-xl text-slate-500 hover:bg-slate-100"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6 flex items-center justify-between rounded-xl bg-slate-50 p-4">
            <div>
              <p className="text-sm text-slate-500">
                Current Status
              </p>

              <div className="mt-2">
                <StatusBadge status={request.status} />
              </div>
            </div>

            <p className="text-sm text-slate-500">
              Submitted {formatDateTime(request.createdAt)}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <DetailItem
              label="Employee"
              value={
                employee?.name ??
                `Employee ${request.employeeId}`
              }
            />

            <DetailItem
              label="Employee Email"
              value={employee?.email ?? 'Unavailable'}
            />

            <DetailItem
              label="Pickup Location"
              value={request.pickupLocation}
            />

            <DetailItem
              label="Destination"
              value={request.destination}
            />

            <DetailItem
              label="Request Date"
              value={formatDate(request.requestDate)}
            />

            <DetailItem
              label="Request Time"
              value={formatTime(request.requestTime)}
            />
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
            <p className="mb-2 text-sm font-semibold text-slate-500">
              Purpose
            </p>

            <p className="leading-7 text-slate-800">
              {request.purpose}
            </p>
          </div>

          {request.status === 'APPROVED' && (
            <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
              <p className="font-semibold text-blue-900">
                Driver and vehicle assignment pending
              </p>

              <p className="mt-1 text-sm text-blue-700">
                We will add assignment controls after completing
                Drivers Management.
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 p-6 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>

          {request.status === 'PENDING' && (
            <>
              <button
                type="button"
                disabled={actionLoading}
                onClick={onReject}
                className="rounded-xl border border-red-300 px-5 py-3 font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Reject
              </button>

              <button
                type="button"
                disabled={actionLoading}
                onClick={onApprove}
                className="rounded-xl bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionLoading
                  ? 'Updating...'
                  : 'Approve Request'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
}: {
  title: string
  value: number
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>

      <h3 className="mt-3 text-4xl font-bold text-slate-900">
        {value}
      </h3>
    </div>
  )
}

function DetailItem({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div>
      <p className="mb-1 text-sm text-slate-500">{label}</p>

      <p className="font-semibold text-slate-900">{value}</p>
    </div>
  )
}

function StatusBadge({
  status,
}: {
  status: TransportRequestStatus
}) {
  const styles: Record<TransportRequestStatus, string> = {
    PENDING: 'bg-amber-100 text-amber-700',
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
    CANCELLED: 'bg-slate-200 text-slate-700',
  }

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}
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

function formatDateTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString()
}

export default TransportRequestsView