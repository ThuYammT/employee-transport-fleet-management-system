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
    icon: '⌂',
  },
  {
    label: 'My Trips',
    path: '/driver/my-trips',
    icon: '↗',
  },
  {
    label: 'Fuel Records',
    path: '/driver/fuel-logs',
    icon: '◉',
  },
  {
    label: 'Vehicle Issues',
    path: '/driver/vehicle-issues',
    icon: '◇',
  },
  {
    label: 'My Vehicle',
    path: '/driver/my-vehicle',
    icon: '◫',
  },
  {
    label: 'Profile',
    path: '/driver/profile',
    icon: '◎',
  },
]

function DriverLayout() {
  const navigate = useNavigate()

  const currentUser =
    getCurrentUser()

  function handleSignOut() {
    const confirmed =
      window.confirm(
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

  const initials =
    currentUser?.name
      ?.split(' ')
      .map(
        (part) =>
          part[0],
      )
      .join('')
      .slice(0, 2)
      .toUpperCase() ??
    'DR'

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-slate-200 bg-white">
        {/* BRAND */}

        <div className="flex h-[72px] shrink-0 items-center border-b border-slate-100 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-sm font-bold text-white">
              FP
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-[15px] font-semibold tracking-tight text-slate-950">
                Fleet Pulse
              </h1>

              <p className="text-[11px] font-medium text-slate-400">
                Driver Operations
              </p>
            </div>
          </div>
        </div>

        {/* NAVIGATION */}

        <div className="flex-1 px-3 py-5">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Driver Workspace
          </p>

          <nav className="space-y-1">
            {menuItems.map(
              (item) => (
                <NavLink
                  key={
                    item.path
                  }
                  to={
                    item.path
                  }
                  end={
                    item.path ===
                    '/driver'
                  }
                  className={({
                    isActive,
                  }) =>
                    `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      isActive
                        ? 'bg-slate-950 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                    }`
                  }
                >
                  <span className="flex h-7 w-7 items-center justify-center text-base">
                    {
                      item.icon
                    }
                  </span>

                  <span>
                    {
                      item.label
                    }
                  </span>
                </NavLink>
              ),
            )}
          </nav>
        </div>

        {/* ACCOUNT */}

        <div className="border-t border-slate-100 p-3">
          <div className="mb-2 flex items-center gap-3 rounded-lg px-3 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
              {initials}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="min-w-0 truncate text-sm font-semibold text-slate-900">
                  {currentUser
                    ?.name ??
                    'Driver'}
                </p>

                <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-bold text-blue-700">
                  DRIVER
                </span>
              </div>

              <p className="mt-0.5 truncate text-xs text-slate-400">
                {currentUser
                  ?.email ??
                  ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={
              handleSignOut
            }
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

export default DriverLayout