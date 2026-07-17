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
    label: 'Overview',
    path: '/admin',
  },
  {
    label: 'Vehicles',
    path: '/admin/vehicles',
  },
  {
    label: 'Drivers',
    path: '/admin/drivers',
  },
  {
    label: 'Transport Requests',
    path: '/admin/transport-requests',
  },
  {
    label: 'Fuel Logs',
    path: '/admin/fuel-logs',
  },
  {
    label: 'Maintenance Section',
    path: '/admin/maintenance',
  },
  {
    label: 'Access Controls',
    path: '/admin/users',
  },
]

function DashboardLayout() {
  const navigate = useNavigate()
  const currentUser = getCurrentUser()

  function handleSignOut() {
    const confirmed = window.confirm(
      'Do you want to sign out?',
    )

    if (!confirmed) {
      return
    }

    clearCurrentUser()

    navigate('/login', {
      replace: true,
    })
  }

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <aside className="flex w-72 shrink-0 flex-col bg-slate-950 p-6 text-white">
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 font-bold">
            FP
          </div>

          <div>
            <h1 className="text-xl font-bold">
              FleetPulse
            </h1>

            <p className="text-xs text-slate-400">
              Admin Portal
            </p>
          </div>
        </div>

        <p className="mb-3 text-xs uppercase text-slate-500">
          Operations
        </p>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
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

        <div className="mt-auto border-t border-slate-800 pt-5">
          <div className="mb-4 rounded-xl bg-slate-900 p-4">
            <p className="truncate text-sm font-semibold text-white">
              {currentUser?.name ?? 'Administrator'}
            </p>

            <p className="mt-1 truncate text-xs text-slate-400">
              {currentUser?.email ?? ''}
            </p>

            <span className="mt-3 inline-flex rounded-full bg-blue-500/15 px-3 py-1 text-xs font-semibold text-blue-300">
              {currentUser?.role ?? 'ADMIN'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full rounded-xl border border-slate-700 px-4 py-3 text-left text-sm font-semibold text-slate-300 transition hover:border-red-500 hover:bg-red-500/10 hover:text-red-300"
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

export default DashboardLayout