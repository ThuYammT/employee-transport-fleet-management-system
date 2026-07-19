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

export type LocationSuggestion = {
  id: string
  label: string
  name: string | null
  locality: string | null
  region: string | null
  country: string | null
  latitude: number
  longitude: number
}

export type RouteEstimateRequest = {
  pickupLatitude: number
  pickupLongitude: number
  destinationLatitude: number
  destinationLongitude: number
}

export type RouteEstimate = {
  distanceMeters: number
  estimatedDistanceKm: number
  estimatedDistanceMiles: number
  durationSeconds: number
  estimatedDurationMinutes: number
  routeCoordinates: [number, number][]
}

export type TransportRequest = {
  id: number
  employeeId: number

  pickupLocation: string
  pickupLatitude?: number | null
  pickupLongitude?: number | null

  destination: string
  destinationLatitude?: number | null
  destinationLongitude?: number | null

  estimatedDistanceKm?: number | null
  estimatedDurationMinutes?: number | null

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
  pickupLatitude: number
  pickupLongitude: number

  destination: string
  destinationLatitude: number
  destinationLongitude: number

  estimatedDistanceKm?: number
  estimatedDurationMinutes?: number

  requestDate: string
  requestTime: string
  purpose: string
}

export type UpdateTransportRequestData =
  Partial<CreateTransportRequestData> & {
    status?: TransportRequestStatus
  }