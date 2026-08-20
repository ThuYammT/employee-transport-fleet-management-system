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
    icon: '⌂',
  },
  {
    label: 'Vehicles',
    path: '/admin/vehicles',
    icon: '◫',
  },
  {
    label: 'Drivers',
    path: '/admin/drivers',
    icon: '◎',
  },
  {
    label: 'Transport Requests',
    path: '/admin/transport-requests',
    icon: '↗',
  },
  {
    label: 'Fuel Logs',
    path: '/admin/fuel-logs',
    icon: '◉',
  },
  {
    label: 'Maintenance',
    path: '/admin/maintenance',
    icon: '◇',
  },
  {
    label: 'User Management',
    path: '/admin/users',
    icon: '◌',
    
  },
  {
    label: 'Profile',
    path: '/admin/profile',
    icon: '○',
  },
]

function DashboardLayout() {
  const navigate = useNavigate()
  const currentUser = getCurrentUser()

  function handleSignOut() {
    const confirmed = window.confirm(
      'Do you want to sign out?',
    )

    if (!confirmed) return

    clearCurrentUser()

    navigate('/login', {
      replace: true,
    })
  }

  const initials =
    currentUser?.name
      ?.split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ?? 'AD'

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-slate-200 bg-white">
        {/* Brand */}
        <div className="flex h-[72px] items-center border-b border-slate-100 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-sm font-bold text-white">
              FP
            </div>

            <div>
              <h1 className="text-[15px] font-semibold tracking-tight text-slate-950">
                Fleet Pulse
              </h1>

              <p className="text-[11px] font-medium text-slate-400">
                Fleet Operations and Management
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-5">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Workspace
          </p>

          <nav className="space-y-1">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin'}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? 'bg-slate-950 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                  }`
                }
              >
                <span className="flex h-7 w-7 items-center justify-center text-base">
                  {item.icon}
                </span>

                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Account */}
        <div className="border-t border-slate-100 p-3">
          <div className="mb-2 flex items-center gap-3 rounded-lg px-3 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
              {initials}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">
                {currentUser?.name ?? 'Administrator'}
              </p>

              <p className="truncate text-xs text-slate-400">
                {currentUser?.email ?? ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="min-h-screen min-w-0 pl-[260px]">
        <Outlet />
      </main>
    </div>
  )
}

export default DashboardLayout