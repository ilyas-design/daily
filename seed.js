/**
 * One-time seed script — run once against your live database:
 *
 *   DATABASE_URL="mongodb+srv://..." node seed.js
 *
 * Safe to re-run: uses replaceOne with upsert so existing entries are never duplicated.
 */

import { MongoClient } from 'mongodb'

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is required.')
  process.exit(1)
}

const client = new MongoClient(process.env.DATABASE_URL)
await client.connect()
const db = client.db('daily')

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

for (const { date, text } of messages) {
  await db.collection('writer_messages').replaceOne(
    { _id: date },
    { _id: date, text },
    { upsert: true },
  )
  await db.collection('journal_entries').replaceOne(
    { _id: `${date}T12:00:00.000Z` },
    { _id: `${date}T12:00:00.000Z`, text, date, source: 'writer' },
    { upsert: true },
  )
  console.log(`✓ Inserted message for ${date}`)
}

console.log('Seed complete.')
await client.close()
