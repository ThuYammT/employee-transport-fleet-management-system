import type {
  UserRole,
  UserStatus,
} from './user'

export type AuthUser = {
  id: number
  name: string
  email: string
  role: UserRole
  phone?: string
  status: UserStatus
  createdAt: string
  updatedAt: string
}

export type LoginData = {
  email: string
  password: string
}

export type RegisterData = {
  name: string
  email: string
  password: string
  phone?: string
}

export type AdminSetupStatus = {
  adminSetupRequired: boolean
  setupConfigured: boolean
}

export type SetupAdminData = {
  name: string
  email: string
  password: string
  phone?: string
  setupKey: string
}

export type SetupAdminResponse = AuthUser & {
  message: string
}