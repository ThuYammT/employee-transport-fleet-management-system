import { useState } from 'react'

import DashboardLayout from './layouts/DashboardLayout'
import DashboardHome from './pages/admin/DashboardHome'
import VehiclesView from './pages/admin/VehiclesView'
import DriversView from './pages/admin/DriversView'
import FuelLogsView from './pages/admin/FuelLogsView'
import MaintenanceView from './pages/admin/MaintenanceView'
import UsersView from './pages/admin/UsersView'

export type Page =
  | 'dashboard'
  | 'vehicles'
  | 'drivers'
  | 'fuel'
  | 'maintenance'
  | 'users'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')

  return (
    <DashboardLayout
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
    >
      {currentPage === 'dashboard' && <DashboardHome />}
      {currentPage === 'vehicles' && <VehiclesView />}
      {currentPage === 'drivers' && <DriversView />}
      {currentPage === 'fuel' && <FuelLogsView />}
      {currentPage === 'maintenance' && <MaintenanceView />}
      {currentPage === 'users' && <UsersView />}
    </DashboardLayout>
  )
}

export default App