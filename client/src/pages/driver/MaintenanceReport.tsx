import { useEffect, useState } from 'react'
import axios from 'axios'
import {
  createVehicleIssueReport,
  getVehicleIssueReportsByDriverId,
} from '../../services/vehicle-issue-report.service'
import { getDriverByUserId } from '../../services/driver.service'
import { getVehicles } from '../../services/vehicle.service'
import type { CreateVehicleIssueReportData, VehicleIssueReport } from '../../types/vehicle-issue-report'
import type { Driver } from '../../types/driver'
import type { Vehicle } from '../../types/vehicle'
import { getCurrentUser } from '../../utils/user-session'

const emptyForm: CreateVehicleIssueReportData = {
  vehicleId: 0,
  driverId: 0,
  issueTitle: '',
  description: '',
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString()
}

function getApiErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  if (!axios.isAxiosError(error)) {
    return fallbackMessage
  }

  const message = error.response?.data?.message

  if (Array.isArray(message)) {
    return message.join(', ')
  }

  if (typeof message === 'string') {
    return message
  }

  if (!error.response) {
    return 'Unable to connect to the server.'
  }

  return fallbackMessage
}

function getStatusBadge(status: string) {
  const baseClass = 'px-3 py-1 rounded-lg text-xs font-semibold'

  const statusClass =
    status === 'RESOLVED'
      ? 'bg-green-100 text-green-700'
      : status === 'IN_PROGRESS'
        ? 'bg-amber-100 text-amber-700'
        : 'bg-blue-100 text-blue-700'

  return (
    <span className={`${baseClass} ${statusClass}`}>
      {status.replaceAll('_', ' ')}
    </span>
  )
}

