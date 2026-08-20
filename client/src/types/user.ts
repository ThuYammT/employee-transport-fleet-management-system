export type UserRole =
  | 'ADMIN'
  | 'EMPLOYEE'
  | 'DRIVER'

export type UserStatus =
  | 'ACTIVE'
  | 'INACTIVE'

export type User = {
  id: number
  name: string
  email: string
  role: UserRole
  phone?: string | null
  status: UserStatus
  createdAt: string
  updatedAt: string
}

export type CreateUserData = {
  name: string
  email: string
  password: string
  role: UserRole
  phone?: string
}

export type UpdateUserData =
  Partial<CreateUserData>

export type CreateAdminData = {
  name: string
  email: string
  password: string
  phone?: string
  actorUserId: number
}