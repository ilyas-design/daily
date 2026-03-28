import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'

// ── Mock pg before importing the server ──────────────────────
// vi.hoisted ensures the variable is available inside vi.mock's factory,
// which Vitest hoists to the top of the file before any imports.
const mockQuery = vi.hoisted(() => vi.fn())

vi.mock('pg', () => ({
  default: {
    Pool: class {
      constructor() { this.query = mockQuery }
    },
  },
}))

// Import AFTER the mock is set up
const { app } = await import('../server.js')

// ─────────────────────────────────────────────────────────────

beforeEach(() => {
  mockQuery.mockReset()
})

// ── Writer saves a message ────────────────────────────────────

describe('POST /api/writer-messages', () => {
  it('stores the message and returns { ok: true }', async () => {
    mockQuery.mockResolvedValue({ rows: [] })

    const res = await request(app)
      .post('/api/writer-messages')
      .send({ date: '2026-03-28', text: 'من أجلكِ… 🤍' })

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })
  })

  it('calls the database with the correct date and text', async () => {
    mockQuery.mockResolvedValue({ rows: [] })

    await request(app)
      .post('/api/writer-messages')
      .send({ date: '2026-03-28', text: 'I love you' })

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO writer_messages'),
      ['2026-03-28', 'I love you'],
    )
  })

  it('returns 400 when date or text is missing', async () => {
    const res = await request(app)
      .post('/api/writer-messages')
      .send({ date: '2026-03-28' }) // no text

    expect(res.status).toBe(400)
    expect(res.body.error).toBeDefined()
  })

  it('returns 500 when the database throws', async () => {
    mockQuery.mockRejectedValue(new Error('DB connection lost'))

    const res = await request(app)
      .post('/api/writer-messages')
      .send({ date: '2026-03-28', text: 'Hello' })

    expect(res.status).toBe(500)
    expect(res.body.error).toBe('DB connection lost')
  })
})

// ── Reader receives messages ──────────────────────────────────

describe('GET /api/writer-messages', () => {
  it('returns all writer messages as a date→text map', async () => {
    mockQuery.mockResolvedValue({
      rows: [
        { date: '2026-03-28', text: 'من أجلكِ… 🤍' },
        { date: '2026-03-27', text: 'Yesterday message' },
      ],
    })

    const res = await request(app).get('/api/writer-messages')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      '2026-03-28': 'من أجلكِ… 🤍',
      '2026-03-27': 'Yesterday message',
    })
  })

  it('returns an empty object when no messages exist', async () => {
    mockQuery.mockResolvedValue({ rows: [] })

    const res = await request(app).get('/api/writer-messages')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({})
  })
})

// ── Full flow: writer writes → reader reads ───────────────────

describe('Full flow: writer writes, reader reads', () => {
  it('a message saved by the writer is received by the reader', async () => {
    const date = '2026-03-28'
    const text = 'سعادتكِ راحتي 💜'

    // Step 1 — writer saves the message
    mockQuery.mockResolvedValueOnce({ rows: [] }) // INSERT response

    const writeRes = await request(app)
      .post('/api/writer-messages')
      .send({ date, text })

    expect(writeRes.status).toBe(200)
    expect(writeRes.body).toEqual({ ok: true })

    // Step 2 — reader fetches messages
    mockQuery.mockResolvedValueOnce({ rows: [{ date, text }] }) // SELECT response

    const readRes = await request(app).get('/api/writer-messages')

    expect(readRes.status).toBe(200)
    expect(readRes.body[date]).toBe(text)
  })

  it('reader sees the latest message when writer overwrites a date', async () => {
    const date = '2026-03-28'
    const originalText = 'First draft'
    const updatedText  = 'Updated message 💞'

    // Writer saves original
    mockQuery.mockResolvedValueOnce({ rows: [] })
    await request(app).post('/api/writer-messages').send({ date, text: originalText })

    // Writer overwrites with updated message (ON CONFLICT DO UPDATE)
    mockQuery.mockResolvedValueOnce({ rows: [] })
    await request(app).post('/api/writer-messages').send({ date, text: updatedText })

    // DB returns the updated row (as it would after an upsert)
    mockQuery.mockResolvedValueOnce({ rows: [{ date, text: updatedText }] })

    const readRes = await request(app).get('/api/writer-messages')
    expect(readRes.body[date]).toBe(updatedText)
  })
})

// ── Journal entries ───────────────────────────────────────────

describe('POST /api/entries', () => {
  it('saves a journal entry and returns { ok: true }', async () => {
    mockQuery.mockResolvedValue({ rows: [] })

    const entry = {
      id: '2026-03-28T12:00:00.000Z',
      text: 'من أجلكِ… 🤍',
      date: '2026-03-28',
      source: 'writer',
    }

    const res = await request(app).post('/api/entries').send(entry)

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO journal_entries'),
      [entry.id, entry.text, entry.date, entry.source],
    )
  })

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/entries')
      .send({ text: 'No id or date' })

    expect(res.status).toBe(400)
  })
})

describe('GET /api/entries', () => {
  it('returns all journal entries as an array', async () => {
    const rows = [
      { id: '2026-03-28T12:00:00.000Z', text: 'Hello', date: '2026-03-28', source: 'writer' },
      { id: '2026-03-28T18:00:00.000Z', text: 'Reply', date: '2026-03-28', source: 'reader' },
    ]
    mockQuery.mockResolvedValue({ rows })

    const res = await request(app).get('/api/entries')

    expect(res.status).toBe(200)
    expect(res.body).toEqual(rows)
  })
})

describe('DELETE /api/entries/:id', () => {
  it('deletes the entry and returns { ok: true }', async () => {
    mockQuery.mockResolvedValue({ rows: [] })

    const res = await request(app).delete('/api/entries/2026-03-28T12:00:00.000Z')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM journal_entries'),
      ['2026-03-28T12:00:00.000Z'],
    )
  })
})
