import api from '../api/axios'

export async function getMaintenanceLogs() {
  const response = await api.get('/maintenance-logs')
  return response.data
}