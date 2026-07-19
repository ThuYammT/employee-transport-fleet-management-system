import { LatLngBounds } from 'leaflet'
import { useEffect } from 'react'
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet'

type Props = {
  pickup: [number, number]
  destination: [number, number]
  routeCoordinates: [number, number][]
}

function FitBounds({ pickup, destination, routeCoordinates }: Props) {
  const map = useMap()
  useEffect(() => {
    const points = routeCoordinates.length ? routeCoordinates : [pickup, destination]
    map.fitBounds(new LatLngBounds(points), { padding: [40, 40] })
  }, [destination, map, pickup, routeCoordinates])
  return null
}

function RouteMap(props: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <MapContainer center={props.pickup} zoom={13} scrollWheelZoom className="h-[420px] w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={props.pickup} />
        <Marker position={props.destination} />
        {props.routeCoordinates.length > 0 && (
          <Polyline positions={props.routeCoordinates} pathOptions={{ color: '#2563eb', weight: 5 }} />
        )}
        <FitBounds {...props} />
      </MapContainer>
    </div>
  )
}

export default RouteMap
