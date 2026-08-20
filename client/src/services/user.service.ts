import api from '../api/axios'

import type {
  CreateAdminData,
  CreateUserData,
  UpdateUserData,
  User,
} from '../types/user'

export async function getUsers(): Promise<
  User[]
> {
  const response =
    await api.get('/users')

  return response.data
}

export async function getUserById(
  id: number,
): Promise<User> {
  const response =
    await api.get(
      `/users/${id}`,
    )

  return response.data
}

export async function createUser(
  data: CreateUserData,
): Promise<User> {
  const response =
    await api.post(
      '/users',
      data,
    )

  return response.data
}

export async function createAdmin(
  data: CreateAdminData,
): Promise<User> {
  const response =
    await api.post(
      '/users/admin',
      data,
    )

  return response.data
}

export async function updateUser(
  id: number,
  data: UpdateUserData,
): Promise<User> {
  const response =
    await api.patch(
      `/users/${id}`,
      data,
    )

  return response.data
}

export async function activateUser(
  id: number,
  actorUserId: number,
): Promise<User> {
  const response =
    await api.patch(
      `/users/${id}/activate`,
      {
        actorUserId,
      },
    )

  return response.data
}

export async function deactivateUser(
  id: number,
  actorUserId: number,
): Promise<User> {
  const response =
    await api.patch(
      `/users/${id}/deactivate`,
      {
        actorUserId,
      },
    )

  return response.data
}

export async function deleteUser(
  id: number,
): Promise<void> {
  await api.delete(
    `/users/${id}`,
  )
}