import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import request from 'supertest'

// ── Mock MongoDB before importing the server ──────────────────

const mockToArray   = vi.hoisted(() => vi.fn().mockResolvedValue([]))
const mockReplaceOne = vi.hoisted(() => vi.fn().mockResolvedValue({}))
const mockDeleteOne  = vi.hoisted(() => vi.fn().mockResolvedValue({}))
const mockDeleteMany = vi.hoisted(() => vi.fn().mockResolvedValue({}))

const mockFindChain = vi.hoisted(() => {
  const chain = { toArray: mockToArray }
  chain.sort = vi.fn().mockReturnValue(chain)
  return chain
})

const mockCollection = vi.hoisted(() => ({
  find:       vi.fn().mockReturnValue(mockFindChain),
  replaceOne: mockReplaceOne,
  deleteOne:  mockDeleteOne,
  deleteMany: mockDeleteMany,
}))

vi.mock('mongodb', () => ({
  MongoClient: class {
    async connect() {}
    db() { return { collection: () => mockCollection } }
  },
}))

const { app, initDB } = await import('../server.js')

// Connect the mock DB once before all tests
beforeAll(async () => { await initDB() })

beforeEach(() => {
  vi.clearAllMocks()
  mockCollection.find.mockReturnValue(mockFindChain)
  mockFindChain.sort.mockReturnValue(mockFindChain)
  mockToArray.mockResolvedValue([])
  mockReplaceOne.mockResolvedValue({})
  mockDeleteOne.mockResolvedValue({})
  mockDeleteMany.mockResolvedValue({})
})

// ── Writer saves a message ────────────────────────────────────

describe('POST /api/writer-messages', () => {
  it('stores the message and returns { ok: true }', async () => {
    const res = await request(app)
      .post('/api/writer-messages')
      .send({ date: '2026-03-28', text: 'من أجلكِ… 🤍' })

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })
  })

  it('calls the database with the correct date and text', async () => {
    await request(app)
      .post('/api/writer-messages')
      .send({ date: '2026-03-28', text: 'I love you' })

    expect(mockReplaceOne).toHaveBeenCalledWith(
      { _id: '2026-03-28' },
      { _id: '2026-03-28', text: 'I love you' },
      { upsert: true },
    )
  })

  it('returns 400 when date or text is missing', async () => {
    const res = await request(app)
      .post('/api/writer-messages')
      .send({ date: '2026-03-28' })

    expect(res.status).toBe(400)
    expect(res.body.error).toBeDefined()
  })

  it('returns 500 when the database throws', async () => {
    mockReplaceOne.mockRejectedValueOnce(new Error('Connection lost'))

    const res = await request(app)
      .post('/api/writer-messages')
      .send({ date: '2026-03-28', text: 'Hello' })

    expect(res.status).toBe(500)
    expect(res.body.error).toBe('Connection lost')
  })
})

// ── Reader receives messages ──────────────────────────────────

describe('GET /api/writer-messages', () => {
  it('returns all writer messages as a date→text map', async () => {
    mockToArray.mockResolvedValueOnce([
      { _id: '2026-03-28', text: 'من أجلكِ… 🤍' },
      { _id: '2026-03-27', text: 'Yesterday message' },
    ])

    const res = await request(app).get('/api/writer-messages')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      '2026-03-28': 'من أجلكِ… 🤍',
      '2026-03-27': 'Yesterday message',
    })
  })

  it('returns an empty object when no messages exist', async () => {
    mockToArray.mockResolvedValueOnce([])

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

    // Writer saves
    const writeRes = await request(app)
      .post('/api/writer-messages')
      .send({ date, text })
    expect(writeRes.status).toBe(200)
    expect(writeRes.body).toEqual({ ok: true })

    // Reader fetches — DB now returns the saved message
    mockToArray.mockResolvedValueOnce([{ _id: date, text }])
    const readRes = await request(app).get('/api/writer-messages')

    expect(readRes.status).toBe(200)
    expect(readRes.body[date]).toBe(text)
  })

  it('reader sees the latest message when writer overwrites a date', async () => {
    const date = '2026-03-28'
    const updatedText = 'Updated message 💞'

    await request(app).post('/api/writer-messages').send({ date, text: 'First draft' })
    await request(app).post('/api/writer-messages').send({ date, text: updatedText })

    // DB returns the updated row (replaceOne with upsert overwrites)
    mockToArray.mockResolvedValueOnce([{ _id: date, text: updatedText }])
    const readRes = await request(app).get('/api/writer-messages')

    expect(readRes.body[date]).toBe(updatedText)
  })
})

// ── Journal entries ───────────────────────────────────────────

describe('POST /api/entries', () => {
  it('saves a journal entry and returns { ok: true }', async () => {
    const entry = {
      id: '2026-03-28T12:00:00.000Z',
      text: 'من أجلكِ… 🤍',
      date: '2026-03-28',
      source: 'writer',
    }

    const res = await request(app).post('/api/entries').send(entry)

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })
    expect(mockReplaceOne).toHaveBeenCalledWith(
      { _id: entry.id },
      { _id: entry.id, text: entry.text, date: entry.date, source: entry.source },
      { upsert: true },
    )
  })

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/api/entries').send({ text: 'No id or date' })
    expect(res.status).toBe(400)
  })
})

describe('GET /api/entries', () => {
  it('returns all journal entries as an array with id field', async () => {
    mockToArray.mockResolvedValueOnce([
      { _id: '2026-03-28T12:00:00.000Z', text: 'Hello', date: '2026-03-28', source: 'writer' },
      { _id: '2026-03-28T18:00:00.000Z', text: 'Reply', date: '2026-03-28', source: 'reader' },
    ])

    const res = await request(app).get('/api/entries')

    expect(res.status).toBe(200)
    expect(res.body[0].id).toBe('2026-03-28T12:00:00.000Z')
    expect(res.body[1].id).toBe('2026-03-28T18:00:00.000Z')
  })
})

describe('DELETE /api/entries/:id', () => {
  it('deletes the entry and returns { ok: true }', async () => {
    const res = await request(app).delete('/api/entries/2026-03-28T12:00:00.000Z')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })
    expect(mockDeleteOne).toHaveBeenCalledWith({ _id: '2026-03-28T12:00:00.000Z' })
  })
})
