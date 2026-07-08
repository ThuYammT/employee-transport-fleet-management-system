import { NavLink, Outlet } from 'react-router-dom'

const menuItems = [
  { label: 'Dashboard', path: '/driver' },
  { label: 'My Trips', path: '/driver/my-trips' },
  { label: 'Fuel Logs', path: '/driver/fuel-logs' },
  { label: 'Vehicle Issues', path: '/driver/vehicle-issues' },
  { label: 'My Vehicle', path: '/driver/my-vehicle' },
  { label: 'Profile', path: '/driver/profile' },
]

function DriverLayout() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex">
      <aside className="w-64 bg-slate-950 text-white p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold">
            FM
          </div>

          <div>
            <h1 className="text-sm font-bold">Fleet Management</h1>
            <p className="text-xs text-slate-400">Driver Portal</p>
          </div>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/driver'}
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

export default DriverLayout