import axios from 'axios'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  getAuditLogs,
} from '../../services/audit-log.service'

import {
  activateUser,
  createAdmin,
  deactivateUser,
  deleteUser,
  getUsers,
} from '../../services/user.service'

import {
  getCurrentUser,
} from '../../utils/user-session'

import type {
  AuditAction,
  AuditLog,
  AuditPagination,
} from '../../types/audit-log'

import type {
  User,
  UserRole,
  UserStatus,
} from '../../types/user'

type MainTab =
  | 'ACCOUNTS'
  | 'AUDIT'

type RoleFilter =
  | 'ALL'
  | UserRole

type StatusFilter =
  | 'ALL'
  | UserStatus

type AdminForm = {
  name: string
  email: string
  phone: string
  password: string
  confirmPassword: string
}

const emptyAdminForm:
  AdminForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
}

const AUDIT_PAGE_SIZE =
  20

const emptyPagination:
  AuditPagination = {
  page: 1,
  limit:
    AUDIT_PAGE_SIZE,
  total: 0,
  totalPages: 1,
  hasPreviousPage:
    false,
  hasNextPage:
    false,
}

function UsersView() {
  const [
    users,
    setUsers,
  ] =
    useState<User[]>([])

  const [
    auditLogs,
    setAuditLogs,
  ] =
    useState<AuditLog[]>([])

  const [
    auditPagination,
    setAuditPagination,
  ] =
    useState<AuditPagination>(
      emptyPagination,
    )

  const [
    activeTab,
    setActiveTab,
  ] =
    useState<MainTab>(
      'ACCOUNTS',
    )

  const [
    accountSearch,
    setAccountSearch,
  ] =
    useState('')

  const [
    auditSearchInput,
    setAuditSearchInput,
  ] =
    useState('')

  const [
    auditSearch,
    setAuditSearch,
  ] =
    useState('')

  const [
    roleFilter,
    setRoleFilter,
  ] =
    useState<RoleFilter>(
      'ALL',
    )

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<StatusFilter>(
      'ALL',
    )

  const [
    auditActionFilter,
    setAuditActionFilter,
  ] =
    useState<
      'ALL' | AuditAction
    >('ALL')

  const [
    auditPage,
    setAuditPage,
  ] =
    useState(1)

  const [
    loadingAccounts,
    setLoadingAccounts,
  ] =
    useState(true)

  const [
    loadingAudit,
    setLoadingAudit,
  ] =
    useState(true)

  const [
    error,
    setError,
  ] =
    useState('')

  const [
    success,
    setSuccess,
  ] =
    useState('')

  const [
    actionLoading,
    setActionLoading,
  ] =
    useState<number | null>(
      null,
    )

  const [
    deletingUserId,
    setDeletingUserId,
  ] =
    useState<number | null>(
      null,
    )

  const [
    isAdminModalOpen,
    setIsAdminModalOpen,
  ] =
    useState(false)

  const [
    adminForm,
    setAdminForm,
  ] =
    useState<AdminForm>(
      emptyAdminForm,
    )

  const [
    adminSaving,
    setAdminSaving,
  ] =
    useState(false)

  const [
    adminError,
    setAdminError,
  ] =
    useState('')

  /* =====================================================
     LOAD DATA
  ===================================================== */

  useEffect(() => {
    void loadUsers()
  }, [])

  useEffect(() => {
    void loadAuditLogs()
  }, [
    auditPage,
    auditActionFilter,
    auditSearch,
  ])

  async function loadUsers() {
    try {
      setLoadingAccounts(
        true,
      )

      setError('')

      const data =
        await getUsers()

      setUsers(data)
    } catch (error) {
      console.error(error)

      setError(
        getApiErrorMessage(
          error,
          'Failed to load account information.',
        ),
      )
    } finally {
      setLoadingAccounts(
        false,
      )
    }
  }

  async function loadAuditLogs() {
    try {
      setLoadingAudit(
        true,
      )

      setError('')

      const result =
        await getAuditLogs({
          page:
            auditPage,

          limit:
            AUDIT_PAGE_SIZE,

          action:
            auditActionFilter,

          search:
            auditSearch,
        })

      setAuditLogs(
        result.data,
      )

      setAuditPagination(
        result.pagination,
      )

      if (
        auditPage >
        result.pagination
          .totalPages
      ) {
        setAuditPage(
          result.pagination
            .totalPages,
        )
      }
    } catch (error) {
      console.error(error)

      setError(
        getApiErrorMessage(
          error,
          'Failed to load audit activity.',
        ),
      )
    } finally {
      setLoadingAudit(
        false,
      )
    }
  }

  async function refreshAll() {
    await Promise.all([
      loadUsers(),
      loadAuditLogs(),
    ])
  }

  /* =====================================================
     STATISTICS
  ===================================================== */

  const totalAdmins =
    useMemo(
      () =>
        users.filter(
          (user) =>
            user.role ===
            'ADMIN',
        ).length,
      [users],
    )

  const totalEmployees =
    useMemo(
      () =>
        users.filter(
          (user) =>
            user.role ===
            'EMPLOYEE',
        ).length,
      [users],
    )

  const totalDrivers =
    useMemo(
      () =>
        users.filter(
          (user) =>
            user.role ===
            'DRIVER',
        ).length,
      [users],
    )

  const activeAccounts =
    useMemo(
      () =>
        users.filter(
          (user) =>
            user.status ===
            'ACTIVE',
        ).length,
      [users],
    )

  const pendingEmployees =
    useMemo(
      () =>
        users.filter(
          (user) =>
            user.role ===
              'EMPLOYEE' &&
            user.status ===
              'INACTIVE',
        ),
      [users],
    )

  /* =====================================================
     ORIGINAL ADMIN
  ===================================================== */

  const primaryAdminId =
    useMemo(() => {
      const admins =
        users
          .filter(
            (user) =>
              user.role ===
              'ADMIN',
          )
          .sort(
            (a, b) => {
              const dateDifference =
                new Date(
                  a.createdAt,
                ).getTime() -
                new Date(
                  b.createdAt,
                ).getTime()

              if (
                dateDifference !==
                0
              ) {
                return dateDifference
              }

              return (
                a.id -
                b.id
              )
            },
          )

      return (
        admins[0]?.id ??
        null
      )
    }, [users])

  /* =====================================================
     ACCOUNT FILTERING
  ===================================================== */

  const filteredUsers =
    useMemo(() => {
      const search =
        accountSearch
          .trim()
          .toLowerCase()

      return users.filter(
        (user) => {
          const matchesRole =
            roleFilter ===
              'ALL' ||
            user.role ===
              roleFilter

          const matchesStatus =
            statusFilter ===
              'ALL' ||
            user.status ===
              statusFilter

          const matchesSearch =
            !search ||
            user.name
              .toLowerCase()
              .includes(search) ||
            user.email
              .toLowerCase()
              .includes(search) ||
            user.role
              .toLowerCase()
              .includes(search) ||
            user.phone
              ?.toLowerCase()
              .includes(search)

          return (
            matchesRole &&
            matchesStatus &&
            matchesSearch
          )
        },
      )
    }, [
      users,
      accountSearch,
      roleFilter,
      statusFilter,
    ])

  /* =====================================================
     AUDIT SEARCH
  ===================================================== */

  function submitAuditSearch(
    event:
      React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setAuditPage(1)

    setAuditSearch(
      auditSearchInput.trim(),
    )
  }

  function clearAuditSearch() {
    setAuditSearchInput(
      '',
    )

    setAuditSearch(
      '',
    )

    setAuditPage(1)
  }

  /* =====================================================
     CREATE ADMIN
  ===================================================== */

  function openCreateAdminModal() {
    setAdminForm(
      emptyAdminForm,
    )

    setAdminError('')

    setIsAdminModalOpen(
      true,
    )
  }

  function closeAdminModal() {
    if (adminSaving) {
      return
    }

    setIsAdminModalOpen(
      false,
    )

    setAdminForm(
      emptyAdminForm,
    )

    setAdminError('')
  }

  async function handleCreateAdmin(
    event:
      React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    const currentUser =
      getCurrentUser()

    if (
      !currentUser ||
      currentUser.role !==
        'ADMIN'
    ) {
      setAdminError(
        'Administrator session not found.',
      )

      return
    }

    const name =
      adminForm.name.trim()

    const email =
      adminForm.email
        .trim()
        .toLowerCase()

    const phone =
      adminForm.phone.trim()

    if (!name) {
      setAdminError(
        'Administrator name is required.',
      )

      return
    }

    if (!email) {
      setAdminError(
        'Email address is required.',
      )

      return
    }

    if (
      adminForm.password
        .length < 8
    ) {
      setAdminError(
        'Password must contain at least 8 characters.',
      )

      return
    }

    if (
      adminForm.password !==
      adminForm.confirmPassword
    ) {
      setAdminError(
        'Passwords do not match.',
      )

      return
    }

    try {
      setAdminSaving(
        true,
      )

      setAdminError('')

      await createAdmin({
        name,
        email,

        password:
          adminForm.password,

        phone:
          phone ||
          undefined,

        actorUserId:
          currentUser.id,
      })

      setIsAdminModalOpen(
        false,
      )

      setAdminForm(
        emptyAdminForm,
      )

      setSuccess(
        'Administrator account created successfully.',
      )

      await refreshAll()
    } catch (error) {
      console.error(error)

      setAdminError(
        getApiErrorMessage(
          error,
          'Failed to create administrator.',
        ),
      )
    } finally {
      setAdminSaving(
        false,
      )
    }
  }

  /* =====================================================
     ACTIVATE / APPROVE / DEACTIVATE
  ===================================================== */

  async function handleAccountStatus(
    user: User,
  ) {
    const currentUser =
      getCurrentUser()

    if (
      !currentUser ||
      currentUser.role !==
        'ADMIN'
    ) {
      setError(
        'Administrator session not found.',
      )

      return
    }

    const isActive =
      user.status ===
      'ACTIVE'

    const pendingEmployee =
      user.role ===
        'EMPLOYEE' &&
      user.status ===
        'INACTIVE'

    const actionLabel =
      isActive
        ? 'deactivate'
        : pendingEmployee
          ? 'approve'
          : 'activate'

    const confirmed =
      window.confirm(
        `${capitalize(
          actionLabel,
        )} ${user.name}'s account?`,
      )

    if (!confirmed) {
      return
    }

    try {
      setActionLoading(
        user.id,
      )

      setError('')
      setSuccess('')

      if (isActive) {
        await deactivateUser(
          user.id,
          currentUser.id,
        )
      } else {
        await activateUser(
          user.id,
          currentUser.id,
        )
      }

      setSuccess(
        pendingEmployee
          ? `${user.name}'s employee account was approved.`
          : `${user.name}'s account was ${isActive ? 'deactivated' : 'activated'}.`,
      )

      await refreshAll()
    } catch (error) {
      console.error(error)

      setError(
        getApiErrorMessage(
          error,
          `Failed to ${actionLabel} the account.`,
        ),
      )
    } finally {
      setActionLoading(
        null,
      )
    }
  }

  /* =====================================================
     DELETE
  ===================================================== */

  async function handleDeleteUser(
    user: User,
  ) {
    const currentUser =
      getCurrentUser()

    if (
      !currentUser ||
      currentUser.role !==
        'ADMIN'
    ) {
      setError(
        'Administrator session not found.',
      )

      return
    }

    if (
      currentUser.id ===
      user.id
    ) {
      setError(
        'You cannot delete your own administrator account.',
      )

      return
    }

    if (
      user.role ===
        'ADMIN' &&
      user.id ===
        primaryAdminId
    ) {
      setError(
        'The original Fleet Pulse administrator account is protected and cannot be deleted.',
      )

      return
    }

    const confirmed =
      window.confirm(
        `Permanently delete ${user.name}?\n\nThis action cannot be undone.\n\nIf this user has fleet or transport history, Fleet Pulse will prevent deletion and you should deactivate the account instead.`,
      )

    if (!confirmed) {
      return
    }

    try {
      setDeletingUserId(
        user.id,
      )

      setError('')
      setSuccess('')

      await deleteUser(
        user.id,
        currentUser.id,
      )

      setSuccess(
        `${user.name}'s account was deleted successfully.`,
      )

      await refreshAll()
    } catch (error) {
      console.error(error)

      setError(
        getApiErrorMessage(
          error,
          'Failed to delete the account.',
        ),
      )
    } finally {
      setDeletingUserId(
        null,
      )
    }
  }

  /* =====================================================
     AUDIT PAGINATION
  ===================================================== */

  const auditStart =
    auditPagination.total ===
    0
      ? 0
      : (auditPagination.page -
          1) *
          auditPagination.limit +
        1

  const auditEnd =
    Math.min(
      auditPagination.page *
        auditPagination.limit,
      auditPagination.total,
    )

  return (
    <>
      {/* =================================================
          HEADER
      ================================================= */}

      <header className="flex min-h-[72px] items-center justify-between border-b border-slate-200 bg-white px-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-950">
            User Management
          </h1>

          <p className="mt-0.5 text-sm text-slate-500">
            Manage accounts,
            employee approvals and
            Fleet Pulse access
            activity.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() =>
              void refreshAll()
            }
            disabled={
              loadingAccounts ||
              loadingAudit
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Refresh
          </button>

          <button
            type="button"
            onClick={
              openCreateAdminModal
            }
            className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            + Create Administrator
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-[1600px] p-8">
        {/* =================================================
            HERO
        ================================================= */}

        <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 px-7 py-7 text-white shadow-sm">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-200">
                Security & Access
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Fleet Pulse Account
                Control
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Approve employee
                registrations,
                manage account
                availability and
                review important
                account activity.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <HeroMetric
                label="Active Accounts"
                value={`${activeAccounts}`}
              />

              <HeroMetric
                label="Pending Approval"
                value={`${pendingEmployees.length}`}
              />
            </div>
          </div>
        </div>

        {/* =================================================
            ALERTS
        ================================================= */}

        {error && (
          <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={() =>
                setError('')
              }
              className="font-bold"
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <span>
              {success}
            </span>

            <button
              type="button"
              onClick={() =>
                setSuccess('')
              }
              className="font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* =================================================
            STATISTICS
        ================================================= */}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Accounts"
            value={
              users.length
            }
            tone="slate"
          />

          <StatCard
            label="Administrators"
            value={
              totalAdmins
            }
            tone="blue"
          />

          <StatCard
            label="Employees"
            value={
              totalEmployees
            }
            tone="green"
          />

          <StatCard
            label="Drivers"
            value={
              totalDrivers
            }
            tone="amber"
          />
        </div>

        {/* =================================================
            PENDING EMPLOYEE APPROVALS
        ================================================= */}

        {pendingEmployees.length >
          0 && (
          <section className="mb-6 overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-amber-100 bg-amber-50/70 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-600">
                  Action required
                </p>

                <h3 className="mt-1 text-lg font-semibold text-slate-950">
                  Employee Account
                  Approvals
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  New employees must
                  be approved before
                  they can sign in.
                </p>
              </div>

              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                {
                  pendingEmployees.length
                }{' '}
                pending
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {pendingEmployees.map(
                (user) => (
                  <div
                    key={
                      user.id
                    }
                    className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <Avatar
                        name={
                          user.name
                        }
                      />

                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">
                          {
                            user.name
                          }
                        </p>

                        <p className="mt-1 truncate text-sm text-slate-500">
                          {
                            user.email
                          }
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Registered{' '}
                          {formatDateTime(
                            user.createdAt,
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={
                          actionLoading ===
                            user.id ||
                          deletingUserId ===
                            user.id
                        }
                        onClick={() =>
                          void handleAccountStatus(
                            user,
                          )
                        }
                        className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                      >
                        {actionLoading ===
                        user.id
                          ? 'Approving...'
                          : 'Approve'}
                      </button>

                      <button
                        type="button"
                        disabled={
                          deletingUserId ===
                            user.id ||
                          actionLoading ===
                            user.id
                        }
                        onClick={() =>
                          void handleDeleteUser(
                            user,
                          )
                        }
                        className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        {deletingUserId ===
                        user.id
                          ? 'Deleting...'
                          : 'Delete'}
                      </button>
                    </div>
                  </div>
                ),
              )}
            </div>
          </section>
        )}

        {/* =================================================
            MAIN CARD
        ================================================= */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* TABS */}

          <div className="flex border-b border-slate-200 px-6 pt-3">
            <TabButton
              active={
                activeTab ===
                'ACCOUNTS'
              }
              onClick={() =>
                setActiveTab(
                  'ACCOUNTS',
                )
              }
            >
              Accounts
            </TabButton>

            <TabButton
              active={
                activeTab ===
                'AUDIT'
              }
              onClick={() =>
                setActiveTab(
                  'AUDIT',
                )
              }
            >
              Audit Log
            </TabButton>
          </div>

          {/* =================================================
              ACCOUNTS TAB
          ================================================= */}

          {activeTab ===
          'ACCOUNTS' ? (
            <>
              <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      'ALL',
                      'ADMIN',
                      'EMPLOYEE',
                      'DRIVER',
                    ] as RoleFilter[]
                  ).map(
                    (role) => (
                      <FilterButton
                        key={
                          role
                        }
                        active={
                          roleFilter ===
                          role
                        }
                        onClick={() =>
                          setRoleFilter(
                            role,
                          )
                        }
                      >
                        {role ===
                        'ALL'
                          ? 'All Roles'
                          : formatStatus(
                              role,
                            )}
                      </FilterButton>
                    ),
                  )}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <select
                    value={
                      statusFilter
                    }
                    onChange={(
                      event,
                    ) =>
                      setStatusFilter(
                        event.target
                          .value as StatusFilter,
                      )
                    }
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
                  >
                    <option value="ALL">
                      All statuses
                    </option>

                    <option value="ACTIVE">
                      Active
                    </option>

                    <option value="INACTIVE">
                      Pending / Inactive
                    </option>
                  </select>

                  <input
                    type="search"
                    value={
                      accountSearch
                    }
                    onChange={(
                      event,
                    ) =>
                      setAccountSearch(
                        event.target
                          .value,
                      )
                    }
                    placeholder="Search name, email or role..."
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-80"
                  />
                </div>
              </div>

              {loadingAccounts ? (
                <LoadingState text="Loading accounts..." />
              ) : filteredUsers.length ===
                0 ? (
                <EmptyState
                  title="No accounts found"
                  description="No Fleet Pulse accounts match the current filters."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1120px] table-fixed text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="w-[270px] px-7 py-4">
                          Account
                        </th>

                        <th className="w-[110px] py-4 pr-5">
                          Role
                        </th>

                        <th className="w-[150px] py-4 pr-5">
                          Status
                        </th>

                        <th className="w-[135px] py-4 pr-5">
                          Phone
                        </th>

                        <th className="w-[145px] py-4 pr-5">
                          Created
                        </th>

                        <th className="w-[175px] py-4 pr-5">
                          Last Updated
                        </th>

                        <th className="w-[230px] py-4 pr-7 text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredUsers.map(
                        (user) => {
                          const currentUser =
                            getCurrentUser()

                          const isSelf =
                            currentUser?.id ===
                            user.id

                          const pendingEmployee =
                            user.role ===
                              'EMPLOYEE' &&
                            user.status ===
                              'INACTIVE'

                          const isPrimaryAdmin =
                            user.role ===
                              'ADMIN' &&
                            user.id ===
                              primaryAdminId

                          return (
                            <tr
                              key={
                                user.id
                              }
                              className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60"
                            >
                              {/* ACCOUNT */}

                              <td className="px-7 py-4">
                                <div className="flex min-w-0 items-center gap-3">
                                  <Avatar
                                    name={
                                      user.name
                                    }
                                  />

                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p
                                        title={
                                          user.name
                                        }
                                        className="truncate font-semibold text-slate-950"
                                      >
                                        {
                                          user.name
                                        }
                                      </p>

                                      {isSelf && (
                                        <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-bold text-blue-600">
                                          YOU
                                        </span>
                                      )}

                                      {isPrimaryAdmin && (
                                        <span className="shrink-0 rounded-full bg-violet-50 px-2 py-0.5 text-[9px] font-bold text-violet-600">
                                          PRIMARY
                                        </span>
                                      )}
                                    </div>

                                    <p
                                      title={
                                        user.email
                                      }
                                      className="mt-1 truncate text-xs text-slate-500"
                                    >
                                      {
                                        user.email
                                      }
                                    </p>
                                  </div>
                                </div>
                              </td>

                              {/* ROLE */}

                              <td className="py-4 pr-5">
                                <RoleBadge
                                  role={
                                    user.role
                                  }
                                />
                              </td>

                              {/* STATUS */}

                              <td className="py-4 pr-5">
                                {pendingEmployee ? (
                                  <span className="inline-flex whitespace-nowrap rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200">
                                    Pending Approval
                                  </span>
                                ) : (
                                  <AccountStatusBadge
                                    status={
                                      user.status
                                    }
                                  />
                                )}
                              </td>

                              {/* PHONE */}

                              <td
                                title={
                                  user.phone ??
                                  ''
                                }
                                className="truncate py-4 pr-5 text-slate-600"
                              >
                                {user.phone ||
                                  '—'}
                              </td>

                              {/* CREATED */}

                              <td className="whitespace-nowrap py-4 pr-5 text-slate-600">
                                {formatDate(
                                  user.createdAt,
                                )}
                              </td>

                              {/* UPDATED */}

                              <td className="py-4 pr-5 text-slate-600">
                                <span className="block leading-5">
                                  {formatDateTime(
                                    user.updatedAt,
                                  )}
                                </span>
                              </td>

                              {/* ACTIONS */}

                              <td className="py-4 pr-7">
                                <div className="flex items-center justify-end gap-2">
                                  {isSelf ? (
                                    <span className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-400">
                                      Current account
                                    </span>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        disabled={
                                          actionLoading ===
                                            user.id ||
                                          deletingUserId ===
                                            user.id
                                        }
                                        onClick={() =>
                                          void handleAccountStatus(
                                            user,
                                          )
                                        }
                                        className={`whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:opacity-50 ${
                                          user.status ===
                                          'ACTIVE'
                                            ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                                            : pendingEmployee
                                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                              : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                                        }`}
                                      >
                                        {actionLoading ===
                                        user.id
                                          ? 'Updating...'
                                          : user.status ===
                                              'ACTIVE'
                                            ? 'Deactivate'
                                            : pendingEmployee
                                              ? 'Approve'
                                              : 'Activate'}
                                      </button>

                                      {isPrimaryAdmin ? (
                                        <span
                                          title="The original administrator cannot be deleted."
                                          className="whitespace-nowrap rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-400"
                                        >
                                          Protected
                                        </span>
                                      ) : (
                                        <button
                                          type="button"
                                          disabled={
                                            deletingUserId ===
                                              user.id ||
                                            actionLoading ===
                                              user.id
                                          }
                                          onClick={() =>
                                            void handleDeleteUser(
                                              user,
                                            )
                                          }
                                          className="whitespace-nowrap rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                                        >
                                          {deletingUserId ===
                                          user.id
                                            ? 'Deleting...'
                                            : 'Delete'}
                                        </button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )
                        },
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <>
              {/* =================================================
                  AUDIT TAB
              ================================================= */}

              <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    System Activity
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Login, logout,
                    registrations,
                    approvals,
                    account changes
                    and deletions.
                  </p>
                </div>

                <form
                  onSubmit={
                    submitAuditSearch
                  }
                  className="flex flex-col gap-3 sm:flex-row"
                >
                  <select
                    value={
                      auditActionFilter
                    }
                    onChange={(
                      event,
                    ) => {
                      setAuditActionFilter(
                        event.target
                          .value as
                          | 'ALL'
                          | AuditAction,
                      )

                      setAuditPage(
                        1,
                      )
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
                  >
                    <option value="ALL">
                      All activity
                    </option>

                    <option value="LOGIN">
                      Login
                    </option>

                    <option value="LOGOUT">
                      Logout
                    </option>

                    <option value="ADMIN_CREATED">
                      Admin Created
                    </option>

                    <option value="ACCOUNT_CREATED">
                      Account Registration
                    </option>

                    <option value="ACCOUNT_UPDATED">
                      Account Updated
                    </option>

                    <option value="ACCOUNT_ACTIVATED">
                      Account Approved / Activated
                    </option>

                    <option value="ACCOUNT_DEACTIVATED">
                      Account Deactivated
                    </option>

                    <option value="ACCOUNT_DELETED">
                      Account Deleted
                    </option>
                  </select>

                  <input
                    type="search"
                    value={
                      auditSearchInput
                    }
                    onChange={(
                      event,
                    ) =>
                      setAuditSearchInput(
                        event.target
                          .value,
                      )
                    }
                    placeholder="Search activity..."
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-72"
                  />

                  <button
                    type="submit"
                    className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Search
                  </button>

                  {(auditSearch ||
                    auditSearchInput) && (
                    <button
                      type="button"
                      onClick={
                        clearAuditSearch
                      }
                      className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      Clear
                    </button>
                  )}
                </form>
              </div>

              {!loadingAudit &&
                auditPagination.total >
                  0 && (
                  <AuditPaginationBar
                    pagination={
                      auditPagination
                    }
                    start={
                      auditStart
                    }
                    end={
                      auditEnd
                    }
                    onPageChange={
                      setAuditPage
                    }
                  />
                )}

              {loadingAudit ? (
                <LoadingState text="Loading audit activity..." />
              ) : auditLogs.length ===
                0 ? (
                <EmptyState
                  title="No audit activity"
                  description="No security events match the current filters."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1100px] table-fixed text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="w-[190px] px-6 py-4">
                          Time
                        </th>

                        <th className="w-[220px] py-4 pr-6">
                          User
                        </th>

                        <th className="w-[180px] py-4 pr-6">
                          Activity
                        </th>

                        <th className="w-[320px] py-4 pr-6">
                          Description
                        </th>

                        <th className="w-[170px] py-4 pr-6">
                          IP Address
                        </th>

                        <th className="w-[170px] py-4 pr-6">
                          Target
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {auditLogs.map(
                        (log) => (
                          <tr
                            key={
                              log.id
                            }
                            className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60"
                          >
                            <td className="px-6 py-4">
                              <p className="font-medium text-slate-700">
                                {formatDateTime(
                                  log.createdAt,
                                )}
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                AUD-
                                {log.id}
                              </p>
                            </td>

                            <td className="py-4 pr-6">
                              {log.actorUser ? (
                                <>
                                  <p className="truncate font-semibold text-slate-800">
                                    {
                                      log.actorUser
                                        .name
                                    }
                                  </p>

                                  <p className="mt-1 truncate text-xs text-slate-500">
                                    {
                                      log.actorUser
                                        .email
                                    }
                                  </p>
                                </>
                              ) : (
                                <span className="text-slate-400">
                                  System
                                </span>
                              )}
                            </td>

                            <td className="py-4 pr-6">
                              <AuditActionBadge
                                action={
                                  log.action
                                }
                              />
                            </td>

                            <td className="py-4 pr-6">
                              <p
                                title={
                                  log.description
                                }
                                className="line-clamp-2 leading-5 text-slate-600"
                              >
                                {
                                  log.description
                                }
                              </p>
                            </td>

                            <td className="py-4 pr-6">
                              <p className="font-mono text-xs text-slate-500">
                                {formatIpAddress(
                                  log.ipAddress,
                                )}
                              </p>
                            </td>

                            <td className="py-4 pr-6">
                              {log.targetUser ? (
                                <>
                                  <p className="truncate font-medium text-slate-700">
                                    {
                                      log.targetUser
                                        .name
                                    }
                                  </p>

                                  <p className="mt-1 text-xs text-slate-400">
                                    {formatStatus(
                                      log.targetUser
                                        .role,
                                    )}
                                  </p>
                                </>
                              ) : (
                                <span className="text-slate-400">
                                  —
                                </span>
                              )}
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </section>
      </section>

      {/* =================================================
          CREATE ADMIN MODAL
      ================================================= */}

      {isAdminModalOpen && (
        <CreateAdminModal
          formData={
            adminForm
          }
          error={
            adminError
          }
          saving={
            adminSaving
          }
          onChange={(
            field,
            value,
          ) => {
            setAdminForm(
              (current) => ({
                ...current,
                [field]:
                  value,
              }),
            )

            setAdminError('')
          }}
          onClose={
            closeAdminModal
          }
          onSubmit={
            handleCreateAdmin
          }
        />
      )}
    </>
  )
}

/* =========================================================
   AVATAR
========================================================= */

function Avatar({
  name,
}: {
  name: string
}) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
      {getInitials(
        name,
      )}
    </div>
  )
}

/* =========================================================
   AUDIT PAGINATION
========================================================= */

function AuditPaginationBar({
  pagination,
  start,
  end,
  onPageChange,
}: {
  pagination:
    AuditPagination

  start: number
  end: number

  onPageChange: (
    page: number,
  ) => void
}) {
  const pages =
    getVisiblePages(
      pagination.page,
      pagination.totalPages,
    )

  return (
    <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs font-medium text-slate-500">
        Showing{' '}
        <span className="font-semibold text-slate-700">
          {start}–{end}
        </span>{' '}
        of{' '}
        <span className="font-semibold text-slate-700">
          {pagination.total.toLocaleString()}
        </span>{' '}
        events
      </p>

      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          disabled={
            !pagination.hasPreviousPage
          }
          onClick={() =>
            onPageChange(
              pagination.page -
                1,
            )
          }
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>

        {pages.map(
          (page) => (
            <button
              key={page}
              type="button"
              onClick={() =>
                onPageChange(
                  page,
                )
              }
              className={`min-w-9 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                page ===
                pagination.page
                  ? 'bg-slate-950 text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {page}
            </button>
          ),
        )}

        <button
          type="button"
          disabled={
            !pagination.hasNextPage
          }
          onClick={() =>
            onPageChange(
              pagination.page +
                1,
            )
          }
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  )
}

function getVisiblePages(
  currentPage: number,
  totalPages: number,
): number[] {
  if (
    totalPages <= 5
  ) {
    return Array.from(
      {
        length:
          totalPages,
      },
      (_, index) =>
        index + 1,
    )
  }

  let start =
    Math.max(
      1,
      currentPage - 2,
    )

  let end =
    Math.min(
      totalPages,
      start + 4,
    )

  if (
    end - start <
    4
  ) {
    start =
      Math.max(
        1,
        end - 4,
      )
  }

  return Array.from(
    {
      length:
        end -
        start +
        1,
    },
    (_, index) =>
      start + index,
  )
}

/* =========================================================
   CREATE ADMIN MODAL
========================================================= */

function CreateAdminModal({
  formData,
  error,
  saving,
  onChange,
  onClose,
  onSubmit,
}: {
  formData:
    AdminForm

  error:
    string

  saving:
    boolean

  onChange: (
    field:
      keyof AdminForm,
    value: string,
  ) => void

  onClose:
    () => void

  onSubmit: (
    event:
      React.FormEvent<HTMLFormElement>,
  ) => void
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-[2px]">
      <div className="my-8 w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-200">
                Access Management
              </p>

              <h2 className="mt-1 text-xl font-semibold">
                Create Administrator
              </h2>

              <p className="mt-1 text-sm text-slate-300">
                Create another
                authorised Fleet
                Pulse administrator.
              </p>
            </div>

            <button
              type="button"
              onClick={
                onClose
              }
              disabled={
                saving
              }
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xl transition hover:bg-white/20 disabled:opacity-50"
            >
              ×
            </button>
          </div>
        </div>

        <form
          onSubmit={
            onSubmit
          }
        >
          <div className="space-y-5 p-6">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-800">
              Administrator accounts
              have access to Fleet
              Pulse management and
              security features.
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Full Name">
                <input
                  type="text"
                  value={
                    formData.name
                  }
                  onChange={(
                    event,
                  ) =>
                    onChange(
                      'name',
                      event.target
                        .value,
                    )
                  }
                  placeholder="Administrator name"
                  className={
                    inputClass
                  }
                  required
                />
              </FormField>

              <FormField label="Email Address">
                <input
                  type="email"
                  value={
                    formData.email
                  }
                  onChange={(
                    event,
                  ) =>
                    onChange(
                      'email',
                      event.target
                        .value,
                    )
                  }
                  placeholder="admin@company.com"
                  className={
                    inputClass
                  }
                  required
                />
              </FormField>

              <FormField label="Phone Number">
                <input
                  type="tel"
                  value={
                    formData.phone
                  }
                  onChange={(
                    event,
                  ) =>
                    onChange(
                      'phone',
                      event.target
                        .value,
                    )
                  }
                  placeholder="Optional"
                  className={
                    inputClass
                  }
                />
              </FormField>

              <FormField label="Role">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                  Administrator
                </div>
              </FormField>

              <FormField label="Password">
                <input
                  type="password"
                  value={
                    formData.password
                  }
                  onChange={(
                    event,
                  ) =>
                    onChange(
                      'password',
                      event.target
                        .value,
                    )
                  }
                  placeholder="At least 8 characters"
                  className={
                    inputClass
                  }
                  required
                />
              </FormField>

              <FormField label="Confirm Password">
                <input
                  type="password"
                  value={
                    formData.confirmPassword
                  }
                  onChange={(
                    event,
                  ) =>
                    onChange(
                      'confirmPassword',
                      event.target
                        .value,
                    )
                  }
                  placeholder="Repeat password"
                  className={
                    inputClass
                  }
                  required
                />
              </FormField>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-5">
            <button
              type="button"
              onClick={
                onClose
              }
              disabled={
                saving
              }
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                saving
              }
              className="rounded-xl bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving
                ? 'Creating...'
                : 'Create Administrator'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* =========================================================
   SMALL UI COMPONENTS
========================================================= */

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children:
    React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`border-b-2 px-4 py-4 text-sm font-semibold transition ${
        active
          ? 'border-slate-950 text-slate-950'
          : 'border-transparent text-slate-400 hover:text-slate-700'
      }`}
    >
      {children}
    </button>
  )
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children:
    React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
        active
          ? 'bg-slate-950 text-white'
          : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
      }`}
    >
      {children}
    </button>
  )
}

function HeroMetric({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="min-w-[145px] rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3">
      <p className="text-xs text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-lg font-semibold text-white">
        {value}
      </p>
    </div>
  )
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string
  value: number

  tone:
    | 'slate'
    | 'blue'
    | 'green'
    | 'amber'
}) {
  const styles = {
    slate:
      'bg-slate-100 text-slate-700',

    blue:
      'bg-blue-50 text-blue-700',

    green:
      'bg-emerald-50 text-emerald-700',

    amber:
      'bg-amber-50 text-amber-700',
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-2xl font-semibold text-slate-950">
            {value}
          </p>
        </div>

        <div
          className={`rounded-xl px-3 py-2 text-xs font-bold ${styles[tone]}`}
        >
          {value}
        </div>
      </div>
    </div>
  )
}

function RoleBadge({
  role,
}: {
  role: UserRole
}) {
  const styles:
    Record<
      UserRole,
      string
    > = {
    ADMIN:
      'bg-violet-50 text-violet-700 ring-1 ring-violet-200',

    EMPLOYEE:
      'bg-blue-50 text-blue-700 ring-1 ring-blue-200',

    DRIVER:
      'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  }

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${styles[role]}`}
    >
      {formatStatus(
        role,
      )}
    </span>
  )
}

function AccountStatusBadge({
  status,
}: {
  status:
    UserStatus
}) {
  const style =
    status === 'ACTIVE'
      ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
      : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${style}`}
    >
      {formatStatus(
        status,
      )}
    </span>
  )
}

function AuditActionBadge({
  action,
}: {
  action:
    AuditAction
}) {
  const styles:
    Record<
      AuditAction,
      string
    > = {
    LOGIN:
      'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',

    LOGOUT:
      'bg-slate-100 text-slate-700 ring-1 ring-slate-200',

    ACCOUNT_CREATED:
      'bg-blue-50 text-blue-700 ring-1 ring-blue-200',

    ACCOUNT_UPDATED:
      'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200',

    ACCOUNT_ACTIVATED:
      'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',

    ACCOUNT_DEACTIVATED:
      'bg-red-50 text-red-700 ring-1 ring-red-200',

    ACCOUNT_DELETED:
      'bg-rose-50 text-rose-700 ring-1 ring-rose-200',

    ADMIN_CREATED:
      'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
  }

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${styles[action]}`}
    >
      {formatStatus(
        action,
      )}
    </span>
  )
}

function FormField({
  label,
  children,
}: {
  label: string
  children:
    React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>

      {children}
    </label>
  )
}

function LoadingState({
  text,
}: {
  text: string
}) {
  return (
    <div className="p-14 text-center">
      <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

      <p className="mt-4 text-sm text-slate-500">
        {text}
      </p>
    </div>
  )
}

function EmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="p-14 text-center">
      <p className="font-semibold text-slate-700">
        {title}
      </p>

      <p className="mt-1 text-sm text-slate-500">
        {description}
      </p>
    </div>
  )
}

const inputClass =
  'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

/* =========================================================
   HELPERS
========================================================= */

function getInitials(
  name: string,
) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(
        (part) =>
          part[0]
            ?.toUpperCase(),
      )
      .join('') ||
    'US'
  )
}

function formatStatus(
  value: string,
) {
  return value
    .replaceAll(
      '_',
      ' ',
    )
    .toLowerCase()
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
    )
}

function capitalize(
  value: string,
) {
  return (
    value.charAt(0)
      .toUpperCase() +
    value.slice(1)
  )
}

function formatDate(
  value: string,
) {
  const date =
    new Date(value)

  return Number.isNaN(
    date.getTime(),
  )
    ? value
    : date.toLocaleDateString(
        undefined,
        {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        },
      )
}

function formatDateTime(
  value: string,
) {
  const date =
    new Date(value)

  return Number.isNaN(
    date.getTime(),
  )
    ? value
    : date.toLocaleString(
        undefined,
        {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        },
      )
}

function formatIpAddress(
  value:
    | string
    | null,
) {
  if (!value) {
    return 'Unavailable'
  }

  if (
    value === '::1' ||
    value ===
      '::ffff:127.0.0.1'
  ) {
    return 'Localhost'
  }

  return value.replace(
    '::ffff:',
    '',
  )
}

function getApiErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (
    !axios.isAxiosError(
      error,
    )
  ) {
    return fallback
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
    return 'Unable to connect to the server.'
  }

  return fallback
}

export default UsersView