export type VehicleIssueStatus =
  | 'OPEN'
  | 'IN_REVIEW'
  | 'RESOLVED'
  | 'CLOSED'

export type VehicleIssueReport = {
  id: number
  vehicleId: number
  driverId: number
  issueTitle: string
  description: string
  status: VehicleIssueStatus
  createdAt: string
  updatedAt: string
}

export type CreateVehicleIssueReportData = {
  vehicleId: number
  driverId: number
  issueTitle: string
  description: string
}

export type UpdateVehicleIssueReportData =
  Partial<CreateVehicleIssueReportData> & {
    status?: VehicleIssueStatus
  }