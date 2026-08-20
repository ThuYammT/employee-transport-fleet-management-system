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
  ] =
    useState<FormData>(
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
  ] = useState(false)

  const [
    mapLoading,
    setMapLoading,
  ] = useState(false)

  const [
    submitting,
    setSubmitting,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState('')

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
                destination!
                  .latitude,

              destinationLongitude:
                destination!
                  .longitude,
            },
            controller.signal,
          )

        setRoute(result)
      } catch (error) {
        if (
          axios.isCancel(
            error,
          ) ||
          controller.signal
            .aborted
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
          !controller.signal
            .aborted
        ) {
          setRouteLoading(
            false,
          )
        }
      }
    }

    void calculateRoute()

    return () =>
      controller.abort()
  }, [
    pickup,
    destination,
  ])

  function handleTextInput(
    event:
      React.ChangeEvent<
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
        pickupLocation:
          value,
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
        destination:
          value,
      }),
    )

    setDestination(null)
    setRoute(null)
  }

  function selectPickup(
    location:
      LocationSuggestion,
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
    location:
      LocationSuggestion,
  ) {
    setDestination(
      location,
    )

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
        selectPickup(
          location,
        )
      } else {
        selectDestination(
          location,
        )
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
    event:
      React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    const currentUser =
      getCurrentUser()

    if (
      !currentUser ||
      currentUser.role !==
        'EMPLOYEE'
    ) {
      navigate('/login', {
        replace: true,
      })

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
      <header className="flex min-h-[72px] items-center border-b border-slate-200 bg-white px-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-950">
            New Transport Request
          </h1>

          <p className="mt-0.5 text-sm text-slate-500">
            Plan your route and
            submit a transportation
            request.
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-[1500px] p-8">
        {/* HERO */}

        <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 px-7 py-6 text-white">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />

          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-200">
              Route planner
            </p>

            <h2 className="mt-2 text-2xl font-semibold">
              Where do you need to
              go?
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Search for your pickup
              and destination or
              select both points
              directly on the map.
              Fleet Pulse will
              calculate the estimated
              route automatically.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form
          onSubmit={
            handleSubmit
          }
          className="space-y-6"
        >
          {/* LOCATION */}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Step 1
              </p>

              <h3 className="mt-1 text-lg font-semibold text-slate-950">
                Select Route
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Search addresses or
                click the map to
                choose locations.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
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
                disabled={
                  busy
                }
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
                disabled={
                  busy
                }
              />
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  setSelectionMode(
                    'pickup',
                  )
                }
                disabled={
                  busy
                }
                className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                  selectionMode ===
                  'pickup'
                    ? 'bg-slate-950 text-white'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                Select Pickup on Map
              </button>

              <button
                type="button"
                onClick={() =>
                  setSelectionMode(
                    'destination',
                  )
                }
                disabled={
                  busy
                }
                className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                  selectionMode ===
                  'destination'
                    ? 'bg-slate-950 text-white'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                Select Destination
              </button>

              {pickup && (
                <button
                  type="button"
                  onClick={
                    clearPickup
                  }
                  disabled={
                    busy
                  }
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-50"
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
                  disabled={
                    busy
                  }
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-50"
                >
                  Clear Destination
                </button>
              )}
            </div>

            {mapLoading && (
              <InfoMessage>
                Finding the selected
                address...
              </InfoMessage>
            )}

            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
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
                disabled={
                  busy
                }
              />
            </div>

            {routeLoading && (
              <InfoMessage>
                Calculating route
                distance and estimated
                travel time...
              </InfoMessage>
            )}

            {!routeLoading &&
              route && (
                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  <RouteStat
                    label="Distance"
                    value={`${route.estimatedDistanceKm.toFixed(
                      2,
                    )} km`}
                  />

                  <RouteStat
                    label="Distance"
                    value={`${route.estimatedDistanceMiles.toFixed(
                      2,
                    )} mi`}
                  />

                  <RouteStat
                    label="Estimated Time"
                    value={formatDuration(
                      route.estimatedDurationMinutes,
                    )}
                  />
                </div>
              )}
          </section>

          {/* SCHEDULE */}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Step 2
              </p>

              <h3 className="mt-1 text-lg font-semibold text-slate-950">
                Schedule & Purpose
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Tell Fleet Pulse when
                transportation is
                needed and why.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
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

            <div className="mt-5">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Purpose
              </label>

              <textarea
                id="purpose"
                name="purpose"
                rows={5}
                maxLength={
                  500
                }
                required
                value={
                  formData.purpose
                }
                onChange={
                  handleTextInput
                }
                placeholder="Explain why transportation is required..."
                className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <p className="mt-2 text-right text-xs text-slate-400">
                {
                  formData.purpose
                    .length
                }
                /500
              </p>
            </div>
          </section>

          {/* ACTIONS */}

          <div className="flex justify-end gap-3">
            <Link
              to="/employee"
              className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
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
              className="rounded-xl bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting
                ? 'Submitting Request...'
                : 'Submit Request'}
            </button>
          </div>
        </form>
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
  type:
    | 'date'
    | 'time'
  value: string
  onChange:
    React.ChangeEventHandler<HTMLInputElement>
  disabled: boolean
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>

      <input
        name={name}
        type={type}
        value={value}
        required
        disabled={
          disabled
        }
        onChange={
          onChange
        }
        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </label>
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
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-xl font-semibold text-slate-900">
        {value}
      </p>
    </div>
  )
}

function InfoMessage({
  children,
}: {
  children:
    React.ReactNode
}) {
  return (
    <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
      {children}
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

  if (!hours) {
    return `${minutes} min`
  }

  if (!minutes) {
    return `${hours} hr`
  }

  return `${hours} hr ${minutes} min`
}

function getErrorMessage(
  error: unknown,
  fallback: string,
) {
  if (
    !axios.isAxiosError(
      error,
    )
  ) {
    return fallback
  }

  const message =
    error.response?.data
      ?.message

  if (
    Array.isArray(
      message,
    )
  ) {
    return message.join(
      ', ',
    )
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