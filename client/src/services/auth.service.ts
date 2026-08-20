import api from '../api/axios'
import type {
  AdminSetupStatus,
  AuthUser,
  LoginData,
  RegisterData,
  SetupAdminData,
  SetupAdminResponse,
} from '../types/auth'

export async function register(
  data: RegisterData,
): Promise<AuthUser> {
  const response = await api.post<AuthUser>(
    '/auth/register',
    data,
  )

  return response.data
}

export async function login(
  data: LoginData,
): Promise<AuthUser> {
  const response = await api.post<AuthUser>(
    '/auth/login',
    data,
  )

  return response.data
}

export async function getAdminSetupStatus(): Promise<AdminSetupStatus> {
  const response = await api.get<AdminSetupStatus>(
    '/auth/setup-status',
  )

  return response.data
}

export async function setupFirstAdmin(
  data: SetupAdminData,
): Promise<SetupAdminResponse> {
  const response =
    await api.post<SetupAdminResponse>(
      '/auth/setup-admin',
      data,
    )

  return response.data
}