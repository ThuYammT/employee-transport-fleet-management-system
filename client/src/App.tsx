import {
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'

import RoleRoute from './components/RoleRoute'

import DashboardLayout from './layouts/DashboardLayout'
import DriverLayout from './layouts/DriverLayout'
import EmployeeLayout from './layouts/EmployeeLayout'

import DashboardHome from './pages/admin/DashboardHome'
import DriversView from './pages/admin/DriversView'
import FuelLogsView from './pages/admin/FuelLogsView'
import MaintenanceView from './pages/admin/MaintenanceView'
import TransportRequestsView from './pages/admin/TransportRequestsView'
import UsersView from './pages/admin/UsersView'
import VehiclesView from './pages/admin/VehiclesView'

import AdminSetupPage from './pages/auth/AdminSetupPage'
import LoginPage from './pages/auth/LoginPage'
import SignUpPage from './pages/auth/SignUpPage'

import DriverDashboard from './pages/driver/DriverDashboard'
import DriverProfilePage from './pages/driver/DriverProfilePage'
import FuelLogsPage from './pages/driver/FuelLogsPage'
import MyTripsPage from './pages/driver/MyTripsPage'
import MyVehiclePage from './pages/driver/MyVehiclePage'
import VehicleIssuesPage from './pages/driver/VehicleIssuesPage'

import EmployeeDashboard from './pages/employee/EmployeeDashboard'
import EmployeeProfilePage from './pages/employee/EmployeeProfilePage'
import MyRequestsPage from './pages/employee/MyRequestsPage'
import NewTransportRequestPage from './pages/employee/NewTransportRequestPage'
import RequestDetailsPage from './pages/employee/RequestDetailsPage'

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to="/login" replace />}
      />

      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route
        path="/signup"
        element={<SignUpPage />}
      />

      <Route
        path="/setup-admin"
        element={<AdminSetupPage />}
      />

      <Route
        path="/employee/setup"
        element={<Navigate to="/signup" replace />}
      />

      <Route
        path="/admin"
        element={
          <RoleRoute allowedRole="ADMIN">
            <DashboardLayout />
          </RoleRoute>
        }
      >
        <Route
          index
          element={<DashboardHome />}
        />

        <Route
          path="vehicles"
          element={<VehiclesView />}
        />

        <Route
          path="drivers"
          element={<DriversView />}
        />

        <Route
          path="transport-requests"
          element={<TransportRequestsView />}
        />

        <Route
          path="fuel-logs"
          element={<FuelLogsView />}
        />

        <Route
          path="maintenance"
          element={<MaintenanceView />}
        />

        <Route
          path="users"
          element={<UsersView />}
        />
      </Route>

      <Route
        path="/driver"
        element={
          <RoleRoute allowedRole="DRIVER">
            <DriverLayout />
          </RoleRoute>
        }
      >
        <Route
          index
          element={<DriverDashboard />}
        />

        <Route
          path="my-trips"
          element={<MyTripsPage />}
        />

        <Route
          path="fuel-logs"
          element={<FuelLogsPage />}
        />

        <Route
          path="vehicle-issues"
          element={<VehicleIssuesPage />}
        />

        <Route
          path="my-vehicle"
          element={<MyVehiclePage />}
        />

        <Route
          path="profile"
          element={<DriverProfilePage />}
        />
      </Route>

      <Route
        path="/employee"
        element={
          <RoleRoute allowedRole="EMPLOYEE">
            <EmployeeLayout />
          </RoleRoute>
        }
      >
        <Route
          index
          element={<EmployeeDashboard />}
        />

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

      <Route
        path="*"
        element={<Navigate to="/login" replace />}
      />
    </Routes>
  )
}

export default App