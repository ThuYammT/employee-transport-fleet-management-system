import api from '../api/axios'

import type {
  CreateTripData,
  Trip,
  UpdateTripData,
} from '../types/trip'

export async function getTrips(): Promise<
  Trip[]
> {
  const response = await api.get<Trip[]>(
    '/trips',
  )

  return response.data
}

export async function getTripById(
  id: number,
): Promise<Trip> {
  const response = await api.get<Trip>(
    `/trips/${id}`,
  )

  return response.data
}

export async function getTripsByDriverId(
  driverId: number,
): Promise<Trip[]> {
  const response = await api.get<Trip[]>(
    `/trips/driver/${driverId}`,
  )

  return response.data
}

export async function createTrip(
  data: CreateTripData,
): Promise<Trip> {
  const response = await api.post<Trip>(
    '/trips',
    data,
  )

  return response.data
}

export async function updateTrip(
  id: number,
  data: UpdateTripData,
): Promise<Trip> {
  const response = await api.patch<Trip>(
    `/trips/${id}`,
    data,
  )

  return response.data
}

export async function startTrip(
  id: number,
): Promise<Trip> {
  const response = await api.patch<Trip>(
    `/trips/${id}/start`,
  )

  return response.data
}

export async function completeTrip(
  id: number,
): Promise<Trip> {
  const response = await api.patch<Trip>(
    `/trips/${id}/complete`,
  )

  return response.data
}

export async function cancelTrip(
  id: number,
): Promise<Trip> {
  const response = await api.patch<Trip>(
    `/trips/${id}/cancel`,
  )

  return response.data
}

export async function deleteTrip(
  id: number,
): Promise<void> {
  await api.delete(`/trips/${id}`)
}