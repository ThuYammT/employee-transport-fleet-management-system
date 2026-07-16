import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import type { UserRole } from '../types/user'
import {
  getCurrentUser,
  getPortalPath,
} from '../utils/user-session'

type RoleRouteProps = {
  allowedRole: UserRole
  children: ReactNode
}

function RoleRoute({
  allowedRole,
  children,
}: RoleRouteProps) {
  const currentUser = getCurrentUser()

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  if (currentUser.status !== 'ACTIVE') {
    return <Navigate to="/login" replace />
  }

  if (currentUser.role !== allowedRole) {
    return (
      <Navigate
        to={getPortalPath(currentUser.role)}
        replace
      />
    )
  }

  return <>{children}</>
}

export default RoleRoute