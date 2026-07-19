import api from '../api/axios'
import type {
  CreateTransportRequestData,
  LocationSuggestion,
  RouteEstimate,
  TransportRequest,
  UpdateTransportRequestData,
} from '../types/transport-request'

export async function getTransportRequests(): Promise<TransportRequest[]> {
  const response = await api.get('/transport-requests')
  return response.data
}

export async function getTransportRequestById(id: number): Promise<TransportRequest> {
  const response = await api.get(`/transport-requests/${id}`)
  return response.data
}

export async function searchLocations(query: string, signal?: AbortSignal): Promise<LocationSuggestion[]> {
  const response = await api.get('/transport-requests/location-search', {
    params: { query, limit: 6 },
    signal,
  })
  return response.data
}

export async function estimateRoute(data: {
  pickupLatitude: number
  pickupLongitude: number
  destinationLatitude: number
  destinationLongitude: number
}, signal?: AbortSignal): Promise<RouteEstimate> {
  const response = await api.post('/transport-requests/estimate-route', data, { signal })
  return response.data
}

export async function createTransportRequest(data: CreateTransportRequestData): Promise<TransportRequest> {
  const response = await api.post('/transport-requests', data)
  return response.data
}

export async function updateTransportRequest(id: number, data: UpdateTransportRequestData): Promise<TransportRequest> {
  const response = await api.patch(`/transport-requests/${id}`, data)
  return response.data
}

export async function deleteTransportRequest(id: number): Promise<void> {
  await api.delete(`/transport-requests/${id}`)
}
