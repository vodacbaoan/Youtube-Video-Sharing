import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiRequest } from './client'

describe('apiRequest', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns parsed JSON when the request succeeds', async () => {
    const responseBody = { videos: [{ id: 1, title: 'Funny clip' }] }

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(responseBody),
    } as unknown as Response)

    await expect(apiRequest('/api/videos')).resolves.toEqual(responseBody)
  })

  it('returns undefined for 204 responses', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 204,
      json: vi.fn(),
    } as unknown as Response)

    await expect(apiRequest('/api/logout', { method: 'DELETE' })).resolves.toBeUndefined()
  })

  it('maps AbortError to a timeout message', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new DOMException('Aborted', 'AbortError'))

    await expect(apiRequest('/api/videos', { timeoutMs: 1500 })).rejects.toThrow(
      'Request timed out after 1500ms',
    )
  })

  it('maps TypeError to backend unreachable', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(apiRequest('/api/videos')).rejects.toThrow('Backend is unreachable')
  })

  it('surfaces API error messages from the response body', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 422,
      json: vi.fn().mockResolvedValue({ errors: ['Invalid YouTube URL'] }),
    } as unknown as Response)

    await expect(apiRequest('/api/videos')).rejects.toThrow('Invalid YouTube URL')
  })
})
