import type {
  UserRole,
  UserStatus,
} from './user'

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'ACCOUNT_CREATED'
  | 'ACCOUNT_UPDATED'
  | 'ACCOUNT_ACTIVATED'
  | 'ACCOUNT_DEACTIVATED'
  | 'ADMIN_CREATED'

export type AuditUser = {
  id: number
  name: string
  email: string
  role: UserRole
  status: UserStatus
}

export type AuditLog = {
  id: number

  actorUserId:
    | number
    | null

  targetUserId:
    | number
    | null

  action:
    AuditAction

  description:
    string

  ipAddress:
    | string
    | null

  userAgent:
    | string
    | null

  actorUser:
    | AuditUser
    | null

  targetUser:
    | AuditUser
    | null

  createdAt:
    string
}

export type AuditPagination = {
  page: number
  limit: number
  total: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export type AuditLogResponse = {
  data: AuditLog[]

  pagination:
    AuditPagination
}

export type AuditLogQuery = {
  page?: number
  limit?: number

  action?:
    | AuditAction
    | 'ALL'

  search?: string
}