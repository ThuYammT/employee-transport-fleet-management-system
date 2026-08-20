import axios from 'axios'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  createVehicleIssueReport,
  getVehicleIssueReportsByDriverId,
} from '../../services/vehicle-issue-report.service'

import {
  getDriverByUserId,
} from '../../services/driver.service'

import {
  getTripsByDriverId,
} from '../../services/trip.service'

import {
  getCurrentUser,
} from '../../utils/user-session'

import type {
  CreateVehicleIssueReportData,
  VehicleIssueReport,
} from '../../types/vehicle-issue-report'

import type {
  Driver,
  DriverVehicle,
} from '../../types/driver'

import type {
  Trip,
} from '../../types/trip'

import type {
  Vehicle,
} from '../../types/vehicle'

type UsedVehicle =
  | Vehicle
  | DriverVehicle

const emptyForm: CreateVehicleIssueReportData = {
  vehicleId: 0,
  driverId: 0,
  issueTitle: '',
  description: '',
}

function VehicleIssuesPage() {
  const [driver, setDriver] =
    useState<Driver | null>(null)

  const [trips, setTrips] =
    useState<Trip[]>([])

  const [
    issueReports,
    setIssueReports,
  ] =
    useState<
      VehicleIssueReport[]
    >([])

  const [
    selectedVehicleId,
    setSelectedVehicleId,
  ] = useState<number | null>(
    null,
  )

  const [
    formData,
    setFormData,
  ] =
    useState<CreateVehicleIssueReportData>(
      emptyForm,
    )

  const [
    isModalOpen,
    setIsModalOpen,
  ] = useState(false)

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState('')

  const [
    modalError,
    setModalError,
  ] = useState('')

  useEffect(() => {
    void loadPageData()
  }, [])

  /* =====================================================
     LOAD
  ===================================================== */

  async function loadPageData(
    silent = false,
  ) {
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
        'This page is only available for driver accounts.',
      )

      setLoading(false)
      return
    }

    try {
      if (!silent) {
        setLoading(true)
      }

      setError('')

      const driverData =
        await getDriverByUserId(
          currentUser.id,
        )

      const [
        reportsData,
        tripsData,
      ] = await Promise.all([
        getVehicleIssueReportsByDriverId(
          driverData.id,
        ),

        getTripsByDriverId(
          driverData.id,
        ),
      ])

      setDriver(
        driverData,
      )

      setIssueReports(
        reportsData,
      )

      setTrips(
        tripsData,
      )
    } catch (error) {
      console.error(error)

      setError(
        getApiErrorMessage(
          error,
          'Failed to load vehicle issue reports.',
        ),
      )
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }

  /* =====================================================
     VEHICLE HISTORY
  ===================================================== */

  const usedVehicles =
    useMemo(() => {
      const map =
        new Map<
          number,
          UsedVehicle
        >()

      if (
        driver?.assignedVehicle
      ) {
        map.set(
          driver.assignedVehicle.id,
          driver.assignedVehicle,
        )
      }

      trips.forEach(
        (trip) => {
          if (trip.vehicle) {
            map.set(
              trip.vehicle.id,
              trip.vehicle,
            )
          }
        },
      )

      issueReports.forEach(
        (report) => {
          if (
            report.vehicle
          ) {
            map.set(
              report.vehicle.id,
              report.vehicle,
            )
          }
        },
      )

      return Array.from(
        map.values(),
      )
    }, [
      driver,
      trips,
      issueReports,
    ])

  const selectedVehicle =
    useMemo(
      () =>
        usedVehicles.find(
          (vehicle) =>
            vehicle.id ===
            selectedVehicleId,
        ) ?? null,
      [
        usedVehicles,
        selectedVehicleId,
      ],
    )

  const selectedReports =
    useMemo(
      () =>
        selectedVehicleId
          ? issueReports.filter(
              (report) =>
                report.vehicleId ===
                selectedVehicleId,
            )
          : [],
      [
        issueReports,
        selectedVehicleId,
      ],
    )

  /* =====================================================
     COUNTS
  ===================================================== */

  const reportedCount =
    useMemo(
      () =>
        issueReports.filter(
          (report) =>
            report.status ===
            'REPORTED',
        ).length,
      [issueReports],
    )

  const inProgressCount =
    useMemo(
      () =>
        issueReports.filter(
          (report) =>
            report.status ===
            'IN_PROGRESS',
        ).length,
      [issueReports],
    )

  const resolvedCount =
    useMemo(
      () =>
        issueReports.filter(
          (report) =>
            report.status ===
            'RESOLVED',
        ).length,
      [issueReports],
    )

  /* =====================================================
     REPORT ISSUE
  ===================================================== */

  function openAddModal() {
    if (
      !driver ||
      !driver.assignedVehicleId ||
      !driver.assignedVehicle
    ) {
      setError(
        'You do not currently have an assigned vehicle. Please contact your administrator.',
      )

      return
    }

    setError('')
    setModalError('')

    setFormData({
      vehicleId:
        driver.assignedVehicleId,

      driverId:
        driver.id,

      issueTitle: '',
      description: '',
    })

    setIsModalOpen(
      true,
    )
  }

  function closeModal() {
    if (saving) {
      return
    }

    setIsModalOpen(
      false,
    )

    setModalError('')

    setFormData(
      emptyForm,
    )
  }

  async function handleSubmit(
    event:
      React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (
      !driver ||
      !formData.vehicleId
    ) {
      setModalError(
        'No assigned vehicle is available.',
      )

      return
    }

    const title =
      formData.issueTitle.trim()

    const description =
      formData.description.trim()

    if (!title) {
      setModalError(
        'Please enter an issue title.',
      )

      return
    }

    if (
      title.length < 3
    ) {
      setModalError(
        'Issue title must contain at least 3 characters.',
      )

      return
    }

    if (!description) {
      setModalError(
        'Please enter a description.',
      )

      return
    }

    if (
      description.length <
      10
    ) {
      setModalError(
        'Description must contain at least 10 characters.',
      )

      return
    }

    try {
      setSaving(true)
      setModalError('')

      await createVehicleIssueReport({
        vehicleId:
          formData.vehicleId,

        driverId:
          driver.id,

        issueTitle:
          title,

        description,
      })

      setIsModalOpen(
        false,
      )

      setFormData(
        emptyForm,
      )

      await loadPageData(
        true,
      )
    } catch (error) {
      console.error(error)

      setModalError(
        getApiErrorMessage(
          error,
          'Failed to report the vehicle issue.',
        ),
      )
    } finally {
      setSaving(false)
    }
  }

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-slate-50 p-8">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="mt-4 text-sm text-slate-500">
            Loading vehicle issues...
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
            Vehicle Issues
          </h1>

          <p className="mt-0.5 text-sm text-slate-500">
            Report vehicle problems
            and track their progress.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() =>
              void loadPageData()
            }
            disabled={loading}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
          >
            Refresh
          </button>

          {driver
            ?.assignedVehicle && (
            <button
              type="button"
              onClick={
                openAddModal
              }
              className="rounded-xl bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
            >
              + Report Issue
            </button>
          )}
        </div>
      </header>

      <section className="mx-auto max-w-[1600px] p-8">
        {/* =========================
            HERO
        ========================== */}

        <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 px-7 py-6 text-white shadow-sm">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-200">
                Vehicle care
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Vehicle issue history
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Report problems you
                notice and follow the
                progress while fleet
                management reviews,
                repairs and resolves
                them.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <HeroItem
                label="Current Vehicle"
                value={
                  driver
                    ?.assignedVehicle
                    ?.plateNumber ??
                  'None'
                }
              />

              <HeroItem
                label="Driver"
                value={
                  driver?.user
                    .name ??
                  'Driver'
                }
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* =========================
            SUMMARY
        ========================== */}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Reports"
            value={
              issueReports.length
            }
            tone="slate"
          />

          <StatCard
            label="Reported"
            value={
              reportedCount
            }
            tone="blue"
          />

          <StatCard
            label="In Progress"
            value={
              inProgressCount
            }
            tone="amber"
          />

          <StatCard
            label="Resolved"
            value={
              resolvedCount
            }
            tone="green"
          />
        </div>

        {/* =========================
            STATUS EXPLANATION
        ========================== */}


        {!selectedVehicle && (
          <VehicleSelection
            vehicles={
              usedVehicles
            }
            issueReports={
              issueReports
            }
            currentVehicleId={
              driver
                ?.assignedVehicleId ??
              null
            }
            onSelect={(
              vehicleId,
            ) =>
              setSelectedVehicleId(
                vehicleId,
              )
            }
          />
        )}

        {selectedVehicle && (
          <VehicleIssueHistory
            vehicle={
              selectedVehicle
            }
            reports={
              selectedReports
            }
            isCurrentVehicle={
              selectedVehicle.id ===
              driver
                ?.assignedVehicleId
            }
            onBack={() =>
              setSelectedVehicleId(
                null,
              )
            }
          />
        )}
      </section>

      {isModalOpen && (
        <IssueModal
          driver={
            driver
          }
          formData={
            formData
          }
          saving={
            saving
          }
          error={
            modalError
          }
          onChange={(
            field,
            value,
          ) => {
            setFormData(
              (current) => ({
                ...current,
                [field]:
                  value,
              }),
            )

            if (
              modalError
            ) {
              setModalError(
                '',
              )
            }
          }}
          onClose={
            closeModal
          }
          onSubmit={
            handleSubmit
          }
        />
      )}
    </>
  )
}

