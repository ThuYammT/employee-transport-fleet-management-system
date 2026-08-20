import axios from 'axios'
import { useEffect, useState } from 'react'
import {
  Link,
  useNavigate,
} from 'react-router-dom'

import { register } from '../../services/auth.service'
import {
  getCurrentUser,
  getPortalPath,
  saveCurrentUser,
} from '../../utils/user-session'

type SignUpFormData = {
  name: string
  email: string
  phone: string
  password: string
  confirmPassword: string
}

const initialFormData: SignUpFormData = {
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
}

function SignUpPage() {
  const navigate = useNavigate()

  const [formData, setFormData] =
    useState<SignUpFormData>(initialFormData)

  const [showPassword, setShowPassword] =
    useState(false)

  const [submitting, setSubmitting] =
    useState(false)

  const [error, setError] = useState('')

  useEffect(() => {
    const currentUser = getCurrentUser()

    if (currentUser) {
      navigate(
        getPortalPath(currentUser.role),
        { replace: true },
      )
    }
  }, [navigate])

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const { name, value } = event.target

    setFormData((current) => ({
      ...current,
      [name]: value,
    }))

    if (error) {
      setError('')
    }
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    const name = formData.name.trim()
    const email = formData.email
      .trim()
      .toLowerCase()

    if (!name || !email || !formData.password) {
      setError(
        'Name, email and password are required.',
      )
      return
    }

    if (formData.password.length < 8) {
      setError(
        'Password must contain at least 8 characters.',
      )
      return
    }

    if (
      formData.password !==
      formData.confirmPassword
    ) {
      setError('Passwords do not match.')
      return
    }

    try {
      setSubmitting(true)
      setError('')

      const employee = await register({
        name,
        email,
        password: formData.password,
        phone:
          formData.phone.trim() || undefined,
      })

      saveCurrentUser(employee)

      navigate('/employee', {
        replace: true,
      })
    } catch (error) {
      console.error(error)

      setError(
        getApiErrorMessage(
          error,
          'Unable to create your account.',
        ),
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="grid min-h-screen bg-slate-100 lg:grid-cols-2">
      <section className="hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 font-bold">
            FM
          </div>

          <div>
            <h1 className="font-bold">
              Fleet Management
            </h1>

            <p className="text-sm text-slate-400">
              Employee Transport System
            </p>
          </div>
        </div>

        <div className="max-w-xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-blue-400">
            Employee registration
          </p>

          <h2 className="text-5xl font-bold leading-tight">
            Your company transportation starts here.
          </h2>

          <p className="mt-6 max-w-lg leading-7 text-slate-400">
            Create an employee account, submit transport
            requests and monitor their approval status.
          </p>
        </div>

        <p className="text-sm text-slate-500">
          New registrations are created as employee
          accounts.
        </p>
      </section>

      <section className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-lg">
          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
            <div className="mb-8">
              <p className="mb-2 text-sm font-semibold text-blue-600">
                Create your account
              </p>

              <h1 className="text-3xl font-bold text-slate-900">
                Employee sign up
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Complete the form below to access the
                employee transport portal.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <FormField
                label="Full name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                autoComplete="name"
              />

              <FormField
                label="Email address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="employee@example.com"
                autoComplete="email"
              />

              <FormField
                label="Phone number"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Optional phone number"
                autoComplete="tel"
                required={false}
              />

              <PasswordField
                label="Password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                showPassword={showPassword}
                onToggle={() =>
                  setShowPassword(
                    (current) => !current,
                  )
                }
              />

              <PasswordField
                label="Confirm password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Enter your password again"
                autoComplete="new-password"
                showPassword={showPassword}
                onToggle={() =>
                  setShowPassword(
                    (current) => !current,
                  )
                }
              />

              <div className="rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-500">
                Your account will be registered with the
                Employee role. Driver and administrator
                accounts are managed internally.
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? 'Creating account...'
                  : 'Create employee account'}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-slate-500">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-blue-600 hover:text-blue-700"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}

function FormField({
  label,
  name,
  value,
  onChange,
  placeholder,
  autoComplete,
  type = 'text',
  required = true,
}: {
  label: string
  name: string
  value: string
  onChange: React.ChangeEventHandler<HTMLInputElement>
  placeholder: string
  autoComplete: string
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
        autoComplete={autoComplete}
        required={required}
        className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  )
}

function PasswordField({
  label,
  name,
  value,
  onChange,
  placeholder,
  autoComplete,
  showPassword,
  onToggle,
}: {
  label: string
  name: string
  value: string
  onChange: React.ChangeEventHandler<HTMLInputElement>
  placeholder: string
  autoComplete: string
  showPassword: boolean
  onToggle: () => void
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-semibold text-slate-700"
      >
        {label}
      </label>

      <div className="relative">
        <input
          id={name}
          name={name}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
          className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-20 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />

        <button
          type="button"
          onClick={onToggle}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500 hover:text-slate-800"
        >
          {showPassword ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>
  )
}

function getApiErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  if (!axios.isAxiosError(error)) {
    return fallbackMessage
  }

  const message = error.response?.data?.message

  if (Array.isArray(message)) {
    return message.join(', ')
  }

  if (typeof message === 'string') {
    return message
  }

  if (!error.response) {
    return 'Unable to connect to the server. Please check your internet connection.'
  }

  return fallbackMessage
}

export default SignUpPage