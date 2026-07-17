import type { Driver } from './driver'
import type { TripStatus } from './trip'
import type { Vehicle } from './vehicle'

export type TransportRequestStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'

export type RequestEmployee = {
  id: number
  name: string
  email: string
  phone?: string | null
  role: 'EMPLOYEE'
  status?: 'ACTIVE' | 'INACTIVE'
}

export type RequestTrip = {
  id: number
  requestId: number
  driverId: number
  vehicleId: number
  startTime?: string | null
  endTime?: string | null
  status: TripStatus
  driver?: Driver
  vehicle?: Vehicle
  createdAt: string
  updatedAt: string
}

export type TransportRequest = {
  id: number
  employeeId: number
  pickupLocation: string
  destination: string
  requestDate: string
  requestTime: string
  purpose: string
  status: TransportRequestStatus
  employee?: RequestEmployee
  trip?: RequestTrip | null
  createdAt: string
  updatedAt: string
}

export type CreateTransportRequestData = {
  employeeId: number
  pickupLocation: string
  destination: string
  requestDate: string
  requestTime: string
  purpose: string
}

export type UpdateTransportRequestData =
  Partial<CreateTransportRequestData> & {
    status?: TransportRequestStatus
  }