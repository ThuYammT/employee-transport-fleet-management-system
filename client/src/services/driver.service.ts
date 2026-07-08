import api from '../api/axios'
import type {
  Driver,
  CreateDriverData,
  UpdateDriverData,
} from '../types/driver'

export async function getDrivers(): Promise<Driver[]> {
  const response = await api.get('/drivers')
  return response.data
}

export async function createDriver(
  data: CreateDriverData,
): Promise<Driver> {
  const response = await api.post('/drivers', data)
  return response.data
}

export async function updateDriver(
  id: number,
  data: UpdateDriverData,
): Promise<Driver> {
  const response = await api.patch(`/drivers/${id}`, data)
  return response.data
}

export async function deleteDriver(id: number): Promise<void> {
  await api.delete(`/drivers/${id}`)
}