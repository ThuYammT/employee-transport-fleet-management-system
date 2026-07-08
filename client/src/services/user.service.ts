import api from '../api/axios'
import type { User, CreateUserData, UpdateUserData } from '../types/user'

export async function getUsers(): Promise<User[]> {
  const response = await api.get('/users')
  return response.data
}

export async function createUser(data: CreateUserData): Promise<User> {
  const response = await api.post('/users', data)
  return response.data
}

export async function updateUser(
  id: number,
  data: UpdateUserData,
): Promise<User> {
  const response = await api.patch(`/users/${id}`, data)
  return response.data
}

export async function deleteUser(id: number): Promise<void> {
  await api.delete(`/users/${id}`)
}