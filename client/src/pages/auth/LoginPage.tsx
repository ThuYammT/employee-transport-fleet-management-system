import axios from 'axios'
import { useEffect, useState } from 'react'
import {
  Link,
  useNavigate,
} from 'react-router-dom'

import { login } from '../../services/auth.service'
import {
  getCurrentUser,
  getPortalPath,
  saveCurrentUser,
} from '../../utils/user-session'

type LoginFormData = {
  email: string
  password: string
}

const initialFormData: LoginFormData = {
  email: '',
  password: '',
}

function LoginPage() {
  const navigate = useNavigate()

  const [formData, setFormData] =
    useState<LoginFormData>(initialFormData)

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

    const email = formData.email
      .trim()
      .toLowerCase()

    if (!email || !formData.password) {
      setError(
        'Email and password are required.',
      )
      return
    }

    try {
      setSubmitting(true)
      setError('')

      const user = await login({
        email,
        password: formData.password,
      })

      saveCurrentUser(user)

      navigate(
        getPortalPath(user.role),
        { replace: true },
      )
    } catch (error) {
      console.error(error)
      setError(
        getApiErrorMessage(
          error,
          'Unable to sign in. Please try again.',
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
            Welcome back
          </p>

          <h2 className="text-5xl font-bold leading-tight">
            Manage workplace transportation from one
            reliable platform.
          </h2>

          <p className="mt-6 max-w-lg leading-7 text-slate-400">
            Submit requests, monitor approvals and stay
            updated on your company transport activity.
          </p>
        </div>

        <p className="text-sm text-slate-500">
          Employee Transport Fleet Management System
        </p>
      </section>

      <section className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 font-bold text-white">
              FM
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
            <div className="mb-8">
              <p className="mb-2 text-sm font-semibold text-blue-600">
                Account access
              </p>

              <h1 className="text-3xl font-bold text-slate-900">
                Sign in
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Enter your account details to continue to
                your portal.
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
                label="Email address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="employee@example.com"
                autoComplete="email"
              />

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Password
                </label>

                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-20 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (current) => !current,
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500 hover:text-slate-800"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? 'Signing in...'
                  : 'Sign in'}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-slate-500">
              Do not have an employee account?{' '}
              <Link
                to="/signup"
                className="font-semibold text-blue-600 hover:text-blue-700"
              >
                Create account
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
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  label: string
  name: string
  type: string
  value: string
  onChange: React.ChangeEventHandler<HTMLInputElement>
  placeholder: string
  autoComplete: string
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
        required
        className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
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

export default LoginPage