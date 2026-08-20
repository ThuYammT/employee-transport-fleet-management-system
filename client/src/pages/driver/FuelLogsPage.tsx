import axios from 'axios'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  createFuelLog,
  getFuelLogsByDriverId,
} from '../../services/fuel-log.service'

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
  CreateFuelLogData,
  FuelLog,
} from '../../types/fuel-log'

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

const emptyForm: CreateFuelLogData = {
  vehicleId: 0,
  driverId: 0,

  fuelDate:
    new Date()
      .toISOString()
      .split('T')[0],

  liters: 0,
  cost: 0,
  fuelStation: '',
  photoUrl: '',
}

function FuelLogsPage() {
  const [driver, setDriver] =
    useState<Driver | null>(
      null,
    )

  const [fuelLogs, setFuelLogs] =
    useState<FuelLog[]>([])

  const [trips, setTrips] =
    useState<Trip[]>([])

  const [
    selectedVehicleId,
    setSelectedVehicleId,
  ] = useState<number | null>(
    null,
  )

  const [formData, setFormData] =
    useState<CreateFuelLogData>(
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
     LOAD DATA
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
        logsData,
        tripsData,
      ] = await Promise.all([
        getFuelLogsByDriverId(
          driverData.id,
        ),

        getTripsByDriverId(
          driverData.id,
        ),
      ])

      setDriver(
        driverData,
      )

      setFuelLogs(
        logsData,
      )

      setTrips(
        tripsData,
      )
    } catch (error) {
      console.error(error)

      setError(
        getApiErrorMessage(
          error,
          'Failed to load fuel records.',
        ),
      )
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }

  /* =====================================================
     USED VEHICLES
  ===================================================== */

  const usedVehicles =
    useMemo(() => {
      const map =
        new Map<
          number,
          UsedVehicle
        >()

      /*
       * Current permanent vehicle.
       */
      if (
        driver?.assignedVehicle
      ) {
        map.set(
          driver.assignedVehicle.id,
          driver.assignedVehicle,
        )
      }

      /*
       * Every vehicle from the
       * driver's trip history.
       */
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

      /*
       * Every vehicle connected
       * to a fuel record.
       *
       * This protects historical
       * records even if the driver
       * is later assigned another
       * vehicle.
       */
      fuelLogs.forEach(
        (log) => {
          if (log.vehicle) {
            map.set(
              log.vehicle.id,
              log.vehicle,
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
      fuelLogs,
    ])

  /* =====================================================
     SELECTED VEHICLE
  ===================================================== */

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

  const selectedVehicleLogs =
    useMemo(
      () =>
        selectedVehicleId
          ? fuelLogs.filter(
              (log) =>
                log.vehicleId ===
                selectedVehicleId,
            )
          : [],
      [
        fuelLogs,
        selectedVehicleId,
      ],
    )

  /* =====================================================
     TOTALS
  ===================================================== */

  const totalLiters =
    useMemo(
      () =>
        fuelLogs.reduce(
          (
            total,
            log,
          ) =>
            total +
            Number(
              log.liters,
            ),
          0,
        ),
      [fuelLogs],
    )

  const totalCost =
    useMemo(
      () =>
        fuelLogs.reduce(
          (
            total,
            log,
          ) =>
            total +
            Number(
              log.cost,
            ),
          0,
        ),
      [fuelLogs],
    )

  const selectedLiters =
    useMemo(
      () =>
        selectedVehicleLogs.reduce(
          (
            total,
            log,
          ) =>
            total +
            Number(
              log.liters,
            ),
          0,
        ),
      [
        selectedVehicleLogs,
      ],
    )

  const selectedCost =
    useMemo(
      () =>
        selectedVehicleLogs.reduce(
          (
            total,
            log,
          ) =>
            total +
            Number(
              log.cost,
            ),
          0,
        ),
      [
        selectedVehicleLogs,
      ],
    )

  /* =====================================================
     MANUAL FUEL LOG
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

      fuelDate:
        new Date()
          .toISOString()
          .split('T')[0],

      liters: 0,
      cost: 0,
      fuelStation: '',
      photoUrl: '',
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

    setFormData(
      emptyForm,
    )

    setModalError('')
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

    if (
      Number(
        formData.liters,
      ) <= 0
    ) {
      setModalError(
        'Please enter a valid fuel amount greater than 0 litres.',
      )

      return
    }

    if (
      Number(
        formData.cost,
      ) < 0
    ) {
      setModalError(
        'Please enter a valid fuel cost.',
      )

      return
    }

    try {
      setSaving(true)
      setModalError('')

      const photoUrl =
        formData.photoUrl &&
        !formData.photoUrl.startsWith(
          'data:',
        )
          ? formData.photoUrl
          : undefined

      await createFuelLog({
        vehicleId:
          formData.vehicleId,

        driverId:
          driver.id,

        fuelDate:
          formData.fuelDate,

        liters:
          Number(
            formData.liters,
          ),

        cost:
          Number(
            formData.cost,
          ),

        fuelStation:
          formData.fuelStation
            ?.trim() ||
          undefined,

        photoUrl,
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
          'Failed to save the fuel record.',
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
            Loading fuel records...
          </p>
        </div>
      </div>
    )
  }

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
            Fuel Records
          </h1>

          <p className="mt-0.5 text-sm text-slate-500">
            Review fuel activity
            across vehicles you have
            driven.
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
              + Log Fuel
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
                Fuel management
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Your fuel history
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Fuel records are
                organised by the
                vehicles you have
                driven so previous
                assignments remain
                easy to review.
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

        {/* =========================
            ERROR
        ========================== */}

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
            label="Vehicles Used"
            value={
              usedVehicles.length
            }
            suffix="vehicles"
            tone="blue"
          />

          <StatCard
            label="Fuel Records"
            value={
              fuelLogs.length
            }
            suffix="logs"
            tone="slate"
          />

          <StatCard
            label="Fuel Recorded"
            value={formatNumber(
              totalLiters,
            )}
            suffix="litres"
            tone="green"
          />

          <StatCard
            label="Total Fuel Cost"
            value={formatMoney(
              totalCost,
            )}
            suffix="MMK"
            tone="amber"
          />
        </div>

        {/* =========================
            VEHICLE LIST
        ========================== */}

        {!selectedVehicle && (
          <VehicleSelection
            vehicles={
              usedVehicles
            }
            fuelLogs={
              fuelLogs
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

        {/* =========================
            VEHICLE FUEL HISTORY
        ========================== */}

        {selectedVehicle && (
          <VehicleFuelHistory
            vehicle={
              selectedVehicle
            }
            logs={
              selectedVehicleLogs
            }
            totalLiters={
              selectedLiters
            }
            totalCost={
              selectedCost
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

      {/* =========================
          ADD FUEL MODAL
      ========================== */}

      {isModalOpen && (
        <FuelLogModal
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
  fuelLogs,
  currentVehicleId,
  onSelect,
}: {
  vehicles:
    UsedVehicle[]

  fuelLogs:
    FuelLog[]

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
          review its fuel records.
        </p>
      </div>

      {vehicles.length ===
      0 ? (
        <div className="p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-500">
            FV
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
              const logs =
                fuelLogs.filter(
                  (log) =>
                    log.vehicleId ===
                    vehicle.id,
                )

              const liters =
                logs.reduce(
                  (
                    total,
                    log,
                  ) =>
                    total +
                    Number(
                      log.liters,
                    ),
                  0,
                )

              const cost =
                logs.reduce(
                  (
                    total,
                    log,
                  ) =>
                    total +
                    Number(
                      log.cost,
                    ),
                  0,
                )

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

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <VehicleMetric
                      label="Fuel Logs"
                      value={`${logs.length}`}
                    />

                    <VehicleMetric
                      label="Fuel"
                      value={`${formatNumber(
                        liters,
                      )} L`}
                    />
                  </div>

                  <div className="mt-3 rounded-xl bg-slate-50 px-4 py-3 transition group-hover:bg-white">
                    <p className="text-xs text-slate-400">
                      Recorded fuel
                      cost
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {formatMoney(
                        cost,
                      )}{' '}
                      MMK
                    </p>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="text-xs font-semibold text-slate-500">
                      View fuel history
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
   VEHICLE FUEL HISTORY
========================================================= */

function VehicleFuelHistory({
  vehicle,
  logs,
  totalLiters,
  totalCost,
  isCurrentVehicle,
  onBack,
}: {
  vehicle:
    UsedVehicle

  logs:
    FuelLog[]

  totalLiters:
    number

  totalCost:
    number

  isCurrentVehicle:
    boolean

  onBack:
    () => void
}) {
  return (
    <div className="space-y-5">
      {/* VEHICLE HEADER */}

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

        <div className="grid gap-4 p-5 sm:grid-cols-3">
          <VehicleSummaryMetric
            label="Fuel Records"
            value={`${logs.length}`}
          />

          <VehicleSummaryMetric
            label="Total Fuel"
            value={`${formatNumber(
              totalLiters,
            )} L`}
          />

          <VehicleSummaryMetric
            label="Total Cost"
            value={`${formatMoney(
              totalCost,
            )} MMK`}
          />
        </div>
      </section>

      {/* HISTORY TABLE */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Fuel activity
          </p>

          <h3 className="mt-1 font-semibold text-slate-950">
            Fuel History
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Fuel records connected
            to this vehicle.
          </p>
        </div>

        {logs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-500">
              FL
            </div>

            <p className="mt-4 font-semibold text-slate-700">
              No fuel records
            </p>

            <p className="mt-1 text-sm text-slate-500">
              No fuel activity has
              been recorded for this
              vehicle yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4">
                    Date
                  </th>

                  <th className="py-4 pr-6">
                    Trip
                  </th>

                  <th className="py-4 pr-6">
                    Fuel Station
                  </th>

                  <th className="py-4 pr-6">
                    Litres
                  </th>

                  <th className="py-4 pr-6">
                    Cost
                  </th>

                  <th className="py-4 pr-6">
                    Record
                  </th>
                </tr>
              </thead>

              <tbody>
                {logs.map(
                  (log) => (
                    <tr
                      key={
                        log.id
                      }
                      className="border-b border-slate-100 transition last:border-b-0 hover:bg-slate-50/80"
                    >
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800">
                          {formatFuelDate(
                            log.fuelDate,
                          )}
                        </p>
                      </td>

                      <td className="py-4 pr-6">
                        {log.tripId ? (
                          <span className="inline-flex rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
                            TRIP-
                            {
                              log.tripId
                            }
                          </span>
                        ) : (
                          <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                            Manual
                          </span>
                        )}
                      </td>

                      <td className="py-4 pr-6">
                        <p className="font-medium text-slate-700">
                          {log.fuelStation ||
                            'Not provided'}
                        </p>
                      </td>

                      <td className="py-4 pr-6">
                        <p className="font-semibold text-slate-800">
                          {formatNumber(
                            Number(
                              log.liters,
                            ),
                          )}{' '}
                          L
                        </p>
                      </td>

                      <td className="py-4 pr-6">
                        <p className="font-semibold text-slate-800">
                          {formatMoney(
                            Number(
                              log.cost,
                            ),
                          )}{' '}
                          MMK
                        </p>
                      </td>

                      <td className="py-4 pr-6">
                        <span className="text-xs font-medium text-slate-400">
                          FL-
                          {log.id}
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
   ADD FUEL MODAL
========================================================= */

function FuelLogModal({
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
    CreateFuelLogData

  saving:
    boolean

  error:
    string

  onChange: (
    field:
      keyof CreateFuelLogData,

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
        {/* HEADER */}

        <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-200">
                Fuel activity
              </p>

              <h2 className="mt-1 text-xl font-semibold">
                Add Fuel Record
              </h2>

              <p className="mt-1 text-sm text-slate-300">
                Record a manual
                refuelling entry for
                your current assigned
                vehicle.
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

            {/* VEHICLE */}

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

            {/* FIELDS */}

            <div className="grid gap-5 sm:grid-cols-2">
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
                  required
                />
              </FormField>

              <FormField
                label="Fuel Station"
              >
                <input
                  type="text"
                  value={
                    formData.fuelStation ??
                    ''
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
                    formData.liters ||
                    ''
                  }
                  onChange={(
                    event,
                  ) =>
                    onChange(
                      'liters',
                      Number(
                        event
                          .target
                          .value,
                      ),
                    )
                  }
                  placeholder="e.g. 30"
                  className={
                    inputClass
                  }
                  required
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
                    formData.cost ||
                    ''
                  }
                  onChange={(
                    event,
                  ) =>
                    onChange(
                      'cost',
                      Number(
                        event
                          .target
                          .value,
                      ),
                    )
                  }
                  placeholder="e.g. 75000"
                  className={
                    inputClass
                  }
                  required
                />
              </FormField>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-800">
              Fuel recorded while
              completing a trip will
              automatically be linked
              to that trip. Manual
              records created here are
              saved without a trip
              reference.
            </div>
          </div>

          {/* FOOTER */}

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
              className="rounded-xl bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? 'Saving...'
                : 'Create Fuel Record'}
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
  label:
    string

  value:
    string
}) {
  return (
    <div className="min-w-[140px] rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur-sm">
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
  suffix,
  tone,
}: {
  label:
    string

  value:
    number | string

  suffix:
    string

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
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {suffix}
          </p>
        </div>

        <span
          className={`h-9 w-9 rounded-xl ${styles[tone]}`}
        />
      </div>
    </div>
  )
}

function VehicleMetric({
  label,
  value,
}: {
  label:
    string

  value:
    string
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
  label:
    string

  value:
    string
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

function FormField({
  label,
  children,
}: {
  label:
    string

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

function formatFuelDate(
  value: string,
) {
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

function formatNumber(
  value: number,
) {
  return value.toLocaleString(
    undefined,
    {
      maximumFractionDigits:
        2,
    },
  )
}

function formatMoney(
  value: number,
) {
  return Math.round(
    value,
  ).toLocaleString()
}

/* =========================================================
   API ERROR
========================================================= */

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

export default FuelLogsPage