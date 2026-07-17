import axios from 'axios'
import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  getTransportRequests,
  updateTransportRequest,
} from '../../services/transport-request.service'

import {
  getDrivers,
} from '../../services/driver.service'

import {
  getVehicles,
} from '../../services/vehicle.service'

import {
  createTrip,
} from '../../services/trip.service'

import type {
  Driver,
} from '../../types/driver'

import type {
  TransportRequest,
  TransportRequestStatus,
} from '../../types/transport-request'

import type {
  Vehicle,
} from '../../types/vehicle'

type StatusFilter =
  | 'ALL'
  | TransportRequestStatus

type AssignmentForm = {
  driverId: string
  vehicleId: string
}

const emptyAssignmentForm: AssignmentForm = {
  driverId: '',
  vehicleId: '',
}

function TransportRequestsView() {
  const [requests, setRequests] = useState<
    TransportRequest[]
  >([])

  const [drivers, setDrivers] = useState<
    Driver[]
  >([])

  const [vehicles, setVehicles] = useState<
    Vehicle[]
  >([])

  const [searchTerm, setSearchTerm] =
    useState('')

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>('ALL')

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  const [
    actionLoadingId,
    setActionLoadingId,
  ] = useState<number | null>(null)

  const [
    selectedRequest,
    setSelectedRequest,
  ] = useState<TransportRequest | null>(
    null,
  )

  const [
    assignmentRequest,
    setAssignmentRequest,
  ] = useState<TransportRequest | null>(
    null,
  )

  const [
    assignmentForm,
    setAssignmentForm,
  ] = useState<AssignmentForm>(
    emptyAssignmentForm,
  )

  const [assigning, setAssigning] =
    useState(false)

  const [
    assignmentError,
    setAssignmentError,
  ] = useState('')

  useEffect(() => {
    void loadPageData()
  }, [])

  async function loadPageData() {
    try {
      setLoading(true)
      setError('')

      const [
        requestData,
        driverData,
        vehicleData,
      ] = await Promise.all([
        getTransportRequests(),
        getDrivers(),
        getVehicles(),
      ])

      setRequests(requestData)
      setDrivers(driverData)
      setVehicles(vehicleData)
    } catch (error) {
      console.error(error)

      setError(
        getApiErrorMessage(
          error,
          'Failed to load transport requests.',
        ),
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusUpdate(
    request: TransportRequest,
    status: TransportRequestStatus,
  ) {
    const actionLabel =
      status === 'APPROVED'
        ? 'approve'
        : 'reject'

    const confirmed = window.confirm(
      `Are you sure you want to ${actionLabel} request REQ-${request.id}?`,
    )

    if (!confirmed) {
      return
    }

    try {
      setActionLoadingId(request.id)
      setError('')

      await updateTransportRequest(
        request.id,
        {
          status,
        },
      )

      await loadPageData()
    } catch (error) {
      console.error(error)

      setError(
        getApiErrorMessage(
          error,
          'Failed to update request status.',
        ),
      )
    } finally {
      setActionLoadingId(null)
    }
  }

  function openAssignmentModal(
    request: TransportRequest,
  ) {
    setAssignmentRequest(request)
    setAssignmentForm(
      emptyAssignmentForm,
    )
    setAssignmentError('')
  }

  function closeAssignmentModal() {
    if (assigning) {
      return
    }

    setAssignmentRequest(null)
    setAssignmentForm(
      emptyAssignmentForm,
    )
    setAssignmentError('')
  }

  async function handleAssignmentSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (!assignmentRequest) {
      return
    }

    const driverId = Number(
      assignmentForm.driverId,
    )

    const vehicleId = Number(
      assignmentForm.vehicleId,
    )

    if (!driverId || !vehicleId) {
      setAssignmentError(
        'Please select both a driver and a vehicle.',
      )

      return
    }

    try {
      setAssigning(true)
      setAssignmentError('')

      await createTrip({
        requestId: assignmentRequest.id,
        driverId,
        vehicleId,
      })

      closeAssignmentModal()
      setSelectedRequest(null)

      await loadPageData()
    } catch (error) {
      console.error(error)

      setAssignmentError(
        getApiErrorMessage(
          error,
          'Failed to assign the trip.',
        ),
      )
    } finally {
      setAssigning(false)
    }
  }

  const availableDrivers = useMemo(
    () =>
      drivers.filter(
        (driver) =>
          driver.availabilityStatus ===
            'AVAILABLE' &&
          driver.user?.status === 'ACTIVE',
      ),
    [drivers],
  )

  const availableVehicles = useMemo(
    () =>
      vehicles.filter(
        (vehicle) =>
          vehicle.status === 'AVAILABLE',
      ),
    [vehicles],
  )

  const filteredRequests = useMemo(() => {
    const keyword = searchTerm
      .trim()
      .toLowerCase()

    return requests.filter((request) => {
      const matchesStatus =
        statusFilter === 'ALL' ||
        request.status === statusFilter

      const matchesSearch =
        !keyword ||
        request.id
          .toString()
          .includes(keyword) ||
        request.pickupLocation
          .toLowerCase()
          .includes(keyword) ||
        request.destination
          .toLowerCase()
          .includes(keyword) ||
        request.purpose
          .toLowerCase()
          .includes(keyword) ||
        request.employee?.name
          .toLowerCase()
          .includes(keyword) ||
        request.employee?.email
          .toLowerCase()
          .includes(keyword)

      return matchesStatus && matchesSearch
    })
  }, [
    requests,
    searchTerm,
    statusFilter,
  ])

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
            Approve employee requests and
            assign drivers and vehicles.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            void loadPageData()
          }
          disabled={loading}
          className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          Refresh
        </button>
      </header>

      <section className="p-8">
        <div className="mb-8 rounded-2xl bg-slate-950 p-8 text-white">
          <h2 className="text-4xl font-bold">
            Request Assignment Center
          </h2>

          <p className="mt-3 max-w-2xl leading-7 text-slate-400">
            Review transport requests,
            approve valid requests and assign
            an available driver and vehicle.
          </p>
        </div>

        <div className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            title="Total"
            value={requests.length}
          />

          <StatCard
            title="Pending"
            value={
              requests.filter(
                (request) =>
                  request.status === 'PENDING',
              ).length
            }
          />

          <StatCard
            title="Approved"
            value={
              requests.filter(
                (request) =>
                  request.status === 'APPROVED',
              ).length
            }
          />

          <StatCard
            title="Assigned"
            value={
              requests.filter(
                (request) =>
                  Boolean(request.trip),
              ).length
            }
          />

          <StatCard
            title="Rejected"
            value={
              requests.filter(
                (request) =>
                  request.status === 'REJECTED',
              ).length
            }
          />
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
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
                  onClick={() =>
                    setStatusFilter(status)
                  }
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
                setSearchTerm(
                  event.target.value,
                )
              }
              placeholder="Search employee, route or purpose..."
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 xl:w-96"
            />
          </div>

          {loading && (
            <div className="p-8 text-slate-500">
              Loading requests...
            </div>
          )}

          {!loading &&
            filteredRequests.length === 0 && (
              <div className="p-12 text-center text-slate-500">
                No transport requests found.
              </div>
            )}

          {!loading &&
            filteredRequests.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1300px] text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-6 py-4">
                        Request
                      </th>

                      <th className="py-4 pr-6">
                        Employee
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

                      <th className="py-4 pr-6">
                        Assignment
                      </th>

                      <th className="py-4 pr-6">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredRequests.map(
                      (request) => {
                        const isProcessing =
                          actionLoadingId ===
                          request.id

                        return (
                          <tr
                            key={request.id}
                            className="border-b border-slate-100 hover:bg-slate-50"
                          >
                            <td className="px-6 py-4 font-semibold">
                              REQ-{request.id}
                            </td>

                            <td className="py-4 pr-6">
                              <p className="font-semibold">
                                {request.employee
                                  ?.name ??
                                  `Employee ${request.employeeId}`}
                              </p>

                              <p className="text-xs text-slate-500">
                                {request.employee
                                  ?.email ??
                                  'Unavailable'}
                              </p>
                            </td>

                            <td className="py-4 pr-6">
                              <p className="font-medium">
                                {
                                  request.pickupLocation
                                }
                              </p>

                              <p className="text-xs text-slate-500">
                                to{' '}
                                {
                                  request.destination
                                }
                              </p>
                            </td>

                            <td className="py-4 pr-6">
                              <p className="font-medium">
                                {formatDate(
                                  request.requestDate,
                                )}
                              </p>

                              <p className="text-xs text-slate-500">
                                {formatTime(
                                  request.requestTime,
                                )}
                              </p>
                            </td>

                            <td className="py-4 pr-6">
                              <RequestStatusBadge
                                status={
                                  request.status
                                }
                              />
                            </td>

                            <td className="py-4 pr-6">
                              {request.trip ? (
                                <div>
                                  <p className="font-semibold">
                                    {request.trip
                                      .driver?.user
                                      ?.name ??
                                      `Driver ${request.trip.driverId}`}
                                  </p>

                                  <p className="text-xs text-slate-500">
                                    {request.trip
                                      .vehicle
                                      ?.plateNumber ??
                                      `Vehicle ${request.trip.vehicleId}`}
                                  </p>

                                  <div className="mt-2">
                                    <TripStatusBadge
                                      status={
                                        request.trip
                                          .status
                                      }
                                    />
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-400">
                                  Not assigned
                                </span>
                              )}
                            </td>

                            <td className="py-4 pr-6">
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedRequest(
                                      request,
                                    )
                                  }
                                  className="font-semibold text-blue-600"
                                >
                                  View
                                </button>

                                {request.status ===
                                  'PENDING' && (
                                  <>
                                    <button
                                      type="button"
                                      disabled={
                                        isProcessing
                                      }
                                      onClick={() =>
                                        void handleStatusUpdate(
                                          request,
                                          'APPROVED',
                                        )
                                      }
                                      className="font-semibold text-green-600 disabled:opacity-50"
                                    >
                                      Approve
                                    </button>

                                    <button
                                      type="button"
                                      disabled={
                                        isProcessing
                                      }
                                      onClick={() =>
                                        void handleStatusUpdate(
                                          request,
                                          'REJECTED',
                                        )
                                      }
                                      className="font-semibold text-red-600 disabled:opacity-50"
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}

                                {request.status ===
                                  'APPROVED' &&
                                  !request.trip && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        openAssignmentModal(
                                          request,
                                        )
                                      }
                                      className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                                    >
                                      Assign Trip
                                    </button>
                                  )}

                                {request.trip && (
                                  <span className="text-xs font-semibold text-green-600">
                                    Assigned
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      },
                    )}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      </section>

      {selectedRequest && (
        <RequestDetailsModal
          request={selectedRequest}
          onClose={() =>
            setSelectedRequest(null)
          }
          onAssign={() => {
            setSelectedRequest(null)
            openAssignmentModal(
              selectedRequest,
            )
          }}
        />
      )}

      {assignmentRequest && (
        <AssignmentModal
          request={assignmentRequest}
          drivers={availableDrivers}
          vehicles={availableVehicles}
          formData={assignmentForm}
          saving={assigning}
          error={assignmentError}
          onChange={(field, value) =>
            setAssignmentForm(
              (current) => ({
                ...current,
                [field]: value,
              }),
            )
          }
          onClose={closeAssignmentModal}
          onSubmit={
            handleAssignmentSubmit
          }
        />
      )}
    </>
  )
}

