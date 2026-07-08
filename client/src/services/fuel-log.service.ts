import api from '../api/axios'
import type {
  FuelLog,
  CreateFuelLogData,
  UpdateFuelLogData,
} from '../types/fuel-log'

export async function getFuelLogs(): Promise<FuelLog[]> {
  const response = await api.get('/fuel-logs')
  return response.data
}

export async function createFuelLog(
  data: CreateFuelLogData,
): Promise<FuelLog> {
  const response = await api.post('/fuel-logs', data)
  return response.data
}

export async function updateFuelLog(
  id: number,
  data: UpdateFuelLogData,
): Promise<FuelLog> {
  const response = await api.patch(`/fuel-logs/${id}`, data)
  return response.data
}

export async function deleteFuelLog(id: number): Promise<void> {
  await api.delete(`/fuel-logs/${id}`)
}