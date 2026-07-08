export type TransportRequestStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'

export type TransportRequest = {
  id: number
  employeeId: number
  pickupLocation: string
  destination: string
  requestDate: string
  requestTime: string
  purpose: string
  status: TransportRequestStatus
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