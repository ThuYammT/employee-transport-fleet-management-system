import api from '../api/axios'

export async function getDashboardStats() {
  const [
    vehiclesResponse,
    driversResponse,
    fuelLogsResponse,
    maintenanceLogsResponse,
    usersResponse,
  ] = await Promise.all([
    api.get('/vehicles'),
    api.get('/drivers'),
    api.get('/fuel-logs'),
    api.get('/maintenance-logs'),
    api.get('/users'),
  ])

  return {
    totalVehicles: vehiclesResponse.data.length,
    totalDrivers: driversResponse.data.length,
    totalFuelLogs: fuelLogsResponse.data.length,
    totalMaintenanceLogs: maintenanceLogsResponse.data.length,
    totalUsers: usersResponse.data.length,
  }
}