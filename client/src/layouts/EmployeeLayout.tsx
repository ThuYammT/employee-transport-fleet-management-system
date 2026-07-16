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
    path: '/employee',
  },
  {
    label: 'New Request',
    path: '/employee/new-request',
  },
  {
    label: 'My Requests',
    path: '/employee/my-requests',
  },
  {
    label: 'Profile',
    path: '/employee/profile',
  },
]

function EmployeeLayout() {
  const navigate = useNavigate()
  const currentUser = getCurrentUser()

  function handleLogout() {
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
      <aside className="flex w-64 shrink-0 flex-col bg-slate-950 p-6 text-white">
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold">
            FM
          </div>

          <div>
            <h1 className="text-sm font-bold">
              Fleet Management
            </h1>

            <p className="text-xs text-slate-400">
              Employee Portal
            </p>
          </div>
        </div>

        <p className="mb-3 text-xs uppercase tracking-wider text-slate-500">
          Employee Menu
        </p>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/employee'}
              className={({ isActive }) =>
                `block rounded-xl px-4 py-3 transition ${
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
              {currentUser?.name ?? 'Employee'}
            </p>

            <p className="mt-1 truncate text-xs text-slate-400">
              {currentUser?.email ?? ''}
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
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

export default EmployeeLayout