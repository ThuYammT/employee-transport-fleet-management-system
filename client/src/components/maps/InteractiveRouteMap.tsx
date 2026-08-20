import {
  LatLngBounds,
  type LatLngExpression,
} from 'leaflet'

import { useEffect } from 'react'

import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet'

export type MapSelectionMode =
  | 'pickup'
  | 'destination'
  | null

type InteractiveRouteMapProps = {
  pickup: [number, number] | null
  destination: [number, number] | null
  routeCoordinates: [number, number][]
  selectionMode: MapSelectionMode

  onMapClick: (
    latitude: number,
    longitude: number,
  ) => void

  disabled?: boolean
}

function MapClickHandler({
  selectionMode,
  onMapClick,
  disabled,
}: {
  selectionMode: MapSelectionMode

  onMapClick: (
    latitude: number,
    longitude: number,
  ) => void

  disabled: boolean
}) {
  useMapEvents({
    click(event) {
      if (
        disabled ||
        !selectionMode
      ) {
        return
      }

      onMapClick(
        event.latlng.lat,
        event.latlng.lng,
      )
    },
  })

  return null
}

function FitMapBounds({
  pickup,
  destination,
  routeCoordinates,
}: {
  pickup: [number, number] | null
  destination: [number, number] | null
  routeCoordinates: [number, number][]
}) {
  const map = useMap()

  useEffect(() => {
    const points: LatLngExpression[] = []

    if (routeCoordinates.length > 0) {
      points.push(...routeCoordinates)
    } else {
      if (pickup) {
        points.push(pickup)
      }

      if (destination) {
        points.push(destination)
      }
    }

    if (points.length === 1) {
      map.setView(
        points[0],
        15,
      )

      return
    }

    if (points.length > 1) {
      const bounds =
        new LatLngBounds(points)

      map.fitBounds(
        bounds,
        {
          padding: [40, 40],
        },
      )
    }
  }, [
    pickup,
    destination,
    routeCoordinates,
    map,
  ])

  return null
}

function InteractiveRouteMap({
  pickup,
  destination,
  routeCoordinates,
  selectionMode,
  onMapClick,
  disabled = false,
}: InteractiveRouteMapProps) {
  const defaultCenter:
    [number, number] =
    pickup ??
    destination ??
    [16.8409, 96.1735]

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
        <p className="font-semibold text-slate-800">
          Choose locations on the map
        </p>

        <p className="mt-1 text-sm text-slate-500">
          {selectionMode === 'pickup' &&
            'Click anywhere on the map to set the pickup location.'}

          {selectionMode ===
            'destination' &&
            'Click anywhere on the map to set the destination.'}

          {!selectionMode &&
            'Select Pickup or Destination mode first.'}
        </p>
      </div>

      <MapContainer
        center={defaultCenter}
        zoom={13}
        scrollWheelZoom
        className="h-[430px] w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler
          selectionMode={selectionMode}
          onMapClick={onMapClick}
          disabled={disabled}
        />

        {pickup && (
          <Marker position={pickup}>
            <Popup>
              Pickup location
            </Popup>
          </Marker>
        )}

        {destination && (
          <Marker position={destination}>
            <Popup>
              Destination
            </Popup>
          </Marker>
        )}

        {routeCoordinates.length > 0 && (
          <Polyline
            positions={
              routeCoordinates
            }
            pathOptions={{
              color: '#2563eb',
              weight: 5,
            }}
          />
        )}

        <FitMapBounds
          pickup={pickup}
          destination={destination}
          routeCoordinates={
            routeCoordinates
          }
        />
      </MapContainer>
    </div>
  )
}

export default InteractiveRouteMap