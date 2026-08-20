import axios from 'axios'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  completeMaintenanceLog,
  createMaintenanceLog,
  deleteMaintenanceLog,
  getMaintenanceLogs,
  reopenMaintenanceLog,
  startMaintenanceLog,
  updateMaintenanceLog,
} from '../../services/maintenance-log.service'

import {
  getVehicles,
} from '../../services/vehicle.service'

import {
  getVehicleIssueReports,
  reopenVehicleIssueReport,
  resolveVehicleIssueReport,
  startVehicleIssueReport,
} from '../../services/vehicle-issue-report.service'

import type {
  CreateMaintenanceLogData,
  MaintenanceLog,
  MaintenanceStatus,
} from '../../types/maintenance-log'

import type {
  Vehicle,
} from '../../types/vehicle'

import type {
  VehicleIssueReport,
} from '../../types/vehicle-issue-report'

const emptyForm: CreateMaintenanceLogData = {
  vehicleId: 0,

  serviceDate:
    new Date()
      .toISOString()
      .split('T')[0],

  description: '',

  cost: 0,

  nextServiceDate: '',
}

function MaintenanceView() {
  const [
    maintenanceLogs,
    setMaintenanceLogs,
  ] = useState<MaintenanceLog[]>([])

  const [
    issueReports,
    setIssueReports,
  ] = useState<VehicleIssueReport[]>([])

  const [
    vehicles,
    setVehicles,
  ] = useState<Vehicle[]>([])

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<
      'All' | MaintenanceStatus
    >('All')

  const [
    issueFilter,
    setIssueFilter,
  ] = useState<
    | 'ALL'
    | 'REPORTED'
    | 'IN_PROGRESS'
    | 'RESOLVED'
  >('ALL')

  const [
    formData,
    setFormData,
  ] =
    useState<CreateMaintenanceLogData>(
      emptyForm,
    )

  const [
    editingRecord,
    setEditingRecord,
  ] =
    useState<MaintenanceLog | null>(
      null,
    )

  const [
    sourceIssue,
    setSourceIssue,
  ] =
    useState<VehicleIssueReport | null>(
      null,
    )

  const [
    selectedIssue,
    setSelectedIssue,
  ] =
    useState<VehicleIssueReport | null>(
      null,
    )

  const [
    isModalOpen,
    setIsModalOpen,
  ] = useState(false)

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    saving,
    setSaving,
  ] = useState(false)

  const [
    actionLoading,
    setActionLoading,
  ] = useState<string | null>(
    null,
  )

  const [
    error,
    setError,
  ] = useState('')

  useEffect(() => {
    void fetchData()
  }, [])

  /* =====================================================
     LOAD
  ===================================================== */

  async function fetchData() {
    try {
      setLoading(true)
      setError('')

      const [
        logsData,
        vehiclesData,
        issuesData,
      ] = await Promise.all([
        getMaintenanceLogs(),
        getVehicles(),
        getVehicleIssueReports(),
      ])

      setMaintenanceLogs(
        logsData,
      )

      setVehicles(
        vehiclesData,
      )

      setIssueReports(
        issuesData,
      )
    } catch (error) {
      console.error(error)

      setError(
        getApiErrorMessage(
          error,
          'Failed to load maintenance information.',
        ),
      )
    } finally {
      setLoading(false)
    }
  }

  /* =====================================================
     DERIVED DATA
  ===================================================== */

  const eligibleVehicles =
    useMemo(
      () =>
        vehicles.filter(
          (vehicle) =>
            vehicle.status ===
            'AVAILABLE',
        ),
      [vehicles],
    )

  const filteredRecords =
    useMemo(
      () =>
        maintenanceLogs.filter(
          (record) =>
            statusFilter ===
              'All' ||
            record.status ===
              statusFilter,
        ),
      [
        maintenanceLogs,
        statusFilter,
      ],
    )

  const filteredIssues =
    useMemo(
      () =>
        issueReports.filter(
          (issue) =>
            issueFilter ===
              'ALL' ||
            issue.status ===
              issueFilter,
        ),
      [
        issueReports,
        issueFilter,
      ],
    )

  const reportedCount =
    useMemo(
      () =>
        issueReports.filter(
          (issue) =>
            issue.status ===
            'REPORTED',
        ).length,
      [issueReports],
    )

  const inProgressIssueCount =
    useMemo(
      () =>
        issueReports.filter(
          (issue) =>
            issue.status ===
            'IN_PROGRESS',
        ).length,
      [issueReports],
    )

  const activeMaintenanceCount =
    useMemo(
      () =>
        maintenanceLogs.filter(
          (record) =>
            record.status !==
            'COMPLETED',
        ).length,
      [maintenanceLogs],
    )

  const completedMaintenanceCount =
    useMemo(
      () =>
        maintenanceLogs.filter(
          (record) =>
            record.status ===
            'COMPLETED',
        ).length,
      [maintenanceLogs],
    )

  /* =====================================================
     MANUAL MAINTENANCE
  ===================================================== */

  function openAddModal() {
    const defaultVehicle =
      eligibleVehicles[0]

    setEditingRecord(null)

    setSourceIssue(null)

    setError('')

    setFormData({
      vehicleId:
        defaultVehicle?.id ??
        0,

      serviceDate:
        new Date()
          .toISOString()
          .split('T')[0],

      description: '',

      cost: 0,

      nextServiceDate: '',
    })

    setIsModalOpen(true)
  }

  /* =====================================================
     MAINTENANCE FROM DRIVER ISSUE
  ===================================================== */

  function openIssueMaintenanceModal(
    issue: VehicleIssueReport,
  ) {
    const vehicle =
      vehicles.find(
        (item) =>
          item.id ===
          issue.vehicleId,
      )

    if (!vehicle) {
      setError(
        'The vehicle connected to this issue could not be found.',
      )

      return
    }

    if (
      vehicle.status !==
      'AVAILABLE'
    ) {
      setError(
        `Vehicle ${vehicle.plateNumber} is currently ${formatStatus(
          vehicle.status,
        )} and cannot be scheduled for maintenance yet.`,
      )

      return
    }

    setEditingRecord(null)

    setSourceIssue(issue)

    setSelectedIssue(null)

    setError('')

    setFormData({
      vehicleId:
        issue.vehicleId,

      serviceDate:
        new Date()
          .toISOString()
          .split('T')[0],

      description:
        `VI-${issue.id}: ${issue.issueTitle} — ${issue.description}`,

      cost: 0,

      nextServiceDate: '',
    })

    setIsModalOpen(true)
  }

  function openEditModal(
    record: MaintenanceLog,
  ) {
    setEditingRecord(record)

    setSourceIssue(null)

    setError('')

    setFormData({
      vehicleId:
        record.vehicleId,

      serviceDate:
        toDateInputValue(
          record.serviceDate,
        ),

      description:
        record.description,

      cost:
        record.cost,

      nextServiceDate:
        record.nextServiceDate
          ? toDateInputValue(
              record.nextServiceDate,
            )
          : '',
    })

    setIsModalOpen(true)
  }

  function closeModal() {
    if (saving) {
      return
    }

    setIsModalOpen(false)

    setEditingRecord(null)

    setSourceIssue(null)

    setFormData(
      emptyForm,
    )
  }

  /* =====================================================
     SAVE MAINTENANCE
  ===================================================== */

  async function handleSubmit(
    event:
      React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (
      !formData.vehicleId ||
      !formData.description.trim()
    ) {
      setError(
        'Please select a vehicle and enter a description.',
      )

      return
    }

    if (
      formData.description
        .trim()
        .length < 3
    ) {
      setError(
        'Description must contain at least 3 characters.',
      )

      return
    }

    if (
      Number(
        formData.cost,
      ) < 0
    ) {
      setError(
        'Cost cannot be negative.',
      )

      return
    }

    try {
      setSaving(true)
      setError('')

      const payload:
        CreateMaintenanceLogData =
        {
          vehicleId:
            formData.vehicleId,

          serviceDate:
            formData.serviceDate,

          description:
            formData.description.trim(),

          cost:
            Number(
              formData.cost,
            ),

          nextServiceDate:
            formData.nextServiceDate
              ?.trim() ||
            undefined,
        }

      if (editingRecord) {
        await updateMaintenanceLog(
          editingRecord.id,
          payload,
        )
      } else {
        await createMaintenanceLog(
          payload,
        )

        /*
         * If this maintenance record
         * came from a driver issue,
         * move the issue from:
         *
         * REPORTED → IN_PROGRESS
         */
        if (
          sourceIssue &&
          sourceIssue.status ===
            'REPORTED'
        ) {
          await startVehicleIssueReport(
            sourceIssue.id,
          )
        }
      }

      setIsModalOpen(false)

      setEditingRecord(null)

      setSourceIssue(null)

      setFormData(
        emptyForm,
      )

      await fetchData()
    } catch (error) {
      console.error(error)

      setError(
        getApiErrorMessage(
          error,
          'Failed to save maintenance.',
        ),
      )
    } finally {
      setSaving(false)
    }
  }

  /* =====================================================
     MAINTENANCE STATUS
  ===================================================== */

  async function handleStatusAction(
    record: MaintenanceLog,

    action:
      | 'start'
      | 'complete'
      | 'reopen',
  ) {
    const actionKey =
      `${action}-${record.id}`

    try {
      setActionLoading(
        actionKey,
      )

      setError('')

      if (
        action === 'start'
      ) {
        await startMaintenanceLog(
          record.id,
        )
      }

      if (
        action === 'complete'
      ) {
        await completeMaintenanceLog(
          record.id,
        )

        /*
         * If the maintenance was
         * created from VI-123,
         * resolve that specific issue.
         */
        const issueId =
          getLinkedIssueId(
            record.description,
          )

        if (issueId) {
          const issue =
            issueReports.find(
              (item) =>
                item.id ===
                issueId,
            )

          if (
            issue &&
            issue.status ===
              'IN_PROGRESS'
          ) {
            await resolveVehicleIssueReport(
              issue.id,
            )
          }
        }
      }

      if (
        action === 'reopen'
      ) {
        await reopenMaintenanceLog(
          record.id,
        )

        const issueId =
          getLinkedIssueId(
            record.description,
          )

        if (issueId) {
          const issue =
            issueReports.find(
              (item) =>
                item.id ===
                issueId,
            )

          if (
            issue?.status ===
            'RESOLVED'
          ) {
            await reopenVehicleIssueReport(
              issue.id,
            )

            await startVehicleIssueReport(
              issue.id,
            )
          }
        }
      }

      await fetchData()
    } catch (error) {
      console.error(error)

      setError(
        getApiErrorMessage(
          error,
          'Failed to update maintenance status.',
        ),
      )
    } finally {
      setActionLoading(
        null,
      )
    }
  }

  /* =====================================================
     RESOLVE ISSUE WITHOUT MAINTENANCE
  ===================================================== */

  async function handleResolveIssue(
    issue: VehicleIssueReport,
  ) {
    const confirmed =
      window.confirm(
        `Resolve VI-${issue.id} without creating maintenance?\n\nUse this when the issue was inspected and no maintenance work is required.`,
      )

    if (!confirmed) {
      return
    }

    const key =
      `resolve-issue-${issue.id}`

    try {
      setActionLoading(
        key,
      )

      setError('')

      if (
        issue.status ===
        'REPORTED'
      ) {
        await startVehicleIssueReport(
          issue.id,
        )
      }

      await resolveVehicleIssueReport(
        issue.id,
      )

      await fetchData()
    } catch (error) {
      console.error(error)

      setError(
        getApiErrorMessage(
          error,
          'Failed to resolve the issue.',
        ),
      )
    } finally {
      setActionLoading(
        null,
      )
    }
  }

  /* =====================================================
     DELETE
  ===================================================== */

  async function handleDelete(
    record: MaintenanceLog,
  ) {
    const confirmed =
      window.confirm(
        `Delete maintenance record MT-${record.id}?`,
      )

    if (!confirmed) {
      return
    }

    try {
      setActionLoading(
        `delete-${record.id}`,
      )

      setError('')

      await deleteMaintenanceLog(
        record.id,
      )

      await fetchData()
    } catch (error) {
      console.error(error)

      setError(
        getApiErrorMessage(
          error,
          'Failed to delete maintenance.',
        ),
      )
    } finally {
      setActionLoading(
        null,
      )
    }
  }

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <>
      {/* HEADER */}

      <header className="flex min-h-[72px] items-center justify-between border-b border-slate-200 bg-white px-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-950">
            Maintenance
          </h1>

          <p className="mt-0.5 text-sm text-slate-500">
            Review driver-reported
            issues and manage fleet
            maintenance.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() =>
              void fetchData()
            }
            disabled={loading}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
          >
            Refresh
          </button>

          <button
            type="button"
            onClick={
              openAddModal
            }
            disabled={
              eligibleVehicles.length ===
              0
            }
            className="rounded-xl bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            + Schedule Maintenance
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-[1600px] p-8">
        {/* HERO */}

        <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 px-7 py-6 text-white shadow-sm">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-200">
                Fleet care
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Maintenance & Issue
                Center
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Review problems reported
                by drivers, decide
                whether maintenance is
                needed and follow each
                repair through
                completion.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <HeroItem
                label="Issues Waiting"
                value={`${reportedCount}`}
              />

              <HeroItem
                label="Active Maintenance"
                value={`${activeMaintenanceCount}`}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* STATS */}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Reported Issues"
            value={reportedCount}
            tone="blue"
          />

          <StatCard
            label="Issues In Progress"
            value={
              inProgressIssueCount
            }
            tone="amber"
          />

          <StatCard
            label="Active Maintenance"
            value={
              activeMaintenanceCount
            }
            tone="red"
          />

          <StatCard
            label="Completed Maintenance"
            value={
              completedMaintenanceCount
            }
            tone="green"
          />
        </div>

        {/* ISSUE QUEUE */}

        <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Driver reports
              </p>

              <h3 className="mt-1 text-lg font-semibold text-slate-950">
                Vehicle Issues
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Review issues before
                deciding whether
                maintenance is needed.
              </p>
            </div>

            <select
              value={
                issueFilter
              }
              onChange={(event) =>
                setIssueFilter(
                  event.target
                    .value as typeof issueFilter,
                )
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="ALL">
                All issues
              </option>

              <option value="REPORTED">
                Reported
              </option>

              <option value="IN_PROGRESS">
                In Progress
              </option>

              <option value="RESOLVED">
                Resolved
              </option>
            </select>
          </div>

          {loading ? (
            <LoadingBlock
              text="Loading reported issues..."
            />
          ) : filteredIssues.length ===
            0 ? (
            <EmptyBlock
              title="No vehicle issues"
              description="Driver-reported issues will appear here."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-4">
                      Report
                    </th>

                    <th className="py-4 pr-6">
                      Vehicle
                    </th>

                    <th className="py-4 pr-6">
                      Driver
                    </th>

                    <th className="py-4 pr-6">
                      Issue
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
                  {filteredIssues.map(
                    (issue) => (
                      <tr
                        key={issue.id}
                        className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/80"
                      >
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-900">
                            VI-{issue.id}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {formatDate(
                              getIssueDate(
                                issue,
                              ),
                            )}
                          </p>
                        </td>

                        <td className="py-4 pr-6">
                          <p className="font-semibold text-slate-800">
                            {issue.vehicle
                              ?.plateNumber ??
                              `Vehicle ${issue.vehicleId}`}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {issue.vehicle
                              ?.vehicleType ??
                              'Unavailable'}
                          </p>
                        </td>

                        <td className="py-4 pr-6">
                          <p className="font-semibold text-slate-800">
                            {issue.driver
                              ?.user?.name ??
                              `Driver ${issue.driverId}`}
                          </p>
                        </td>

                        <td className="max-w-[300px] py-4 pr-6">
                          <p className="font-semibold text-slate-800">
                            {issue.issueTitle}
                          </p>

                          <p
                            className="mt-1 truncate text-xs text-slate-500"
                            title={
                              issue.description
                            }
                          >
                            {issue.description}
                          </p>
                        </td>

                        <td className="py-4 pr-6">
                          <IssueStatusBadge
                            status={
                              issue.status
                            }
                          />
                        </td>

                        <td className="py-4 pr-6">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedIssue(
                                  issue,
                                )
                              }
                              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              View
                            </button>

                            {issue.status ===
                              'REPORTED' && (
                              <button
                                type="button"
                                onClick={() =>
                                  openIssueMaintenanceModal(
                                    issue,
                                  )
                                }
                                className="rounded-lg bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 px-3 py-2 text-xs font-semibold text-white"
                              >
                                Schedule Maintenance
                              </button>
                            )}

                            {issue.status !==
                              'RESOLVED' && (
                              <button
                                type="button"
                                disabled={
                                  actionLoading ===
                                  `resolve-issue-${issue.id}`
                                }
                                onClick={() =>
                                  void handleResolveIssue(
                                    issue,
                                  )
                                }
                                className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                              >
                                Resolve
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* MAINTENANCE LOGS */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Service records
              </p>

              <h3 className="mt-1 text-lg font-semibold text-slate-950">
                Maintenance Logs
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {maintenanceLogs.length}{' '}
                maintenance records
              </p>
            </div>

            <select
              value={
                statusFilter
              }
              onChange={(event) =>
                setStatusFilter(
                  event.target
                    .value as
                    | 'All'
                    | MaintenanceStatus,
                )
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="All">
                All statuses
              </option>

              <option value="PENDING">
                Pending
              </option>

              <option value="IN_PROGRESS">
                In Progress
              </option>

              <option value="COMPLETED">
                Completed
              </option>
            </select>
          </div>

          {loading ? (
            <LoadingBlock
              text="Loading maintenance records..."
            />
          ) : filteredRecords.length ===
            0 ? (
            <EmptyBlock
              title="No maintenance records"
              description="Scheduled maintenance will appear here."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1150px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-4">
                      Record
                    </th>

                    <th className="py-4 pr-6">
                      Vehicle
                    </th>

                    <th className="py-4 pr-6">
                      Description
                    </th>

                    <th className="py-4 pr-6">
                      Service Date
                    </th>

                    <th className="py-4 pr-6">
                      Status
                    </th>

                    <th className="py-4 pr-6">
                      Cost
                    </th>

                    <th className="py-4 pr-6">
                      Next Service
                    </th>

                    <th className="py-4 pr-6 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRecords.map(
                    (record) => {
                      const linkedIssueId =
                        getLinkedIssueId(
                          record.description,
                        )

                      return (
                        <tr
                          key={
                            record.id
                          }
                          className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/80"
                        >
                          <td className="px-6 py-4">
                            <p className="font-semibold text-slate-900">
                              MT-{record.id}
                            </p>

                            {linkedIssueId && (
                              <p className="mt-1 text-xs font-medium text-blue-600">
                                From VI-
                                {linkedIssueId}
                              </p>
                            )}
                          </td>

                          <td className="py-4 pr-6">
                            <p className="font-semibold text-slate-800">
                              {record.vehicle
                                ?.plateNumber ??
                                `Vehicle ${record.vehicleId}`}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {record.vehicle
                                ?.vehicleType ??
                                '—'}
                            </p>
                          </td>

                          <td className="max-w-[280px] py-4 pr-6">
                            <p
                              className="truncate text-slate-700"
                              title={
                                record.description
                              }
                            >
                              {record.description}
                            </p>
                          </td>

                          <td className="whitespace-nowrap py-4 pr-6 font-medium text-slate-700">
                            {formatDate(
                              record.serviceDate,
                            )}
                          </td>

                          <td className="py-4 pr-6">
                            <MaintenanceStatusBadge
                              status={
                                record.status
                              }
                            />
                          </td>

                          <td className="py-4 pr-6 font-semibold text-slate-800">
                            {Number(
                              record.cost,
                            ).toLocaleString()}{' '}
                            MMK
                          </td>

                          <td className="whitespace-nowrap py-4 pr-6 text-slate-500">
                            {record.nextServiceDate
                              ? formatDate(
                                  record.nextServiceDate,
                                )
                              : '—'}
                          </td>

                          <td className="py-4 pr-6">
                            <div className="flex flex-wrap justify-end gap-2">
                              {record.status ===
                                'PENDING' && (
                                <ActionButton
                                  label="Start"
                                  disabled={
                                    actionLoading ===
                                    `start-${record.id}`
                                  }
                                  tone="amber"
                                  onClick={() =>
                                    void handleStatusAction(
                                      record,
                                      'start',
                                    )
                                  }
                                />
                              )}

                              {record.status ===
                                'IN_PROGRESS' && (
                                <ActionButton
                                  label="Complete"
                                  disabled={
                                    actionLoading ===
                                    `complete-${record.id}`
                                  }
                                  tone="green"
                                  onClick={() =>
                                    void handleStatusAction(
                                      record,
                                      'complete',
                                    )
                                  }
                                />
                              )}

                              {record.status ===
                                'COMPLETED' && (
                                <ActionButton
                                  label="Reopen"
                                  disabled={
                                    actionLoading ===
                                    `reopen-${record.id}`
                                  }
                                  tone="slate"
                                  onClick={() =>
                                    void handleStatusAction(
                                      record,
                                      'reopen',
                                    )
                                  }
                                />
                              )}

                              {record.status !==
                                'COMPLETED' && (
                                <ActionButton
                                  label="Edit"
                                  tone="blue"
                                  onClick={() =>
                                    openEditModal(
                                      record,
                                    )
                                  }
                                />
                              )}

                              <ActionButton
                                label="Delete"
                                disabled={
                                  actionLoading ===
                                  `delete-${record.id}`
                                }
                                tone="red"
                                onClick={() =>
                                  void handleDelete(
                                    record,
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
          )}
        </section>
      </section>

      {/* MAINTENANCE MODAL */}

      {isModalOpen && (
        <MaintenanceModal
          formData={
            formData
          }
          vehicles={
            editingRecord
              ? vehicles
              : sourceIssue
                ? vehicles.filter(
                    (vehicle) =>
                      vehicle.id ===
                      sourceIssue.vehicleId,
                  )
                : eligibleVehicles
          }
          editingRecord={
            editingRecord
          }
          sourceIssue={
            sourceIssue
          }
          saving={
            saving
          }
          onChange={
            setFormData
          }
          onClose={
            closeModal
          }
          onSubmit={
            handleSubmit
          }
        />
      )}

      {/* ISSUE DETAILS */}

      {selectedIssue && (
        <IssueDetailsModal
          issue={
            selectedIssue
          }
          onClose={() =>
            setSelectedIssue(
              null,
            )
          }
        />
      )}
    </>
  )
}

/* =========================================================
   MAINTENANCE MODAL
========================================================= */

function MaintenanceModal({
  formData,
  vehicles,
  editingRecord,
  sourceIssue,
  saving,
  onChange,
  onClose,
  onSubmit,
}: {
  formData:
    CreateMaintenanceLogData

  vehicles:
    Vehicle[]

  editingRecord:
    MaintenanceLog | null

  sourceIssue:
    VehicleIssueReport | null

  saving:
    boolean

  onChange:
    React.Dispatch<
      React.SetStateAction<CreateMaintenanceLogData>
    >

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
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-200">
                Fleet maintenance
              </p>

              <h2 className="mt-1 text-xl font-semibold">
                {editingRecord
                  ? 'Edit Maintenance'
                  : sourceIssue
                    ? 'Schedule From Issue'
                    : 'Schedule Maintenance'}
              </h2>

              {sourceIssue && (
                <p className="mt-1 text-sm text-slate-300">
                  Driver report VI-
                  {sourceIssue.id}
                </p>
              )}
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xl text-slate-200 hover:bg-white/20"
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
            {sourceIssue && (
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
                  Reported by driver
                </p>

                <p className="mt-2 font-semibold text-slate-900">
                  {sourceIssue.issueTitle}
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {sourceIssue.description}
                </p>
              </div>
            )}

            <FormField label="Vehicle">
              <select
                value={
                  formData.vehicleId ||
                  ''
                }
                disabled={
                  Boolean(
                    editingRecord,
                  ) ||
                  Boolean(
                    sourceIssue,
                  )
                }
                onChange={(event) =>
                  onChange(
                    (current) => ({
                      ...current,

                      vehicleId:
                        Number(
                          event.target
                            .value,
                        ),
                    }),
                  )
                }
                className={`${inputClass} disabled:bg-slate-100 disabled:text-slate-500`}
                required
              >
                {vehicles.map(
                  (vehicle) => (
                    <option
                      key={
                        vehicle.id
                      }
                      value={
                        vehicle.id
                      }
                    >
                      {vehicle.plateNumber}{' '}
                      (
                      {vehicle.vehicleType}
                      )
                    </option>
                  ),
                )}
              </select>
            </FormField>

            <FormField label="Maintenance Description">
              <textarea
                rows={4}
                value={
                  formData.description
                }
                onChange={(event) =>
                  onChange(
                    (current) => ({
                      ...current,

                      description:
                        event.target
                          .value,
                    }),
                  )
                }
                className={`${inputClass} resize-none`}
                required
              />
            </FormField>

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Service Date">
                <input
                  type="date"
                  value={
                    formData.serviceDate
                  }
                  onChange={(event) =>
                    onChange(
                      (current) => ({
                        ...current,

                        serviceDate:
                          event.target
                            .value,
                      }),
                    )
                  }
                  className={
                    inputClass
                  }
                  required
                />
              </FormField>

              <FormField label="Estimated / Final Cost (MMK)">
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={
                    formData.cost ||
                    ''
                  }
                  onChange={(event) =>
                    onChange(
                      (current) => ({
                        ...current,

                        cost:
                          Number(
                            event.target
                              .value,
                          ),
                      }),
                    )
                  }
                  className={
                    inputClass
                  }
                  required
                />
              </FormField>
            </div>

            <FormField label="Next Service Date">
              <input
                type="date"
                value={
                  formData.nextServiceDate ??
                  ''
                }
                onChange={(event) =>
                  onChange(
                    (current) => ({
                      ...current,

                      nextServiceDate:
                        event.target
                          .value,
                    }),
                  )
                }
                className={
                  inputClass
                }
              />
            </FormField>

            {sourceIssue && (
              <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                Creating this
                maintenance record will
                move VI-
                {sourceIssue.id} to{' '}
                <strong>
                  IN PROGRESS
                </strong>
                . When this maintenance
                is completed, that issue
                will automatically be
                resolved.
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-5">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 px-5 py-3 text-sm font-semibold text-white shadow-sm disabled:opacity-50"
            >
              {saving
                ? 'Saving...'
                : editingRecord
                  ? 'Update Maintenance'
                  : 'Create Maintenance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* =========================================================
   ISSUE DETAILS
========================================================= */

function IssueDetailsModal({
  issue,
  onClose,
}: {
  issue:
    VehicleIssueReport

  onClose:
    () => void
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 px-6 py-5 text-white">
          <div className="flex justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-200">
                Vehicle issue
              </p>

              <h2 className="mt-1 text-xl font-semibold">
                VI-{issue.id}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-xl text-slate-300"
            >
              ×
            </button>
          </div>
        </div>

        <div className="space-y-5 p-6">
          <IssueStatusBadge
            status={issue.status}
          />

          <DetailItem
            label="Vehicle"
            value={
              issue.vehicle
                ?.plateNumber ??
              `Vehicle ${issue.vehicleId}`
            }
          />

          <DetailItem
            label="Driver"
            value={
              issue.driver?.user
                ?.name ??
              `Driver ${issue.driverId}`
            }
          />

          <DetailItem
            label="Issue"
            value={
              issue.issueTitle
            }
          />

          <DetailItem
            label="Description"
            value={
              issue.description
            }
          />

          <DetailItem
            label="Reported"
            value={formatDate(
              getIssueDate(
                issue,
              ),
            )}
          />
        </div>

        <div className="flex justify-end border-t border-slate-100 px-6 py-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700"
          >
            Close
          </button>
        </div>
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

      <p className="mt-1 text-lg font-semibold text-white">
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

          <p className="mt-2 text-2xl font-semibold text-slate-950">
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
      {formatStatus(
        status,
      )}
    </span>
  )
}

function MaintenanceStatusBadge({
  status,
}: {
  status:
    MaintenanceStatus
}) {
  const styles:
    Record<
      MaintenanceStatus,
      string
    > = {
    PENDING:
      'bg-blue-50 text-blue-700 ring-1 ring-blue-200',

    IN_PROGRESS:
      'bg-amber-50 text-amber-700 ring-1 ring-amber-200',

    COMPLETED:
      'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  }

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${styles[status]}`}
    >
      {formatStatus(
        status,
      )}
    </span>
  )
}

function ActionButton({
  label,
  tone,
  disabled,
  onClick,
}: {
  label: string

  tone:
    | 'blue'
    | 'green'
    | 'amber'
    | 'red'
    | 'slate'

  disabled?: boolean

  onClick:
    () => void
}) {
  const styles = {
    blue:
      'border-blue-100 text-blue-700 hover:bg-blue-50',

    green:
      'border-emerald-100 text-emerald-700 hover:bg-emerald-50',

    amber:
      'border-amber-100 text-amber-700 hover:bg-amber-50',

    red:
      'border-red-100 text-red-600 hover:bg-red-50',

    slate:
      'border-slate-200 text-slate-700 hover:bg-slate-50',
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg border bg-white px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${styles[tone]}`}
    >
      {label}
    </button>
  )
}

function LoadingBlock({
  text,
}: {
  text: string
}) {
  return (
    <div className="p-12 text-center text-sm text-slate-500">
      {text}
    </div>
  )
}

function EmptyBlock({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="p-12 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-500">
        FM
      </div>

      <p className="mt-4 font-semibold text-slate-700">
        {title}
      </p>

      <p className="mt-1 text-sm text-slate-500">
        {description}
      </p>
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

      <p className="mt-1 break-words text-sm font-semibold leading-6 text-slate-800">
        {value}
      </p>
    </div>
  )
}

const inputClass =
  'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

/* =========================================================
   HELPERS
========================================================= */

function getLinkedIssueId(
  description: string,
): number | null {
  const match =
    description.match(
      /\bVI-(\d+)\b/i,
    )

  if (!match) {
    return null
  }

  const issueId =
    Number(match[1])

  return Number.isNaN(
    issueId,
  )
    ? null
    : issueId
}

function getIssueDate(
  issue:
    VehicleIssueReport,
): string {
  const extended =
    issue as VehicleIssueReport & {
      reportedAt?: string
      createdAt?: string
    }

  return (
    extended.reportedAt ??
    extended.createdAt ??
    ''
  )
}

function toDateInputValue(
  value: string,
) {
  return value.split(
    'T',
  )[0]
}

function formatDate(
  value: string,
) {
  if (!value) {
    return 'Unavailable'
  }

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

export default MaintenanceView