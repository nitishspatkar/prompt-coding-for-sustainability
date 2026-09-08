import { useState } from 'react'

export default function Login({ onLogin }) {
  const [pid, setPid] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const disabled = pid.trim().length < 2 || loading

  async function handleSubmit(e) {
    e.preventDefault()
    if (disabled) return
    setError('')
    setLoading(true)
    try {
      await onLogin(pid.trim())
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="centered-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <p className="login-lead">
          Enter the participant ID from your invitation email to begin coding.
        </p>
        <label className="field-label" htmlFor="pid">
          Participant ID
        </label>
        <input
          id="pid"
          className="text-input"
          type="text"
          value={pid}
          onChange={(e) => setPid(e.target.value)}
          placeholder="e.g. P-0417"
          autoComplete="off"
          autoFocus
        />
        <button className="btn-primary full" type="submit" disabled={disabled}>
          {loading ? 'Signing in…' : 'Begin session'}
        </button>
        {error ? <p className="error-text">{error}</p> : null}
      </form>
    </div>
  )
}
