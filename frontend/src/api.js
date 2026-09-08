const API_BASE = import.meta.env.VITE_API_BASE || ''

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })
  if (!res.ok) {
    let detail = res.statusText
    try {
      const body = await res.json()
      detail = body.detail || detail
    } catch {
      /* ignore */
    }
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail))
  }
  if (res.status === 204) return null
  const type = res.headers.get('content-type') || ''
  if (type.includes('application/json')) return res.json()
  return res.text()
}

export function login(participantId) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ participant_id: participantId }),
  })
}

export function markOrientation(participantId) {
  return request('/auth/orientation', {
    method: 'POST',
    body: JSON.stringify({ participant_id: participantId }),
  })
}

export function getNextPrompt(pid) {
  return request(`/prompts/next?pid=${encodeURIComponent(pid)}`)
}

export function getAllPrompts(pid) {
  return request(`/prompts/all?pid=${encodeURIComponent(pid)}`)
}

export function getPrompt(pid, promptId) {
  return request(`/prompts/${encodeURIComponent(promptId)}?pid=${encodeURIComponent(pid)}`)
}

export function confirmPrompt(payload) {
  return request('/prompts/confirm', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function submitAll(participantId) {
  return request('/prompts/submit', {
    method: 'POST',
    body: JSON.stringify({ participant_id: participantId }),
  })
}

export function adminOverview(key) {
  return request(`/admin/overview?key=${encodeURIComponent(key)}`)
}

export function adminExportUrl(key) {
  return `${API_BASE}/admin/export?key=${encodeURIComponent(key)}`
}
