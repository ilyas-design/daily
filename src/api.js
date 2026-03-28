// All API calls to the Express backend.
// In production, the backend serves the frontend from the same origin.
// In development, Vite proxies /api → localhost:3001.

async function apiFetch(path, options) {
  const res = await fetch(path, options)
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`API ${path} failed: ${res.status} ${body}`)
  }
  return res.json()
}

export function fetchEntries() {
  return apiFetch('/api/entries')
}

export function saveEntry({ id, text, date, source }) {
  return apiFetch('/api/entries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, text, date, source }),
  })
}

export function deleteEntry(id) {
  return apiFetch(`/api/entries/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

/** Delete all entries matching a given date + source (e.g. replace today's reader reply) */
export function deleteEntriesByDateSource(date, source) {
  return apiFetch(`/api/entries?date=${encodeURIComponent(date)}&source=${encodeURIComponent(source)}`, {
    method: 'DELETE',
  })
}

export function fetchWriterMessages() {
  return apiFetch('/api/writer-messages')
}

export function saveWriterMessageAPI(date, text) {
  return apiFetch('/api/writer-messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date, text }),
  })
}

export function deleteWriterMessage(date) {
  return apiFetch(`/api/writer-messages/${encodeURIComponent(date)}`, { method: 'DELETE' })
}
