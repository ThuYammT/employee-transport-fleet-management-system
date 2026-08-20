import type { Driver } from './driver'
import type { TransportRequest } from './transport-request'
import type { Vehicle } from './vehicle'

export type TripStatus =
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'

export type TripEmployee = {
  id: number
  name: string
  email: string
  phone?: string | null
  role: 'EMPLOYEE'
  status?: 'ACTIVE' | 'INACTIVE'
}

export type TripRequest = Omit<
  TransportRequest,
  'trip'
> & {
  employee?: TripEmployee
}

export type Trip = {
  id: number
  requestId: number
  driverId: number
  vehicleId: number
  startTime?: string | null
  endTime?: string | null
  status: TripStatus
  request?: TripRequest
  driver?: Driver
  vehicle?: Vehicle
  createdAt: string
  updatedAt: string
}

export type CreateTripData = {
  requestId: number
  driverId: number
  vehicleId: number
}

export type UpdateTripData =
  Partial<CreateTripData>