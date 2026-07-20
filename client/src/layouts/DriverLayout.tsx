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
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-slate-950 px-5 py-5 text-white">
        <div className="mb-6 flex shrink-0 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold">
            FM
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-base font-bold">
              Fleet Management
            </h1>

            <p className="text-xs text-slate-400">
              Driver Portal
            </p>
          </div>
        </div>

        <p className="mb-2 shrink-0 text-xs uppercase tracking-wide text-slate-500">
          Driver Menu
        </p>

        <nav className="space-y-1.5">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/driver'}
              className={({ isActive }) =>
                `block rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto shrink-0 border-t border-slate-800 pt-4">
          <div className="mb-3 rounded-xl bg-slate-900 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {currentUser?.name ?? 'Driver'}
                </p>

                <p className="mt-0.5 truncate text-xs text-slate-400">
                  {currentUser?.email ?? 'No email'}
                </p>
              </div>

              <span className="shrink-0 rounded-full bg-blue-600/20 px-2.5 py-1 text-[11px] font-semibold text-blue-300">
                {currentUser?.role ?? 'DRIVER'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full rounded-xl border border-slate-700 px-4 py-2.5 text-left text-sm font-semibold text-slate-300 transition hover:border-red-500 hover:bg-red-500/10 hover:text-red-300"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="min-h-screen min-w-0 pl-64">
        <Outlet />
      </main>
    </div>
  )
}

export default DriverLayout