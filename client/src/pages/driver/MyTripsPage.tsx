import axios from 'axios'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  cancelTrip,
  completeTrip,
  getTripsByDriverId,
  startTrip,
} from '../../services/trip.service'

import {
  getDriverByUserId,
} from '../../services/driver.service'

import {
  createFuelLog,
} from '../../services/fuel-log.service'

import {
  createVehicleIssueReport,
} from '../../services/vehicle-issue-report.service'

import {
  getCurrentUser,
} from '../../utils/user-session'

import type {
  Trip,
  TripStatus,
} from '../../types/trip'

import type {
  Driver,
} from '../../types/driver'

type TripFilter =
  | 'ALL'
  | TripStatus

type PostTripForm = {
  fuelDate: string
  fuelStation: string
  liters: string
  cost: string

  issueTitle: string
  issueDescription: string
}

function createEmptyPostTripForm(): PostTripForm {
  return {
    fuelDate:
      new Date()
        .toISOString()
        .split('T')[0],

    fuelStation: '',
    liters: '',
    cost: '',

    issueTitle: '',
    issueDescription: '',
  }
}

function MyTripsPage() {
  const [driver, setDriver] =
    useState<Driver | null>(null)

  const [trips, setTrips] =
    useState<Trip[]>([])

  const [filter, setFilter] =
    useState<TripFilter>('ALL')

  const [loading, setLoading] =
    useState(true)

  const [
    actionTripId,
    setActionTripId,
  ] = useState<number | null>(null)

  const [
    selectedTrip,
    setSelectedTrip,
  ] = useState<Trip | null>(
    null,
  )

  const [
    completingTrip,
    setCompletingTrip,
  ] = useState<Trip | null>(
    null,
  )

  const [
    postTripForm,
    setPostTripForm,
  ] = useState<PostTripForm>(
    createEmptyPostTripForm(),
  )

  const [
    postTripError,
    setPostTripError,
  ] = useState('')

  const [
    savingPostTrip,
    setSavingPostTrip,
  ] = useState(false)

  const [error, setError] =
    useState('')

  useEffect(() => {
    void loadTrips()
  }, [])

  async function loadTrips() {
    const currentUser =
      getCurrentUser()

    if (!currentUser) {
      setError(
        'Your login session was not found.',
      )

      setLoading(false)
      return
    }

    if (
      currentUser.role !==
      'DRIVER'
    ) {
      setError(
        'This page is only available for driver accounts.',
      )

      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError('')

      const driverData =
        await getDriverByUserId(
          currentUser.id,
        )

      const tripData =
        await getTripsByDriverId(
          driverData.id,
        )

      setDriver(
        driverData,
      )

      setTrips(
        tripData,
      )

      setSelectedTrip(
        (currentTrip) => {
          if (!currentTrip) {
            return null
          }

          return (
            tripData.find(
              (trip) =>
                trip.id ===
                currentTrip.id,
            ) ?? null
          )
        },
      )
    } catch (error) {
      console.error(error)

      setError(
        getApiErrorMessage(
          error,
          'Failed to load your trips.',
        ),
      )
    } finally {
      setLoading(false)
    }
  }

  /* =====================================================
     START TRIP
  ===================================================== */

  async function handleStart(
    trip: Trip,
  ) {
    const confirmed =
      window.confirm(
        `Start TRIP-${trip.id}?`,
      )

    if (!confirmed) {
      return
    }

    await performTripAction(
      trip.id,
      startTrip,
      'Failed to start the trip.',
    )
  }

  /* =====================================================
     OPEN POST-TRIP FORM
  ===================================================== */

  function handleComplete(
    trip: Trip,
  ) {
    if (
      trip.status !==
      'IN_PROGRESS'
    ) {
      setError(
        'Only an in-progress trip can be completed.',
      )

      return
    }

    setSelectedTrip(null)

    setCompletingTrip(
      trip,
    )

    setPostTripForm(
      createEmptyPostTripForm(),
    )

    setPostTripError('')
  }

  function closePostTripModal() {
    if (savingPostTrip) {
      return
    }

    setCompletingTrip(
      null,
    )

    setPostTripForm(
      createEmptyPostTripForm(),
    )

    setPostTripError('')
  }

  /* =====================================================
     COMPLETE TRIP + OPTIONAL REPORTS
  ===================================================== */

  async function handlePostTripSubmit(
    event:
      React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (
      !completingTrip ||
      !driver
    ) {
      return
    }

    const fuelStation =
      postTripForm.fuelStation.trim()

    const litersText =
      postTripForm.liters.trim()

    const costText =
      postTripForm.cost.trim()

    const issueTitle =
      postTripForm.issueTitle.trim()

    const issueDescription =
      postTripForm.issueDescription.trim()

    /*
     * Fuel record is optional.
     *
     * If the driver fills ANY fuel field,
     * we treat it as an attempt to create
     * a fuel record.
     */
    const hasFuelData =
      Boolean(fuelStation) ||
      Boolean(litersText) ||
      Boolean(costText)

    /*
     * Vehicle issue is also optional.
     */
    const hasIssueData =
      Boolean(issueTitle) ||
      Boolean(issueDescription)

    let liters = 0
    let cost = 0

    if (hasFuelData) {
      liters =
        Number(litersText)

      cost =
        Number(costText)

      if (
        !litersText ||
        Number.isNaN(liters) ||
        liters <= 0
      ) {
        setPostTripError(
          'Please enter a valid fuel amount greater than 0 litres.',
        )

        return
      }

      if (
        !costText ||
        Number.isNaN(cost) ||
        cost < 0
      ) {
        setPostTripError(
          'Please enter a valid fuel cost.',
        )

        return
      }
    }

    if (hasIssueData) {
      if (
        !issueTitle ||
        !issueDescription
      ) {
        setPostTripError(
          'Please enter both the issue title and description, or leave both fields blank.',
        )

        return
      }

      if (
        issueTitle.length < 3
      ) {
        setPostTripError(
          'Issue title must contain at least 3 characters.',
        )

        return
      }

      if (
        issueDescription.length <
        10
      ) {
        setPostTripError(
          'Issue description must contain at least 10 characters.',
        )

        return
      }
    }

    const confirmed =
      window.confirm(
        `Complete TRIP-${completingTrip.id}?`,
      )

    if (!confirmed) {
      return
    }

    try {
      setSavingPostTrip(
        true,
      )

      setPostTripError('')
      setError('')

      /*
       * Save optional fuel record.
       *
       * The important part is tripId.
       * This allows the fuel record to
       * remain connected to this trip.
       */
      if (hasFuelData) {
        await createFuelLog({
          vehicleId:
            completingTrip.vehicleId,

          driverId:
            driver.id,

          tripId:
            completingTrip.id,

          fuelDate:
            postTripForm.fuelDate,

          liters,

          cost,

          fuelStation:
            fuelStation ||
            undefined,
        })
      }

      /*
       * Save optional vehicle issue.
       *
       * We keep this as a
       * VehicleIssueReport rather than
       * directly creating Maintenance.
       * Admin will decide whether the
       * issue requires maintenance.
       */
      if (hasIssueData) {
        await createVehicleIssueReport({
          vehicleId:
            completingTrip.vehicleId,

          driverId:
            driver.id,

          issueTitle,

          description:
            issueDescription,
        })
      }

      /*
       * Complete the trip only after
       * optional information was saved.
       */
      const updatedTrip =
        await completeTrip(
          completingTrip.id,
        )

      setTrips(
        (currentTrips) =>
          currentTrips.map(
            (trip) =>
              trip.id ===
              updatedTrip.id
                ? updatedTrip
                : trip,
          ),
      )

      setDriver(
        (currentDriver) =>
          currentDriver
            ? {
                ...currentDriver,

                availabilityStatus:
                  'AVAILABLE',
              }
            : currentDriver,
      )

      setCompletingTrip(
        null,
      )

      setPostTripForm(
        createEmptyPostTripForm(),
      )

      setPostTripError('')
    } catch (error) {
      console.error(error)

      setPostTripError(
        getApiErrorMessage(
          error,
          'Failed to save the post-trip information.',
        ),
      )
    } finally {
      setSavingPostTrip(
        false,
      )
    }
  }

  /* =====================================================
     CANCEL TRIP
  ===================================================== */

  async function handleCancel(
    trip: Trip,
  ) {
    const confirmed =
      window.confirm(
        `Cancel TRIP-${trip.id}?`,
      )

    if (!confirmed) {
      return
    }

    await performTripAction(
      trip.id,
      cancelTrip,
      'Failed to cancel the trip.',
    )
  }

  /* =====================================================
     NORMAL TRIP ACTION
  ===================================================== */

  async function performTripAction(
    tripId: number,

    action: (
      id: number,
    ) => Promise<Trip>,

    fallbackMessage: string,
  ) {
    try {
      setActionTripId(
        tripId,
      )

      setError('')

      const updatedTrip =
        await action(
          tripId,
        )

      setTrips(
        (currentTrips) =>
          currentTrips.map(
            (trip) =>
              trip.id ===
              updatedTrip.id
                ? updatedTrip
                : trip,
          ),
      )

      setSelectedTrip(
        (currentTrip) =>
          currentTrip?.id ===
          updatedTrip.id
            ? updatedTrip
            : currentTrip,
      )

      if (
        updatedTrip.status ===
        'IN_PROGRESS'
      ) {
        setDriver(
          (currentDriver) =>
            currentDriver
              ? {
                  ...currentDriver,

                  availabilityStatus:
                    'ON_TRIP',
                }
              : currentDriver,
        )
      }

      if (
        updatedTrip.status ===
          'COMPLETED' ||
        updatedTrip.status ===
          'CANCELLED'
      ) {
        setDriver(
          (currentDriver) =>
            currentDriver
              ? {
                  ...currentDriver,

                  availabilityStatus:
                    'AVAILABLE',
                }
              : currentDriver,
        )
      }
    } catch (error) {
      console.error(error)

      setError(
        getApiErrorMessage(
          error,
          fallbackMessage,
        ),
      )
    } finally {
      setActionTripId(
        null,
      )
    }
  }

  /* =====================================================
     DATA
  ===================================================== */

  const filteredTrips =
    useMemo(() => {
      if (
        filter === 'ALL'
      ) {
        return trips
      }

      return trips.filter(
        (trip) =>
          trip.status ===
          filter,
      )
    }, [
      trips,
      filter,
    ])

  const counts =
    useMemo(
      () => ({
        scheduled:
          trips.filter(
            (trip) =>
              trip.status ===
              'SCHEDULED',
          ).length,

        inProgress:
          trips.filter(
            (trip) =>
              trip.status ===
              'IN_PROGRESS',
          ).length,

        completed:
          trips.filter(
            (trip) =>
              trip.status ===
              'COMPLETED',
          ).length,

        cancelled:
          trips.filter(
            (trip) =>
              trip.status ===
              'CANCELLED',
          ).length,
      }),
      [trips],
    )

  const filters:
    TripFilter[] = [
      'ALL',
      'SCHEDULED',
      'IN_PROGRESS',
      'COMPLETED',
      'CANCELLED',
    ]

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <>
      {/* =========================
          HEADER
      ========================== */}

      <header className="flex min-h-[72px] items-center justify-between border-b border-slate-200 bg-white px-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-950">
            My Trips
          </h1>

          <p className="mt-0.5 text-sm text-slate-500">
            View and manage your
            assigned transport trips.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            void loadTrips()
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
            HERO
        ========================== */}

        <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 px-7 py-6 text-white shadow-sm">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-200">
                Trip operations
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Your transport
                assignments
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Review trip details,
                start assigned journeys
                and record post-trip
                information when your
                journey is complete.
              </p>
            </div>

            <div className="flex gap-3">
              <HeroStatus
                label="Driver"
                value={
                  driver?.user.name ??
                  'Driver'
                }
              />

              <HeroStatus
                label="Status"
                value={
                  driver
                    ?.availabilityStatus
                    ? formatStatus(
                        driver.availabilityStatus,
                      )
                    : 'Unavailable'
                }
              />
            </div>
          </div>
        </div>

        {/* =========================
            STATS
        ========================== */}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Scheduled"
            value={
              counts.scheduled
            }
            tone="blue"
          />

          <StatCard
            label="In Progress"
            value={
              counts.inProgress
            }
            tone="amber"
          />

          <StatCard
            label="Completed"
            value={
              counts.completed
            }
            tone="green"
          />

          <StatCard
            label="Cancelled"
            value={
              counts.cancelled
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
            TABLE CARD
        ========================== */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h3 className="font-semibold text-slate-950">
                Trip history
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {filteredTrips.length}{' '}
                trips shown
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {filters.map(
                (status) => (
                  <button
                    key={
                      status
                    }
                    type="button"
                    onClick={() =>
                      setFilter(
                        status,
                      )
                    }
                    className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                      filter ===
                      status
                        ? 'bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 text-white shadow-sm'
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
          </div>

          {loading && (
            <div className="p-12 text-center text-sm text-slate-500">
              Loading your trips...
            </div>
          )}

          {!loading &&
            filteredTrips.length ===
              0 && (
              <div className="p-12 text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-500">
                  TR
                </div>

                <p className="mt-4 font-semibold text-slate-700">
                  No trips found
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Assigned trips will
                  appear here.
                </p>
              </div>
            )}

          {!loading &&
            filteredTrips.length >
              0 && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-6 py-4">
                        Trip
                      </th>

                      <th className="py-4 pr-6">
                        Passenger
                      </th>

                      <th className="py-4 pr-6">
                        Route
                      </th>

                      <th className="py-4 pr-6">
                        Schedule
                      </th>

                      <th className="py-4 pr-6">
                        Vehicle
                      </th>

                      <th className="py-4 pr-6">
                        Status
                      </th>

                      <th className="py-4 pr-6 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredTrips.map(
                      (trip) => {
                        const isProcessing =
                          actionTripId ===
                          trip.id

                        return (
                          <tr
                            key={
                              trip.id
                            }
                            className="border-b border-slate-100 transition last:border-b-0 hover:bg-slate-50/80"
                          >
                            <td className="px-6 py-4">
                              <p className="font-semibold text-slate-900">
                                TRIP-
                                {
                                  trip.id
                                }
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                Driver trip
                              </p>
                            </td>

                            <td className="py-4 pr-6">
                              <p className="font-semibold text-slate-800">
                                {trip
                                  .request
                                  ?.employee
                                  ?.name ??
                                  'Unknown'}
                              </p>

                              <p className="mt-1 max-w-[180px] truncate text-xs text-slate-500">
                                {trip
                                  .request
                                  ?.employee
                                  ?.email ??
                                  'Unavailable'}
                              </p>
                            </td>

                            <td className="max-w-[250px] py-4 pr-6">
                              <p
                                className="truncate font-medium text-slate-800"
                                title={
                                  trip
                                    .request
                                    ?.pickupLocation ??
                                  ''
                                }
                              >
                                {trip
                                  .request
                                  ?.pickupLocation ??
                                  'Unavailable'}
                              </p>

                              <p
                                className="mt-1 truncate text-xs text-slate-500"
                                title={
                                  trip
                                    .request
                                    ?.destination ??
                                  ''
                                }
                              >
                                to{' '}
                                {trip
                                  .request
                                  ?.destination ??
                                  'Unavailable'}
                              </p>
                            </td>

                            <td className="whitespace-nowrap py-4 pr-6">
                              <p className="font-medium text-slate-700">
                                {trip.request
                                  ? formatDate(
                                      trip
                                        .request
                                        .requestDate,
                                    )
                                  : '—'}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {trip.request
                                  ? formatTime(
                                      trip
                                        .request
                                        .requestTime,
                                    )
                                  : '—'}
                              </p>
                            </td>

                            <td className="py-4 pr-6">
                              <p className="font-semibold text-slate-800">
                                {trip
                                  .vehicle
                                  ?.plateNumber ??
                                  `Vehicle ${trip.vehicleId}`}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {trip
                                  .vehicle
                                  ?.vehicleType ??
                                  '—'}
                              </p>
                            </td>

                            <td className="py-4 pr-6">
                              <TripStatusBadge
                                status={
                                  trip.status
                                }
                              />
                            </td>

                            <td className="py-4 pr-6">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedTrip(
                                      trip,
                                    )
                                  }
                                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                                >
                                  View
                                </button>

                                {trip.status ===
                                  'SCHEDULED' && (
                                  <button
                                    type="button"
                                    disabled={
                                      isProcessing
                                    }
                                    onClick={() =>
                                      void handleStart(
                                        trip,
                                      )
                                    }
                                    className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-40"
                                  >
                                    {isProcessing
                                      ? 'Starting...'
                                      : 'Start'}
                                  </button>
                                )}

                                {trip.status ===
                                  'IN_PROGRESS' && (
                                  <button
                                    type="button"
                                    disabled={
                                      isProcessing
                                    }
                                    onClick={() =>
                                      handleComplete(
                                        trip,
                                      )
                                    }
                                    className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-40"
                                  >
                                    Complete
                                  </button>
                                )}

                                {(trip.status ===
                                  'SCHEDULED' ||
                                  trip.status ===
                                    'IN_PROGRESS') && (
                                  <button
                                    type="button"
                                    disabled={
                                      isProcessing
                                    }
                                    onClick={() =>
                                      void handleCancel(
                                        trip,
                                      )
                                    }
                                    className="rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-40"
                                  >
                                    Cancel
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
        </div>
      </section>

      {/* =========================
          TRIP DETAILS
      ========================== */}

      {selectedTrip && (
        <TripDetailsModal
          trip={
            selectedTrip
          }
          processing={
            actionTripId ===
            selectedTrip.id
          }
          onClose={() =>
            setSelectedTrip(
              null,
            )
          }
          onStart={() =>
            void handleStart(
              selectedTrip,
            )
          }
          onComplete={() =>
            handleComplete(
              selectedTrip,
            )
          }
          onCancel={() =>
            void handleCancel(
              selectedTrip,
            )
          }
        />
      )}

      {/* =========================
          POST TRIP REPORT
      ========================== */}

      {completingTrip && (
        <PostTripReportModal
          trip={
            completingTrip
          }
          formData={
            postTripForm
          }
          saving={
            savingPostTrip
          }
          error={
            postTripError
          }
          onChange={(
            field,
            value,
          ) => {
            setPostTripForm(
              (current) => ({
                ...current,
                [field]:
                  value,
              }),
            )

            if (
              postTripError
            ) {
              setPostTripError(
                '',
              )
            }
          }}
          onClose={
            closePostTripModal
          }
          onSubmit={
            handlePostTripSubmit
          }
        />
      )}
    </>
  )
}

/* =========================================================
   POST TRIP REPORT
========================================================= */

function PostTripReportModal({
  trip,
  formData,
  saving,
  error,
  onChange,
  onClose,
  onSubmit,
}: {
  trip: Trip
  formData: PostTripForm
  saving: boolean
  error: string

  onChange: (
    field: keyof PostTripForm,
    value: string,
  ) => void

  onClose: () => void

  onSubmit: (
    event:
      React.FormEvent<HTMLFormElement>,
  ) => void
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-[2px]">
      <div className="my-8 flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* HEADER */}

        <div className="shrink-0 bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-200">
                Trip completion
              </p>

              <h2 className="mt-1 text-xl font-semibold">
                Post-Trip Report
              </h2>

              <p className="mt-1 text-sm text-slate-300">
                TRIP-
                {trip.id} •{' '}
                {trip.vehicle
                  ?.plateNumber ??
                  `Vehicle ${trip.vehicleId}`}
              </p>
            </div>

            <button
              type="button"
              onClick={
                onClose
              }
              disabled={
                saving
              }
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xl text-slate-200 transition hover:bg-white/20 disabled:opacity-50"
            >
              ×
            </button>
          </div>
        </div>

        <form
          onSubmit={
            onSubmit
          }
          className="overflow-y-auto"
        >
          <div className="space-y-6 p-6">
            {/* TRIP SUMMARY */}

            <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <ModalInformation
                  label="Vehicle"
                  value={
                    trip.vehicle
                      ?.plateNumber ??
                    `Vehicle ${trip.vehicleId}`
                  }
                />

                <ModalInformation
                  label="Passenger"
                  value={
                    trip.request
                      ?.employee
                      ?.name ??
                    'Unknown'
                  }
                />

                <ModalInformation
                  label="Destination"
                  value={
                    trip.request
                      ?.destination ??
                    'Unavailable'
                  }
                />
              </div>
            </section>

            <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-800">
              Fuel and vehicle issue
              information are optional.
              If there was no refuelling
              and no vehicle problem,
              leave the sections blank
              and complete the trip.
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* FUEL */}

            <section className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      Fuel Record
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Optional — complete
                      this section only if
                      fuel was added.
                    </p>
                  </div>

                  <OptionalBadge />
                </div>
              </div>

              <div className="grid gap-4 p-5 sm:grid-cols-2">
                <FormField
                  label="Fuel Date"
                >
                  <input
                    type="date"
                    value={
                      formData.fuelDate
                    }
                    onChange={(
                      event,
                    ) =>
                      onChange(
                        'fuelDate',
                        event
                          .target
                          .value,
                      )
                    }
                    className={
                      inputClass
                    }
                  />
                </FormField>

                <FormField
                  label="Fuel Station"
                >
                  <input
                    type="text"
                    value={
                      formData.fuelStation
                    }
                    onChange={(
                      event,
                    ) =>
                      onChange(
                        'fuelStation',
                        event
                          .target
                          .value,
                      )
                    }
                    placeholder="e.g. PT, Shell"
                    className={
                      inputClass
                    }
                  />
                </FormField>

                <FormField
                  label="Litres"
                >
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={
                      formData.liters
                    }
                    onChange={(
                      event,
                    ) =>
                      onChange(
                        'liters',
                        event
                          .target
                          .value,
                      )
                    }
                    placeholder="e.g. 30"
                    className={
                      inputClass
                    }
                  />
                </FormField>

                <FormField
                  label="Cost (MMK)"
                >
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={
                      formData.cost
                    }
                    onChange={(
                      event,
                    ) =>
                      onChange(
                        'cost',
                        event
                          .target
                          .value,
                      )
                    }
                    placeholder="e.g. 75000"
                    className={
                      inputClass
                    }
                  />
                </FormField>
              </div>
            </section>

            {/* VEHICLE ISSUE */}

            <section className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      Vehicle Issue
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Optional — report
                      anything that should
                      be reviewed by fleet
                      management.
                    </p>
                  </div>

                  <OptionalBadge />
                </div>
              </div>

              <div className="space-y-4 p-5">
                <FormField
                  label="Issue Title"
                >
                  <input
                    type="text"
                    value={
                      formData.issueTitle
                    }
                    onChange={(
                      event,
                    ) =>
                      onChange(
                        'issueTitle',
                        event
                          .target
                          .value,
                      )
                    }
                    placeholder="e.g. Brake noise"
                    className={
                      inputClass
                    }
                  />
                </FormField>

                <FormField
                  label="Description"
                >
                  <textarea
                    rows={4}
                    value={
                      formData.issueDescription
                    }
                    onChange={(
                      event,
                    ) =>
                      onChange(
                        'issueDescription',
                        event
                          .target
                          .value,
                      )
                    }
                    placeholder="Describe what you noticed during the trip..."
                    className={`${inputClass} resize-none`}
                  />
                </FormField>
              </div>
            </section>
          </div>

          {/* FOOTER */}

          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-white px-6 py-5">
            <p className="text-xs text-slate-500">
              Completing the trip will
              mark you and the vehicle
              available again.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                disabled={
                  saving
                }
                onClick={
                  onClose
                }
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Back
              </button>

              <button
                type="submit"
                disabled={
                  saving
                }
                className="rounded-xl bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? 'Completing Trip...'
                  : 'Complete Trip'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

/* =========================================================
   TRIP DETAILS MODAL
========================================================= */

function TripDetailsModal({
  trip,
  processing,
  onClose,
  onStart,
  onComplete,
  onCancel,
}: {
  trip: Trip
  processing: boolean
  onClose: () => void
  onStart: () => void
  onComplete: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-[2px]">
      <div className="my-8 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="shrink-0 bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-200">
                Assigned trip
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-semibold">
                  TRIP-
                  {trip.id}
                </h2>

                <TripStatusBadge
                  status={
                    trip.status
                  }
                />
              </div>
            </div>

            <button
              type="button"
              onClick={
                onClose
              }
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xl text-slate-200 transition hover:bg-white/20"
            >
              ×
            </button>
          </div>
        </div>

        <div className="overflow-y-auto p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <DetailCard
              label="Passenger"
              value={
                trip.request
                  ?.employee
                  ?.name ??
                'Unknown'
              }
              secondary={
                trip.request
                  ?.employee
                  ?.email
              }
            />

            <DetailCard
              label="Vehicle"
              value={
                trip.vehicle
                  ?.plateNumber ??
                `Vehicle ${trip.vehicleId}`
              }
              secondary={
                trip.vehicle
                  ?.vehicleType
              }
            />

            <DetailCard
              label="Schedule"
              value={
                trip.request
                  ? formatDate(
                      trip.request
                        .requestDate,
                    )
                  : 'Unavailable'
              }
              secondary={
                trip.request
                  ? formatTime(
                      trip.request
                        .requestTime,
                    )
                  : undefined
              }
            />

            <DetailCard
              label="Started"
              value={
                trip.startTime
                  ? formatDateTime(
                      trip.startTime,
                    )
                  : 'Not started'
              }
            />

            <DetailCard
              label="Ended"
              value={
                trip.endTime
                  ? formatDateTime(
                      trip.endTime,
                    )
                  : 'Not ended'
              }
            />

            <DetailCard
              label="Purpose"
              value={
                trip.request
                  ?.purpose ??
                'No purpose provided'
              }
            />
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="grid gap-6 md:grid-cols-2">
              <RoutePoint
                label="Pickup"
                value={
                  trip.request
                    ?.pickupLocation ??
                  'Unavailable'
                }
                tone="blue"
              />

              <RoutePoint
                label="Destination"
                value={
                  trip.request
                    ?.destination ??
                  'Unavailable'
                }
                tone="indigo"
              />
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-slate-100 bg-white px-6 py-5">
          <button
            type="button"
            onClick={
              onClose
            }
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Close
          </button>

          {trip.status ===
            'SCHEDULED' && (
            <button
              type="button"
              disabled={
                processing
              }
              onClick={
                onStart
              }
              className="rounded-xl bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {processing
                ? 'Starting...'
                : 'Start Trip'}
            </button>
          )}

          {trip.status ===
            'IN_PROGRESS' && (
            <button
              type="button"
              disabled={
                processing
              }
              onClick={
                onComplete
              }
              className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              Complete Trip
            </button>
          )}

          {(trip.status ===
            'SCHEDULED' ||
            trip.status ===
              'IN_PROGRESS') && (
            <button
              type="button"
              disabled={
                processing
              }
              onClick={
                onCancel
              }
              className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
            >
              Cancel Trip
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

function HeroStatus({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="min-w-[130px] rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur-sm">
      <p className="text-xs text-slate-400">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-semibold text-white">
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
    | 'blue'
    | 'amber'
    | 'green'
    | 'red'
}) {
  const styles = {
    blue:
      'bg-blue-50 text-blue-700',

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

function TripStatusBadge({
  status,
}: {
  status: TripStatus
}) {
  const styles:
    Record<
      TripStatus,
      string
    > = {
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

function DetailCard({
  label,
  value,
  secondary,
}: {
  label: string
  value: string
  secondary?: string | null
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 break-words font-semibold text-slate-800">
        {value}
      </p>

      {secondary && (
        <p className="mt-1 text-xs text-slate-500">
          {secondary}
        </p>
      )}
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

  tone:
    | 'blue'
    | 'indigo'
}) {
  const style =
    tone === 'blue'
      ? 'bg-blue-500 ring-blue-100'
      : 'bg-indigo-500 ring-indigo-100'

  return (
    <div className="flex items-start gap-4">
      <span
        className={`mt-1 h-3 w-3 shrink-0 rounded-full ring-4 ${style}`}
      />

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-semibold leading-6 text-slate-800">
          {value}
        </p>
      </div>
    </div>
  )
}

function ModalInformation({
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

      <p className="mt-1 truncate text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  )
}

function OptionalBadge() {
  return (
    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
      OPTIONAL
    </span>
  )
}

function FormField({
  label,
  children,
}: {
  label: string
  children:
    React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>

      {children}
    </label>
  )
}

const inputClass =
  'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

/* =========================================================
   FORMATTERS
========================================================= */

function formatStatus(
  value: string,
) {
  return value
    .replaceAll(
      '_',
      ' ',
    )
    .toLowerCase()
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
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

function formatTime(
  value: string,
) {
  const [
    hours,
    minutes,
  ] = value
    .split(':')
    .map(Number)

  if (
    Number.isNaN(
      hours,
    ) ||
    Number.isNaN(
      minutes,
    )
  ) {
    return value
  }

  const date =
    new Date()

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

/* =========================================================
   API ERROR
========================================================= */

function getApiErrorMessage(
  error: unknown,
  fallback: string,
) {
  if (
    !axios.isAxiosError(
      error,
    )
  ) {
    return fallback
  }

  const message =
    error.response?.data
      ?.message

  if (
    Array.isArray(
      message,
    )
  ) {
    return message.join(
      ', ',
    )
  }

  if (
    typeof message ===
    'string'
  ) {
    return message
  }

  if (
    !error.response
  ) {
    return 'Unable to connect to the server.'
  }

  return fallback
}

export default MyTripsPage