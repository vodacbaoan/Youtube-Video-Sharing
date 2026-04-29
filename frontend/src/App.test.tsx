import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  listVideos: vi.fn(),
  shareVideo: vi.fn(),
  unsubscribe: vi.fn(),
  createSubscription: vi.fn(),
}))

vi.mock('./api/auth', () => ({
  getCurrentUser: mocks.getCurrentUser,
  login: mocks.login,
  logout: mocks.logout,
  register: mocks.register,
}))

vi.mock('./api/videos', () => ({
  listVideos: mocks.listVideos,
  shareVideo: mocks.shareVideo,
}))

vi.mock('./api/cable', () => ({
  cable: {
    subscriptions: {
      create: mocks.createSubscription,
    },
  },
}))

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getCurrentUser.mockRejectedValue(new Error('Not signed in'))
    mocks.listVideos.mockResolvedValue({ videos: [] })
    mocks.createSubscription.mockImplementation(() => ({
      unsubscribe: mocks.unsubscribe,
    }))
  })

  it('shows the empty state when no videos are returned', async () => {
    render(<App />)

    expect(await screen.findByText('No videos shared yet.')).toBeInTheDocument()
  })

  it('restores the logged-in user on load and subscribes for notifications', async () => {
    mocks.getCurrentUser.mockResolvedValue({
      user: { id: 1, email: 'person@example.com' },
    })

    render(<App />)

    expect(await screen.findByText('Welcome person@example.com')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Share a movie' })).toBeInTheDocument()

    await waitFor(() => {
      expect(mocks.createSubscription).toHaveBeenCalledWith(
        { channel: 'VideoSharesChannel' },
        expect.objectContaining({ received: expect.any(Function) }),
      )
    })
  })

  it('shows the password confirmation field after switching to register mode', async () => {
    render(<App />)

    await screen.findByText('No videos shared yet.')
    expect(screen.queryByPlaceholderText('confirm password')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByPlaceholderText('confirm password')).toBeInTheDocument()
  })

  it('shows a mismatch error when register passwords do not match', async () => {
    render(<App />)

    await screen.findByText('No videos shared yet.')
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

    fireEvent.change(screen.getByPlaceholderText('email'), {
      target: { value: 'movie@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('password'), {
      target: { value: 'password123' },
    })
    fireEvent.change(await screen.findByPlaceholderText('confirm password'), {
      target: { value: 'different-password' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Register' }))

    expect(await screen.findByText("Password confirmation doesn't match Password")).toBeInTheDocument()
  })

  it('adds the shared video to the list after a successful share', async () => {
    mocks.getCurrentUser.mockResolvedValue({
      user: { id: 1, email: 'person@example.com' },
    })
    mocks.shareVideo.mockResolvedValue({
      video: {
        id: 1,
        title: 'Test video',
        youtube_url: 'https://youtu.be/dQw4w9WgXcQ',
        youtube_video_id: 'dQw4w9WgXcQ',
        embed_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        thumbnail_url: 'https://img.youtube.com/test.jpg',
        shared_by: 'person@example.com',
        created_at: '2026-04-29T00:00:00Z',
      },
    })

    render(<App />)

    expect(await screen.findByText('Welcome person@example.com')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Share a movie' }))
    fireEvent.change(screen.getByLabelText('YouTube URL'), {
      target: { value: 'https://youtu.be/dQw4w9WgXcQ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Share' }))

    await screen.findByText('Shared "Test video"')
    expect(await screen.findByText('Test video')).toBeInTheDocument()
    expect(screen.getByText('Shared by: person@example.com')).toBeInTheDocument()
    expect(screen.queryByLabelText('YouTube URL')).not.toBeInTheDocument()
    expect(mocks.shareVideo).toHaveBeenCalledWith('https://youtu.be/dQw4w9WgXcQ')
  })

  it('shows a notification and refreshes videos when another user shares', async () => {
    mocks.getCurrentUser.mockResolvedValue({
      user: { id: 1, email: 'person@example.com' },
    })
    mocks.listVideos
      .mockResolvedValueOnce({ videos: [] })
      .mockResolvedValueOnce({
        videos: [
          {
            id: 2,
            title: 'Other video',
            youtube_url: 'https://youtu.be/aaaaaaaaaaa',
            youtube_video_id: 'aaaaaaaaaaa',
            embed_url: 'https://www.youtube.com/embed/aaaaaaaaaaa',
            thumbnail_url: null,
            shared_by: 'other@example.com',
            created_at: '2026-04-29T00:00:00Z',
          },
        ],
      })

    render(<App />)

    expect(await screen.findByText('Welcome person@example.com')).toBeInTheDocument()
    await waitFor(() => expect(mocks.createSubscription).toHaveBeenCalled())

    const subscriptionHandlers = mocks.createSubscription.mock.calls[0]?.[1]

    await act(async () => {
      subscriptionHandlers.received({
        shared_by: 'other@example.com',
        title: 'Other video',
      })
    })

    expect(await screen.findByText('other@example.com shared "Other video"')).toBeInTheDocument()
    expect(await screen.findByText('Shared by: other@example.com')).toBeInTheDocument()
    expect(mocks.listVideos).toHaveBeenCalledTimes(2)
  })

  it('ignores notifications for videos shared by the current user', async () => {
    mocks.getCurrentUser.mockResolvedValue({
      user: { id: 1, email: 'person@example.com' },
    })

    render(<App />)

    expect(await screen.findByText('Welcome person@example.com')).toBeInTheDocument()
    await waitFor(() => expect(mocks.createSubscription).toHaveBeenCalled())

    const subscriptionHandlers = mocks.createSubscription.mock.calls[0]?.[1]

    act(() => {
      subscriptionHandlers.received({
        shared_by: 'person@example.com',
        title: 'Own video',
      })
    })

    expect(screen.queryByText('person@example.com shared "Own video"')).not.toBeInTheDocument()
    expect(mocks.listVideos).toHaveBeenCalledTimes(1)
  })
})
