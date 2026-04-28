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
})
