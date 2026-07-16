import axios from 'axios'
import {
  useEffect,
  useState,
} from 'react'
import { Link } from 'react-router-dom'

import {
  getAdminSetupStatus,
  setupFirstAdmin,
} from '../../services/auth.service'
import type { AdminSetupStatus } from '../../types/auth'

type AdminSetupFormData = {
  name: string
  email: string
  phone: string
  password: string
  confirmPassword: string
  setupKey: string
}

const initialFormData: AdminSetupFormData = {
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  setupKey: '',
}

function AdminSetupPage() {
  const [setupStatus, setSetupStatus] =
    useState<AdminSetupStatus | null>(null)

  const [formData, setFormData] =
    useState<AdminSetupFormData>(
      initialFormData,
    )

  const [loading, setLoading] =
    useState(true)

  const [submitting, setSubmitting] =
    useState(false)

  const [showPassword, setShowPassword] =
    useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    async function loadSetupStatus() {
      try {
        setLoading(true)
        setError('')

        const status =
          await getAdminSetupStatus()

        setSetupStatus(status)
      } catch (error) {
        console.error(error)

        setError(
          getApiErrorMessage(
            error,
            'Failed to check the administrator setup status.',
          ),
        )
      } finally {
        setLoading(false)
      }
    }

    void loadSetupStatus()
  }, [])

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

    if (
      !name ||
      !email ||
      !formData.password ||
      !formData.setupKey
    ) {
      setError(
        'Name, email, password and setup key are required.',
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

    if (formData.setupKey.length < 16) {
      setError(
        'The setup key must contain at least 16 characters.',
      )
      return
    }

    try {
      setSubmitting(true)
      setError('')
      setSuccess('')

      const response = await setupFirstAdmin({
        name,
        email,
        password: formData.password,
        phone:
          formData.phone.trim() || undefined,
        setupKey: formData.setupKey,
      })

      setSuccess(response.message)

      setSetupStatus({
        adminSetupRequired: false,
        setupConfigured: true,
      })

      setFormData(initialFormData)
    } catch (error) {
      console.error(error)

      setError(
        getApiErrorMessage(
          error,
          'Failed to create the administrator account.',
        ),
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="font-semibold text-slate-800">
            Checking administrator setup...
          </p>
        </div>
      </main>
    )
  }

  if (
    setupStatus &&
    !setupStatus.adminSetupRequired
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-2xl font-bold text-green-700">
            ✓
          </div>

          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-green-600">
            Setup complete
          </p>

          <h1 className="text-3xl font-bold text-slate-900">
            Administrator setup is complete
          </h1>

          <p className="mt-4 leading-7 text-slate-500">
            The first administrator account has already
            been created. Additional administrators
            should be created from the protected Admin
            Users page.
          </p>

          {success && (
            <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
              {success}
            </div>
          )}

          <Link
            to="/login"
            className="mt-8 inline-flex rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Continue to sign in
          </Link>
        </div>
      </main>
    )
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
              Initial System Setup
            </p>
          </div>
        </div>

        <div className="max-w-xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-blue-400">
            First-time configuration
          </p>

          <h2 className="text-5xl font-bold leading-tight">
            Create the system’s first administrator.
          </h2>

          <p className="mt-6 max-w-lg leading-7 text-slate-400">
            This setup can be completed only once.
            Afterward, all administrator accounts must
            be managed from the protected admin portal.
          </p>
        </div>

        <p className="text-sm text-slate-500">
          A private server setup key is required.
        </p>
      </section>

      <section className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-lg">
          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
            <div className="mb-8">
              <p className="mb-2 text-sm font-semibold text-blue-600">
                Administrator bootstrap
              </p>

              <h1 className="text-3xl font-bold text-slate-900">
                Set up first admin
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Enter the company administrator details
                and the private setup key configured on
                the server.
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

            {setupStatus &&
              !setupStatus.setupConfigured && (
                <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                  The backend does not have an
                  <strong>
                    {' '}
                    INITIAL_ADMIN_SETUP_KEY{' '}
                  </strong>
                  environment variable configured yet.
                  Add it locally and in Render before
                  submitting this form.
                </div>
              )}

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <FormField
                label="Administrator name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter full name"
                autoComplete="name"
              />

              <FormField
                label="Email address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="admin@company.com"
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
                label="Administrator password"
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
                placeholder="Enter password again"
                autoComplete="new-password"
                showPassword={showPassword}
                onToggle={() =>
                  setShowPassword(
                    (current) => !current,
                  )
                }
              />

              <PasswordField
                label="Private setup key"
                name="setupKey"
                value={formData.setupKey}
                onChange={handleChange}
                placeholder="Enter the server setup key"
                autoComplete="off"
                showPassword={showPassword}
                onToggle={() =>
                  setShowPassword(
                    (current) => !current,
                  )
                }
              />

              <button
                type="submit"
                disabled={
                  submitting ||
                  !setupStatus?.setupConfigured
                }
                className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? 'Creating administrator...'
                  : 'Create first administrator'}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-slate-500">
              Already completed setup?{' '}
              <Link
                to="/login"
                className="font-semibold text-blue-600 hover:text-blue-700"
              >
                Return to sign in
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

export default AdminSetupPage