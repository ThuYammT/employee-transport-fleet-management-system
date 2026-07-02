function DashboardView() {
  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Overview of fleet operations and transport activity.</p>
        </div>
        <button>Admin</button>
      </div>

      <div className="cards">
        <div className="card"><p>Total Vehicles</p><h2>16</h2></div>
        <div className="card"><p>Available Drivers</p><h2>9</h2></div>
        <div className="card"><p>Pending Requests</p><h2>5</h2></div>
        <div className="card"><p>Active Trips</p><h2>3</h2></div>
      </div>
    </section>
  )
}

export default DashboardView