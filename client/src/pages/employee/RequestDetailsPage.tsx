import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  getTransportRequestById,
  updateTransportRequest,
} from '../../services/transport-request.service'
import type { TransportRequest } from '../../types/transport-request'

function RequestDetailsPage() {
  const { requestId } = useParams()
  const navigate = useNavigate()
  const [request, setRequest] = useState<TransportRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const id = Number(requestId)
      if (!Number.isInteger(id)) {
        setError('Invalid request ID')
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        setError('')
        setRequest(await getTransportRequestById(id))
      } catch (error) {
        console.error(error)
        setError('Failed to load request details')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [requestId])

  async function handleCancel() {
    if (!request) return
    if (!window.confirm('Are you sure you want to cancel this request?')) return
    try {
      await updateTransportRequest(request.id, { status: 'CANCELLED' })
      navigate('/employee/my-requests')
    } catch (error) {
      console.error(error)
      window.alert('Failed to cancel request')
    }
  }

  return (
    <>
      <header className="border-b border-slate-200 bg-white px-8 py-5">
        <h1 className="text-xl font-bold">Transport Request Details</h1>
        <p className="text-sm text-slate-500">Review the complete information for your request.</p>
      </header>

      <section className="p-8">
        <div className="mx-auto max-w-5xl">
          <Link to="/employee/my-requests" className="mb-5 inline-block text-sm font-semibold text-blue-600">
            ← Back to My Requests
          </Link>

          {loading && <p className="text-slate-500">Loading request details...</p>}
          {error && <div className="rounded-xl bg-red-50 p-4 text-red-600">{error}</div>}

          {!loading && !error && request && (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm text-slate-500">Request ID</p>
                  <h2 className="text-2xl font-bold">REQ-{request.id}</h2>
                </div>
                <StatusBadge status={request.status} />
              </div>

              <div className="grid grid-cols-1 gap-6 py-8 md:grid-cols-2">
                <DetailItem label="Pickup Location" value={request.pickupLocation} />
                <DetailItem label="Destination" value={request.destination} />
                <DetailItem
                  label="Estimated Distance"
                  value={request.estimatedDistanceKm != null ? `${request.estimatedDistanceKm.toFixed(2)} km` : 'Not available'}
                />
                <DetailItem
                  label="Estimated Duration"
                  value={request.estimatedDurationMinutes != null ? `${request.estimatedDurationMinutes} min` : 'Not available'}
                />
                <DetailItem label="Request Date" value={new Date(request.requestDate).toLocaleDateString()} />
                <DetailItem label="Request Time" value={request.requestTime} />
                <DetailItem label="Employee ID" value={String(request.employeeId)} />
                <DetailItem label="Created At" value={new Date(request.createdAt).toLocaleString()} />
              </div>

              <div className="rounded-xl bg-slate-50 p-5">
                <p className="mb-2 text-sm font-semibold text-slate-500">Purpose</p>
                <p className="leading-7 text-slate-800">{request.purpose}</p>
              </div>

              {request.status === 'PENDING' && (
                <div className="mt-8 flex justify-end">
                  <button type="button" onClick={handleCancel} className="rounded-xl border border-red-300 px-6 py-3 font-semibold text-red-600 hover:bg-red-50">
                    Cancel Request
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  )
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return <div><p className="mb-1 text-sm text-slate-500">{label}</p><p className="font-semibold text-slate-900">{value}</p></div>
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700',
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
    CANCELLED: 'bg-slate-200 text-slate-700',
  }
  return <span className={`w-fit rounded-full px-4 py-2 text-sm font-semibold ${styles[status] ?? 'bg-slate-100 text-slate-700'}`}>{status}</span>
}

export default RequestDetailsPage
