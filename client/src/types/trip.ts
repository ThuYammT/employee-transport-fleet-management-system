export type TripStatus =
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'

export type Trip = {
  id: number
  requestId: number
  driverId: number
  vehicleId: number
  startTime?: string | null
  endTime?: string | null
  status: TripStatus
  createdAt: string
  updatedAt: string
}

export type CreateTripData = {
  requestId: number
  driverId: number
  vehicleId: number
}

export type UpdateTripData = Partial<CreateTripData>