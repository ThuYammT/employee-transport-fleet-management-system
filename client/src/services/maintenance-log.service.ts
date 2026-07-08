import api from '../api/axios'
import type {
  MaintenanceLog,
  CreateMaintenanceLogData,
  UpdateMaintenanceLogData,
} from '../types/maintenance-log'

export async function getMaintenanceLogs(): Promise<MaintenanceLog[]> {
  const response = await api.get('/maintenance-logs')
  return response.data
}

export async function createMaintenanceLog(
  data: CreateMaintenanceLogData,
): Promise<MaintenanceLog> {
  const response = await api.post('/maintenance-logs', data)
  return response.data
}

export async function updateMaintenanceLog(
  id: number,
  data: UpdateMaintenanceLogData,
): Promise<MaintenanceLog> {
  const response = await api.patch(`/maintenance-logs/${id}`, data)
  return response.data
}

export async function deleteMaintenanceLog(id: number): Promise<void> {
  await api.delete(`/maintenance-logs/${id}`)
}