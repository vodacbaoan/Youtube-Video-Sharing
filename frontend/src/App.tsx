import { type FormEvent, useEffect, useState } from 'react'
import { getCurrentUser, login, logout, register, type User } from './api/auth'
import { cable } from './api/cable'
import { listVideos, shareVideo, type Video } from './api/videos'
import './App.css'

type VideoShareNotification = {
  title: string
  shared_by: string
}

function App() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [videos, setVideos] = useState<Video[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [showShareForm, setShowShareForm] = useState(false)
  const [message, setMessage] = useState('')
  const [notification, setNotification] = useState<VideoShareNotification | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let isActive = true

    getCurrentUser()
      .then(({ user }) => {
        if (isActive) setUser(user)
      })
      .catch(() => undefined)

    listVideos()
      .then(({ videos }) => {
        if (isActive) setVideos(videos)
      })
      .catch((error) => {
        if (isActive) setMessage(error instanceof Error ? error.message : 'Could not load videos')
      })

    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    if (!user) return

    const subscription = cable.subscriptions.create<VideoShareNotification>(
      { channel: 'VideoSharesChannel' },
      {
        received(data) {
          if (data.shared_by === user.email) return

          setNotification(data)
          void listVideos()
            .then(({ videos }) => setVideos(videos))
            .catch(() => undefined)
        },
      },
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setMessage('')

    try {
      if (mode === 'register' && password !== passwordConfirmation) {
        throw new Error("Password confirmation doesn't match Password")
      }

      const result =
        mode === 'register'
          ? await register(email, password, passwordConfirmation)
          : await login(email, password)

      setUser(result.user)
      setPassword('')
      setPasswordConfirmation('')
      setMessage(`Signed in as ${result.user.email}`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Request failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  function switchMode(nextMode: 'login' | 'register') {
    setMode(nextMode)
    setPassword('')
    setPasswordConfirmation('')
    setMessage('')
  }

  async function handleLogout() {
    setIsSubmitting(true)
    setMessage('')

    try {
      await logout()
      setUser(null)
      setShowShareForm(false)
      setNotification(null)
      setMessage('Logged out')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Request failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleShare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setMessage('')

    try {
      const result = await shareVideo(youtubeUrl)
      setVideos((currentVideos) => [result.video, ...currentVideos])
      setYoutubeUrl('')
      setShowShareForm(false)
      setMessage(`Shared "${result.video.title}"`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Request failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  function formatDate(value: string) {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark">FM</span>
          <h1>Funny Movies</h1>
        </div>

        {user ? (
          <div className="auth-row" aria-label="User session">
            <span>Welcome {user.email}</span>
            <button
              type="button"
              onClick={() => setShowShareForm((isVisible) => !isVisible)}
              disabled={isSubmitting}
            >
              Share a movie
            </button>
            <button type="button" onClick={handleLogout} disabled={isSubmitting}>
              Logout
            </button>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <input
              type="password"
              placeholder="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            {mode === 'register' && (
              <input
                type="password"
                placeholder="confirm password"
                value={passwordConfirmation}
                onChange={(event) => setPasswordConfirmation(event.target.value)}
              />
            )}
            <button type="submit" disabled={isSubmitting}>
              {mode === 'register' ? 'Register' : 'Login'}
            </button>
            <button
              type="button"
              onClick={() => switchMode(mode === 'register' ? 'login' : 'register')}
              disabled={isSubmitting}
            >
              {mode === 'register' ? 'Back to login' : 'Register'}
            </button>
          </form>
        )}
      </header>

      {message && <p className="message">{message}</p>}

      {notification && (
        <div className="notification-banner" role="status">
          <span>
            {notification.shared_by} shared "{notification.title}"
          </span>
          <button type="button" onClick={() => setNotification(null)}>
            Dismiss
          </button>
        </div>
      )}

      {user && showShareForm && (
        <form className="share-form" onSubmit={handleShare}>
          <label htmlFor="youtube-url">YouTube URL</label>
          <input
            id="youtube-url"
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            value={youtubeUrl}
            onChange={(event) => setYoutubeUrl(event.target.value)}
          />
          <button type="submit" disabled={isSubmitting}>
            Share
          </button>
        </form>
      )}

      <section className="content" aria-label="Shared videos">
        {videos.length === 0 ? (
          <p className="empty-state">No videos shared yet.</p>
        ) : (
          <div className="video-list">
            {videos.map((video) => (
              <article className="video-item" key={video.id}>
                <iframe
                  src={video.embed_url}
                  title={video.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
                <div className="video-info">
                  <h2>{video.title}</h2>
                  <p>Shared by: {video.shared_by}</p>
                  <p>{formatDate(video.created_at)}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default App