/* =========================================================
   VEHICLE SELECTION
========================================================= */

function VehicleSelection({
  vehicles,
  issueReports,
  currentVehicleId,
  onSelect,
}: {
  vehicles:
    UsedVehicle[]

  issueReports:
    VehicleIssueReport[]

  currentVehicleId:
    number | null

  onSelect: (
    vehicleId: number,
  ) => void
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Vehicle history
        </p>

        <h3 className="mt-1 text-lg font-semibold text-slate-950">
          Vehicles You've Driven
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Select a vehicle to
          review reported issues.
        </p>
      </div>

      {vehicles.length ===
      0 ? (
        <div className="p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-500">
            VI
          </div>

          <p className="mt-4 font-semibold text-slate-700">
            No vehicle history yet
          </p>

          <p className="mx-auto mt-1 max-w-lg text-sm leading-6 text-slate-500">
            Vehicles will appear
            here after they are
            assigned to you or used
            in one of your trips.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
          {vehicles.map(
            (vehicle) => {
              const reports =
                issueReports.filter(
                  (report) =>
                    report.vehicleId ===
                    vehicle.id,
                )

              const unresolved =
                reports.filter(
                  (report) =>
                    report.status !==
                    'RESOLVED',
                ).length

              const resolved =
                reports.filter(
                  (report) =>
                    report.status ===
                    'RESOLVED',
                ).length

              const isCurrent =
                vehicle.id ===
                currentVehicleId

              return (
                <button
                  key={
                    vehicle.id
                  }
                  type="button"
                  onClick={() =>
                    onSelect(
                      vehicle.id,
                    )
                  }
                  className="group rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:border-blue-300 hover:bg-blue-50/40 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-lg font-semibold text-slate-950">
                        {
                          vehicle.plateNumber
                        }
                      </p>

                      <p className="mt-1 truncate text-sm text-slate-500">
                        {
                          vehicle.vehicleType
                        }
                      </p>
                    </div>

                    {isCurrent && (
                      <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                        CURRENT
                      </span>
                    )}
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-3">
                    <VehicleMetric
                      label="Reports"
                      value={`${reports.length}`}
                    />

                    <VehicleMetric
                      label="Open"
                      value={`${unresolved}`}
                    />

                    <VehicleMetric
                      label="Resolved"
                      value={`${resolved}`}
                    />
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="text-xs font-semibold text-slate-500">
                      View issue history
                    </span>

                    <span className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-500">
                      →
                    </span>
                  </div>
                </button>
              )
            },
          )}
        </div>
      )}
    </section>
  )
}

