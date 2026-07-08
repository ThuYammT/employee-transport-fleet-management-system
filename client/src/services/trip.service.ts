import api from '../api/axios'
import type {
  Trip,
  CreateTripData,
  UpdateTripData,
} from '../types/trip'

export async function getTrips(): Promise<Trip[]> {
  const response = await api.get('/trips')
  return response.data
}

export async function createTrip(
  data: CreateTripData,
): Promise<Trip> {
  const response = await api.post('/trips', data)
  return response.data
}

export async function updateTrip(
  id: number,
  data: UpdateTripData,
): Promise<Trip> {
  const response = await api.patch(`/trips/${id}`, data)
  return response.data
}

export async function deleteTrip(id: number): Promise<void> {
  await api.delete(`/trips/${id}`)
}