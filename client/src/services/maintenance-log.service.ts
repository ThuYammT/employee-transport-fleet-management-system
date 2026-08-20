import api from '../api/axios'

import type {
  CreateMaintenanceLogData,
  MaintenanceLog,
  UpdateMaintenanceLogData,
} from '../types/maintenance-log'

export async function getMaintenanceLogs(): Promise<
  MaintenanceLog[]
> {
  const response =
    await api.get<MaintenanceLog[]>(
      '/maintenance-logs',
    )

  return response.data
}

export async function getMaintenanceLogById(
  id: number,
): Promise<MaintenanceLog> {
  const response =
    await api.get<MaintenanceLog>(
      `/maintenance-logs/${id}`,
    )

  return response.data
}

export async function getMaintenanceLogsByVehicleId(
  vehicleId: number,
): Promise<MaintenanceLog[]> {
  const response =
    await api.get<MaintenanceLog[]>(
      `/maintenance-logs/vehicle/${vehicleId}`,
    )

  return response.data
}

export async function createMaintenanceLog(
  data: CreateMaintenanceLogData,
): Promise<MaintenanceLog> {
  const response =
    await api.post<MaintenanceLog>(
      '/maintenance-logs',
      data,
    )

  return response.data
}

export async function updateMaintenanceLog(
  id: number,
  data: UpdateMaintenanceLogData,
): Promise<MaintenanceLog> {
  const response =
    await api.patch<MaintenanceLog>(
      `/maintenance-logs/${id}`,
      data,
    )

  return response.data
}

export async function startMaintenanceLog(
  id: number,
): Promise<MaintenanceLog> {
  const response =
    await api.patch<MaintenanceLog>(
      `/maintenance-logs/${id}/start`,
    )

  return response.data
}

export async function completeMaintenanceLog(
  id: number,
): Promise<MaintenanceLog> {
  const response =
    await api.patch<MaintenanceLog>(
      `/maintenance-logs/${id}/complete`,
    )

  return response.data
}

export async function reopenMaintenanceLog(
  id: number,
): Promise<MaintenanceLog> {
  const response =
    await api.patch<MaintenanceLog>(
      `/maintenance-logs/${id}/reopen`,
    )

  return response.data
}

export async function deleteMaintenanceLog(
  id: number,
): Promise<MaintenanceLog> {
  const response =
    await api.delete<MaintenanceLog>(
      `/maintenance-logs/${id}`,
    )

  return response.data
}