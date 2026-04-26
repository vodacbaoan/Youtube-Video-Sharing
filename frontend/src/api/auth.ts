import { apiRequest } from './client'

export type User = {
  id: number
  email: string
}

type AuthResponse = {
  user: User
}

export function register(
  email: string,
  password: string,
  passwordConfirmation: string,
): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/api/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, password_confirmation: passwordConfirmation }),
  })
}

export function login(email: string, password: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/api/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function logout(): Promise<void> {
  return apiRequest<void>('/api/logout', { method: 'DELETE' })
}

export function getCurrentUser(): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/api/me')
}
