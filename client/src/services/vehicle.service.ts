import api from '../api/axios'
import type {
  Vehicle,
  CreateVehicleData,
  UpdateVehicleData,
} from '../types/vehicle'

export async function getVehicles(): Promise<Vehicle[]> {
  const response = await api.get('/vehicles')
  return response.data
}

export async function createVehicle(
  data: CreateVehicleData,
): Promise<Vehicle> {
  const response = await api.post('/vehicles', data)
  return response.data
}

export async function updateVehicle(
  id: number,
  data: UpdateVehicleData,
): Promise<Vehicle> {
  const response = await api.patch(`/vehicles/${id}`, data)
  return response.data
}

export async function deleteVehicle(id: number): Promise<void> {
  await api.delete(`/vehicles/${id}`)
}