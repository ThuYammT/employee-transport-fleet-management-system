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
  deleteTransportRequest,
  getTransportRequests,
  updateTransportRequest,
} from '../../services/transport-request.service'

import type {
  TransportRequest,
  TransportRequestStatus,
} from '../../types/transport-request'

import {
  getCurrentUser,
} from '../../utils/user-session'

type StatusFilter =
  | 'ALL'
  | TransportRequestStatus

function MyRequestsPage() {
  const navigate = useNavigate()

  const [
    requests,
    setRequests,
  ] =
    useState<TransportRequest[]>([])

  const [
    searchTerm,
    setSearchTerm,
  ] = useState('')

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<StatusFilter>('ALL')

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    actionLoadingId,
    setActionLoadingId,
  ] =
    useState<number | null>(null)

  const [
    error,
    setError,
  ] = useState('')

  useEffect(() => {
    void loadRequests()
  }, [])

  async function loadRequests() {
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

  async function refreshRequests() {
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

    const data =
      await getTransportRequests()

    setRequests(
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
        ),
    )
  }

  async function handleCancel(
    request:
      TransportRequest,
  ) {
    if (
      request.status !==
      'PENDING'
    ) {
      window.alert(
        'Only pending requests can be cancelled.',
      )

      return
    }

    const confirmed =
      window.confirm(
        `Cancel transport request REQ-${request.id}?`,
      )

    if (!confirmed) {
      return
    }

    try {
      setActionLoadingId(
        request.id,
      )

      await updateTransportRequest(
        request.id,
        {
          status:
            'CANCELLED',
        },
      )

      await refreshRequests()
    } catch (error) {
      console.error(error)

      window.alert(
        'Failed to cancel the request.',
      )
    } finally {
      setActionLoadingId(
        null,
      )
    }
  }

  async function handleDelete(
    request:
      TransportRequest,
  ) {
    if (
      request.status !==
      'CANCELLED'
    ) {
      window.alert(
        'Only cancelled requests can be deleted.',
      )

      return
    }

    const confirmed =
      window.confirm(
        `Permanently delete request REQ-${request.id}?`,
      )

    if (!confirmed) {
      return
    }

    try {
      setActionLoadingId(
        request.id,
      )

      await deleteTransportRequest(
        request.id,
      )

      await refreshRequests()
    } catch (error) {
      console.error(error)

      window.alert(
        'Failed to delete the request.',
      )
    } finally {
      setActionLoadingId(
        null,
      )
    }
  }

  const filteredRequests =
    useMemo(() => {
      const search =
        searchTerm
          .trim()
          .toLowerCase()

      return requests.filter(
        (request) => {
          const matchesStatus =
            statusFilter ===
              'ALL' ||
            request.status ===
              statusFilter

          const matchesSearch =
            !search ||
            request.id
              .toString()
              .includes(
                search,
              ) ||
            request.pickupLocation
              .toLowerCase()
              .includes(
                search,
              ) ||
            request.destination
              .toLowerCase()
              .includes(
                search,
              ) ||
            request.purpose
              .toLowerCase()
              .includes(
                search,
              )

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

  const filters:
    StatusFilter[] = [
      'ALL',
      'PENDING',
      'APPROVED',
      'REJECTED',
      'CANCELLED',
    ]

  return (
    <>
      <header className="flex min-h-[72px] items-center justify-between border-b border-slate-200 bg-white px-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-950">
            My Requests
          </h1>

          <p className="mt-0.5 text-sm text-slate-500">
            Review and manage your
            transport requests.
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

        <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 px-7 py-6 text-white">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />

          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-200">
              Request management
            </p>

            <h2 className="mt-2 text-2xl font-semibold">
              Transport Request
              History
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Search your previous
              requests, follow their
              current approval status
              and open route details.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* FILTERS */}

          <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-2">
              {filters.map(
                (status) => (
                  <button
                    key={
                      status
                    }
                    type="button"
                    onClick={() =>
                      setStatusFilter(
                        status,
                      )
                    }
                    className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                      statusFilter ===
                      status
                        ? 'bg-slate-950 text-white'
                        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {status.replaceAll(
                      '_',
                      ' ',
                    )}
                  </button>
                ),
              )}
            </div>

            <div className="flex items-center gap-3">
              <input
                type="search"
                value={
                  searchTerm
                }
                onChange={(
                  event,
                ) =>
                  setSearchTerm(
                    event.target
                      .value,
                  )
                }
                placeholder="Search request, route or purpose..."
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 xl:w-80"
              />

              <button
                type="button"
                onClick={() =>
                  void loadRequests()
                }
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

              <p className="mt-4 text-sm text-slate-500">
                Loading requests...
              </p>
            </div>
          ) : filteredRequests.length ===
            0 ? (
            <div className="p-12 text-center">
              <p className="font-semibold text-slate-700">
                No matching requests
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Change the filters or
                submit a new request.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] table-fixed text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="w-[110px] px-6 py-4">
                      Request
                    </th>

                    <th className="w-[280px] py-4 pr-6">
                      Route
                    </th>

                    <th className="w-[150px] py-4 pr-6">
                      Schedule
                    </th>

                    <th className="w-[230px] py-4 pr-6">
                      Purpose
                    </th>

                    <th className="w-[130px] py-4 pr-6">
                      Status
                    </th>

                    <th className="w-[210px] py-4 pr-6 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRequests.map(
                    (request) => {
                      const processing =
                        actionLoadingId ===
                        request.id

                      return (
                        <tr
                          key={
                            request.id
                          }
                          className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/80"
                        >
                          <td className="px-6 py-4">
                            <p className="font-semibold text-slate-900">
                              REQ-
                              {
                                request.id
                              }
                            </p>
                          </td>

                          <td className="py-4 pr-6">
                            <div className="max-w-[250px]">
                              <p
                                title={
                                  request.pickupLocation
                                }
                                className="truncate font-semibold text-slate-800"
                              >
                                {
                                  request.pickupLocation
                                }
                              </p>

                              <p
                                title={
                                  request.destination
                                }
                                className="mt-1 truncate text-xs text-slate-500"
                              >
                                to{' '}
                                {
                                  request.destination
                                }
                              </p>
                            </div>
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
                            <p
                              className="truncate text-slate-600"
                              title={
                                request.purpose
                              }
                            >
                              {
                                request.purpose
                              }
                            </p>
                          </td>

                          <td className="py-4 pr-6">
                            <StatusBadge
                              status={
                                request.status
                              }
                            />
                          </td>

                          <td className="py-4 pr-6">
                            <div className="flex justify-end gap-2">
                              <Link
                                to={`/employee/requests/${request.id}`}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                View
                              </Link>

                              {request.status ===
                                'PENDING' && (
                                <button
                                  type="button"
                                  disabled={
                                    processing
                                  }
                                  onClick={() =>
                                    void handleCancel(
                                      request,
                                    )
                                  }
                                  className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                                >
                                  {processing
                                    ? 'Cancelling...'
                                    : 'Cancel'}
                                </button>
                              )}

                              {request.status ===
                                'CANCELLED' && (
                                <button
                                  type="button"
                                  disabled={
                                    processing
                                  }
                                  onClick={() =>
                                    void handleDelete(
                                      request,
                                    )
                                  }
                                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
                                >
                                  {processing
                                    ? 'Deleting...'
                                    : 'Delete'}
                                </button>
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
        </section>
      </section>
    </>
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
      {status}
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
          month: 'short',
          day: 'numeric',
          year: 'numeric',
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

  const date =
    new Date()

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

export default MyRequestsPage