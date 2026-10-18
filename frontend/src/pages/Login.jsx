import { useState } from 'react'
import { useAuth } from '../AuthContext.jsx'

export default function Login() {
  const { login, register } = useAuth()

  const [mode, setMode] = useState('signin')
  const [form, setForm] = useState({ full_name: '', email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const isSignup = mode === 'signup'

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const switchMode = () => {
    setMode(isSignup ? 'signin' : 'signup')
    setShowPassword(false)
    setError(null)
  }

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)

    try {
      if (isSignup) {
        await register({
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          password: form.password,
        })
      } else {
        await login({
          email: form.email.trim(),
          password: form.password,
        })
      }
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card card">
        <div className="brand" style={{ marginBottom: 18 }}>
          <span className="brand-mark">§</span>
          <span className="brand-name">Ledger</span>
        </div>

        <div className="eyebrow">{isSignup ? 'Get started' : 'Welcome back'}</div>
        <h1 className="page-title" style={{ fontSize: '1.6rem', marginBottom: 6 }}>
          {isSignup ? 'Create your account' : 'Sign in'}
        </h1>
        <p className="page-sub" style={{ marginBottom: 22 }}>
          {isSignup
            ? 'Your companies and invoices stay private to your account.'
            : 'Sign in to reach your invoices and companies.'}
        </p>

        <form onSubmit={submit}>
          {isSignup && (
            <div className="field" style={{ marginBottom: 14 }}>
              <label>Full name</label>
              <input
                required
                autoComplete="name"
                value={form.full_name}
                onChange={update('full_name')}
              />
            </div>
          )}

          <div className="field" style={{ marginBottom: 14 }}>
            <label>Email</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={update('email')}
            />
          </div>

          <div className="field" style={{ marginBottom: 14 }}>
            <label>Password</label>
            <div className="password-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={isSignup ? 8 : undefined}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                value={form.password}
                onChange={update('password')}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((shown) => !shown)}
                aria-pressed={showPassword}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: 6 }}
            disabled={busy}
          >
            {busy ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <p className="auth-switch">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button type="button" className="link-btn" onClick={switchMode}>
            {isSignup ? 'Sign in' : 'Create one'}
          </button>
        </p>
      </div>
    </div>
  )
}
