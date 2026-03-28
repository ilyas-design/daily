/**
 * One-time seed script — run once against your live database:
 *
 *   DATABASE_URL="your-render-postgres-url" node seed.js
 *
 * Safe to re-run: uses ON CONFLICT DO NOTHING so existing rows are never overwritten.
 */

import pg from 'pg'

const { Pool } = pg

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is required.')
  process.exit(1)
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

const messages = [
  {
    date: '2026-03-28',
    text: `من أجلكِ…
أنا مستعدّ لكل شيء،
فقط لأرى ابتسامتكِ تبقى كما هي 🤍

سعادتكِ ليست شيئًا عابرًا عندي،
بل راحتي أنا في رؤيتها 💜

لو كان الفرح طريقًا،
لسلكتُه معكِ حتى آخره،
دون تعبٍ أو تردّد 🌙

وإن مرّ عليكِ يومٌ ثقيل،
سأكون قربكِ بطريقتي،
حتى تعودي تبتسمين 💫

كل ما أريده…
أن تكوني بخير دائمًا،
وأن تبقى ضحكتكِ كما أحب 💞

So if there's anything in this world I'd choose again and again…
it's your smile, and the happiness I see in you ✨`,
  },
  // Add more messages here:
  // { date: '2026-03-29', text: '...' },
]

async function seed() {
  for (const { date, text } of messages) {
    await pool.query(
      `INSERT INTO writer_messages (date, text) VALUES ($1, $2) ON CONFLICT (date) DO NOTHING`,
      [date, text],
    )
    await pool.query(
      `INSERT INTO journal_entries (id, text, date, source) VALUES ($1, $2, $3, 'writer') ON CONFLICT (id) DO NOTHING`,
      [`${date}T12:00:00.000Z`, text, date],
    )
    console.log(`✓ Inserted message for ${date}`)
  }
  console.log('Seed complete.')
  await pool.end()
}

seed().catch(err => { console.error(err); process.exit(1) })
