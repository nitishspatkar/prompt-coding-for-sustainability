import { useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import { login, markOrientation } from './api'
import { SESSION_KEY } from './constants'
import AdminView from './components/AdminView'
import CodingView from './components/CodingView'
import Done from './components/Done'
import Login from './components/Login'
import Orientation from './components/Orientation'

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

function CoderApp() {
  const [session, setSession] = useState(() => loadSession())
  const [screen, setScreen] = useState(() => {
    const s = loadSession()
    if (!s) return 'login'
    if (s.is_submitted) return 'done'
    if (!s.has_seen_orientation) return 'orientation'
    return 'coding'
  })
  const [doneStats, setDoneStats] = useState(null)

  useEffect(() => {
    if (session?.is_submitted && screen !== 'done') {
      setScreen('done')
    }
  }, [session, screen])

  async function handleLogin(participantId) {
    const res = await login(participantId)
    const next = {
      token: res.token,
      participant_id: res.participant_id,
      has_seen_orientation: res.has_seen_orientation,
      is_submitted: res.is_submitted,
    }
    saveSession(next)
    setSession(next)
    if (res.is_submitted) {
      setDoneStats(null)
      setScreen('done')
    } else if (!res.has_seen_orientation) {
      setScreen('orientation')
    } else {
      setScreen('coding')
    }
  }

  async function startCoding() {
    if (session) {
      try {
        await markOrientation(session.participant_id)
      } catch {
        /* non-fatal */
      }
      const next = { ...session, has_seen_orientation: true }
      saveSession(next)
      setSession(next)
    }
    setScreen('coding')
  }

  function handleSubmitted(result) {
    const next = { ...session, is_submitted: true }
    saveSession(next)
    setSession(next)
    setDoneStats(result)
    setScreen('done')
  }

  if (screen === 'login') {
    return <Login onLogin={handleLogin} />
  }

  if (screen === 'orientation') {
    return <Orientation onContinue={startCoding} />
  }

  if (screen === 'done') {
    return (
      <Done
        totalCount={doneStats?.total ?? '—'}
        effectTotal={doneStats?.effect_total ?? '—'}
        pidLabel={session?.participant_id || '—'}
      />
    )
  }

  return (
    <CodingView
      participantId={session.participant_id}
      isSubmitted={!!session.is_submitted}
      onSubmitted={handleSubmitted}
    />
  )
}

export default function App() {
  return (
    <div className="app-shell">
      <Routes>
        <Route path="/admin" element={<AdminView />} />
        <Route path="/*" element={<CoderApp />} />
      </Routes>
    </div>
  )
}
