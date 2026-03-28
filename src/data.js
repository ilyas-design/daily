// ─── CONFIG ──────────────────────────────────────────────────
export const CONFIG = {
  startDate:  '2025-02-27',   // ← first date
  easterTaps: 7,
  writerPin:  '1234',         // ← change this PIN to unlock Writer mode
};

// ─── LOVE MESSAGES ───────────────────────────────────────────
export const LOVE_MESSAGES = [
  "In a universe of infinite stars, finding you was the universe finally finding itself.",
  "Every morning I wake up and rediscover that loving you is the most natural thing I have ever done.",
  "You are not just my love story — you are the reason I believe in stories at all.",
  "Some things are too beautiful for words. You are the reason I keep trying anyway.",
  "I have loved you across a thousand lifetimes, and I will love you in a thousand more.",
  "You make the most ordinary moments feel like poetry.",
  "When the world is noise, you are my silence. When silence grows heavy, you are my song.",
  "Love is not something you fall into — it is something you choose, every single day. I choose you.",
  "There are places in my heart that only exist because you walked into my life.",
  "You are the warmth I reach for before I even realize I am cold.",
  "In every version of my life I could imagine, you are the one constant I would never change.",
  "Your laughter is my favorite sound in the entire universe.",
  "I don't just love you — I am in awe of you.",
  "The smallest moments with you carry the weight of the most beautiful things.",
  "Being loved by you feels like the world finally making sense.",
  "You walked into my life and rearranged everything, and somehow it was all exactly right.",
  "I love the way your mind works, the way you see things others quietly miss.",
  "You are home — wherever we are, whatever the hour.",
  "Distance means nothing when someone means everything.",
  "Some loves whisper. Yours thunders through every corner of my soul.",
  "Every day I love you more than the day before. On the days when that seems impossible, you prove me beautifully wrong.",
  "You are the dream I didn't dare to dream until I met you.",
  "I see forever every time I look at you.",
  "You deserve a love that never makes you wonder if you are enough. You are always more than enough.",
  "The way you exist in this world — gently, beautifully — it heals something in me I didn't know was broken.",
  "I fall in love with you again in the quiet moments: over coffee, mid-sentence, without warning.",
  "Thank you for choosing me, again and again, on the easiest days and the hardest ones.",
  "You are not just part of my story. You are the reason I wanted to write one at all.",
  "If time is a river, I want every current and every bend to be shared with you.",
  "No map could ever lead me somewhere more beautiful than right beside you.",
  "You are the pause before the music starts — full of everything, and somehow enough.",
  "I keep falling in love with you in new ways. I don't think I'll ever stop.",
  "You are my favorite place, my favorite conversation, my favorite everything.",
  "Wherever I am going, I hope you are always the reason I am going there.",
  "You are the kind of person poems are written about. This is one of them.",
];

// ─── EASTER EGG ──────────────────────────────────────────────
export const EASTER_MESSAGES = [
  "You found the secret. Just like I found you — by some miracle the universe arranged quietly, just for us.",
  "This message was always here, hidden, waiting for someone curious enough to find it. Just like I was waiting for you.",
  "Secrets only mean something when shared with the right person. You are that person. Always.",
];

// ─── DUMMY SEED ENTRIES ───────────────────────────────────────
function fakeISO(ymd, hh, mm) {
  return `${ymd}T${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:00.000Z`;
}
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

const t0 = daysAgo(0);
const t1 = daysAgo(1);
const t3 = daysAgo(3);
const t5 = daysAgo(5);
const t8 = daysAgo(8);
const t12 = daysAgo(12);

export const DUMMY_ENTRIES = [
  { id: fakeISO(t0, 9, 14),  date: t0,  text: "Good morning, love ☀️ Made your favorite coffee and thought of you with every sip. Today feels like a good day." },
  { id: fakeISO(t0, 21, 5),  date: t0,  text: "Can't sleep. Just wanted to write that I'm really grateful for you. That's all. ♥" },
  { id: fakeISO(t1, 18, 30), date: t1,  text: "We watched the rain from the window for like an hour and said nothing and it was perfect. I love those moments with you." },
  { id: fakeISO(t3, 10, 0),  date: t3,  text: "رسالة بالعربي 🌸 أنا سعيد جداً لأنك في حياتي. كل يوم معك يشعرني بأن العالم أجمل." },
  { id: fakeISO(t3, 22, 45), date: t3,  text: "You fell asleep on my shoulder during the movie. I didn't move for two hours. Best two hours of my week." },
  { id: fakeISO(t5, 14, 20), date: t5,  text: "Saw a flower today that reminded me of you — unexpected, quietly beautiful, impossible to ignore." },
  { id: fakeISO(t8, 8, 5),   date: t8,  text: "First entry in our journal! I want us to fill this with tiny moments. The big ones take care of themselves." },
  { id: fakeISO(t8, 20, 55), date: t8,  text: "You laughed so hard today that you snorted and then laughed harder. I am keeping that memory forever." },
  { id: fakeISO(t12, 16, 0), date: t12, text: "Missing you a little extra today. Wrote this just so you'd know. Come home soon. ♥" },
];
