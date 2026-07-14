import { Navigate, Route, Routes } from 'react-router-dom'

import DashboardLayout from './layouts/DashboardLayout'
import DriverLayout from './layouts/DriverLayout'
import EmployeeLayout from './layouts/EmployeeLayout'
import TransportRequestsView from './pages/admin/TransportRequestsView'
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
import EmployeeSetupPage from './pages/employee/EmployeeSetupPage'
import EmployeeDashboard from './pages/employee/EmployeeDashboard'
import EmployeeProfilePage from './pages/employee/EmployeeProfilePage'
import MyRequestsPage from './pages/employee/MyRequestsPage'
import NewTransportRequestPage from './pages/employee/NewTransportRequestPage'
import RequestDetailsPage from './pages/employee/RequestDetailsPage'

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
        <Route
              path="transport-requests"
              element={<TransportRequestsView />}
            />
      </Route>

      <Route path="/driver" element={<DriverLayout />}>
        <Route index element={<DriverDashboard />} />
        <Route path="my-trips" element={<MyTripsPage />} />
        <Route path="fuel-logs" element={<FuelLogsPage />} />
        <Route
          path="vehicle-issues"
          element={<VehicleIssuesPage />}
        />
        <Route path="my-vehicle" element={<MyVehiclePage />} />
        <Route path="profile" element={<DriverProfilePage />} />
      </Route>

      <Route
        path="/employee/setup"
        element={<EmployeeSetupPage />}
      />

      <Route path="/employee" element={<EmployeeLayout />}>
        <Route index element={<EmployeeDashboard />} />

        <Route
          path="new-request"
          element={<NewTransportRequestPage />}
        />

        <Route
          path="my-requests"
          element={<MyRequestsPage />}
        />

        <Route
          path="requests/:requestId"
          element={<RequestDetailsPage />}
        />

        <Route
          path="profile"
          element={<EmployeeProfilePage />}
        />
      </Route>

      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}

export default App