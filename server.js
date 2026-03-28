import express from 'express'
import { fileURLToPath } from 'url'
import path from 'path'
import pg from 'pg'

const { Pool } = pg
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
app.use(express.json())

// Allow cross-origin requests (needed when running vite dev server separately)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  if (req.method === 'OPTIONS') return res.sendStatus(200)
  next()
})

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS journal_entries (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      date TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'daily'
    )
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS writer_messages (
      date TEXT PRIMARY KEY,
      text TEXT NOT NULL
    )
  `)
  console.log('Database tables ready')
}

// ── Journal entries ───────────────────────────────────────────

app.get('/api/entries', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, text, date, source FROM journal_entries ORDER BY id')
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/entries', async (req, res) => {
  const { id, text, date, source } = req.body
  if (!id || !text || !date) return res.status(400).json({ error: 'Missing fields' })
  try {
    await pool.query(
      `INSERT INTO journal_entries (id, text, date, source)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET text = $2, date = $3, source = $4`,
      [id, text, date, source || 'daily'],
    )
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

app.delete('/api/entries/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM journal_entries WHERE id = $1', [req.params.id])
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// Delete all entries matching a date + source (used to replace reader reply)
app.delete('/api/entries', async (req, res) => {
  const { date, source } = req.query
  if (!date || !source) return res.status(400).json({ error: 'Missing date or source' })
  try {
    await pool.query('DELETE FROM journal_entries WHERE date = $1 AND source = $2', [date, source])
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// ── Writer messages ───────────────────────────────────────────

app.get('/api/writer-messages', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT date, text FROM writer_messages')
    const map = {}
    rows.forEach(r => { map[r.date] = r.text })
    res.json(map)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/writer-messages', async (req, res) => {
  const { date, text } = req.body
  if (!date || !text) return res.status(400).json({ error: 'Missing fields' })
  try {
    await pool.query(
      `INSERT INTO writer_messages (date, text)
       VALUES ($1, $2)
       ON CONFLICT (date) DO UPDATE SET text = $2`,
      [date, text],
    )
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

app.delete('/api/writer-messages/:date', async (req, res) => {
  try {
    await pool.query('DELETE FROM writer_messages WHERE date = $1', [req.params.date])
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
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

// Only start listening when run directly (not imported by tests)
if (process.env.NODE_ENV !== 'test') {
  initDB()
    .then(() => app.listen(PORT, () => console.log(`Server running on port ${PORT}`)))
    .catch(err => { console.error('DB init failed:', err); process.exit(1) })
}

export { app, pool, initDB }
