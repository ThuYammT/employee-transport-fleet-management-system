import axios from 'axios'
import {
  useEffect,
  useState,
} from 'react'

import {
  Link,
  useNavigate,
} from 'react-router-dom'

import InteractiveRouteMap, {
  type MapSelectionMode,
} from '../../components/maps/InteractiveRouteMap'

import LocationSearchInput from '../../components/maps/LocationSearchInput'

import {
  createTransportRequest,
  estimateRoute,
  reverseGeocode,
} from '../../services/transport-request.service'

import type {
  LocationSuggestion,
  RouteEstimate,
} from '../../types/transport-request'

import {
  getCurrentUser,
} from '../../utils/user-session'

type FormData = {
  pickupLocation: string
  destination: string
  requestDate: string
  requestTime: string
  purpose: string
}

const initialFormData: FormData = {
  pickupLocation: '',
  destination: '',
  requestDate: '',
  requestTime: '',
  purpose: '',
}

function NewTransportRequestPage() {
  const navigate =
    useNavigate()

  const [
    formData,
    setFormData,
  ] = useState<FormData>(
    initialFormData,
  )

  const [
    pickup,
    setPickup,
  ] =
    useState<LocationSuggestion | null>(
      null,
    )

  const [
    destination,
    setDestination,
  ] =
    useState<LocationSuggestion | null>(
      null,
    )

  const [
    route,
    setRoute,
  ] =
    useState<RouteEstimate | null>(
      null,
    )

  const [
    selectionMode,
    setSelectionMode,
  ] =
    useState<MapSelectionMode>(
      null,
    )

  const [
    routeLoading,
    setRouteLoading,
  ] =
    useState(false)

  const [
    mapLoading,
    setMapLoading,
  ] =
    useState(false)

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false)

  const [
    error,
    setError,
  ] =
    useState('')

  useEffect(() => {
    if (
      !pickup ||
      !destination
    ) {
      setRoute(null)
      return
    }

    const controller =
      new AbortController()

    async function calculateRoute() {
      try {
        setRouteLoading(true)
        setError('')

        const result =
          await estimateRoute(
            {
              pickupLatitude:
                pickup!.latitude,

              pickupLongitude:
                pickup!.longitude,

              destinationLatitude:
                destination!.latitude,

              destinationLongitude:
                destination!.longitude,
            },

            controller.signal,
          )

        setRoute(result)
      } catch (error) {
        if (
          axios.isCancel(error) ||
          controller.signal.aborted
        ) {
          return
        }

        console.error(error)

        setRoute(null)

        setError(
          getErrorMessage(
            error,
            'Failed to calculate the route.',
          ),
        )
      } finally {
        if (
          !controller.signal.aborted
        ) {
          setRouteLoading(false)
        }
      }
    }

    void calculateRoute()

    return () => {
      controller.abort()
    }
  }, [
    pickup,
    destination,
  ])

  function handleTextInput(
    event: React.ChangeEvent<
      HTMLInputElement |
      HTMLTextAreaElement
    >,
  ) {
    const {
      name,
      value,
    } = event.target

    setFormData(
      (current) => ({
        ...current,
        [name]: value,
      }),
    )
  }

  function handlePickupTextChange(
    value: string,
  ) {
    setFormData(
      (current) => ({
        ...current,
        pickupLocation: value,
      }),
    )

    setPickup(null)
    setRoute(null)
  }

  function handleDestinationTextChange(
    value: string,
  ) {
    setFormData(
      (current) => ({
        ...current,
        destination: value,
      }),
    )

    setDestination(null)
    setRoute(null)
  }

  function selectPickup(
    location: LocationSuggestion,
  ) {
    setPickup(location)

    setFormData(
      (current) => ({
        ...current,
        pickupLocation:
          location.label,
      }),
    )

    setSelectionMode(
      'destination',
    )
  }

  function selectDestination(
    location: LocationSuggestion,
  ) {
    setDestination(location)

    setFormData(
      (current) => ({
        ...current,
        destination:
          location.label,
      }),
    )

    setSelectionMode(null)
  }

  async function handleMapClick(
    latitude: number,
    longitude: number,
  ) {
    if (!selectionMode) {
      return
    }

    try {
      setMapLoading(true)
      setError('')

      const location =
        await reverseGeocode(
          latitude,
          longitude,
        )

      if (
        selectionMode ===
        'pickup'
      ) {
        selectPickup(location)
      } else {
        selectDestination(location)
      }
    } catch (error) {
      console.error(error)

      setError(
        getErrorMessage(
          error,
          'Failed to identify that map location.',
        ),
      )
    } finally {
      setMapLoading(false)
    }
  }

  function clearPickup() {
    setPickup(null)
    setRoute(null)

    setFormData(
      (current) => ({
        ...current,
        pickupLocation: '',
      }),
    )
  }

  function clearDestination() {
    setDestination(null)
    setRoute(null)

    setFormData(
      (current) => ({
        ...current,
        destination: '',
      }),
    )
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    const currentUser =
      getCurrentUser()

    if (
      !currentUser ||
      currentUser.role !==
        'EMPLOYEE'
    ) {
      navigate(
        '/login',
        {
          replace: true,
        },
      )

      return
    }

    const purpose =
      formData.purpose.trim()

    if (
      !pickup ||
      !destination ||
      !route
    ) {
      setError(
        'Select a pickup location and destination first.',
      )

      return
    }

    if (
      !formData.requestDate ||
      !formData.requestTime ||
      !purpose
    ) {
      setError(
        'Complete the date, time, and purpose.',
      )

      return
    }

    try {
      setSubmitting(true)
      setError('')

      await createTransportRequest({
        employeeId:
          currentUser.id,

        pickupLocation:
          pickup.label,

        pickupLatitude:
          pickup.latitude,

        pickupLongitude:
          pickup.longitude,

        destination:
          destination.label,

        destinationLatitude:
          destination.latitude,

        destinationLongitude:
          destination.longitude,

        estimatedDistanceKm:
          route.estimatedDistanceKm,

        estimatedDurationMinutes:
          route.estimatedDurationMinutes,

        requestDate:
          formData.requestDate,

        requestTime:
          formData.requestTime,

        purpose,
      })

      navigate(
        '/employee/my-requests',
      )
    } catch (error) {
      console.error(error)

      setError(
        getErrorMessage(
          error,
          'Failed to submit the request.',
        ),
      )
    } finally {
      setSubmitting(false)
    }
  }

  const pickupPosition:
    [number, number] | null =
    pickup
      ? [
          pickup.latitude,
          pickup.longitude,
        ]
      : null

  const destinationPosition:
    [number, number] | null =
    destination
      ? [
          destination.latitude,
          destination.longitude,
        ]
      : null

  const busy =
    submitting ||
    routeLoading ||
    mapLoading

  return (
    <>
      <header className="border-b border-slate-200 bg-white px-8 py-5">
        <h1 className="text-xl font-bold text-slate-900">
          New Transport Request
        </h1>

        <p className="text-sm text-slate-500">
          Search for locations or select them directly on the map.
        </p>
      </header>

      <section className="p-8">
        <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <LocationSearchInput
                id="pickupLocation"
                label="Pickup Location"
                placeholder="Search pickup location"
                value={
                  formData.pickupLocation
                }
                selectedLocation={
                  pickup
                }
                onTextChange={
                  handlePickupTextChange
                }
                onSelect={
                  selectPickup
                }
                disabled={busy}
              />

              <LocationSearchInput
                id="destination"
                label="Destination"
                placeholder="Search destination"
                value={
                  formData.destination
                }
                selectedLocation={
                  destination
                }
                onTextChange={
                  handleDestinationTextChange
                }
                onSelect={
                  selectDestination
                }
                disabled={busy}
              />
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  setSelectionMode(
                    'pickup',
                  )
                }
                disabled={busy}
                className={`rounded-xl px-5 py-3 text-sm font-semibold transition ${
                  selectionMode ===
                  'pickup'
                    ? 'bg-blue-600 text-white'
                    : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                } disabled:opacity-50`}
              >
                Set Pickup on Map
              </button>

              <button
                type="button"
                onClick={() =>
                  setSelectionMode(
                    'destination',
                  )
                }
                disabled={busy}
                className={`rounded-xl px-5 py-3 text-sm font-semibold transition ${
                  selectionMode ===
                  'destination'
                    ? 'bg-red-600 text-white'
                    : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                } disabled:opacity-50`}
              >
                Set Destination on Map
              </button>

              {pickup && (
                <button
                  type="button"
                  onClick={
                    clearPickup
                  }
                  disabled={busy}
                  className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Clear Pickup
                </button>
              )}

              {destination && (
                <button
                  type="button"
                  onClick={
                    clearDestination
                  }
                  disabled={busy}
                  className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Clear Destination
                </button>
              )}
            </div>

            {mapLoading && (
              <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm font-medium text-blue-700">
                Finding the selected address...
              </div>
            )}

            <div className="mt-6">
              <InteractiveRouteMap
                pickup={
                  pickupPosition
                }
                destination={
                  destinationPosition
                }
                routeCoordinates={
                  route?.routeCoordinates ??
                  []
                }
                selectionMode={
                  selectionMode
                }
                onMapClick={
                  handleMapClick
                }
                disabled={busy}
              />
            </div>

            {routeLoading && (
              <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-5 text-blue-700">
                Calculating route distance and duration...
              </div>
            )}

            {!routeLoading &&
              route && (
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <RouteStat
                    label="Distance"
                    value={`${route.estimatedDistanceKm.toFixed(
                      2,
                    )} km`}
                  />

                  <RouteStat
                    label="Distance in miles"
                    value={`${route.estimatedDistanceMiles.toFixed(
                      2,
                    )} mi`}
                  />

                  <RouteStat
                    label="Estimated time"
                    value={formatDuration(
                      route.estimatedDurationMinutes,
                    )}
                  />
                </div>
              )}

            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                label="Request Date"
                name="requestDate"
                type="date"
                value={
                  formData.requestDate
                }
                onChange={
                  handleTextInput
                }
                disabled={
                  submitting
                }
              />

              <FormField
                label="Request Time"
                name="requestTime"
                type="time"
                value={
                  formData.requestTime
                }
                onChange={
                  handleTextInput
                }
                disabled={
                  submitting
                }
              />
            </div>

            <div className="mt-6">
              <label
                htmlFor="purpose"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Purpose
              </label>

              <textarea
                id="purpose"
                name="purpose"
                value={
                  formData.purpose
                }
                onChange={
                  handleTextInput
                }
                placeholder="Explain why transportation is required"
                required
                rows={5}
                maxLength={500}
                disabled={
                  submitting
                }
                className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
              />

              <div className="mt-2 flex justify-end">
                <span className="text-xs text-slate-400">
                  {
                    formData
                      .purpose
                      .length
                  }
                  /500
                </span>
              </div>
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
              <Link
                to="/employee"
                className="rounded-xl border border-slate-300 px-6 py-3 text-center font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={
                  busy ||
                  !pickup ||
                  !destination ||
                  !route
                }
                className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? 'Submitting Request...'
                  : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </>
  )
}

function FormField({
  label,
  name,
  type,
  value,
  onChange,
  disabled,
}: {
  label: string
  name: string
  type: 'date' | 'time'
  value: string

  onChange:
    React.ChangeEventHandler<HTMLInputElement>

  disabled: boolean
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-semibold text-slate-700"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required
        disabled={disabled}
        className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
      />
    </div>
  )
}

function RouteStat({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
      <p className="text-sm font-medium text-blue-700">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-blue-950">
        {value}
      </p>
    </div>
  )
}

function formatDuration(
  totalMinutes: number,
) {
  const hours =
    Math.floor(
      totalMinutes / 60,
    )

  const minutes =
    totalMinutes % 60

  if (hours === 0) {
    return `${minutes} min`
  }

  if (minutes === 0) {
    return `${hours} hr`
  }

  return `${hours} hr ${minutes} min`
}

function getErrorMessage(
  error: unknown,
  fallback: string,
) {
  if (
    !axios.isAxiosError(error)
  ) {
    return fallback
  }

  const message =
    error.response?.data?.message

  if (
    Array.isArray(message)
  ) {
    return message.join(', ')
  }

  if (
    typeof message ===
    'string'
  ) {
    return message
  }

  return fallback
}

export default NewTransportRequestPage