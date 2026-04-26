export type User = {
  id: number
  email: string
}

type AuthResponse = {
  user: User
}

const API_BASE = import.meta.env.VITE_API_URL ?? `http://${window.location.hostname}:3000`

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (response.status === 204) {
    return undefined as T
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = Array.isArray(data.errors)
      ? data.errors.join(', ')
      : data.error || 'Request failed'
    throw new Error(message)
  }

  return data as T
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
