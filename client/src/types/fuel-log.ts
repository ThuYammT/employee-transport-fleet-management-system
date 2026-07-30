import type { Driver } from './driver'
import type { Trip } from './trip'
import type { Vehicle } from './vehicle'

export type FuelLog = {
  id: number
  vehicleId: number
  driverId: number
  tripId?: number | null

  fuelDate: string
  liters: number
  cost: number
  mileage: number

  photoUrl?: string | null

  vehicle?: Vehicle
  driver?: Driver
  trip?: Trip | null

  createdAt: string
  updatedAt: string
}

export type CreateFuelLogData = {
  vehicleId: number
  driverId: number
  tripId?: number

  fuelDate: string
  liters: number
  cost: number
  mileage: number

  photoUrl?: string
}

export type UpdateFuelLogData = {
  fuelDate?: string
  liters?: number
  cost?: number
  fuelStation?: string
  photoUrl?: string
}