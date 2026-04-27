export const API_BASE = import.meta.env.VITE_API_URL ?? `http://${window.location.hostname}:3000`

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
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