/* =========================================================
   VEHICLE ISSUE HISTORY
========================================================= */

function VehicleIssueHistory({
  vehicle,
  reports,
  isCurrentVehicle,
  onBack,
}: {
  vehicle:
    UsedVehicle

  reports:
    VehicleIssueReport[]

  isCurrentVehicle:
    boolean

  onBack:
    () => void
}) {
  const reported =
    reports.filter(
      (report) =>
        report.status ===
        'REPORTED',
    ).length

  const inProgress =
    reports.filter(
      (report) =>
        report.status ===
        'IN_PROGRESS',
    ).length

  const resolved =
    reports.filter(
      (report) =>
        report.status ===
        'RESOLVED',
    ).length

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 px-6 py-5 text-white">
          <button
            type="button"
            onClick={
              onBack
            }
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-300 transition hover:text-white"
          >
            ← All Vehicles
          </button>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-semibold">
                  {
                    vehicle.plateNumber
                  }
                </h2>

                {isCurrentVehicle && (
                  <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-200 ring-1 ring-emerald-400/30">
                    CURRENT VEHICLE
                  </span>
                )}
              </div>

              <p className="mt-1 text-sm text-slate-300">
                {
                  vehicle.vehicleType
                }
              </p>
            </div>

            <p className="text-sm text-slate-300">
              Vehicle ID #
              {vehicle.id}
            </p>
          </div>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-4">
          <VehicleSummaryMetric
            label="Reports"
            value={`${reports.length}`}
          />

          <VehicleSummaryMetric
            label="Reported"
            value={`${reported}`}
          />

          <VehicleSummaryMetric
            label="In Progress"
            value={`${inProgress}`}
          />

          <VehicleSummaryMetric
            label="Resolved"
            value={`${resolved}`}
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Issue activity
          </p>

          <h3 className="mt-1 font-semibold text-slate-950">
            Issue History
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Problems reported for
            this vehicle and their
            current status.
          </p>
        </div>

        {reports.length ===
        0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-500">
              VI
            </div>

            <p className="mt-4 font-semibold text-slate-700">
              No issues reported
            </p>

            <p className="mt-1 text-sm text-slate-500">
              No vehicle problems
              have been recorded for
              this vehicle.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4">
                    Reported
                  </th>

                  <th className="py-4 pr-6">
                    Issue
                  </th>

                  <th className="py-4 pr-6">
                    Description
                  </th>

                  <th className="py-4 pr-6">
                    Status
                  </th>

                  <th className="py-4 pr-6">
                    Record
                  </th>
                </tr>
              </thead>

              <tbody>
                {reports.map(
                  (report) => (
                    <tr
                      key={
                        report.id
                      }
                      className="border-b border-slate-100 transition last:border-b-0 hover:bg-slate-50/80"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="font-semibold text-slate-800">
                          {formatDate(
                            getReportDate(
                              report,
                            ),
                          )}
                        </p>
                      </td>

                      <td className="py-4 pr-6">
                        <p className="font-semibold text-slate-800">
                          {
                            report.issueTitle
                          }
                        </p>
                      </td>

                      <td className="max-w-[320px] py-4 pr-6">
                        <p
                          className="truncate text-slate-600"
                          title={
                            report.description
                          }
                        >
                          {
                            report.description
                          }
                        </p>
                      </td>

                      <td className="py-4 pr-6">
                        <IssueStatusBadge
                          status={
                            report.status
                          }
                        />
                      </td>

                      <td className="py-4 pr-6">
                        <span className="text-xs font-medium text-slate-400">
                          VI-
                          {report.id}
                        </span>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

/* =========================================================
   REPORT MODAL
========================================================= */

function IssueModal({
  driver,
  formData,
  saving,
  error,
  onChange,
  onClose,
  onSubmit,
}: {
  driver:
    Driver | null

  formData:
    CreateVehicleIssueReportData

  saving:
    boolean

  error:
    string

  onChange: (
    field:
      keyof CreateVehicleIssueReportData,

    value:
      string | number,
  ) => void

  onClose:
    () => void

  onSubmit: (
    event:
      React.FormEvent<HTMLFormElement>,
  ) => void
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-[2px]">
      <div className="my-8 w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-200">
                Vehicle care
              </p>

              <h2 className="mt-1 text-xl font-semibold">
                Report Vehicle Issue
              </h2>

              <p className="mt-1 text-sm text-slate-300">
                Notify fleet
                management about a
                problem with your
                current vehicle.
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
        >
          <div className="space-y-5 p-6">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Vehicle
              </label>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                {driver
                  ?.assignedVehicle ? (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {
                          driver
                            .assignedVehicle
                            .plateNumber
                        }
                      </p>

                      <p className="mt-1 text-sm text-slate-600">
                        {
                          driver
                            .assignedVehicle
                            .vehicleType
                        }
                      </p>
                    </div>

                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                      CURRENT VEHICLE
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    No vehicle
                    assigned.
                  </p>
                )}
              </div>
            </div>

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
                placeholder="e.g. Brake noise, engine warning light"
                className={
                  inputClass
                }
                required
              />
            </FormField>

            <FormField
              label="Description"
            >
              <textarea
                rows={5}
                value={
                  formData.description
                }
                onChange={(
                  event,
                ) =>
                  onChange(
                    'description',
                    event.target
                      .value,
                  )
                }
                placeholder="Describe what happened, when you noticed it and anything else that may help fleet management..."
                className={`${inputClass} resize-none`}
                required
              />
            </FormField>

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-800">
              Submitting this report
              does not automatically
              place the vehicle into
              maintenance. Fleet
              management will review
              the issue and decide
              whether maintenance is
              required.
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-5">
            <button
              type="button"
              onClick={
                onClose
              }
              disabled={
                saving
              }
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                saving
              }
              className="rounded-xl bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:opacity-50"
            >
              {saving
                ? 'Submitting...'
                : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* =========================================================
   SMALL COMPONENTS
========================================================= */

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
    | 'green'
    | 'amber'
    | 'slate'
}) {
  const styles = {
    blue:
      'bg-blue-50 text-blue-700',

    green:
      'bg-emerald-50 text-emerald-700',

    amber:
      'bg-amber-50 text-amber-700',

    slate:
      'bg-slate-100 text-slate-700',
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



function VehicleMetric({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-3">
      <p className="text-xs text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  )
}

function VehicleSummaryMetric({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-lg font-semibold text-slate-900">
        {value}
      </p>
    </div>
  )
}

function IssueStatusBadge({
  status,
}: {
  status: string
}) {
  const styles:
    Record<
      string,
      string
    > = {
    REPORTED:
      'bg-blue-50 text-blue-700 ring-1 ring-blue-200',

    IN_PROGRESS:
      'bg-amber-50 text-amber-700 ring-1 ring-amber-200',

    RESOLVED:
      'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
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

function getReportDate(
  report:
    VehicleIssueReport,
): string {
  const value =
    (
      report as VehicleIssueReport & {
        reportedAt?: string
        createdAt?: string
      }
    ).reportedAt ??
    (
      report as VehicleIssueReport & {
        reportedAt?: string
        createdAt?: string
      }
    ).createdAt ??
    ''

  return value
}

function formatDate(
  value: string,
): string {
  if (!value) {
    return 'Unavailable'
  }

  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value
  }

  return date.toLocaleDateString(
    undefined,
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    },
  )
}

function getApiErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  if (
    !axios.isAxiosError(
      error,
    )
  ) {
    return fallbackMessage
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

  return fallbackMessage
}

export default VehicleIssuesPage