import { type FormEvent, useEffect, useState } from 'react'
import { getCurrentUser, login, logout, register, type User } from './api/auth'
import './App.css'

function App() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let isActive = true

    getCurrentUser()
      .then(({ user }) => {
        if (isActive) setUser(user)
      })
      .catch(() => undefined)

    return () => {
      isActive = false
    }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setMessage('')

    try {
      // Rails has_secure_password validates password_confirmation on registration.
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
      setMessage('Logged out')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Request failed')
    } finally {
      setIsSubmitting(false)
    }
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

      <section className="content" aria-label="Shared videos" />
    </main>
  )
}

export default App
