export default function DriverDashboard() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Driver Dashboard
        </h1>
        <p className="text-slate-500">
          Welcome back. Here is your trip overview for today.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <DashboardCard title="Today's Trips" value="1" />
        <DashboardCard title="Completed Trips" value="8" />
        <DashboardCard title="Fuel Logs This Month" value="5" />
        <DashboardCard title="Pending Issues" value="1" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Today&apos;s Trip
            </h2>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">
              Scheduled
            </span>
          </div>

          <div className="space-y-4">
            <TripPoint title="Pickup" location="Office Main Building" time="09:00 AM" />
            <TripPoint title="Drop-off" location="Yangon International Airport" time="10:30 AM" />
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Passenger</p>
            <p className="font-semibold text-slate-900">Aung Ko Ko</p>

            <p className="mt-3 text-sm text-slate-500">Vehicle</p>
            <p className="font-semibold text-slate-900">YGN-1K/1234</p>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Quick Actions
          </h2>

          <div className="space-y-3">
            <ActionButton label="Start Trip" />
            <ActionButton label="Add Fuel Log" />
            <ActionButton label="Report Issue" />
            <ActionButton label="View My Vehicle" />
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Upcoming Trips
          </h2>
          <button className="text-sm font-medium text-blue-600">
            View all
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-slate-500">
              <tr>
                <th className="py-3">Trip ID</th>
                <th>Date</th>
                <th>From - To</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              <tr className="border-b">
                <td className="py-3 font-medium">TP-0019</td>
                <td>21 May 2024</td>
                <td>Office → Meeting Hall</td>
                <td>08:30 AM</td>
                <td>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-700">
                    Scheduled
                  </span>
                </td>
              </tr>

              <tr>
                <td className="py-3 font-medium">TP-0020</td>
                <td>22 May 2024</td>
                <td>Office → Client Site</td>
                <td>02:00 PM</td>
                <td>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-700">
                    Scheduled
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function DashboardCard({
  title,
  value,
}: {
  title: string
  value: string
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <h3 className="mt-2 text-3xl font-bold text-slate-900">{value}</h3>
      <p className="mt-2 text-sm text-blue-600">View details</p>
    </div>
  )
}

function TripPoint({
  title,
  location,
  time,
}: {
  title: string
  location: string
  time: string
}) {
  return (
    <div className="border-l-4 border-blue-500 pl-4">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="text-slate-700">{location}</p>
      <p className="text-sm text-slate-500">{time}</p>
    </div>
  )
}

function ActionButton({ label }: { label: string }) {
  return (
    <button className="w-full rounded-xl border border-slate-200 px-4 py-3 text-left font-medium text-slate-700 hover:bg-slate-50">
      {label}
    </button>
  )
}