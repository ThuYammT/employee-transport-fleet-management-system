import api from '../api/axios'

import type {
  CreateVehicleIssueReportData,
  UpdateVehicleIssueReportData,
  VehicleIssueReport,
} from '../types/vehicle-issue-report'

export async function getVehicleIssueReports(): Promise<
  VehicleIssueReport[]
> {
  const response =
    await api.get<VehicleIssueReport[]>(
      '/vehicle-issue-reports',
    )

  return response.data
}

export async function getVehicleIssueReportById(
  id: number,
): Promise<VehicleIssueReport> {
  const response =
    await api.get<VehicleIssueReport>(
      `/vehicle-issue-reports/${id}`,
    )

  return response.data
}

export async function getVehicleIssueReportsByDriverId(
  driverId: number,
): Promise<VehicleIssueReport[]> {
  const response =
    await api.get<VehicleIssueReport[]>(
      `/vehicle-issue-reports/driver/${driverId}`,
    )

  return response.data
}

export async function getVehicleIssueReportsByVehicleId(
  vehicleId: number,
): Promise<VehicleIssueReport[]> {
  const response =
    await api.get<VehicleIssueReport[]>(
      `/vehicle-issue-reports/vehicle/${vehicleId}`,
    )

  return response.data
}

export async function createVehicleIssueReport(
  data: CreateVehicleIssueReportData,
): Promise<VehicleIssueReport> {
  const response =
    await api.post<VehicleIssueReport>(
      '/vehicle-issue-reports',
      data,
    )

  return response.data
}

export async function updateVehicleIssueReport(
  id: number,
  data: UpdateVehicleIssueReportData,
): Promise<VehicleIssueReport> {
  const response =
    await api.patch<VehicleIssueReport>(
      `/vehicle-issue-reports/${id}`,
      data,
    )

  return response.data
}

export async function startVehicleIssueInvestigation(
  id: number,
): Promise<VehicleIssueReport> {
  const response =
    await api.patch<VehicleIssueReport>(
      `/vehicle-issue-reports/${id}/start`,
    )

  return response.data
}

export async function resolveVehicleIssueReport(
  id: number,
): Promise<VehicleIssueReport> {
  const response =
    await api.patch<VehicleIssueReport>(
      `/vehicle-issue-reports/${id}/resolve`,
    )

  return response.data
}

export async function reopenVehicleIssueReport(
  id: number,
): Promise<VehicleIssueReport> {
  const response =
    await api.patch<VehicleIssueReport>(
      `/vehicle-issue-reports/${id}/reopen`,
    )

  return response.data
}

export async function deleteVehicleIssueReport(
  id: number,
): Promise<VehicleIssueReport> {
  const response =
    await api.delete<VehicleIssueReport>(
      `/vehicle-issue-reports/${id}`,
    )

  return response.data
}