import { NavLink, Outlet } from 'react-router-dom'

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
  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <aside className="flex w-64 flex-col bg-slate-950 p-6 text-white">
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold">
            FM
          </div>

          <div>
            <h1 className="text-sm font-bold">Fleet Management</h1>
            <p className="text-xs text-slate-400">Employee Portal</p>
          </div>
        </div>

        <p className="mb-3 text-xs uppercase text-slate-500">
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
      </aside>

      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  )
}

export default EmployeeLayout