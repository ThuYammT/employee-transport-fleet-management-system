import axios from 'axios'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createUser } from '../../services/user.service'
import { saveEmployeeId } from '../../utils/employee-session'

type EmployeeFormData = {
  name: string
  email: string
  password: string
  phone: string
}

const initialFormData: EmployeeFormData = {
  name: '',
  email: '',
  password: '',
  phone: '',
}

function EmployeeSetupPage() {
  const navigate = useNavigate()

  const [formData, setFormData] =
    useState<EmployeeFormData>(initialFormData)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const { name, value } = event.target

    setFormData((current) => ({
      ...current,
      [name]: value,
    }))
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.password.trim()
    ) {
      setError('Name, email and password are required.')
      return
    }

    try {
      setSubmitting(true)
      setError('')

      const employee = await createUser({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim() || undefined,
        role: 'EMPLOYEE',
      })

      saveEmployeeId(employee.id)

      navigate('/employee')
    } catch (error) {
      console.error(error)

      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message

        if (Array.isArray(message)) {
          setError(message.join(', '))
        } else if (typeof message === 'string') {
          setError(message)
        } else {
          setError('Failed to create employee account.')
        }
      } else {
        setError('Failed to create employee account.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 font-bold text-white">
            EM
          </div>

          <h1 className="text-3xl font-bold text-slate-900">
            Create Test Employee
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Create a real employee account for testing the Employee
            Portal before authentication is implemented.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <FormField
            label="Full Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter employee name"
          />

          <FormField
            label="Email Address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="employee@example.com"
          />

          <FormField
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter a secure password"
          />

          <FormField
            label="Phone Number"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Optional phone number"
            required={false}
          />

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? 'Creating Employee...'
              : 'Create Employee Account'}
          </button>
        </form>

        <div className="mt-6 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-800">
          This setup page is temporary. It should be removed after JWT
          authentication and registration rules are implemented.
        </div>
      </div>
    </div>
  )
}

function FormField({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = true,
}: {
  label: string
  name: string
  value: string
  onChange: React.ChangeEventHandler<HTMLInputElement>
  placeholder: string
  type?: string
  required?: boolean
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
        required={required}
        className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  )
}

export default EmployeeSetupPage