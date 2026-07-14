import api from '../api/axios'
import type {
  TransportRequest,
  CreateTransportRequestData,
  UpdateTransportRequestData,
} from '../types/transport-request'

export async function getTransportRequests(): Promise<
  TransportRequest[]
> {
  const response = await api.get('/transport-requests')
  return response.data
}

export async function getTransportRequestById(
  id: number,
): Promise<TransportRequest> {
  const response = await api.get(`/transport-requests/${id}`)
  return response.data
}

export async function createTransportRequest(
  data: CreateTransportRequestData,
): Promise<TransportRequest> {
  const response = await api.post('/transport-requests', data)
  return response.data
}

export async function updateTransportRequest(
  id: number,
  data: UpdateTransportRequestData,
): Promise<TransportRequest> {
  const response = await api.patch(
    `/transport-requests/${id}`,
    data,
  )

  return response.data
}

export async function deleteTransportRequest(
  id: number,
): Promise<void> {
  await api.delete(`/transport-requests/${id}`)
}