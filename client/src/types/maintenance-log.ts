export type MaintenanceStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'

export type MaintenanceLog = {
  id: number
  vehicleId: number
  serviceDate: string
  description: string
  cost: number
  nextServiceDate?: string | null
  status: MaintenanceStatus
  createdAt: string
  updatedAt: string
}

export type CreateMaintenanceLogData = {
  vehicleId: number
  serviceDate: string
  description: string
  cost: number
  nextServiceDate?: string
}

export type UpdateMaintenanceLogData =
  Partial<CreateMaintenanceLogData> & {
    status?: MaintenanceStatus
  }