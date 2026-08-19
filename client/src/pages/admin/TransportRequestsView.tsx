import axios from 'axios'

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  createPortal,
} from 'react-dom'

import RouteMap from '../../components/maps/RouteMap'

import {
  estimateRoute,
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
  RouteEstimate,
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

const ITEMS_PER_PAGE = 10

function TransportRequestsView() {
  const [requests, setRequests] =
    useState<TransportRequest[]>([])

  const [drivers, setDrivers] =
    useState<Driver[]>([])

  const [vehicles, setVehicles] =
    useState<Vehicle[]>([])

  const [searchTerm, setSearchTerm] =
    useState('')

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<StatusFilter>('ALL')

  const [currentPage, setCurrentPage] =
    useState(1)

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
  ] =
    useState<TransportRequest | null>(
      null,
    )

  const [
    assignmentRequest,
    setAssignmentRequest,
  ] =
    useState<TransportRequest | null>(
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

  useEffect(() => {
    setCurrentPage(1)
  }, [
    searchTerm,
    statusFilter,
  ])

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

    const confirmed =
      window.confirm(
        `Are you sure you want to ${actionLabel} request REQ-${request.id}?`,
      )

    if (!confirmed) {
      return
    }

    try {
      setActionLoadingId(
        request.id,
      )

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
        requestId:
          assignmentRequest.id,
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

  const availableDrivers =
    useMemo(
      () =>
        drivers.filter(
          (driver) =>
            driver.availabilityStatus ===
              'AVAILABLE' &&
            driver.user?.status ===
              'ACTIVE',
        ),
      [drivers],
    )

  const availableVehicles =
    useMemo(
      () =>
        vehicles.filter(
          (vehicle) =>
            vehicle.status ===
            'AVAILABLE',
        ),
      [vehicles],
    )

  const requestCounts =
    useMemo(
      () => ({
        pending:
          requests.filter(
            (request) =>
              request.status ===
              'PENDING',
          ).length,

        approved:
          requests.filter(
            (request) =>
              request.status ===
              'APPROVED',
          ).length,

        assigned:
          requests.filter(
            (request) =>
              Boolean(request.trip),
          ).length,

        rejected:
          requests.filter(
            (request) =>
              request.status ===
              'REJECTED',
          ).length,
      }),
      [requests],
    )

  const filteredRequests =
    useMemo(() => {
      const keyword =
        searchTerm
          .trim()
          .toLowerCase()

      return requests.filter(
        (request) => {
          const matchesStatus =
            statusFilter === 'ALL' ||
            request.status ===
              statusFilter

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

          return (
            matchesStatus &&
            matchesSearch
          )
        },
      )
    }, [
      requests,
      searchTerm,
      statusFilter,
    ])

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredRequests.length /
        ITEMS_PER_PAGE,
    ),
  )

  const paginatedRequests =
    useMemo(() => {
      const startIndex =
        (currentPage - 1) *
        ITEMS_PER_PAGE

      return filteredRequests.slice(
        startIndex,
        startIndex +
          ITEMS_PER_PAGE,
      )
    }, [
      currentPage,
      filteredRequests,
    ])

  useEffect(() => {
    if (
      currentPage >
      totalPages
    ) {
      setCurrentPage(
        totalPages,
      )
    }
  }, [
    currentPage,
    totalPages,
  ])

  return (
    <>
      <header className="flex min-h-[72px] items-center justify-between border-b border-slate-200 bg-white px-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-950">
            Transport Requests
          </h1>

          <p className="mt-0.5 text-sm text-slate-500">
            Review employee transport
            requests and manage trip
            assignments.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            void loadPageData()
          }
          disabled={loading}
          className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
        >
          {loading
            ? 'Refreshing...'
            : 'Refresh'}
        </button>
      </header>

      <section className="mx-auto max-w-[1600px] p-8">
        {/* =========================
            GRADIENT INTRO
        ========================== */}

        <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 px-7 py-6 text-white shadow-sm">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-200">
                Request operations
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Transport request center
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Review employee journeys,
                approve valid requests and
                assign available drivers and
                fleet vehicles.
              </p>
            </div>

            <div className="flex gap-3">
              <GradientStatusItem
                label="Drivers ready"
                value={
                  availableDrivers.length
                }
              />

              <GradientStatusItem
                label="Vehicles ready"
                value={
                  availableVehicles.length
                }
              />
            </div>
          </div>
        </div>

        {/* =========================
            STATS
        ========================== */}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <MiniStatCard
            label="Total requests"
            value={requests.length}
            tone="slate"
          />

          <MiniStatCard
            label="Pending"
            value={
              requestCounts.pending
            }
            tone="amber"
          />

          <MiniStatCard
            label="Approved"
            value={
              requestCounts.approved
            }
            tone="green"
          />

          <MiniStatCard
            label="Assigned"
            value={
              requestCounts.assigned
            }
            tone="blue"
          />

          <MiniStatCard
            label="Rejected"
            value={
              requestCounts.rejected
            }
            tone="red"
          />
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* =========================
            TABLE
        ========================== */}

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 rounded-t-2xl border-b border-slate-100 px-6 py-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h3 className="font-semibold text-slate-950">
                Request queue
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {filteredRequests.length}{' '}
                requests shown
              </p>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row">
              <input
                type="search"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value,
                  )
                }
                placeholder="Search employee, route or purpose..."
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 lg:w-80"
              />

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target
                      .value as StatusFilter,
                  )
                }
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="ALL">
                  All statuses
                </option>

                <option value="PENDING">
                  Pending
                </option>

                <option value="APPROVED">
                  Approved
                </option>

                <option value="REJECTED">
                  Rejected
                </option>

                <option value="CANCELLED">
                  Cancelled
                </option>
              </select>
            </div>
          </div>

          {loading && (
            <div className="p-12 text-center text-sm text-slate-500">
              Loading transport
              requests...
            </div>
          )}

          {!loading &&
            filteredRequests.length ===
              0 && (
              <div className="p-12 text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-500">
                  TR
                </div>

                <p className="mt-4 font-semibold text-slate-700">
                  No transport requests
                  found
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Try changing your
                  search or status filter.
                </p>
              </div>
            )}

          {!loading &&
            filteredRequests.length >
              0 && (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1100px] text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
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

                        <th className="py-4 pr-6 text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {paginatedRequests.map(
                        (request) => {
                          const isProcessing =
                            actionLoadingId ===
                            request.id

                          return (
                            <tr
                              key={
                                request.id
                              }
                              className="border-b border-slate-100 transition last:border-b-0 hover:bg-slate-50/80"
                            >
                              {/* REQUEST */}

                              <td className="px-6 py-4">
                                <p className="font-semibold text-slate-900">
                                  REQ-
                                  {
                                    request.id
                                  }
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                  Transport
                                  request
                                </p>
                              </td>

                              {/* EMPLOYEE */}

                              <td className="py-4 pr-6">
                                <div className="flex items-center gap-3">
                                  <EmployeeAvatar
                                    name={
                                      request
                                        .employee
                                        ?.name ??
                                      'Employee'
                                    }
                                  />

                                  <div className="min-w-0">
                                    <p className="font-semibold text-slate-900">
                                      {request
                                        .employee
                                        ?.name ??
                                        `Employee ${request.employeeId}`}
                                    </p>

                                    <p className="mt-1 max-w-[180px] truncate text-xs text-slate-500">
                                      {request
                                        .employee
                                        ?.email ??
                                        'Unavailable'}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              {/* ROUTE */}

                              <td className="max-w-[230px] py-4 pr-6">
                                <p className="truncate font-medium text-slate-800">
                                  {
                                    request.pickupLocation
                                  }
                                </p>

                                <div className="my-1 flex items-center gap-2 text-xs text-slate-400">
                                  <span className="h-px w-3 bg-slate-300" />

                                  to

                                  <span className="h-px w-3 bg-slate-300" />
                                </div>

                                <p className="truncate text-sm text-slate-500">
                                  {
                                    request.destination
                                  }
                                </p>
                              </td>

                              {/* SCHEDULE */}

                              <td className="whitespace-nowrap py-4 pr-6">
                                <p className="font-medium text-slate-700">
                                  {formatDate(
                                    request.requestDate,
                                  )}
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                  {formatTime(
                                    request.requestTime,
                                  )}
                                </p>
                              </td>

                              {/* STATUS */}

                              <td className="py-4 pr-6">
                                <RequestStatusBadge
                                  status={
                                    request.status
                                  }
                                />
                              </td>

                              {/* ASSIGNMENT */}

                              <td className="py-4 pr-6">
                                {request.trip ? (
                                  <div>
                                    <p className="font-semibold text-slate-800">
                                      {request.trip
                                        .driver
                                        ?.user
                                        ?.name ??
                                        `Driver ${request.trip.driverId}`}
                                    </p>

                                    <p className="mt-1 text-xs text-slate-500">
                                      {request.trip
                                        .vehicle
                                        ?.plateNumber ??
                                        `Vehicle ${request.trip.vehicleId}`}
                                    </p>

                                    <div className="mt-2">
                                      <TripStatusBadge
                                        status={
                                          request
                                            .trip
                                            .status
                                        }
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-sm text-slate-400">
                                    Not assigned
                                  </span>
                                )}
                              </td>

                              {/* ACTIONS */}

                              <td className="py-4 pr-6">
                                <div className="flex justify-end">
                                  <RequestActions
                                    request={
                                      request
                                    }
                                    isProcessing={
                                      isProcessing
                                    }
                                    onView={() =>
                                      setSelectedRequest(
                                        request,
                                      )
                                    }
                                    onApprove={() =>
                                      void handleStatusUpdate(
                                        request,
                                        'APPROVED',
                                      )
                                    }
                                    onReject={() =>
                                      void handleStatusUpdate(
                                        request,
                                        'REJECTED',
                                      )
                                    }
                                    onAssign={() =>
                                      openAssignmentModal(
                                        request,
                                      )
                                    }
                                  />
                                </div>
                              </td>
                            </tr>
                          )
                        },
                      )}
                    </tbody>
                  </table>
                </div>

                <Pagination
                  currentPage={
                    currentPage
                  }
                  totalPages={
                    totalPages
                  }
                  totalItems={
                    filteredRequests.length
                  }
                  itemsPerPage={
                    ITEMS_PER_PAGE
                  }
                  onPageChange={
                    setCurrentPage
                  }
                />
              </>
            )}
        </div>
      </section>

      {/* REQUEST DETAILS */}

      {selectedRequest && (
        <RequestDetailsModal
          request={selectedRequest}
          onClose={() =>
            setSelectedRequest(null)
          }
          onAssign={() => {
            const request =
              selectedRequest

            setSelectedRequest(null)

            openAssignmentModal(
              request,
            )
          }}
        />
      )}

      {/* ASSIGNMENT */}

      {assignmentRequest && (
        <AssignmentModal
          request={
            assignmentRequest
          }
          drivers={
            availableDrivers
          }
          vehicles={
            availableVehicles
          }
          formData={
            assignmentForm
          }
          saving={assigning}
          error={
            assignmentError
          }
          onChange={(
            field,
            value,
          ) =>
            setAssignmentForm(
              (current) => ({
                ...current,
                [field]: value,
              }),
            )
          }
          onClose={
            closeAssignmentModal
          }
          onSubmit={
            handleAssignmentSubmit
          }
        />
      )}
    </>
  )
}

