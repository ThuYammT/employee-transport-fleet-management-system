import api from '../api/axios'

import type {
  CreateDriverData,
  Driver,
  UpdateDriverData,
} from '../types/driver'

export async function getDrivers(): Promise<
  Driver[]
> {
  const response = await api.get<Driver[]>(
    '/drivers',
  )

  return response.data
}

export async function getDriverById(
  id: number,
): Promise<Driver> {
  const response = await api.get<Driver>(
    `/drivers/${id}`,
  )

  return response.data
}

export async function getDriverByUserId(
  userId: number,
): Promise<Driver> {
  const response = await api.get<Driver>(
    `/drivers/user/${userId}`,
  )

  return response.data
}

export async function createDriver(
  data: CreateDriverData,
): Promise<Driver> {
  const response = await api.post<Driver>(
    '/drivers',
    data,
  )

  return response.data
}

export async function updateDriver(
  id: number,
  data: UpdateDriverData,
): Promise<Driver> {
  const response = await api.patch<Driver>(
    `/drivers/${id}`,
    data,
  )

  return response.data
}

export async function deactivateDriver(
  id: number,
): Promise<Driver> {
  const response = await api.delete<Driver>(
    `/drivers/${id}`,
  )

  return response.data
}