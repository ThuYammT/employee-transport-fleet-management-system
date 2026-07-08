import api from '../api/axios'
import type {
  VehicleIssueReport,
  CreateVehicleIssueReportData,
  UpdateVehicleIssueReportData,
} from '../types/vehicle-issue-report'

export async function getVehicleIssueReports(): Promise<
  VehicleIssueReport[]
> {
  const response = await api.get('/vehicle-issue-reports')
  return response.data
}

export async function createVehicleIssueReport(
  data: CreateVehicleIssueReportData,
): Promise<VehicleIssueReport> {
  const response = await api.post('/vehicle-issue-reports', data)
  return response.data
}

export async function updateVehicleIssueReport(
  id: number,
  data: UpdateVehicleIssueReportData,
): Promise<VehicleIssueReport> {
  const response = await api.patch(
    `/vehicle-issue-reports/${id}`,
    data,
  )
  return response.data
}

export async function deleteVehicleIssueReport(
  id: number,
): Promise<void> {
  await api.delete(`/vehicle-issue-reports/${id}`)
}