/* =========================================================
   REQUEST ACTIONS DROPDOWN
========================================================= */

function RequestActions({
  request,
  isProcessing,
  onView,
  onApprove,
  onReject,
  onAssign,
}: {
  request: TransportRequest
  isProcessing: boolean
  onView: () => void
  onApprove: () => void
  onReject: () => void
  onAssign: () => void
}) {
  const buttonRef =
    useRef<HTMLButtonElement | null>(
      null,
    )

  const [open, setOpen] =
    useState(false)

  const [
    menuPosition,
    setMenuPosition,
  ] = useState({
    top: 0,
    right: 0,
  })

  function openMenu() {
    if (!buttonRef.current) {
      return
    }

    const rect =
      buttonRef.current.getBoundingClientRect()

    setMenuPosition({
      top: rect.bottom + 6,

      right:
        window.innerWidth -
        rect.right,
    })

    setOpen(true)
  }

  useEffect(() => {
    if (!open) {
      return
    }

    function closeMenu() {
      setOpen(false)
    }

    window.addEventListener(
      'resize',
      closeMenu,
    )

    window.addEventListener(
      'scroll',
      closeMenu,
      true,
    )

    return () => {
      window.removeEventListener(
        'resize',
        closeMenu,
      )

      window.removeEventListener(
        'scroll',
        closeMenu,
        true,
      )
    }
  }, [open])

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          if (open) {
            setOpen(false)
          } else {
            openMenu()
          }
        }}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
      >
        Actions

        <span
          className={`text-[10px] text-slate-400 transition ${
            open
              ? 'rotate-180'
              : ''
          }`}
        >
          ▼
        </span>
      </button>

      {open &&
        createPortal(
          <>
            <button
              type="button"
              aria-label="Close actions menu"
              onClick={() =>
                setOpen(false)
              }
              className="fixed inset-0 z-[90] cursor-default"
            />

            <div
              className="fixed z-[100] w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-2xl"
              style={{
                top:
                  menuPosition.top,

                right:
                  menuPosition.right,
              }}
            >
              {/* VIEW */}

              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  onView()
                }}
                className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <span>
                  View details
                </span>

                <span className="text-xs text-slate-300">
                  →
                </span>
              </button>

              {/* PENDING */}

              {request.status ===
                'PENDING' && (
                <>
                  <div className="my-1 border-t border-slate-100" />

                  <button
                    type="button"
                    disabled={
                      isProcessing
                    }
                    onClick={() => {
                      setOpen(false)

                      onApprove()
                    }}
                    className="flex w-full items-center px-4 py-2.5 text-left text-sm font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Approve request
                  </button>

                  <button
                    type="button"
                    disabled={
                      isProcessing
                    }
                    onClick={() => {
                      setOpen(false)

                      onReject()
                    }}
                    className="flex w-full items-center px-4 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Reject request
                  </button>
                </>
              )}

              {/* APPROVED BUT UNASSIGNED */}

              {request.status ===
                'APPROVED' &&
                !request.trip && (
                  <>
                    <div className="my-1 border-t border-slate-100" />

                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false)

                        onAssign()
                      }}
                      className="flex w-full items-center px-4 py-2.5 text-left text-sm font-medium text-blue-700 transition hover:bg-blue-50"
                    >
                      Assign trip
                    </button>
                  </>
                )}

              {/* ALREADY ASSIGNED */}

              {request.trip && (
                <>
                  <div className="my-1 border-t border-slate-100" />

                  <div className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-emerald-600">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />

                    Trip assigned
                  </div>
                </>
              )}

              {/* FINAL STATUS */}

              {(request.status ===
                'REJECTED' ||
                request.status ===
                  'CANCELLED') && (
                <>
                  <div className="my-1 border-t border-slate-100" />

                  <div className="px-4 py-2.5 text-xs text-slate-400">
                    No further actions
                  </div>
                </>
              )}
            </div>
          </>,
          document.body,
        )}
    </>
  )
}

