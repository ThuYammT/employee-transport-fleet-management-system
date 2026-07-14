import axios from 'axios'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { createTransportRequest } from '../../services/transport-request.service'
import { getEmployeeId } from '../../utils/employee-session'

type TransportRequestFormData = {
  pickupLocation: string
  destination: string
  requestDate: string
  requestTime: string
  purpose: string
}

const initialFormData: TransportRequestFormData = {
  pickupLocation: '',
  destination: '',
  requestDate: '',
  requestTime: '',
  purpose: '',
}

function NewTransportRequestPage() {
  const navigate = useNavigate()

  const [formData, setFormData] =
    useState<TransportRequestFormData>(initialFormData)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function handleInputChange(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >,
  ) {
    const { name, value } = event.target

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }))
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    const employeeId = getEmployeeId()

    if (!employeeId) {
      navigate('/employee/setup', { replace: true })
      return
    }

    const pickupLocation = formData.pickupLocation.trim()
    const destination = formData.destination.trim()
    const purpose = formData.purpose.trim()

    if (
      !pickupLocation ||
      !destination ||
      !formData.requestDate ||
      !formData.requestTime ||
      !purpose
    ) {
      setError('Please complete all required fields.')
      return
    }

    if (pickupLocation.toLowerCase() === destination.toLowerCase()) {
      setError(
        'Pickup location and destination must be different.',
      )
      return
    }

    const selectedDateTime = new Date(
      `${formData.requestDate}T${formData.requestTime}`,
    )

    if (Number.isNaN(selectedDateTime.getTime())) {
      setError('Please provide a valid request date and time.')
      return
    }

    try {
      setSubmitting(true)
      setError('')

      await createTransportRequest({
        employeeId,
        pickupLocation,
        destination,
        requestDate: formData.requestDate,
        requestTime: formData.requestTime,
        purpose,
      })

      navigate('/employee/my-requests')
    } catch (error) {
      console.error(error)

      if (axios.isAxiosError(error)) {
        const backendMessage = error.response?.data?.message

        if (Array.isArray(backendMessage)) {
          setError(backendMessage.join(', '))
        } else if (typeof backendMessage === 'string') {
          setError(backendMessage)
        } else if (error.response?.status === 404) {
          setError(
            'The employee account could not be found. Please create or select an employee account again.',
          )
        } else if (error.response?.status === 400) {
          setError(
            'The request information is invalid. Please review the form.',
          )
        } else {
          setError('Failed to submit the transport request.')
        }
      } else {
        setError('Failed to submit the transport request.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <header className="border-b border-slate-200 bg-white px-8 py-5">
        <h1 className="text-xl font-bold text-slate-900">
          New Transport Request
        </h1>

        <p className="text-sm text-slate-500">
          Submit a request for employee transportation.
        </p>
      </header>

      <section className="p-8">
        <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">
              Request Details
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Enter the route, schedule and purpose of your trip.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                label="Pickup Location"
                name="pickupLocation"
                value={formData.pickupLocation}
                onChange={handleInputChange}
                placeholder="Enter pickup location"
              />

              <FormField
                label="Destination"
                name="destination"
                value={formData.destination}
                onChange={handleInputChange}
                placeholder="Enter destination"
              />

              <FormField
                label="Request Date"
                name="requestDate"
                type="date"
                value={formData.requestDate}
                onChange={handleInputChange}
              />

              <FormField
                label="Request Time"
                name="requestTime"
                type="time"
                value={formData.requestTime}
                onChange={handleInputChange}
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
                value={formData.purpose}
                onChange={handleInputChange}
                placeholder="Explain why transportation is required"
                required
                rows={5}
                maxLength={500}
                className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <div className="mt-2 flex justify-end">
                <span className="text-xs text-slate-400">
                  {formData.purpose.length}/500
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
                disabled={submitting}
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
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  name: string
  value: string
  onChange: React.ChangeEventHandler<HTMLInputElement>
  placeholder?: string
  type?: 'text' | 'date' | 'time'
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
        placeholder={placeholder}
        required
        className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  )
}

export default NewTransportRequestPage