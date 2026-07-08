export type FuelLog = {
  id: number
  vehicleId: number
  driverId: number
  tripId?: number | null
  fuelDate: string
  liters: number
  cost: number
  mileage: number
  fuelStation?: string | null
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
  fuelStation?: string
}

export type UpdateFuelLogData = Partial<CreateFuelLogData>