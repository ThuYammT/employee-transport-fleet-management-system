import { NavLink, Outlet } from 'react-router-dom'

const menuItems = [
  { label: 'Overview', path: '/admin' },
  { label: 'Vehicles', path: '/admin/vehicles' },
  { label: 'Drivers', path: '/admin/drivers' },
  { label: 'Fuel Logs', path: '/admin/fuel-logs' },
  { label: 'Maintenance Section', path: '/admin/maintenance' },
  { label: 'Access Controls', path: '/admin/users' },
]

function DashboardLayout() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex">
      <aside className="w-72 bg-slate-950 text-white p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center font-bold">
            FP
          </div>

          <h1 className="text-xl font-bold">FleetPulse</h1>
        </div>

        <p className="text-xs text-slate-500 uppercase mb-3">
          Operations
        </p>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              className={({ isActive }) =>
                `block w-full text-left px-4 py-3 rounded-xl transition ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}

export default DashboardLayout