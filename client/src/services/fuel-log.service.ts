import api from '../api/axios'

export async function getFuelLogs() {
  const response = await api.get('/fuel-logs')
  return response.data
}