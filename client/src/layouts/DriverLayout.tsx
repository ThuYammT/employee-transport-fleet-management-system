import {
  NavLink,
  Outlet,
  useNavigate,
} from 'react-router-dom'

import {
  clearCurrentUser,
  getCurrentUser,
} from '../utils/user-session'

const menuItems = [
  {
    label: 'Dashboard',
    path: '/driver',
  },
  {
    label: 'My Trips',
    path: '/driver/my-trips',
  },
  {
    label: 'Fuel Logs',
    path: '/driver/fuel-logs',
  },
  {
    label: 'Vehicle Issues',
    path: '/driver/vehicle-issues',
  },
  {
    label: 'My Vehicle',
    path: '/driver/my-vehicle',
  },
  {
    label: 'Profile',
    path: '/driver/profile',
  },
]

function DriverLayout() {
  const navigate = useNavigate()
  const currentUser = getCurrentUser()

  function handleSignOut() {
    clearCurrentUser()
    navigate('/login', {
      replace: true,
    })
  }

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <aside className="flex w-64 flex-col bg-slate-950 p-6 text-white">
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold">
            FM
          </div>

          <div>
            <h1 className="text-sm font-bold">
              Fleet Management
            </h1>

            <p className="text-xs text-slate-400">
              Driver Portal
            </p>
          </div>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/driver'}
              className={({ isActive }) =>
                `block w-full rounded-xl px-4 py-3 text-left transition ${
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

        <div className="mt-auto border-t border-slate-800 pt-6">
          <div className="mb-4 rounded-xl bg-slate-900 p-4">
            <p className="truncate text-sm font-semibold text-white">
              {currentUser?.name ?? 'Driver'}
            </p>

            <p className="mt-1 truncate text-xs text-slate-400">
              {currentUser?.email ?? 'No email'}
            </p>

            <span className="mt-3 inline-flex rounded-full bg-blue-600/20 px-3 py-1 text-xs font-semibold text-blue-300">
              {currentUser?.role ?? 'DRIVER'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-left font-semibold text-red-300 transition hover:bg-red-500 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  )
}

export default DriverLayout