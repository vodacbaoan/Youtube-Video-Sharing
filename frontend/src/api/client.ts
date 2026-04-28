export const API_BASE = import.meta.env.VITE_API_URL ?? `http://${window.location.hostname}:3000`

const DEFAULT_TIMEOUT_MS = 10_000

type ApiRequestOptions = RequestInit & {
  timeoutMs?: number
}

export async function apiRequest<T>(
  path: string,
  { timeoutMs = DEFAULT_TIMEOUT_MS, ...options }: ApiRequestOptions = {},
): Promise<T> {
  const controller = new AbortController()
  const timeoutId = timeoutMs > 0 ? globalThis.setTimeout(() => controller.abort(), timeoutMs) : null

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      credentials: 'include',
      ...options,
      signal: controller.signal,
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
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms`)
    }

    if (error instanceof TypeError) {
      throw new Error('Backend is unreachable')
    }

    throw error
  } finally {
    if (timeoutId !== null) {
      globalThis.clearTimeout(timeoutId)
    }
  }
}
