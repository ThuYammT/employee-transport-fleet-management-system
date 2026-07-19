import api from '../api/axios'

import type {
  CreateFuelLogData,
  FuelLog,
  UpdateFuelLogData,
} from '../types/fuel-log'

export async function getFuelLogs(): Promise<
  FuelLog[]
> {
  const response = await api.get<FuelLog[]>(
    '/fuel-logs',
  )

  return response.data
}

export async function getFuelLogById(
  id: number,
): Promise<FuelLog> {
  const response = await api.get<FuelLog>(
    `/fuel-logs/${id}`,
  )

  return response.data
}

export async function getFuelLogsByDriverId(
  driverId: number,
): Promise<FuelLog[]> {
  const response = await api.get<FuelLog[]>(
    `/fuel-logs/driver/${driverId}`,
  )

  return response.data
}

export async function getFuelLogsByVehicleId(
  vehicleId: number,
): Promise<FuelLog[]> {
  const response = await api.get<FuelLog[]>(
    `/fuel-logs/vehicle/${vehicleId}`,
  )

  return response.data
}

export async function getFuelLogsByTripId(
  tripId: number,
): Promise<FuelLog[]> {
  const response = await api.get<FuelLog[]>(
    `/fuel-logs/trip/${tripId}`,
  )

  return response.data
}

export async function createFuelLog(
  data: CreateFuelLogData,
): Promise<FuelLog> {
  const response = await api.post<FuelLog>(
    '/fuel-logs',
    data,
  )

  return response.data
}

export async function updateFuelLog(
  id: number,
  data: UpdateFuelLogData,
): Promise<FuelLog> {
  const response = await api.patch<FuelLog>(
    `/fuel-logs/${id}`,
    data,
  )

  return response.data
}

export async function deleteFuelLog(
  id: number,
): Promise<FuelLog> {
  const response = await api.delete<FuelLog>(
    `/fuel-logs/${id}`,
  )

  return response.data
}