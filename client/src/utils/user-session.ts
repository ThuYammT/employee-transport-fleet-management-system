import type { AuthUser } from '../types/auth'
import type { UserRole } from '../types/user'

const USER_SESSION_KEY = 'fleetManagementUser'

export function saveCurrentUser(user: AuthUser): void {
  localStorage.setItem(
    USER_SESSION_KEY,
    JSON.stringify(user),
  )
}

export function getCurrentUser(): AuthUser | null {
  const storedUser = localStorage.getItem(
    USER_SESSION_KEY,
  )

  if (!storedUser) {
    return null
  }

  try {
    const parsedUser = JSON.parse(
      storedUser,
    ) as Partial<AuthUser>

    if (
      typeof parsedUser.id !== 'number' ||
      parsedUser.id <= 0 ||
      typeof parsedUser.name !== 'string' ||
      typeof parsedUser.email !== 'string' ||
      !isUserRole(parsedUser.role) ||
      !isUserStatus(parsedUser.status)
    ) {
      clearCurrentUser()
      return null
    }

    return parsedUser as AuthUser
  } catch {
    clearCurrentUser()
    return null
  }
}

export function clearCurrentUser(): void {
  localStorage.removeItem(USER_SESSION_KEY)
}

export function isLoggedIn(): boolean {
  return getCurrentUser() !== null
}

export function hasRole(role: UserRole): boolean {
  return getCurrentUser()?.role === role
}

export function getPortalPath(
  role: UserRole,
): string {
  switch (role) {
    case 'ADMIN':
      return '/admin'

    case 'DRIVER':
      return '/driver'

    case 'EMPLOYEE':
      return '/employee'

    default:
      return '/login'
  }
}

function isUserRole(
  value: unknown,
): value is UserRole {
  return (
    value === 'ADMIN' ||
    value === 'DRIVER' ||
    value === 'EMPLOYEE'
  )
}

function isUserStatus(
  value: unknown,
): value is 'ACTIVE' | 'INACTIVE' {
  return value === 'ACTIVE' || value === 'INACTIVE'
}