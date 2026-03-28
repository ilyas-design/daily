// ─── DATES ───────────────────────────────────────────────────
export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export function getDayCount(startDate) {
  const start = new Date(startDate);
  const today = new Date();
  start.setHours(0,0,0,0);
  today.setHours(0,0,0,0);
  return Math.floor((today - start) / 86_400_000) + 1;
}

export function getMessageForDay(dayCount, messages) {
  if (dayCount < 1) return null;
  return messages[(dayCount - 1) % messages.length];
}

export function formatDateLabel(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString('default', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

export function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('default', { hour: '2-digit', minute: '2-digit' });
}

// ─── TEXT ────────────────────────────────────────────────────
export function isArabic(text) {
  return /[\u0600-\u06FF]/.test(text);
}

// ─── JOURNAL GROUPING ─────────────────────────────────────────
/** Sort key from id (ISO), optional createdAt, or calendar date at noon for legacy rows. */
export function entrySortTime(e) {
  if (e.createdAt) {
    const t = Date.parse(e.createdAt);
    if (!Number.isNaN(t)) return t;
  }
  const fromId = Date.parse(e.id);
  if (!Number.isNaN(fromId)) return fromId;
  const ymd = e.date || String(e.id).slice(0, 10);
  const fallback = Date.parse(`${ymd}T12:00:00.000Z`);
  return Number.isNaN(fallback) ? 0 : fallback;
}

/** Groups by calendar day (newest day first). Entries within a day sorted by real time (id / createdAt), not array order. */
export function groupByDate(entries) {
  const map = {};
  entries.forEach(e => {
    const date = e.date || e.id.slice(0, 10);
    if (!map[date]) map[date] = [];
    map[date].push(e);
  });
  return Object.keys(map)
    .sort()
    .reverse()
    .map(date => ({
      date,
      entries: map[date].slice().sort((a, b) => entrySortTime(a) - entrySortTime(b)),
    }));
}

// ─── RIPPLE ──────────────────────────────────────────────────
export function triggerRipple(element, clientX, clientY) {
  const old = element.querySelector('.ripple');
  if (old) old.remove();
  const circle = document.createElement('span');
  const diam = Math.max(element.clientWidth, element.clientHeight);
  const rect = element.getBoundingClientRect();
  circle.classList.add('ripple');
  circle.style.cssText = `width:${diam}px;height:${diam}px;left:${clientX-rect.left-diam/2}px;top:${clientY-rect.top-diam/2}px;`;
  element.appendChild(circle);
  setTimeout(() => circle.remove(), 700);
}

// ─── AUDIO ───────────────────────────────────────────────────
export function createAudioEngine() {
  const ctx    = new (window.AudioContext || window.webkitAudioContext)();
  const master = ctx.createGain();
  master.gain.setValueAtTime(0, ctx.currentTime);
  master.connect(ctx.destination);

  const delay = ctx.createDelay(3);
  const dfb   = ctx.createGain();
  const dlpf  = ctx.createBiquadFilter();
  delay.delayTime.value = 1.8;
  dfb.gain.value = 0.38;
  dlpf.type = 'lowpass';
  dlpf.frequency.value = 900;
  delay.connect(dlpf); dlpf.connect(dfb); dfb.connect(delay); delay.connect(master);

  [110, 130.81, 164.81, 220, 329.63].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    const lfo = ctx.createOscillator();
    const lg  = ctx.createGain();
    osc.type = 'sine'; osc.frequency.value = freq;
    g.gain.value = [0.055, 0.040, 0.038, 0.028, 0.018][i];
    lfo.type = 'sine'; lfo.frequency.value = 0.12 + i * 0.04; lg.gain.value = 0.3;
    lfo.connect(lg); lg.connect(osc.frequency); lfo.start();
    osc.connect(g); g.connect(delay); g.connect(master); osc.start();
  });

  return {
    ctx, master,
    fadeIn()  { master.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 2.5); },
    fadeOut() { master.gain.linearRampToValueAtTime(0,    ctx.currentTime + 2);   },
  };
}

// ─── WRITER MESSAGES ─────────────────────────────────────────
/** Returns the writer's custom message for today, or null */
export function todayWriterMessage(writerMessages) {
  return writerMessages[todayISO()] ?? null;
}

/** Most recent dated message (ISO keys sort lexicographically). For migration when no last-save key exists. */
export function latestWriterMessage(writerMessages) {
  if (!writerMessages || typeof writerMessages !== 'object') return null;
  const dates = Object.keys(writerMessages).filter((d) => {
    const t = writerMessages[d];
    return t && String(t).trim();
  });
  if (dates.length === 0) return null;
  dates.sort((a, b) => b.localeCompare(a));
  const text = String(writerMessages[dates[0]]).trim();
  return text || null;
}

/** Newest text for today from journal (writer or daily reveal) — keeps Today's Message in sync after reload. */
export function todayMessageFromJournal(entries) {
  if (!entries?.length) return null;
  const t = todayISO();
  const matches = entries.filter(
    (e) => e.date === t && (e.source === 'daily' || e.source === 'writer'),
  );
  if (matches.length === 0) return null;
  matches.sort((a, b) => entrySortTime(b) - entrySortTime(a));
  const text = matches[0].text;
  return text && String(text).trim() ? String(text).trim() : null;
}

// ─── PARTICLES ───────────────────────────────────────────────
export function randomBetween(a, b) { return a + Math.random() * (b - a); }
