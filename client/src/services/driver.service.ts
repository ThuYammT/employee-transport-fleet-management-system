import api from '../api/axios'

export async function getDrivers() {
  const response = await api.get('/drivers')
  return response.data
}