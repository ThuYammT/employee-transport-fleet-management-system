import axios from 'axios'
import { useEffect, useRef, useState } from 'react'
import { searchLocations } from '../../services/transport-request.service'
import type { LocationSuggestion } from '../../types/transport-request'

type Props = {
  id: string
  label: string
  placeholder: string
  value: string
  selectedLocation: LocationSuggestion | null
  onTextChange: (value: string) => void
  onSelect: (location: LocationSuggestion) => void
  disabled?: boolean
}

function LocationSearchInput(props: Props) {
  const [items, setItems] = useState<LocationSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  useEffect(() => {
    const query = props.value.trim()
    if (props.disabled || props.selectedLocation?.label === props.value || query.length < 2) {
      setItems([])
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      try {
        setLoading(true)
        setError('')
        setItems(await searchLocations(query, controller.signal))
        setOpen(true)
      } catch (error) {
        if (!axios.isCancel(error) && !controller.signal.aborted) {
          setError('Location search failed')
          setOpen(true)
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 450)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [props.disabled, props.selectedLocation, props.value])

  return (
    <div ref={root} className="relative">
      <label htmlFor={props.id} className="mb-2 block text-sm font-semibold text-slate-700">{props.label}</label>
      <input
        id={props.id}
        value={props.value}
        onChange={(event) => { props.onTextChange(event.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder={props.placeholder}
        autoComplete="off"
        required
        disabled={props.disabled}
        className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
      />

      {props.selectedLocation?.label === props.value && (
        <p className="mt-2 text-xs font-semibold text-green-700">Location selected</p>
      )}

      {open && (loading || error || items.length > 0) && (
        <div className="absolute z-[1000] mt-2 max-h-72 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
          {loading && <p className="p-3 text-sm text-slate-500">Searching...</p>}
          {!loading && error && <p className="p-3 text-sm text-red-600">{error}</p>}
          {!loading && !error && items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => { props.onSelect(item); setOpen(false); setItems([]) }}
              className="block w-full rounded-lg px-3 py-3 text-left hover:bg-blue-50"
            >
              <span className="block text-sm font-semibold text-slate-800">{item.name ?? item.label}</span>
              <span className="mt-1 block text-xs text-slate-500">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default LocationSearchInput