function MaintenanceReport() {
  const [issueReports, setIssueReports] = useState<VehicleIssueReport[]>([])
  const [driver, setDriver] = useState<Driver | null>(null)
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [formData, setFormData] = useState<CreateVehicleIssueReportData>(emptyForm)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDriverAndReports()
  }, [])

  async function fetchDriverAndReports() {
    try {
      setLoading(true)
      setError('')

      const currentUser = getCurrentUser()
      if (!currentUser || currentUser.role !== 'DRIVER') {
        setError('You must be logged in as a driver to access this page.')
        return
      }

      const driverData = await getDriverByUserId(currentUser.id)
      setDriver(driverData)

      if (driverData.assignedVehicleId) {
        const vehicles = await getVehicles()
        const assignedVehicle = vehicles.find(
          (v) => v.id === driverData.assignedVehicleId,
        )
        if (assignedVehicle) {
          setVehicle(assignedVehicle)
        }
      }

      const reportsData = await getVehicleIssueReportsByDriverId(driverData.id)
      setIssueReports(reportsData)
    } catch (fetchError) {
      console.error(fetchError)
      setError(getApiErrorMessage(fetchError, 'Failed to load issue reports'))
    } finally {
      setLoading(false)
    }
  }

  function openAddModal() {
    if (!driver || !vehicle) {
      setError('No vehicle assigned to your profile. Please contact admin.')
      return
    }

    setError('')
    setFormData({
      vehicleId: vehicle.id,
      driverId: driver.id,
      issueTitle: '',
      description: '',
    })
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setFormData(emptyForm)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!formData.vehicleId || !formData.driverId) {
      setError('Please select a vehicle and driver.')
      return
    }

    if (!formData.issueTitle.trim() || !formData.description.trim()) {
      setError('Please enter both issue title and description.')
      return
    }

    if (formData.issueTitle.trim().length < 3) {
      setError('Issue title must be at least 3 characters.')
      return
    }

    if (formData.description.trim().length < 10) {
      setError('Description must be at least 10 characters.')
      return
    }

    try {
      setSaving(true)
      setError('')

      await createVehicleIssueReport({
        vehicleId: formData.vehicleId,
        driverId: formData.driverId,
        issueTitle: formData.issueTitle.trim(),
        description: formData.description.trim(),
      })

      closeModal()
      await fetchDriverAndReports()
    } catch (submitError) {
      console.error(submitError)
      setError(getApiErrorMessage(submitError, 'Failed to submit issue report'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="page-section">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">My Maintenance Reports</h2>
        <p className="text-slate-500 mt-1">
          Report and track maintenance issues for your assigned vehicle.
        </p>
      </header>

      {error && (
        <div
          className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700"
          role="alert"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl shadow border border-slate-200 p-8 text-center">
          <p className="text-slate-500">Loading maintenance reports...</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl shadow border border-slate-200 p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold">Issue Reports</h3>
                <p className="text-sm text-slate-500">
                  Total reports: {issueReports.length}
                </p>
              </div>

              {driver && vehicle && (
                <button
                  onClick={openAddModal}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold transition w-full sm:w-auto"
                >
                  + Report Issue
                </button>
              )}
            </div>

            {(!driver || !vehicle) && (
              <div className="text-center py-8 text-slate-500">
                <p className="font-medium">No vehicle assigned</p>
                <p className="text-sm mt-1">
                  Please contact your administrator to assign a vehicle to your
                  profile before reporting maintenance issues.
                </p>
              </div>
            )}

            {driver && vehicle && issueReports.length === 0 && (
              <p className="text-slate-500 text-center py-8">
                No maintenance issues reported yet. Click "Report Issue" to add
                your first report.
              </p>
            )}

            {driver && vehicle && issueReports.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-500">
                      <th className="py-4">Date</th>
                      <th className="py-4">Vehicle</th>
                      <th className="py-4">Issue Title</th>
                      <th className="py-4">Description</th>
                      <th className="py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issueReports.map((report) => (
                      <tr
                        key={report.id}
                        className="border-b border-slate-100 hover:bg-slate-50"
                      >
                        <td className="py-4 font-medium">
                          {formatDate(report.reportedAt ?? report.createdAt ?? '')}
                        </td>
                        <td className="py-4">
                          <div className="font-semibold">
                            {report.vehicle?.plateNumber ?? `Vehicle #${report.vehicleId}`}
                          </div>
                          <div className="text-xs text-slate-500">
                            {report.vehicle?.vehicleType ?? '—'}
                          </div>
                        </td>
                        <td className="py-4 font-medium">{report.issueTitle}</td>
                        <td className="py-4 max-w-xs truncate" title={report.description}>
                          {report.description}
                        </td>
                        <td className="py-4">{getStatusBadge(report.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {isModalOpen && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-bold">Report Maintenance Issue</h3>
                    <p className="text-sm text-slate-500">
                      Describe the issue you&apos;re experiencing with your vehicle.
                    </p>
                  </div>
                  <button
                    onClick={closeModal}
                    className="text-slate-400 hover:text-slate-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-slate-700">
                      Vehicle
                    </label>
                    <div className="mt-2 px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm">
                      {vehicle
                        ? `${vehicle.plateNumber} (${vehicle.vehicleType})`
                        : 'No vehicle assigned'}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700">
                      Issue Title
                    </label>
                    <input
                      type="text"
                      value={formData.issueTitle}
                      onChange={(event) =>
                        setFormData({
                          ...formData,
                          issueTitle: event.target.value,
                        })
                      }
                      className="mt-2 w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none"
                      placeholder="e.g. Brake noise, Engine overheating"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(event) =>
                        setFormData({
                          ...formData,
                          description: event.target.value,
                        })
                      }
                      rows={4}
                      className="mt-2 w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none resize-none"
                      placeholder="Describe the issue in detail..."
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="bg-slate-200 text-slate-700 px-5 py-3 rounded-xl font-semibold"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-3 rounded-xl font-semibold"
                    >
                      {saving ? 'Submitting...' : 'Submit Report'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}

export default MaintenanceReport