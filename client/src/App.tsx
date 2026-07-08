import { Navigate, Route, Routes } from 'react-router-dom'

import DashboardLayout from './layouts/DashboardLayout'
import DriverLayout from './layouts/DriverLayout'

import DashboardHome from './pages/admin/DashboardHome'
import VehiclesView from './pages/admin/VehiclesView'
import DriversView from './pages/admin/DriversView'
import FuelLogsView from './pages/admin/FuelLogsView'
import MaintenanceView from './pages/admin/MaintenanceView'
import UsersView from './pages/admin/UsersView'

import DriverDashboard from './pages/driver/DriverDashboard'
import MyTripsPage from './pages/driver/MyTripsPage'
import FuelLogsPage from './pages/driver/FuelLogsPage'
import VehicleIssuesPage from './pages/driver/VehicleIssuesPage'
import MyVehiclePage from './pages/driver/MyVehiclePage'
import DriverProfilePage from './pages/driver/DriverProfilePage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin" replace />} />

      <Route path="/admin" element={<DashboardLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="vehicles" element={<VehiclesView />} />
        <Route path="drivers" element={<DriversView />} />
        <Route path="fuel-logs" element={<FuelLogsView />} />
        <Route path="maintenance" element={<MaintenanceView />} />
        <Route path="users" element={<UsersView />} />
      </Route>

      <Route path="/driver" element={<DriverLayout />}>
        <Route index element={<DriverDashboard />} />
        <Route path="my-trips" element={<MyTripsPage />} />
        <Route path="fuel-logs" element={<FuelLogsPage />} />
        <Route path="vehicle-issues" element={<VehicleIssuesPage />} />
        <Route path="my-vehicle" element={<MyVehiclePage />} />
        <Route path="profile" element={<DriverProfilePage />} />
      </Route>
    </Routes>
  )
}

export default App