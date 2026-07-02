import type { ReactNode } from 'react'
import type { Page } from '../App'
type Props = {
  currentPage: Page
  setCurrentPage: (page: Page) => void
  children: ReactNode
}

const menuItems = [
  { label: 'Overview', value: 'dashboard' },
  { label: 'Fleet Vehicles', value: 'vehicles' },
  { label: 'Drivers Roster', value: 'drivers' },
  { label: 'Fuel Tracking', value: 'fuel' },
  { label: 'Maintenance Queue', value: 'maintenance' },
  { label: 'Access Controls', value: 'users' },
]

function DashboardLayout({
  currentPage,
  setCurrentPage,
  children,
}: Props) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex">

      <aside className="w-72 bg-slate-950 text-white p-6 flex flex-col">

        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center font-bold">
            FP
          </div>

          <h1 className="text-xl font-bold">
            FleetPulse
          </h1>
        </div>

        <p className="text-xs text-slate-500 uppercase mb-3">
          Operations
        </p>

        <nav className="space-y-2">

          {menuItems.map((item) => (

            <button
              key={item.value}
              onClick={() => setCurrentPage(item.value as Page)}
              className={`w-full text-left px-4 py-3 rounded-xl transition

              ${
                currentPage === item.value
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              {item.label}
            </button>

          ))}

        </nav>


      </aside>

      <main className="flex-1">
        {children}
      </main>

    </div>
  )
}

export default DashboardLayout