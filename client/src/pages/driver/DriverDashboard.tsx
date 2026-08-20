import axios from 'axios'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  Link,
} from 'react-router-dom'

import {
  getDriverByUserId,
} from '../../services/driver.service'

import {
  completeTrip,
  getTripsByDriverId,
  startTrip,
} from '../../services/trip.service'

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
  Driver,
  DriverAvailabilityStatus,
} from '../../types/driver'

import type {
  Trip,
  TripStatus,
} from '../../types/trip'

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

function DriverDashboard() {
  const [driver, setDriver] =
    useState<Driver | null>(null)

  const [trips, setTrips] =
    useState<Trip[]>([])

  const [loading, setLoading] =
    useState(true)

  const [
    actionTripId,
    setActionTripId,
  ] = useState<number | null>(null)

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
    void loadDashboard()
  }, [])

  async function loadDashboard() {
    const currentUser =
      getCurrentUser()

    if (!currentUser) {
      setError(
        'Your login session was not found. Please sign in again.',
      )

      setLoading(false)
      return
    }

    if (
      currentUser.role !==
      'DRIVER'
    ) {
      setError(
        'This dashboard is only available for driver accounts.',
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
        sortTrips(
          tripData,
        ),
      )
    } catch (error) {
      console.error(error)

      setError(
        getApiErrorMessage(
          error,
          'Failed to load the driver dashboard.',
        ),
      )
    } finally {
      setLoading(false)
    }
  }

  const scheduledTrips =
    useMemo(
      () =>
        trips.filter(
          (trip) =>
            trip.status ===
            'SCHEDULED',
        ),
      [trips],
    )

  const inProgressTrips =
    useMemo(
      () =>
        trips.filter(
          (trip) =>
            trip.status ===
            'IN_PROGRESS',
        ),
      [trips],
    )

  const completedTrips =
    useMemo(
      () =>
        trips.filter(
          (trip) =>
            trip.status ===
            'COMPLETED',
        ),
      [trips],
    )

  const cancelledTrips =
    useMemo(
      () =>
        trips.filter(
          (trip) =>
            trip.status ===
            'CANCELLED',
        ),
      [trips],
    )

  const activeTrip =
    useMemo(() => {
      const inProgressTrip =
        trips.find(
          (trip) =>
            trip.status ===
            'IN_PROGRESS',
        )

      if (inProgressTrip) {
        return inProgressTrip
      }

      return (
        scheduledTrips[0] ??
        null
      )
    }, [
      trips,
      scheduledTrips,
    ])

  const upcomingTrips =
    useMemo(
      () =>
        scheduledTrips
          .filter(
            (trip) =>
              trip.id !==
              activeTrip?.id,
          )
          .slice(0, 5),
      [
        scheduledTrips,
        activeTrip,
      ],
    )

  async function handleStartTrip(
    trip: Trip,
  ) {
    const confirmed =
      window.confirm(
        `Start TRIP-${trip.id}?`,
      )

    if (!confirmed) {
      return
    }

    try {
      setActionTripId(
        trip.id,
      )

      setError('')

      const updatedTrip =
        await startTrip(
          trip.id,
        )

      setTrips(
        (currentTrips) =>
          sortTrips(
            currentTrips.map(
              (item) =>
                item.id ===
                updatedTrip.id
                  ? updatedTrip
                  : item,
            ),
          ),
      )

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
    } catch (error) {
      console.error(error)

      setError(
        getApiErrorMessage(
          error,
          'Failed to start the trip.',
        ),
      )
    } finally {
      setActionTripId(
        null,
      )
    }
  }

  /* =====================================================
     OPEN POST-TRIP REPORT
  ===================================================== */

  function handleCompleteTrip(
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
     SAVE POST-TRIP REPORT
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

    const hasFuelData =
      Boolean(fuelStation) ||
      Boolean(litersText) ||
      Boolean(costText)

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

      const updatedTrip =
        await completeTrip(
          completingTrip.id,
        )

      setTrips(
        (currentTrips) =>
          sortTrips(
            currentTrips.map(
              (trip) =>
                trip.id ===
                updatedTrip.id
                  ? updatedTrip
                  : trip,
            ),
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

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-slate-50 p-8">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="mt-4 text-sm text-slate-500">
            Loading your dashboard...
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* =========================
          HEADER
      ========================== */}

      <header className="flex min-h-[72px] items-center justify-between border-b border-slate-200 bg-white px-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-950">
            Driver Dashboard
          </h1>

          <p className="mt-0.5 text-sm text-slate-500">
            View your assignments,
            vehicle and trip activity.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            void loadDashboard()
          }
          className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Refresh
        </button>
      </header>

      <section className="mx-auto max-w-[1600px] p-8">
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* =========================
            HERO
        ========================== */}

        <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 px-7 py-7 text-white shadow-sm">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-200">
                Driver operations
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Welcome back,{' '}
                {driver?.user.name ??
                  'Driver'}
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
                Keep track of your
                assigned vehicle, current
                trip and upcoming
                transport assignments.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <HeroStatusItem
                label="Availability"
                value={
                  driver
                    ?.availabilityStatus
                    ? formatStatus(
                        driver.availabilityStatus,
                      )
                    : 'Unavailable'
                }
              />

              <HeroStatusItem
                label="Assigned Vehicle"
                value={
                  driver
                    ?.assignedVehicle
                    ?.plateNumber ??
                  'None'
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
            label="Scheduled Trips"
            value={
              scheduledTrips.length
            }
            tone="blue"
          />

          <StatCard
            label="In Progress"
            value={
              inProgressTrips.length
            }
            tone="amber"
          />

          <StatCard
            label="Completed Trips"
            value={
              completedTrips.length
            }
            tone="green"
          />

          <StatCard
            label="Cancelled Trips"
            value={
              cancelledTrips.length
            }
            tone="red"
          />
        </div>

        {/* =========================
            CURRENT TRIP
        ========================== */}

        <div className="mb-6 grid gap-6 xl:grid-cols-[1.7fr_0.8fr]">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Current assignment
                </p>

                <h3 className="mt-1 text-lg font-semibold text-slate-950">
                  {activeTrip
                    ? `TRIP-${activeTrip.id}`
                    : 'No active trip'}
                </h3>
              </div>

              {activeTrip && (
                <TripStatusBadge
                  status={
                    activeTrip.status
                  }
                />
              )}
            </div>

            {!activeTrip ? (
              <EmptyCurrentTrip />
            ) : (
              <CurrentTripCard
                trip={
                  activeTrip
                }
              />
            )}

            {activeTrip && (
              <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                <Link
                  to="/driver/my-trips"
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  View Details
                </Link>

                {activeTrip.status ===
                  'SCHEDULED' && (
                  <button
                    type="button"
                    disabled={
                      actionTripId ===
                      activeTrip.id
                    }
                    onClick={() =>
                      void handleStartTrip(
                        activeTrip,
                      )
                    }
                    className="rounded-xl bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:opacity-50"
                  >
                    {actionTripId ===
                    activeTrip.id
                      ? 'Starting...'
                      : 'Start Trip'}
                  </button>
                )}

                {activeTrip.status ===
                  'IN_PROGRESS' && (
                  <button
                    type="button"
                    disabled={
                      savingPostTrip
                    }
                    onClick={() =>
                      handleCompleteTrip(
                        activeTrip,
                      )
                    }
                    className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Complete Trip
                  </button>
                )}
              </div>
            )}
          </section>

          {/* QUICK ACTIONS */}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Shortcuts
            </p>

            <h3 className="mt-1 text-lg font-semibold text-slate-950">
              Quick Actions
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Access common driver
              activities.
            </p>

            <div className="mt-5 space-y-3">
              <QuickActionLink
                to="/driver/my-trips"
                label="My Trips"
                description="View current and previous assignments"
              />

              <QuickActionLink
                to="/driver/fuel-logs"
                label="Fuel Records"
                description="Record and review fuel activity"
              />

              <QuickActionLink
                to="/driver/vehicle-issues"
                label="Vehicle Issues"
                description="Report a vehicle problem"
              />

              <QuickActionLink
                to="/driver/my-vehicle"
                label="My Vehicle"
                description="View assigned vehicle details"
              />
            </div>
          </section>
        </div>

        {/* =========================
            DRIVER / VEHICLE
        ========================== */}

        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          <InformationCard
            title="Driver Status"
          >
            <InformationRow
              label="Driver"
              value={
                driver?.user.name ??
                'Unavailable'
              }
            />

            <InformationRow
              label="Availability"
              value={
                driver
                  ?.availabilityStatus
                  ? formatStatus(
                      driver.availabilityStatus,
                    )
                  : 'Unavailable'
              }
              badge={
                driver
                  ?.availabilityStatus
              }
            />

            <InformationRow
              label="Licence"
              value={
                driver?.licenseNumber ??
                'Unavailable'
              }
            />
          </InformationCard>

          <InformationCard
            title="Assigned Vehicle"
          >
            <InformationRow
              label="Plate Number"
              value={
                driver
                  ?.assignedVehicle
                  ?.plateNumber ??
                'Not assigned'
              }
            />

            <InformationRow
              label="Vehicle"
              value={
                driver
                  ?.assignedVehicle
                  ?.vehicleType ??
                'Unavailable'
              }
            />

            <InformationRow
              label="Vehicle Status"
              value={
                driver
                  ?.assignedVehicle
                  ?.status
                  ? formatStatus(
                      driver
                        .assignedVehicle
                        .status,
                    )
                  : 'Unavailable'
              }
            />
          </InformationCard>
        </div>

        {/* =========================
            UPCOMING TRIPS
        ========================== */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Schedule
              </p>

              <h3 className="mt-1 text-lg font-semibold text-slate-950">
                Upcoming Trips
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Your next assigned
                transport requests.
              </p>
            </div>

            <Link
              to="/driver/my-trips"
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              View All
            </Link>
          </div>

          {upcomingTrips.length ===
          0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-500">
                TR
              </div>

              <p className="mt-4 font-semibold text-slate-700">
                No additional upcoming
                trips
              </p>

              <p className="mt-1 text-sm text-slate-500">
                New assignments will
                appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left text-sm">
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
                  </tr>
                </thead>

                <tbody>
                  {upcomingTrips.map(
                    (trip) => (
                      <tr
                        key={trip.id}
                        className="border-b border-slate-100 transition last:border-b-0 hover:bg-slate-50/80"
                      >
                        <td className="px-6 py-4 font-semibold text-slate-900">
                          TRIP-
                          {trip.id}
                        </td>

                        <td className="py-4 pr-6">
                          <p className="font-semibold text-slate-800">
                            {trip.request
                              ?.employee
                              ?.name ??
                              'Unknown'}
                          </p>

                          <p className="mt-1 max-w-[180px] truncate text-xs text-slate-500">
                            {trip.request
                              ?.employee
                              ?.email ??
                              'Unavailable'}
                          </p>
                        </td>

                        <td className="max-w-[260px] py-4 pr-6">
                          <p
                            className="truncate font-medium text-slate-800"
                            title={
                              trip.request
                                ?.pickupLocation ??
                              ''
                            }
                          >
                            {trip.request
                              ?.pickupLocation ??
                              'Unavailable'}
                          </p>

                          <p
                            className="mt-1 truncate text-xs text-slate-500"
                            title={
                              trip.request
                                ?.destination ??
                              ''
                            }
                          >
                            to{' '}
                            {trip.request
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
                            {trip.vehicle
                              ?.plateNumber ??
                              `Vehicle ${trip.vehicleId}`}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {trip.vehicle
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
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>

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
   POST TRIP MODAL
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
    field:
      keyof PostTripForm,
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
            <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-800">
              Fuel and vehicle issue
              information are optional.
              Leave both sections blank
              if nothing needs to be
              recorded.
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* FUEL */}

            <section className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
                <h3 className="font-semibold text-slate-900">
                  Fuel Record
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Optional — complete
                  this only if fuel was
                  added.
                </p>
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
                        event.target
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
                        event.target
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
                        event.target
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
                        event.target
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

            {/* ISSUE */}

            <section className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
                <h3 className="font-semibold text-slate-900">
                  Vehicle Issue
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Optional — report a
                  problem noticed during
                  the trip.
                </p>
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
                        event.target
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
                        event.target
                          .value,
                      )
                    }
                    placeholder="Describe what you noticed..."
                    className={`${inputClass} resize-none`}
                  />
                </FormField>
              </div>
            </section>
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 bg-white px-6 py-5">
            <button
              type="button"
              disabled={
                saving
              }
              onClick={
                onClose
              }
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Back
            </button>

            <button
              type="submit"
              disabled={
                saving
              }
              className="rounded-xl bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-95 disabled:opacity-50"
            >
              {saving
                ? 'Completing Trip...'
                : 'Complete Trip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* =========================================================
   EXISTING UI COMPONENTS
========================================================= */

function CurrentTripCard({
  trip,
}: {
  trip: Trip
}) {
  return (
    <div className="p-6">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <TripDetail
          label="Passenger"
          value={
            trip.request
              ?.employee?.name ??
            'Unknown'
          }
          secondaryValue={
            trip.request
              ?.employee?.email
          }
        />

        <TripDetail
          label="Vehicle"
          value={
            trip.vehicle
              ?.plateNumber ??
            `Vehicle ${trip.vehicleId}`
          }
          secondaryValue={
            trip.vehicle
              ?.vehicleType
          }
        />

        <TripDetail
          label="Schedule"
          value={
            trip.request
              ? formatDate(
                  trip.request
                    .requestDate,
                )
              : 'Unavailable'
          }
          secondaryValue={
            trip.request
              ? formatTime(
                  trip.request
                    .requestTime,
                )
              : undefined
          }
        />
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
        <div className="grid gap-5 md:grid-cols-2">
          <RouteItem
            label="Pickup"
            value={
              trip.request
                ?.pickupLocation ??
              'Unavailable'
            }
            tone="blue"
          />

          <RouteItem
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

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <TripDetail
          label="Purpose"
          value={
            trip.request?.purpose ??
            'No purpose provided'
          }
        />

        <TripDetail
          label="Started"
          value={
            trip.startTime
              ? formatDateTime(
                  trip.startTime,
                )
              : 'Not started'
          }
        />
      </div>
    </div>
  )
}

function EmptyCurrentTrip() {
  return (
    <div className="p-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-500">
        TR
      </div>

      <p className="mt-4 font-semibold text-slate-700">
        You do not have an active
        trip
      </p>

      <p className="mt-1 text-sm text-slate-500">
        Your next approved assignment
        will appear here.
      </p>
    </div>
  )
}

function QuickActionLink({
  to,
  label,
  description,
}: {
  to: string
  label: string
  description: string
}) {
  return (
    <Link
      to={to}
      className="group block rounded-xl border border-slate-200 bg-white px-4 py-3.5 transition hover:border-blue-200 hover:bg-blue-50"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-700">
            {label}
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>

        <span className="text-sm text-slate-300 group-hover:text-blue-500">
          →
        </span>
      </div>
    </Link>
  )
}

function HeroStatusItem({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="min-w-[150px] rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3">
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

function InformationCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="font-semibold text-slate-950">
        {title}
      </h3>

      <div className="mt-5 space-y-4">
        {children}
      </div>
    </section>
  )
}

function InformationRow({
  label,
  value,
  badge,
}: {
  label: string
  value: string
  badge?: DriverAvailabilityStatus
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 last:border-b-0 last:pb-0">
      <p className="text-sm text-slate-500">
        {label}
      </p>

      <div className="flex items-center gap-2">
        <p className="text-sm font-semibold text-slate-800">
          {value}
        </p>

        {badge && (
          <DriverStatusBadge
            status={
              badge
            }
          />
        )}
      </div>
    </div>
  )
}

function TripDetail({
  label,
  value,
  secondaryValue,
}: {
  label: string
  value: string
  secondaryValue?: string | null
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-slate-800">
        {value}
      </p>

      {secondaryValue && (
        <p className="mt-1 text-xs text-slate-500">
          {secondaryValue}
        </p>
      )}
    </div>
  )
}

function RouteItem({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'blue' | 'indigo'
}) {
  const style =
    tone === 'blue'
      ? 'bg-blue-500 ring-blue-100'
      : 'bg-indigo-500 ring-indigo-100'

  return (
    <div className="flex items-start gap-3">
      <span
        className={`mt-1.5 h-3 w-3 shrink-0 rounded-full ring-4 ${style}`}
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

function DriverStatusBadge({
  status,
}: {
  status:
    DriverAvailabilityStatus
}) {
  const styles:
    Record<
      DriverAvailabilityStatus,
      string
    > = {
    AVAILABLE:
      'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',

    ON_TRIP:
      'bg-blue-50 text-blue-700 ring-1 ring-blue-200',

    OFF_DUTY:
      'bg-amber-50 text-amber-700 ring-1 ring-amber-200',

    INACTIVE:
      'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
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

function sortTrips(
  trips: Trip[],
): Trip[] {
  return [...trips].sort(
    (
      firstTrip,
      secondTrip,
    ) => {
      return (
        getTripScheduleDate(
          firstTrip,
        ).getTime() -
        getTripScheduleDate(
          secondTrip,
        ).getTime()
      )
    },
  )
}

function getTripScheduleDate(
  trip: Trip,
): Date {
  const requestDate =
    trip.request?.requestDate

  const requestTime =
    trip.request?.requestTime

  if (!requestDate) {
    return new Date(
      trip.createdAt,
    )
  }

  const datePart =
    requestDate.split(
      'T',
    )[0]

  const timePart =
    requestTime ||
    '00:00'

  const date =
    new Date(
      `${datePart}T${timePart}`,
    )

  return Number.isNaN(
    date.getTime(),
  )
    ? new Date(
        trip.createdAt,
      )
    : date
}

function formatStatus(
  value: string,
): string {
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
): string {
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
): string {
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
): string {
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

function getApiErrorMessage(
  error: unknown,
  fallback: string,
): string {
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

  if (!error.response) {
    return 'Unable to connect to the server.'
  }

  return fallback
}

export default DriverDashboard