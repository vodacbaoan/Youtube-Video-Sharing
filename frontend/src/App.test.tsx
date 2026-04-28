import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import App from './App'

vi.mock('./api/auth', () => ({
  getCurrentUser: vi.fn().mockRejectedValue(new Error('Not signed in')),
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
}))

vi.mock('./api/videos', () => ({
  listVideos: vi.fn().mockResolvedValue({ videos: [] }),
  shareVideo: vi.fn(),
}))

vi.mock('./api/cable', () => ({
  cable: {
    subscriptions: {
      create: vi.fn(() => ({
        unsubscribe: vi.fn(),
      })),
    },
  },
}))

describe('App', () => {
  it('shows the empty state when no videos are returned', async () => {
    render(<App />)

    expect(await screen.findByText('No videos shared yet.')).toBeInTheDocument()
  })

  it('shows the password confirmation field after switching to register mode', async () => {
    render(<App />)

    expect(screen.queryByPlaceholderText('confirm password')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Register' }))

    expect(await screen.findByPlaceholderText('confirm password')).toBeInTheDocument()
  })

  it('shows a mismatch error when register passwords do not match', async () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Register' }))

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
})