function AssignmentModal({
  request,
  drivers,
  vehicles,
  formData,
  saving,
  error,
  onChange,
  onClose,
  onSubmit,
}: {
  request: TransportRequest
  drivers: Driver[]
  vehicles: Vehicle[]
  formData: AssignmentForm
  saving: boolean
  error: string
  onChange: (
    field: keyof AssignmentForm,
    value: string,
  ) => void
  onClose: () => void
  onSubmit: (
    event: React.FormEvent<HTMLFormElement>,
  ) => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              Assign Trip
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              REQ-{request.id}:{' '}
              {request.pickupLocation} to{' '}
              {request.destination}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="text-2xl text-slate-400"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {drivers.length === 0 && (
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            No available drivers exist. Complete
            or remove another assignment first.
          </div>
        )}

        {vehicles.length === 0 && (
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            No available vehicles exist.
          </div>
        )}

        <form
          onSubmit={onSubmit}
          className="space-y-5"
        >
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Driver
            </label>

            <select
              value={formData.driverId}
              onChange={(event) =>
                onChange(
                  'driverId',
                  event.target.value,
                )
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
              required
            >
              <option value="">
                Select an available driver
              </option>

              {drivers.map((driver) => (
                <option
                  key={driver.id}
                  value={driver.id}
                >
                  {driver.user?.name} —{' '}
                  {driver.licenseNumber}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Vehicle
            </label>

            <select
              value={formData.vehicleId}
              onChange={(event) =>
                onChange(
                  'vehicleId',
                  event.target.value,
                )
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
              required
            >
              <option value="">
                Select an available vehicle
              </option>

              {vehicles.map((vehicle) => (
                <option
                  key={vehicle.id}
                  value={vehicle.id}
                >
                  {vehicle.plateNumber} —{' '}
                  {vehicle.vehicleType}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            <p>
              <strong>Date:</strong>{' '}
              {formatDate(
                request.requestDate,
              )}
            </p>

            <p className="mt-1">
              <strong>Time:</strong>{' '}
              {formatTime(
                request.requestTime,
              )}
            </p>

            <p className="mt-1">
              <strong>Purpose:</strong>{' '}
              {request.purpose}
            </p>
          </div>

          <div className="flex justify-end gap-3 border-t pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl bg-slate-200 px-5 py-3 font-semibold"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                saving ||
                drivers.length === 0 ||
                vehicles.length === 0
              }
              className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
            >
              {saving
                ? 'Assigning...'
                : 'Create Trip Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function RequestDetailsModal({
  request,
  onClose,
  onAssign,
}: {
  request: TransportRequest
  onClose: () => void
  onAssign: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b p-6">
          <div>
            <p className="text-sm text-slate-500">
              Transport Request
            </p>

            <h2 className="text-2xl font-bold">
              REQ-{request.id}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-2xl text-slate-400"
          >
            ×
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <DetailItem
              label="Employee"
              value={
                request.employee?.name ??
                `Employee ${request.employeeId}`
              }
            />

            <DetailItem
              label="Email"
              value={
                request.employee?.email ??
                'Unavailable'
              }
            />

            <DetailItem
              label="Pickup"
              value={
                request.pickupLocation
              }
            />

            <DetailItem
              label="Destination"
              value={
                request.destination
              }
            />

            <DetailItem
              label="Date"
              value={formatDate(
                request.requestDate,
              )}
            />

            <DetailItem
              label="Time"
              value={formatTime(
                request.requestTime,
              )}
            />
          </div>

          <div className="rounded-xl bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-500">
              Purpose
            </p>

            <p className="mt-2">
              {request.purpose}
            </p>
          </div>

          {request.trip && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-5">
              <h3 className="font-bold text-green-900">
                Trip assigned
              </h3>

              <p className="mt-2 text-sm text-green-800">
                Driver:{' '}
                {request.trip.driver?.user
                  ?.name ??
                  `Driver ${request.trip.driverId}`}
              </p>

              <p className="mt-1 text-sm text-green-800">
                Vehicle:{' '}
                {request.trip.vehicle
                  ?.plateNumber ??
                  `Vehicle ${request.trip.vehicleId}`}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t p-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-5 py-3 font-semibold"
          >
            Close
          </button>

          {request.status ===
            'APPROVED' &&
            !request.trip && (
              <button
                type="button"
                onClick={onAssign}
                className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white"
              >
                Assign Driver and Vehicle
              </button>
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
      <p className="text-sm text-slate-500">
        {title}
      </p>

      <h3 className="mt-3 text-4xl font-bold">
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
      <p className="text-sm text-slate-500">
        {label}
      </p>

      <p className="mt-1 font-semibold">
        {value}
      </p>
    </div>
  )
}

function RequestStatusBadge({
  status,
}: {
  status: TransportRequestStatus
}) {
  const styles: Record<
    TransportRequestStatus,
    string
  > = {
    PENDING:
      'bg-amber-100 text-amber-700',
    APPROVED:
      'bg-green-100 text-green-700',
    REJECTED:
      'bg-red-100 text-red-700',
    CANCELLED:
      'bg-slate-200 text-slate-700',
  }

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {status}
    </span>
  )
}

function TripStatusBadge({
  status,
}: {
  status:
    | 'SCHEDULED'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'CANCELLED'
}) {
  const styles = {
    SCHEDULED:
      'bg-blue-100 text-blue-700',
    IN_PROGRESS:
      'bg-amber-100 text-amber-700',
    COMPLETED:
      'bg-green-100 text-green-700',
    CANCELLED:
      'bg-red-100 text-red-700',
  }

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {status.replaceAll('_', ' ')}
    </span>
  )
}

function formatDate(value: string) {
  const date = new Date(value)

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString()
}

function formatTime(value: string) {
  const [hours, minutes] = value
    .split(':')
    .map(Number)

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    return value
  }

  const date = new Date()
  date.setHours(hours, minutes)

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getApiErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (!axios.isAxiosError(error)) {
    return fallback
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

  return fallback
}

export default TransportRequestsView