/* =========================================================
   ASSIGNMENT MODAL
========================================================= */

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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-[2px]">
      <div className="my-8 w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-200">
                Trip assignment
              </p>

              <h2 className="mt-1 text-xl font-semibold">
                Assign Driver &
                Vehicle
              </h2>

              <p className="mt-1 text-sm text-slate-300">
                REQ-{request.id}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xl text-slate-200 transition hover:bg-white/20"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Route
            </p>

            <p className="mt-2 font-semibold text-slate-800">
              {request.pickupLocation}
            </p>

            <p className="my-1 text-xs text-slate-400">
              ↓
            </p>

            <p className="font-semibold text-slate-800">
              {request.destination}
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {drivers.length === 0 && (
            <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              No available drivers
              currently exist.
            </div>
          )}

          {vehicles.length ===
            0 && (
            <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              No available vehicles
              currently exist.
            </div>
          )}

          <form
            onSubmit={onSubmit}
            className="space-y-5"
          >
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Driver
              </label>

              <select
                value={
                  formData.driverId
                }
                onChange={(event) =>
                  onChange(
                    'driverId',
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                required
              >
                <option value="">
                  Select an available
                  driver
                </option>

                {drivers.map(
                  (driver) => (
                    <option
                      key={driver.id}
                      value={driver.id}
                    >
                      {driver.user?.name}{' '}
                      —{' '}
                      {
                        driver.licenseNumber
                      }
                    </option>
                  ),
                )}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Vehicle
              </label>

              <select
                value={
                  formData.vehicleId
                }
                onChange={(event) =>
                  onChange(
                    'vehicleId',
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                required
              >
                <option value="">
                  Select an available
                  vehicle
                </option>

                {vehicles.map(
                  (vehicle) => (
                    <option
                      key={vehicle.id}
                      value={vehicle.id}
                    >
                      {
                        vehicle.plateNumber
                      }{' '}
                      —{' '}
                      {
                        vehicle.vehicleType
                      }
                    </option>
                  ),
                )}
              </select>
            </div>

            <div className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3">
              <ModalInfo
                label="Date"
                value={formatDate(
                  request.requestDate,
                )}
              />

              <ModalInfo
                label="Time"
                value={formatTime(
                  request.requestTime,
                )}
              />

              <ModalInfo
                label="Purpose"
                value={
                  request.purpose
                }
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  saving ||
                  drivers.length ===
                    0 ||
                  vehicles.length ===
                    0
                }
                className="rounded-xl bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving
                  ? 'Assigning...'
                  : 'Create Trip Assignment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

/* =========================================================
   REQUEST DETAILS MODAL
========================================================= */

function RequestDetailsModal({
  request,
  onClose,
  onAssign,
}: {
  request: TransportRequest
  onClose: () => void
  onAssign: () => void
}) {
  const [route, setRoute] =
    useState<RouteEstimate | null>(
      null,
    )

  const [
    routeLoading,
    setRouteLoading,
  ] = useState(false)

  const [
    routeError,
    setRouteError,
  ] = useState('')

  useEffect(() => {
    const hasCoordinates =
      request.pickupLatitude != null &&
      request.pickupLongitude != null &&
      request.destinationLatitude !=
        null &&
      request.destinationLongitude !=
        null

    if (!hasCoordinates) {
      setRoute(null)
      setRouteError('')
      return
    }

    const controller =
      new AbortController()

    async function loadRoute() {
      try {
        setRouteLoading(true)
        setRouteError('')

        const routeData =
          await estimateRoute(
            {
              pickupLatitude:
                request.pickupLatitude!,

              pickupLongitude:
                request.pickupLongitude!,

              destinationLatitude:
                request.destinationLatitude!,

              destinationLongitude:
                request.destinationLongitude!,
            },

            controller.signal,
          )

        setRoute(routeData)
      } catch (error) {
        if (
          axios.isCancel(error) ||
          controller.signal.aborted
        ) {
          return
        }

        console.error(error)

        setRoute(null)

        setRouteError(
          getApiErrorMessage(
            error,
            'The route map could not be loaded.',
          ),
        )
      } finally {
        if (
          !controller.signal.aborted
        ) {
          setRouteLoading(false)
        }
      }
    }

    void loadRoute()

    return () => {
      controller.abort()
    }
  }, [
    request.id,
    request.pickupLatitude,
    request.pickupLongitude,
    request.destinationLatitude,
    request.destinationLongitude,
  ])

  const pickupPosition:
    | [number, number]
    | null =
    request.pickupLatitude != null &&
    request.pickupLongitude != null
      ? [
          request.pickupLatitude,
          request.pickupLongitude,
        ]
      : null

  const destinationPosition:
    | [number, number]
    | null =
    request.destinationLatitude !=
      null &&
    request.destinationLongitude !=
      null
      ? [
          request.destinationLatitude,
          request.destinationLongitude,
        ]
      : null

  const distanceKm =
    route?.estimatedDistanceKm ??
    request.estimatedDistanceKm ??
    null

  const distanceMiles =
    route?.estimatedDistanceMiles ??
    (distanceKm != null
      ? distanceKm * 0.621371
      : null)

  const durationMinutes =
    route?.estimatedDurationMinutes ??
    request.estimatedDurationMinutes ??
    null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-[2px]">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="shrink-0 bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-200">
                Transport request
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-semibold">
                  REQ-{request.id}
                </h2>

                <RequestStatusBadge
                  status={
                    request.status
                  }
                />
              </div>

              <p className="mt-2 text-sm text-slate-300">
                Review journey,
                employee and assignment
                details.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xl text-slate-200 transition hover:bg-white/20"
            >
              ×
            </button>
          </div>
        </div>

        <div className="overflow-y-auto p-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Request information
              </p>

              <div className="mt-5 space-y-5">
                <DetailItem
                  label="Employee"
                  value={
                    request.employee
                      ?.name ??
                    `Employee ${request.employeeId}`
                  }
                />

                <DetailItem
                  label="Email"
                  value={
                    request.employee
                      ?.email ??
                    'Unavailable'
                  }
                />

                <div className="grid gap-4 sm:grid-cols-2">
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

                <DetailItem
                  label="Purpose"
                  value={
                    request.purpose
                  }
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Journey
              </p>

              <div className="mt-5">
                <RoutePoint
                  label="Pickup"
                  value={
                    request.pickupLocation
                  }
                  tone="blue"
                />

                <div className="ml-[5px] h-7 border-l-2 border-dashed border-slate-200" />

                <RoutePoint
                  label="Destination"
                  value={
                    request.destination
                  }
                  tone="indigo"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <RouteInformationCard
              label="Distance"
              value={
                distanceKm != null
                  ? `${distanceKm.toFixed(
                      2,
                    )} km`
                  : 'Not available'
              }
            />

            <RouteInformationCard
              label="Distance in miles"
              value={
                distanceMiles != null
                  ? `${distanceMiles.toFixed(
                      2,
                    )} mi`
                  : 'Not available'
              }
            />

            <RouteInformationCard
              label="Estimated time"
              value={
                durationMinutes != null
                  ? formatDuration(
                      durationMinutes,
                    )
                  : 'Not available'
              }
            />
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-5 py-4">
              <h3 className="font-semibold text-slate-900">
                Route map
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Pickup, destination and
                estimated driving route.
              </p>
            </div>

            <div className="p-5">
              {routeLoading && (
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-5 text-sm font-medium text-blue-700">
                  Loading route map...
                </div>
              )}

              {!routeLoading &&
                pickupPosition &&
                destinationPosition &&
                route && (
                  <RouteMap
                    pickup={
                      pickupPosition
                    }
                    destination={
                      destinationPosition
                    }
                    routeCoordinates={
                      route.routeCoordinates
                    }
                  />
                )}

              {!routeLoading &&
                routeError && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                    <p className="font-semibold text-amber-800">
                      Route map
                      unavailable
                    </p>

                    <p className="mt-1 text-sm text-amber-700">
                      {routeError}
                    </p>
                  </div>
                )}

              {!routeLoading &&
                !routeError &&
                (!pickupPosition ||
                  !destinationPosition) && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                    <p className="font-semibold text-slate-700">
                      No map available
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      This request was
                      created before
                      location coordinates
                      were available.
                    </p>
                  </div>
                )}
            </div>
          </div>

          {request.trip && (
            <div className="mt-6 overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-100 px-5 py-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                    Assignment
                  </p>

                  <h3 className="mt-1 font-semibold text-emerald-950">
                    Trip assigned
                  </h3>
                </div>

                <TripStatusBadge
                  status={
                    request.trip.status
                  }
                />
              </div>

              <div className="grid gap-4 p-5 sm:grid-cols-2">
                <DetailItem
                  label="Driver"
                  value={
                    request.trip.driver
                      ?.user?.name ??
                    `Driver ${request.trip.driverId}`
                  }
                />

                <DetailItem
                  label="Vehicle"
                  value={
                    request.trip.vehicle
                      ?.plateNumber ??
                    `Vehicle ${request.trip.vehicleId}`
                  }
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex shrink-0 justify-end gap-3 border-t border-slate-100 bg-white px-6 py-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Close
          </button>

          {request.status ===
            'APPROVED' &&
            !request.trip && (
              <button
                type="button"
                onClick={onAssign}
                className="rounded-xl bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
              >
                Assign Driver &
                Vehicle
              </button>
            )}
        </div>
      </div>
    </div>
  )
}

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function GradientStatusItem({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <div className="min-w-[120px] rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur-sm">
      <p className="text-xs text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-xl font-semibold text-white">
        {value}
      </p>
    </div>
  )
}

function MiniStatCard({
  label,
  value,
  tone,
}: {
  label: string
  value: number

  tone:
    | 'green'
    | 'blue'
    | 'amber'
    | 'slate'
    | 'red'
}) {
  const styles = {
    green:
      'bg-emerald-50 text-emerald-700',

    blue:
      'bg-blue-50 text-blue-700',

    amber:
      'bg-amber-50 text-amber-700',

    slate:
      'bg-slate-100 text-slate-700',

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

          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
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

function EmployeeAvatar({
  name,
}: {
  name: string
}) {
  const initials =
    name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()

  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-950 to-blue-900 text-[11px] font-bold text-white">
      {initials || 'EM'}
    </div>
  )
}

function RoutePoint({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'blue' | 'indigo'
}) {
  const dotStyle =
    tone === 'blue'
      ? 'bg-blue-500 ring-blue-50'
      : 'bg-indigo-500 ring-indigo-50'

  return (
    <div className="flex items-start gap-4">
      <span
        className={`mt-1 h-3 w-3 shrink-0 rounded-full ring-4 ${dotStyle}`}
      />

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>

        <p className="mt-1 font-semibold text-slate-800">
          {value}
        </p>
      </div>
    </div>
  )
}

function RouteInformationCard({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50/50 p-5">
      <p className="text-sm font-medium text-blue-700">
        {label}
      </p>

      <p className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
        {value}
      </p>
    </div>
  )
}

function ModalInfo({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-semibold text-slate-700">
        {value}
      </p>
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
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  )
}

/* =========================================================
   PAGINATION
========================================================= */

function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number

  onPageChange: (
    page: number,
  ) => void
}) {
  const firstItem =
    totalItems === 0
      ? 0
      : (currentPage - 1) *
          itemsPerPage +
        1

  const lastItem = Math.min(
    currentPage *
      itemsPerPage,
    totalItems,
  )

  return (
    <div className="flex flex-col gap-4 rounded-b-2xl border-t border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500">
        Showing{' '}
        <span className="font-semibold text-slate-700">
          {firstItem}
        </span>{' '}
        to{' '}
        <span className="font-semibold text-slate-700">
          {lastItem}
        </span>{' '}
        of{' '}
        <span className="font-semibold text-slate-700">
          {totalItems}
        </span>{' '}
        requests
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() =>
            onPageChange(
              currentPage - 1,
            )
          }
          disabled={
            currentPage === 1
          }
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>

        {Array.from(
          {
            length: totalPages,
          },
          (_, index) =>
            index + 1,
        ).map((page) => (
          <button
            key={page}
            type="button"
            onClick={() =>
              onPageChange(page)
            }
            className={`h-9 min-w-9 rounded-lg px-3 text-sm font-semibold transition ${
              currentPage === page
                ? 'bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {page}
          </button>
        ))}

        <button
          type="button"
          onClick={() =>
            onPageChange(
              currentPage + 1,
            )
          }
          disabled={
            currentPage ===
            totalPages
          }
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  )
}

/* =========================================================
   BADGES
========================================================= */

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
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${styles[status]}`}
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
      'bg-blue-50 text-blue-700 ring-1 ring-blue-200',

    IN_PROGRESS:
      'bg-amber-50 text-amber-700 ring-1 ring-amber-200',

    COMPLETED:
      'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',

    CANCELLED:
      'bg-red-50 text-red-700 ring-1 ring-red-200',
  }

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${styles[status]}`}
    >
      {status.replaceAll(
        '_',
        ' ',
      )}
    </span>
  )
}

/* =========================================================
   FORMATTERS
========================================================= */

function formatDuration(
  totalMinutes: number,
) {
  const hours = Math.floor(
    totalMinutes / 60,
  )

  const minutes =
    totalMinutes % 60

  if (hours === 0) {
    return `${minutes} min`
  }

  if (minutes === 0) {
    return `${hours} hr`
  }

  return `${hours} hr ${minutes} min`
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
    : date.toLocaleDateString()
}

function formatTime(
  value: string,
) {
  const [hours, minutes] =
    value
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
  )

  return date.toLocaleTimeString(
    [],
    {
      hour: '2-digit',
      minute: '2-digit',
    },
  )
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

  if (
    typeof message === 'string'
  ) {
    return message
  }

  if (!error.response) {
    return 'Unable to connect to the server.'
  }

  return fallback
}

export default TransportRequestsView