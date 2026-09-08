import { useState } from 'react'
import { adminExportUrl, adminOverview } from '../api'

export default function AdminView() {
  const [key, setKey] = useState(() => sessionStorage.getItem('spc_admin_key') || '')
  const [authedKey, setAuthedKey] = useState(() => sessionStorage.getItem('spc_admin_key') || '')
  const [rows, setRows] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function load(adminKey) {
    setLoading(true)
    setError('')
    try {
      const data = await adminOverview(adminKey)
      setRows(data.participants)
      setAuthedKey(adminKey)
      sessionStorage.setItem('spc_admin_key', adminKey)
    } catch (err) {
      setError(err.message || 'Unauthorized')
      setAuthedKey('')
      sessionStorage.removeItem('spc_admin_key')
    } finally {
      setLoading(false)
    }
  }

  async function handleLogin(e) {
    e.preventDefault()
    await load(key.trim())
  }

  if (!authedKey) {
    return (
      <div className="admin-page">
        <div className="admin-login">
          <h1>Admin</h1>
          <p className="admin-lede">Enter the admin key to view coding progress.</p>
          <form onSubmit={handleLogin}>
            <label className="field-label" htmlFor="admin-key">
              Admin key
            </label>
            <input
              id="admin-key"
              className="text-input"
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              autoComplete="off"
            />
            <button className="btn-primary full" type="submit" disabled={!key.trim() || loading}>
              {loading ? 'Checking…' : 'Open dashboard'}
            </button>
            {error ? <p className="error-text">{error}</p> : null}
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <h1>Admin</h1>
      <p className="admin-lede">Participant progress and submission status.</p>
      <div className="admin-table-wrap">
        <div className="admin-toolbar">
          <button type="button" className="btn-ghost" onClick={() => load(authedKey)} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
          <a className="btn-ghost" href={adminExportUrl(authedKey)} style={{ textDecoration: 'none' }}>
            Export effects CSV
          </a>
          <div className="header-spacer" />
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              setAuthedKey('')
              sessionStorage.removeItem('spc_admin_key')
            }}
          >
            Sign out
          </button>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Participant</th>
              <th>Confirmed</th>
              <th>Total</th>
              <th>Submitted</th>
              <th>Submitted at</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ color: 'var(--ink-4)' }}>
                  No participants yet.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.participant_id}>
                  <td>{r.participant_id}</td>
                  <td>
                    {r.confirmed_count} / {r.total_prompts}
                  </td>
                  <td>{r.total_prompts}</td>
                  <td>
                    <span className={`badge ${r.is_submitted ? 'badge-yes' : 'badge-no'}`}>
                      {r.is_submitted ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td>
                    {r.submitted_at
                      ? new Date(r.submitted_at).toLocaleString()
                      : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {error ? <p className="error-text">{error}</p> : null}
    </div>
  )
}
