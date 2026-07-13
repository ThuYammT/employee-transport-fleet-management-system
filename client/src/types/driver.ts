import type { User } from './user'
import type { Vehicle } from './vehicle'

export type DriverAvailabilityStatus =
  | 'AVAILABLE'
  | 'ON_TRIP'
  | 'OFF_DUTY'
  | 'INACTIVE'

export type DriverUser = Pick<
  User,
  'id' | 'name' | 'email' | 'role' | 'phone' | 'status'
>

export type DriverVehicle = Pick<
  Vehicle,
  'id' | 'plateNumber' | 'vehicleType' | 'capacity' | 'status' | 'currentMileage'
>

export type Driver = {
  id: number
  userId: number
  licenseNumber: string
  availabilityStatus: DriverAvailabilityStatus
  assignedVehicleId?: number | null
  user?: DriverUser
  assignedVehicle?: DriverVehicle | null
  createdAt: string
  updatedAt: string
}

export type CreateDriverData = {
  userId: number
  licenseNumber: string
  assignedVehicleId?: number
}

export type UpdateDriverData = Partial<CreateDriverData>