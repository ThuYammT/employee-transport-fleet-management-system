import type { Driver } from './driver'
import type { Vehicle } from './vehicle'

export type VehicleIssueStatus =
  | 'REPORTED'
  | 'IN_PROGRESS'
  | 'RESOLVED'

export type VehicleIssueReport = {
  id: number
  vehicleId: number
  driverId: number

  issueTitle: string
  description: string
  status: VehicleIssueStatus

  vehicle?: Vehicle
  driver?: Driver

  reportedAt?: string
  createdAt?: string
  updatedAt?: string
}

export type CreateVehicleIssueReportData = {
  vehicleId: number
  driverId: number
  issueTitle: string
  description: string
}

export type UpdateVehicleIssueReportData = {
  issueTitle?: string
  description?: string
  status?: VehicleIssueStatus
}