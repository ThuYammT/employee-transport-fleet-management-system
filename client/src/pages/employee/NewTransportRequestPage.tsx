import axios from 'axios'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import LocationSearchInput from '../../components/maps/LocationSearchInput'
import RouteMap from '../../components/maps/RouteMap'
import { createTransportRequest, estimateRoute } from '../../services/transport-request.service'
import type { LocationSuggestion, RouteEstimate } from '../../types/transport-request'
import { getCurrentUser } from '../../utils/user-session'

function NewTransportRequestPage() {
  const navigate = useNavigate()
  const [pickup, setPickup] = useState<LocationSuggestion | null>(null)
  const [destination, setDestination] = useState<LocationSuggestion | null>(null)
  const [pickupText, setPickupText] = useState('')
  const [destinationText, setDestinationText] = useState('')
  const [requestDate, setRequestDate] = useState('')
  const [requestTime, setRequestTime] = useState('')
  const [purpose, setPurpose] = useState('')
  const [route, setRoute] = useState<RouteEstimate | null>(null)
  const [routeLoading, setRouteLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!pickup || !destination) { setRoute(null); return }
    const controller = new AbortController()
    ;(async () => {
      try {
        setRouteLoading(true)
        setError('')
        setRoute(await estimateRoute({
          pickupLatitude: pickup.latitude,
          pickupLongitude: pickup.longitude,
          destinationLatitude: destination.latitude,
          destinationLongitude: destination.longitude,
        }, controller.signal))
      } catch (error) {
        if (!axios.isCancel(error) && !controller.signal.aborted) {
          setError(getMessage(error, 'Failed to calculate the route'))
          setRoute(null)
        }
      } finally {
        if (!controller.signal.aborted) setRouteLoading(false)
      }
    })()
    return () => controller.abort()
  }, [pickup, destination])

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const user = getCurrentUser()
    if (!user || user.role !== 'EMPLOYEE') { navigate('/login', { replace: true }); return }
    if (!pickup || !destination || !route) { setError('Select both locations and wait for the route estimate'); return }

    try {
      setSubmitting(true)
      setError('')
      await createTransportRequest({
        employeeId: user.id,
        pickupLocation: pickup.label,
        pickupLatitude: pickup.latitude,
        pickupLongitude: pickup.longitude,
        destination: destination.label,
        destinationLatitude: destination.latitude,
        destinationLongitude: destination.longitude,
        requestDate,
        requestTime,
        purpose: purpose.trim(),
      })
      navigate('/employee/my-requests')
    } catch (error) {
      setError(getMessage(error, 'Failed to submit request'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <header className="border-b border-slate-200 bg-white px-8 py-5">
        <h1 className="text-xl font-bold text-slate-900">New Transport Request</h1>
        <p className="text-sm text-slate-500">Select locations and review the route estimate.</p>
      </header>

      <section className="p-8">
        <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</div>}

          <form onSubmit={submit}>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <LocationSearchInput
                id="pickup"
                label="Pickup Location"
                placeholder="Search pickup location"
                value={pickupText}
                selectedLocation={pickup}
                onTextChange={(value) => { setPickupText(value); setPickup(null); setRoute(null) }}
                onSelect={(value) => { setPickup(value); setPickupText(value.label) }}
                disabled={submitting}
              />
              <LocationSearchInput
                id="destination"
                label="Destination"
                placeholder="Search destination"
                value={destinationText}
                selectedLocation={destination}
                onTextChange={(value) => { setDestinationText(value); setDestination(null); setRoute(null) }}
                onSelect={(value) => { setDestination(value); setDestinationText(value.label) }}
                disabled={submitting}
              />

              <Field label="Request Date" type="date" value={requestDate} onChange={setRequestDate} />
              <Field label="Request Time" type="time" value={requestTime} onChange={setRequestTime} />
            </div>

            {routeLoading && <div className="mt-6 rounded-xl bg-blue-50 p-5 text-blue-700">Calculating route...</div>}

            {route && (
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Stat label="Estimated distance" value={`${route.estimatedDistanceKm.toFixed(2)} km`} />
                <Stat label="Estimated duration" value={`${route.estimatedDurationMinutes} min`} />
              </div>
            )}

            {pickup && destination && route && (
              <div className="mt-6">
                <RouteMap
                  pickup={[pickup.latitude, pickup.longitude]}
                  destination={[destination.latitude, destination.longitude]}
                  routeCoordinates={route.routeCoordinates}
                />
              </div>
            )}

            <div className="mt-6">
              <label htmlFor="purpose" className="mb-2 block text-sm font-semibold text-slate-700">Purpose</label>
              <textarea
                id="purpose"
                value={purpose}
                onChange={(event) => setPurpose(event.target.value)}
                rows={5}
                maxLength={500}
                required
                className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="mt-8 flex justify-end gap-3 border-t border-slate-200 pt-6">
              <Link to="/employee" className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700">Cancel</Link>
              <button disabled={submitting || routeLoading || !route} className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white disabled:opacity-60">
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </>
  )
}

function Field({ label, type, value, onChange }: { label: string; type: 'date' | 'time'; value: string; onChange: (value: string) => void }) {
  return <div><label className="mb-2 block text-sm font-semibold text-slate-700">{label}</label><input type={type} value={value} onChange={(e) => onChange(e.target.value)} required className="w-full rounded-xl border border-slate-300 px-4 py-3" /></div>
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5"><p className="text-sm text-blue-700">{label}</p><p className="mt-2 text-2xl font-bold text-blue-950">{value}</p></div>
}

function getMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback
  const message = error.response?.data?.message
  if (Array.isArray(message)) return message.join(', ')
  return typeof message === 'string' ? message : fallback
}

export default NewTransportRequestPage
