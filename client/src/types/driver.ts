export type DriverAvailabilityStatus =
  | 'AVAILABLE'
  | 'ON_TRIP'
  | 'OFF_DUTY'
  | 'INACTIVE'

export type Driver = {
  id: number
  userId: number
  licenseNumber: string
  availabilityStatus: DriverAvailabilityStatus
  assignedVehicleId?: number | null
  createdAt: string
  updatedAt: string
}

export type CreateDriverData = {
  userId: number
  licenseNumber: string
  assignedVehicleId?: number
}

export type UpdateDriverData = Partial<CreateDriverData>