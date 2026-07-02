import { useState } from 'react'
import './App.css'

import DashboardView from './components/DashboardView'
import VehiclesView from './components/VehiclesView'
import DriversView from './components/DriversView'
import FuelLogsView from './components/FuelLogsView'
import MaintenanceView from './components/MaintenanceView'
import UsersView from './components/UsersView'

type Page = 'dashboard' | 'vehicles' | 'drivers' | 'fuelLogs' | 'maintenance' | 'users'

function App() {
  const [activePage, setActivePage] = useState<Page>('dashboard')

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>FleetMS</h2>

        <nav>
          <button className={activePage === 'dashboard' ? 'active' : ''} onClick={() => setActivePage('dashboard')}>Dashboard</button>
          <button className={activePage === 'vehicles' ? 'active' : ''} onClick={() => setActivePage('vehicles')}>Vehicles</button>
          <button className={activePage === 'drivers' ? 'active' : ''} onClick={() => setActivePage('drivers')}>Drivers</button>
          <button className={activePage === 'fuelLogs' ? 'active' : ''} onClick={() => setActivePage('fuelLogs')}>Fuel Logs</button>
          <button className={activePage === 'maintenance' ? 'active' : ''} onClick={() => setActivePage('maintenance')}>Maintenance</button>
          <button className={activePage === 'users' ? 'active' : ''} onClick={() => setActivePage('users')}>Users</button>
        </nav>
      </aside>

      <main className="main">
        {activePage === 'dashboard' && <DashboardView />}
        {activePage === 'vehicles' && <VehiclesView />}
        {activePage === 'drivers' && <DriversView />}
        {activePage === 'fuelLogs' && <FuelLogsView />}
        {activePage === 'maintenance' && <MaintenanceView />}
        {activePage === 'users' && <UsersView />}
      </main>
    </div>
  )
}

export default App