import type { Vehicle } from './vehicle'

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
  vehicle?: Vehicle
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