import { useState, useRef, useCallback, useMemo } from 'react'
import { CONFIG, LOVE_MESSAGES } from './data'
import {
  getDayCount, createAudioEngine,
  todayISO, latestWriterMessage, todayMessageFromJournal,
  entrySortTime, getMessageForDay,
} from './utils'

import Particles       from './components/Particles'
import MusicBtn        from './components/MusicBtn'
import TodaysQuoteBtn  from './components/TodaysQuoteBtn'
import Header          from './components/Header'
import DailyMessage    from './components/DailyMessage'
import EasterModal     from './components/EasterModal'
import WriterComposer  from './components/WriterComposer'
import RoleSelectModal from './components/RoleSelectModal'
import PinModal        from './components/PinModal'
import Journal         from './components/Journal'
import Toast           from './components/Toast'
import SallyIntro      from './components/SallyIntro'

// ── Storage keys ─────────────────────────────────────────────
const JOURNAL_KEY      = 'love_journal_entries'
const ROLE_KEY         = 'user_role'
const WRITER_MSG_KEY   = 'writer_messages'
const LAST_WRITER_KEY  = 'love_last_writer_message'

function loadStored() {
  try {
    const raw = localStorage.getItem(JOURNAL_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

/** Merge saved writer messages into the timeline once (same storage, visible in Our Journal). */
function buildInitialEntries() {
  const entries = loadStored()
  const wm = loadWriterMessages()
  const next = [...entries]
  let changed = false
  for (const [date, text] of Object.entries(wm)) {
    if (!text || !String(text).trim()) continue
    if (!next.some(e => e.source === 'writer' && e.date === date)) {
      next.push({ id: `${date}T12:00:00.000Z`, text: String(text).trim(), date, source: 'writer' })
      changed = true
    }
  }
  if (changed) localStorage.setItem(JOURNAL_KEY, JSON.stringify(next))
  return next
}
function persist(entries) {
  localStorage.setItem(JOURNAL_KEY, JSON.stringify(entries))
}
function loadRole() {
  return localStorage.getItem(ROLE_KEY) // 'writer' | 'reader' | null
}
function saveRole(r) {
  localStorage.setItem(ROLE_KEY, r)
}
function loadWriterMessages() {
  try { return JSON.parse(localStorage.getItem(WRITER_MSG_KEY)) || {} }
  catch { return {} }
}
function persistWriterMessages(map) {
  localStorage.setItem(WRITER_MSG_KEY, JSON.stringify(map))
}

function loadLastWriterDisplay() {
  try {
    const raw = localStorage.getItem(LAST_WRITER_KEY)
    if (raw != null && String(raw).trim()) return String(raw).trim()
  } catch {}
  return latestWriterMessage(loadWriterMessages()) ?? null
}

// ─────────────────────────────────────────────────────────────
export default function App() {
  // ── State ──────────────────────────────────────────────────
  const [entries,        setEntries]        = useState(buildInitialEntries)
  const [role,           setRole]           = useState(loadRole)        // null | 'writer' | 'reader'
  const [writerMessages, setWriterMessages] = useState(loadWriterMessages)
  const [lastWriterDisplay, setLastWriterDisplay] = useState(loadLastWriterDisplay)
  const [easterOpen,     setEasterOpen]     = useState(false)
  const [pinOpen,        setPinOpen]        = useState(false)
  const [toast,          setToast]          = useState(null)
  const [musicOn,        setMusicOn]        = useState(false)
  const [showIntro,      setShowIntro]      = useState(true)

  const audioRef      = useRef(null)
  const toastTimerRef = useRef(null)

  // ── Derived ────────────────────────────────────────────────
  const dayCount     = getDayCount(CONFIG.startDate)
  const fromJournalToday = todayMessageFromJournal(entries)
  const effectiveMsg =
    (lastWriterDisplay && String(lastWriterDisplay).trim()) ||
    fromJournalToday ||
    latestWriterMessage(writerMessages) ||
    null

  /** Writer / journal text, or a stable daily line from LOVE_MESSAGES */
  const readerDailyMessage = useMemo(() => {
    const t = effectiveMsg && String(effectiveMsg).trim()
    if (t) return t
    if (dayCount < 1) return null
    return getMessageForDay(dayCount, LOVE_MESSAGES)
  }, [effectiveMsg, dayCount])

  /** Newest today journal row — same time + badge as timeline entries */
  const todayJournalMeta = useMemo(() => {
    const t = todayISO()
    const matches = entries.filter(
      (e) => e.date === t && (e.source === 'daily' || e.source === 'writer'),
    )
    if (matches.length === 0) return { id: null, source: null }
    matches.sort((a, b) => entrySortTime(b) - entrySortTime(a))
    const top = matches[0]
    return { id: top.id, source: top.source }
  }, [entries])

  /** Reader's reply for today (newest reader entry for this calendar day) */
  const todayReaderComment = useMemo(() => {
    const t = todayISO()
    const matches = entries.filter((e) => e.date === t && e.source === 'reader')
    if (matches.length === 0) return null
    matches.sort((a, b) => entrySortTime(b) - entrySortTime(a))
    return matches[0].text
  }, [entries])

  // ── Toast ──────────────────────────────────────────────────
  const showToast = useCallback((msg) => {
    setToast(msg)
    clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToast(null), 2400)
  }, [])

  // ── Role ───────────────────────────────────────────────────
  function handleRoleSelect(selected) {
    saveRole(selected)
    setRole(selected)
  }
  function switchRole() {
    if (role === 'writer') {
      // Writer → Reader: instant, no PIN needed
      saveRole('reader')
      setRole('reader')
      showToast('💌 Reader mode')
    } else {
      // Reader → Writer: require PIN
      setPinOpen(true)
    }
  }

  function handlePinSuccess() {
    setPinOpen(false)
    saveRole('writer')
    setRole('writer')
    showToast('✍️ Writer mode')
  }

  // ── Writer message ─────────────────────────────────────────
  const saveWriterMessage = useCallback((text, dateISO) => {
    const day = dateISO ?? todayISO()
    const trimmed = text.trim()
    setWriterMessages(prev => {
      const updated = { ...prev, [day]: trimmed }
      persistWriterMessages(updated)
      return updated
    })
    setLastWriterDisplay(trimmed)
    try {
      localStorage.setItem(LAST_WRITER_KEY, trimmed)
    } catch {}
    setEntries(prev => {
      const without = prev.filter(e => !(e.source === 'writer' && e.date === day))
      const entry = { id: new Date().toISOString(), text: trimmed, date: day, source: 'writer' }
      const updated = [...without, entry]
      persist(updated)
      return updated
    })
    showToast('Message saved ♥')
  }, [showToast])

  // ── Journal entries ────────────────────────────────────────
  const addEntry = useCallback((text, date, source = null) => {
    setEntries(prev => {
      const entry = { id: new Date().toISOString(), text, date }
      if (source) entry.source = source
      const updated = [...prev, entry]
      persist(updated)
      return updated
    })
    if (!source) showToast('Saved 🎀')   // silent for auto-saves
  }, [showToast])

  const deleteEntry = useCallback((id) => {
    setEntries(prev => {
      const removed = prev.find(e => e.id === id)
      if (!removed) return prev
      const updated = prev.filter(e => e.id !== id)
      persist(updated)
      if (removed.source === 'writer' && removed.date) {
        setWriterMessages(wm => {
          const next = { ...wm }
          delete next[removed.date]
          persistWriterMessages(next)
          return next
        })
      }
      return updated
    })
    showToast('Entry removed')
  }, [showToast])

  // ── Reader reveal → auto-save to timeline ─────────────────
  const handleDailyReveal = useCallback(() => {
    const text = readerDailyMessage && String(readerDailyMessage).trim()
    if (!text) return
    const today = todayISO()
    const alreadyOnTimeline = entries.some(
      e => e.date === today && (e.source === 'daily' || e.source === 'writer'),
    )
    if (alreadyOnTimeline) return
    addEntry(text, today, 'daily')
    setLastWriterDisplay(text)
    try {
      localStorage.setItem(LAST_WRITER_KEY, text)
    } catch {}
    showToast('Added to our timeline ✨')
  }, [readerDailyMessage, entries, addEntry, showToast])

  /** Replace or clear today's reader reply (shown on timeline as 💬 Reply) */
  const saveReaderComment = useCallback(
    (text) => {
      const today = todayISO()
      const trimmed = String(text ?? '').trim()
      setEntries((prev) => {
        const without = prev.filter((e) => !(e.date === today && e.source === 'reader'))
        const updated = trimmed
          ? [
              ...without,
              {
                id: new Date().toISOString(),
                text: trimmed,
                date: today,
                source: 'reader',
              },
            ]
          : without
        persist(updated)
        return updated
      })
      showToast(trimmed ? 'Reply saved 💌' : 'Reply removed')
    },
    [showToast],
  )

  // ── Music ──────────────────────────────────────────────────
  function toggleMusic() {
    if (!musicOn) {
      if (!audioRef.current) audioRef.current = createAudioEngine()
      else if (audioRef.current.ctx.state === 'suspended') audioRef.current.ctx.resume()
      audioRef.current.fadeIn()
      setMusicOn(true)
      showToast('♪ Music on')
    } else {
      audioRef.current?.fadeOut()
      setMusicOn(false)
      showToast('Music off')
    }
  }

  // ─────────────────────────────────────────────────────────
  return (
    <>
      {showIntro && <SallyIntro onDone={() => setShowIntro(false)} />}
      <Particles />
      {role !== null && (
        <TodaysQuoteBtn
          role={role}
          onWriterHint={() => showToast('Reader mode 💌 opens the letter — use Switch below')}
        />
      )}
      <MusicBtn playing={musicOn} onToggle={toggleMusic} />

      {/* Role selection — shown on first visit */}
      {role === null && <RoleSelectModal onSelect={handleRoleSelect} />}

      <div className="app">
        <Header dayCount={dayCount} />

        {/* Writer: compose today's message */}
        {role === 'writer' && (
          <WriterComposer
            writerMessages={writerMessages}
            onSave={saveWriterMessage}
            dayCount={dayCount}
          />
        )}

        {/* Reader: reveal today's message (auto-saves to timeline) */}
        {role === 'reader' && (
          <DailyMessage
            dayCount={dayCount}
            message={readerDailyMessage}
            journalEntryId={todayJournalMeta.id}
            journalEntrySource={todayJournalMeta.source}
            readerComment={todayReaderComment}
            onSaveReaderComment={saveReaderComment}
            onEasterEgg={() => setEasterOpen(true)}
            onReveal={handleDailyReveal}
          />
        )}

        {easterOpen && <EasterModal onClose={() => setEasterOpen(false)} dayCount={dayCount} />}
      {pinOpen    && <PinModal onSuccess={handlePinSuccess} onCancel={() => setPinOpen(false)} />}

        {/* Timeline — visible to both roles; no composer for either */}
        <Journal
          entries={entries}
          onAdd={addEntry}
          onDelete={deleteEntry}
          showToast={showToast}
          showComposer={false}
          dayCount={dayCount}
        />

        <footer className="footer">
          <img className="footer-hk-sticker" src="/stickers/hk-heart.svg" alt="" aria-hidden="true" draggable="false" />
          <p>Made with ♥ for you</p>
          {role !== null && (
            <button className="btn-switch-role" onClick={switchRole}>
              Switch to {role === 'writer' ? 'Reader 💌' : 'Writer ✍️'}
            </button>
          )}
        </footer>
      </div>

      <Toast message={toast} />
    </>
  )
}
