import { useEffect, useState } from 'react'
import { getDashboardStats } from '../../services/dashboard.service'

function DashboardHome() {
  const [stats, setStats] = useState({
    totalVehicles: 0,
    totalDrivers: 0,
    totalFuelLogs: 0,
    totalMaintenanceLogs: 0,
    totalUsers: 0,
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      setLoading(true)

      const data = await getDashboardStats()

      setStats(data)
    } catch (error) {
      console.error(error)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Overview</h2>
          <p className="text-sm text-slate-500">
            Welcome back, Super Administrator
          </p>
        </div>

        <input
          className="bg-slate-100 border border-slate-200 rounded-full px-5 py-3 text-sm outline-none"
          placeholder="Search Bar"
        />
      </header>

      <section className="p-8">
        <div className="bg-slate-950 text-white rounded-2xl p-8 flex justify-between items-center mb-8 shadow">
          <div>
            <h1 className="text-5xl font-bold mb-4">
              Fleet Operations Command
            </h1>

            <p className="text-slate-400 max-w-xl">
              Real-time administrative control over vehicle statuses,
              driver availability, fuel allocation, and maintenance schedules.
            </p>
          </div>

          <button className="bg-white text-slate-950 px-8 py-4 rounded-xl font-semibold">
            Manage Fleet →
          </button>
        </div>

        {loading && <p className="text-slate-500">Loading dashboard data...</p>}

        {error && <p className="text-red-500">{error}</p>}

        {!loading && !error && (
          <div className="grid grid-cols-4 gap-6">
            <StatCard title="Total Fleet" value={stats.totalVehicles.toString()} tag="Vehicles" />
            <StatCard title="Total Drivers" value={stats.totalDrivers.toString()} tag="Drivers" />
            <StatCard title="Fuel Logs" value={stats.totalFuelLogs.toString()} tag="Records" />
            <StatCard title="Maintenance Logs" value={stats.totalMaintenanceLogs.toString()} tag="Records" />
          </div>
        )}
      </section>
    </>
  )
}

function StatCard({
  title,
  value,
  tag,
}: {
  title: string
  value: string
  tag: string
}) {
  return (
    <div className="bg-white rounded-2xl shadow p-6 border border-slate-200">
      <p className="text-sm text-slate-500 mb-3">{title}</p>

      <div className="flex justify-between items-end">
        <h2 className="text-4xl font-bold">{value}</h2>

        <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-lg">
          {tag}
        </span>
      </div>
    </div>
  )
}

export default DashboardHome