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
  register,
} from '../../services/auth.service'

import {
  getCurrentUser,
  getPortalPath,
} from '../../utils/user-session'

type SignUpFormData = {
  name: string
  email: string
  phone: string
  password: string
  confirmPassword: string
}

const initialFormData:
  SignUpFormData = {
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
}

function SignUpPage() {
  const navigate =
    useNavigate()

  const [
    formData,
    setFormData,
  ] =
    useState<SignUpFormData>(
      initialFormData,
    )

  const [
    showPassword,
    setShowPassword,
  ] =
    useState(false)

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false)

  const [
    error,
    setError,
  ] =
    useState('')

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

    const name =
      formData.name.trim()

    const email =
      formData.email
        .trim()
        .toLowerCase()

    if (
      !name ||
      !email ||
      !formData.password
    ) {
      setError(
        'Name, email and password are required.',
      )

      return
    }

    if (
      formData.password
        .length < 8
    ) {
      setError(
        'Password must contain at least 8 characters.',
      )

      return
    }

    if (
      formData.password !==
      formData.confirmPassword
    ) {
      setError(
        'Passwords do not match.',
      )

      return
    }

    try {
      setSubmitting(true)
      setError('')

      /*
       * Registration creates an
       * INACTIVE employee account.
       *
       * DO NOT save it to localStorage.
       */

      await register({
        name,
        email,

        password:
          formData.password,

        phone:
          formData.phone
            .trim() ||
          undefined,
      })

      navigate(
        '/login',
        {
          replace: true,

          state: {
            registrationMessage:
              'Your Fleet Pulse account was created successfully. Please wait for an administrator to approve your account before signing in.',
          },
        },
      )
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
    <main className="grid min-h-screen bg-[#f6f7f9] lg:grid-cols-[1.08fr_0.92fr]">
      {/* LEFT PANEL */}

      <section className="relative hidden overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-32 top-20 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-sm font-bold text-slate-950">
            FP
          </div>

          <div>
            <h1 className="text-lg font-semibold">
              Fleet Pulse
            </h1>

            <p className="text-xs text-slate-400">
              Fleet Operations &
              Employee Transport
            </p>
          </div>
        </div>

        <div className="relative z-10 max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-300">
            Employee transport
          </p>

          <h2 className="mt-5 text-5xl font-semibold leading-[1.08] tracking-tight">
            Your workplace journey
            starts here.
          </h2>

          <p className="mt-6 max-w-lg text-base leading-7 text-slate-300">
            Create your employee
            account and request
            transportation through
            Fleet Pulse after your
            account has been approved
            by fleet management.
          </p>

          <div className="mt-10 space-y-3">
            <Benefit>
              Search pickup and
              destination locations
            </Benefit>

            <Benefit>
              View route distance and
              estimated travel time
            </Benefit>

            <Benefit>
              Follow request approval
              and trip assignment
            </Benefit>
          </div>
        </div>

        <p className="relative z-10 text-xs text-slate-500">
          Employee accounts require
          administrator approval •
          Fleet Pulse
        </p>
      </section>

      {/* FORM */}

      <section className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-lg">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-xs font-bold text-white">
              FP
            </div>

            <div>
              <p className="font-semibold text-slate-950">
                Fleet Pulse
              </p>

              <p className="text-xs text-slate-400">
                Employee Transport
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
            <div className="mb-7">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">
                Employee registration
              </p>

              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                Create your account
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Register for Fleet
                Pulse. Your account
                will be reviewed by an
                administrator before
                access is granted.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            <form
              onSubmit={
                handleSubmit
              }
              className="space-y-5"
            >
              <FormField
                label="Full Name"
                name="name"
                value={
                  formData.name
                }
                onChange={
                  handleChange
                }
                placeholder="Enter your full name"
                autoComplete="name"
              />

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

              <FormField
                label="Phone Number"
                name="phone"
                type="tel"
                value={
                  formData.phone
                }
                onChange={
                  handleChange
                }
                placeholder="Optional phone number"
                autoComplete="tel"
                required={
                  false
                }
              />

              <PasswordField
                label="Password"
                name="password"
                value={
                  formData.password
                }
                onChange={
                  handleChange
                }
                placeholder="At least 8 characters"
                showPassword={
                  showPassword
                }
                onToggle={() =>
                  setShowPassword(
                    (current) =>
                      !current,
                  )
                }
              />

              <PasswordField
                label="Confirm Password"
                name="confirmPassword"
                value={
                  formData.confirmPassword
                }
                onChange={
                  handleChange
                }
                placeholder="Enter password again"
                showPassword={
                  showPassword
                }
                onToggle={() =>
                  setShowPassword(
                    (current) =>
                      !current,
                  )
                }
              />

              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-sm font-semibold text-amber-800">
                  Administrator approval required
                </p>

                <p className="mt-1 text-xs leading-5 text-amber-700">
                  After registration,
                  your account will
                  remain unavailable
                  until a Fleet Pulse
                  administrator
                  approves it.
                </p>
              </div>

              <button
                type="submit"
                disabled={
                  submitting
                }
                className="w-full rounded-xl bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting
                  ? 'Creating Account...'
                  : 'Submit Registration'}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-slate-500">
              Already have an
              approved account?{' '}
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

function Benefit({
  children,
}: {
  children:
    React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3 text-sm text-slate-300">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-400/15 text-xs font-bold text-blue-200 ring-1 ring-blue-400/20">
        ✓
      </span>

      <span>
        {children}
      </span>
    </div>
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

  onChange:
    React.ChangeEventHandler<HTMLInputElement>

  placeholder: string
  autoComplete: string
  type?: string
  required?: boolean
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>

      <input
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
        required={
          required
        }
        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  )
}

function PasswordField({
  label,
  name,
  value,
  onChange,
  placeholder,
  showPassword,
  onToggle,
}: {
  label: string
  name: string
  value: string

  onChange:
    React.ChangeEventHandler<HTMLInputElement>

  placeholder: string
  showPassword: boolean
  onToggle: () => void
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>

      <div className="relative">
        <input
          name={name}
          type={
            showPassword
              ? 'text'
              : 'password'
          }
          value={value}
          onChange={
            onChange
          }
          placeholder={
            placeholder
          }
          autoComplete="new-password"
          required
          className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-20 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />

        <button
          type="button"
          onClick={
            onToggle
          }
          className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          {showPassword
            ? 'Hide'
            : 'Show'}
        </button>
      </div>
    </label>
  )
}

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

export default SignUpPage