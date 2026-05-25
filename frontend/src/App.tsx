import { type FormEvent, useEffect, useState } from 'react'
import { getCurrentUser, login, logout, register, type User } from './api/auth'
import { cable } from './api/cable'
import {
  addVideoToCollection,
  createCollection,
  listCollections,
  removeVideoFromCollection,
  type Collection,
} from './api/collections'
import { listVideos, shareVideo, type Video } from './api/videos'
import './App.css'

type VideoShareNotification = {
  title: string
  shared_by: string
}

type MessageTone = 'error' | 'success'

function App() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [collectionTitle, setCollectionTitle] = useState('')
  const [selectedCollectionId, setSelectedCollectionId] = useState('')
  const [videos, setVideos] = useState<Video[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [showShareForm, setShowShareForm] = useState(false)
  const [message, setMessage] = useState('')
  const [messageTone, setMessageTone] = useState<MessageTone>('error')
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
        if (isActive) {
          setMessageTone('error')
          setMessage(error instanceof Error ? error.message : 'Could not load videos')
        }
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

  useEffect(() => {
    if (!user) return

    let isActive = true

    listCollections()
      .then(({ collections }) => {
        if (!isActive) return

        setCollections(collections)
        setSelectedCollectionId(collections[0]?.id.toString() ?? '')
      })
      .catch((error) => {
        if (isActive) {
          setMessageTone('error')
          setMessage(error instanceof Error ? error.message : 'Could not load collections')
        }
      })

    return () => {
      isActive = false
    }
  }, [user])

  useEffect(() => {
    if (!message || messageTone !== 'success') return

    const timeoutId = window.setTimeout(() => {
      setMessage('')
    }, 3500)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [message, messageTone])

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
    } catch (error) {
      setMessageTone('error')
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
      setCollections([])
      setSelectedCollectionId('')
    } catch (error) {
      setMessageTone('error')
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
      setMessageTone('success')
      setMessage(`Shared "${result.video.title}"`)
    } catch (error) {
      setMessageTone('error')
      setMessage(error instanceof Error ? error.message : 'Request failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleCreateCollection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setMessage('')

    try {
      const result = await createCollection(collectionTitle.trim())
      setCollections((currentCollections) => [result.collection, ...currentCollections])
      setCollectionTitle('')
      setSelectedCollectionId(result.collection.id.toString())
      setMessageTone('success')
      setMessage(`Created "${result.collection.title}"`)
    } catch (error) {
      setMessageTone('error')
      setMessage(error instanceof Error ? error.message : 'Request failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleAddVideoToCollection(videoId: number) {
    if (!selectedCollectionId) return

    setIsSubmitting(true)
    setMessage('')

    try {
      const result = await addVideoToCollection(Number(selectedCollectionId), videoId)
      setCollections((currentCollections) =>
        currentCollections.map((collection) =>
          collection.id === result.collection.id ? result.collection : collection,
        ),
      )
      setMessageTone('success')
      setMessage(`Added to "${result.collection.title}"`)
    } catch (error) {
      setMessageTone('error')
      setMessage(error instanceof Error ? error.message : 'Request failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleRemoveVideoFromCollection(collectionId: number, videoId: number) {
    setIsSubmitting(true)
    setMessage('')

    try {
      await removeVideoFromCollection(collectionId, videoId)
      setCollections((currentCollections) =>
        currentCollections.map((collection) =>
          collection.id === collectionId
            ? {
                ...collection,
                videos: collection.videos.filter((video) => video.id !== videoId),
              }
            : collection,
        ),
      )
    } catch (error) {
      setMessageTone('error')
      setMessage(error instanceof Error ? error.message : 'Request failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  function formatDate(value: string) {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Ho_Chi_Minh',
    })

    const parts = formatter.formatToParts(new Date(value))
    const getPart = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((part) => part.type === type)?.value ?? ''

    return `${getPart('day')}/${getPart('month')}/${getPart('year')} ${getPart('hour')}:${getPart('minute')} ${getPart('dayPeriod').toUpperCase()}`
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <img src="/favicon.png" alt="" />
          </span>
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
            <div className="auth-controls">
              <input
                type="email"
                placeholder="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <div className="auth-passwords">
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
              </div>
              <div className="auth-actions">
                <button type="submit" disabled={isSubmitting}>
                  {mode === 'register' ? 'Register' : 'Login'}
                </button>
                <button
                  type="button"
                  onClick={() => switchMode(mode === 'register' ? 'login' : 'register')}
                  disabled={isSubmitting}
                >
                  {mode === 'register' ? 'Back to login' : 'Create account'}
                </button>
              </div>
            </div>
          </form>
        )}
      </header>

      {message && <p className={`message message--${messageTone}`}>{message}</p>}

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

      {user && (
        <section className="collections-panel" aria-label="Collections">
          <form className="collection-form" onSubmit={handleCreateCollection}>
            <label htmlFor="collection-title">Collection</label>
            <input
              id="collection-title"
              type="text"
              placeholder="Favorites"
              value={collectionTitle}
              onChange={(event) => setCollectionTitle(event.target.value)}
            />
            <button type="submit" disabled={isSubmitting || collectionTitle.trim() === ''}>
              Create
            </button>
          </form>

          {collections.length > 0 && (
            <div className="collections-list">
              {collections.map((collection) => (
                <div className="collection-item" key={collection.id}>
                  <h2>{collection.title}</h2>
                  <p>{collection.videos.length} videos</p>
                  {collection.videos.map((video) => (
                    <div className="collection-video" key={video.id}>
                      <span>{video.title}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveVideoFromCollection(collection.id, video.id)}
                        disabled={isSubmitting}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </section>
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
                  <p>At: {formatDate(video.created_at)}</p>
                  {user && (
                    <div className="add-to-collection">
                      <select
                        value={selectedCollectionId}
                        onChange={(event) => setSelectedCollectionId(event.target.value)}
                        disabled={collections.length === 0 || isSubmitting}
                      >
                        {collections.length === 0 ? (
                          <option value="">No collections</option>
                        ) : (
                          collections.map((collection) => (
                            <option key={collection.id} value={collection.id}>
                              {collection.title}
                            </option>
                          ))
                        )}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleAddVideoToCollection(video.id)}
                        disabled={collections.length === 0 || isSubmitting}
                      >
                        Add
                      </button>
                    </div>
                  )}
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
