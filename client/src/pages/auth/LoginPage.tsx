import axios from 'axios'

import {
  useEffect,
  useState,
} from 'react'

import {
  Link,
  useNavigate,
} from 'react-router-dom'

import {
  login,
} from '../../services/auth.service'

import {
  getCurrentUser,
  getPortalPath,
  saveCurrentUser,
} from '../../utils/user-session'

type LoginFormData = {
  email: string
  password: string
}

const initialFormData:
  LoginFormData = {
  email: '',
  password: '',
}

function LoginPage() {
  const navigate =
    useNavigate()

  const [
    formData,
    setFormData,
  ] =
    useState<LoginFormData>(
      initialFormData,
    )

  const [
    showPassword,
    setShowPassword,
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
    const currentUser =
      getCurrentUser()

    if (currentUser) {
      navigate(
        getPortalPath(
          currentUser.role,
        ),
        {
          replace: true,
        },
      )
    }
  }, [navigate])

  function handleChange(
    event:
      React.ChangeEvent<HTMLInputElement>,
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

    if (error) {
      setError('')
    }
  }

  async function handleSubmit(
    event:
      React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    const email =
      formData.email
        .trim()
        .toLowerCase()

    if (
      !email ||
      !formData.password
    ) {
      setError(
        'Email and password are required.',
      )

      return
    }

    try {
      setSubmitting(true)
      setError('')

      const user =
        await login({
          email,
          password:
            formData.password,
        })

      saveCurrentUser(
        user,
      )

      navigate(
        getPortalPath(
          user.role,
        ),
        {
          replace: true,
        },
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
    <main className="grid min-h-screen bg-[#f6f7f9] lg:grid-cols-[1.08fr_0.92fr]">
      {/* LEFT BRAND PANEL */}

      <section className="relative hidden overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-32 top-20 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-40 left-20 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />

        {/* BRAND */}

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-sm font-bold text-slate-950">
            FP
          </div>

          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              Fleet Pulse
            </h1>

            <p className="text-xs text-slate-400">
              Fleet Operations &
              Employee Transport
            </p>
          </div>
        </div>

        {/* MAIN MESSAGE */}

        <div className="relative z-10 max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-300">
            Fleet operations,
            simplified
          </p>

          <h2 className="mt-5 text-5xl font-semibold leading-[1.08] tracking-tight">
            Keep people and
            vehicles moving.
          </h2>

          <p className="mt-6 max-w-lg text-base leading-7 text-slate-300">
            Fleet Pulse brings
            transport requests,
            driver assignments,
            vehicle activity,
            maintenance and fleet
            operations into one
            organised workspace.
          </p>

          {/* OPERATION HIGHLIGHTS */}

          <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Built for daily fleet operations
            </p>

            <div className="mt-5 space-y-5">
              <HighlightItem
                title="Transport Requests"
                description="Plan, approve and track employee transport from request to trip completion."
              />

              <HighlightItem
                title="Vehicle & Driver Coordination"
                description="Keep vehicle assignments organised and prevent conflicts during active trips."
              />

              <HighlightItem
                title="Fleet Activity"
                description="Track trips, fuel usage, reported vehicle issues and maintenance from one place."
              />
            </div>
          </div>
        </div>

        {/* FOOTER */}

        <div className="relative z-10 flex items-center justify-between text-xs text-slate-500">
          <p>
            Fleet Pulse
          </p>

          <p>
            Transport & Fleet
            Management
          </p>
        </div>
      </section>

      {/* RIGHT LOGIN PANEL */}

      <section className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          {/* MOBILE BRAND */}

          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-xs font-bold text-white">
              FP
            </div>

            <div>
              <p className="font-semibold text-slate-950">
                Fleet Pulse
              </p>

              <p className="text-xs text-slate-400">
                Fleet Operations
              </p>
            </div>
          </div>

          {/* LOGIN CARD */}

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">
                Secure access
              </p>

              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                Welcome back
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Sign in to access
                your Fleet Pulse
                workspace.
              </p>
            </div>

            {/* ERROR */}

            {error && (
              <div
                role="alert"
                className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            {/* FORM */}

            <form
              onSubmit={
                handleSubmit
              }
              className="space-y-5"
            >
              <FormField
                label="Email Address"
                name="email"
                type="email"
                value={
                  formData.email
                }
                onChange={
                  handleChange
                }
                placeholder="name@company.com"
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
                    value={
                      formData.password
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-20 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (current) =>
                          !current,
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 transition hover:text-slate-900"
                  >
                    {showPassword
                      ? 'Hide'
                      : 'Show'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={
                  submitting
                }
                className="w-full rounded-xl bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting
                  ? 'Signing in...'
                  : 'Sign in to Fleet Pulse'}
              </button>
            </form>

            {/* SIGN UP */}

            <div className="my-7 border-t border-slate-100" />

            <p className="text-center text-sm text-slate-500">
              Need an employee
              account?{' '}
              <Link
                to="/signup"
                className="font-semibold text-blue-600 transition hover:text-blue-700"
              >
                Create account
              </Link>
            </p>

            <p className="mt-5 text-center text-xs leading-5 text-slate-400">
              Driver and
              administrator accounts
              are managed internally
              by Fleet Pulse.
            </p>
          </div>

          {/* SMALL FOOTER */}

          <p className="mt-6 text-center text-xs text-slate-400">
            Fleet Pulse • Company
            Transport & Fleet
            Operations
          </p>
        </div>
      </section>
    </main>
  )
}

/* =========================================================
   LEFT PANEL HIGHLIGHT
========================================================= */

function HighlightItem({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-400/15 text-xs font-bold text-blue-200 ring-1 ring-blue-400/20">
        ✓
      </div>

      <div>
        <p className="text-sm font-semibold text-white">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-400">
          {description}
        </p>
      </div>
    </div>
  )
}

/* =========================================================
   FORM FIELD
========================================================= */

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

  onChange:
    React.ChangeEventHandler<HTMLInputElement>

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
        onChange={
          onChange
        }
        placeholder={
          placeholder
        }
        autoComplete={
          autoComplete
        }
        required
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  )
}

/* =========================================================
   API ERROR
========================================================= */

function getApiErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  if (
    !axios.isAxiosError(
      error,
    )
  ) {
    return fallbackMessage
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

  if (!error.response) {
    return 'Unable to connect to Fleet Pulse. Please check your connection and try again.'
  }

  return fallbackMessage
}

export default LoginPage