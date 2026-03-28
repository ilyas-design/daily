import express from 'express'
import { fileURLToPath } from 'url'
import path from 'path'
import { MongoClient } from 'mongodb'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
app.use(express.json())

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  if (req.method === 'OPTIONS') return res.sendStatus(200)
  next()
})

let db

export async function initDB() {
  const client = new MongoClient(process.env.DATABASE_URL)
  await client.connect()
  db = client.db('daily')
  console.log('Connected to MongoDB')
}

const col = {
  entries:  () => db.collection('journal_entries'),
  messages: () => db.collection('writer_messages'),
}

// ── Journal entries ───────────────────────────────────────────

app.get('/api/entries', async (req, res) => {
  try {
    const docs = await col.entries().find().sort({ _id: 1 }).toArray()
    res.json(docs.map(({ _id, ...rest }) => ({ id: _id, ...rest })))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/entries', async (req, res) => {
  const { id, text, date, source } = req.body
  if (!id || !text || !date) return res.status(400).json({ error: 'Missing fields' })
  try {
    await col.entries().replaceOne(
      { _id: id },
      { _id: id, text, date, source: source || 'daily' },
      { upsert: true },
    )
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.delete('/api/entries/:id', async (req, res) => {
  try {
    await col.entries().deleteOne({ _id: req.params.id })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.delete('/api/entries', async (req, res) => {
  const { date, source } = req.query
  if (!date || !source) return res.status(400).json({ error: 'Missing date or source' })
  try {
    await col.entries().deleteMany({ date, source })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Writer messages ───────────────────────────────────────────

app.get('/api/writer-messages', async (req, res) => {
  try {
    const docs = await col.messages().find().toArray()
    const map = {}
    docs.forEach(d => { map[d._id] = d.text })
    res.json(map)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/writer-messages', async (req, res) => {
  const { date, text } = req.body
  if (!date || !text) return res.status(400).json({ error: 'Missing fields' })
  try {
    await col.messages().replaceOne({ _id: date }, { _id: date, text }, { upsert: true })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.delete('/api/writer-messages/:date', async (req, res) => {
  try {
    await col.messages().deleteOne({ _id: req.params.date })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Serve React build ─────────────────────────────────────────

app.use(express.static(path.join(__dirname, 'dist')))
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

// ── Start ─────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001

if (process.env.NODE_ENV !== 'test') {
  initDB()
    .then(() => app.listen(PORT, () => console.log(`Server running on port ${PORT}`)))
    .catch(err => { console.error('Failed to start:', err); process.exit(1) })
}

export { app }
