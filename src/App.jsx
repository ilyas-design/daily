import { useState, useRef, useCallback } from 'react'
import { CONFIG, LOVE_MESSAGES, DUMMY_ENTRIES } from './data'
import {
  getDayCount, getMessageForDay, createAudioEngine,
  todayISO, todayWriterMessage,
} from './utils'

import Particles       from './components/Particles'
import MusicBtn        from './components/MusicBtn'
import Header          from './components/Header'
import DailyMessage    from './components/DailyMessage'
import EasterModal     from './components/EasterModal'
import WriterComposer  from './components/WriterComposer'
import RoleSelectModal from './components/RoleSelectModal'
import PinModal        from './components/PinModal'
import Journal         from './components/Journal'
import Toast           from './components/Toast'

// ── Storage keys ─────────────────────────────────────────────
const JOURNAL_KEY      = 'love_journal_entries'
const ROLE_KEY         = 'user_role'
const WRITER_MSG_KEY   = 'writer_messages'

function loadStored() {
  try {
    const raw = localStorage.getItem(JOURNAL_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return DUMMY_ENTRIES
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

// ─────────────────────────────────────────────────────────────
export default function App() {
  // ── State ──────────────────────────────────────────────────
  const [entries,        setEntries]        = useState(buildInitialEntries)
  const [role,           setRole]           = useState(loadRole)        // null | 'writer' | 'reader'
  const [writerMessages, setWriterMessages] = useState(loadWriterMessages)
  const [easterOpen,     setEasterOpen]     = useState(false)
  const [pinOpen,        setPinOpen]        = useState(false)
  const [toast,          setToast]          = useState(null)
  const [musicOn,        setMusicOn]        = useState(false)

  const audioRef      = useRef(null)
  const toastTimerRef = useRef(null)

  // ── Derived ────────────────────────────────────────────────
  const dayCount       = getDayCount(CONFIG.startDate)
  const fallbackMsg    = getMessageForDay(dayCount, LOVE_MESSAGES)
  const customMsg      = todayWriterMessage(writerMessages)
  const effectiveMsg   = customMsg ?? fallbackMsg   // writer's msg takes priority

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
    if (!customMsg) return
    const today = todayISO()
    const alreadyOnTimeline = entries.some(
      e => e.date === today && (e.source === 'daily' || e.source === 'writer'),
    )
    if (alreadyOnTimeline) return
    addEntry(customMsg, today, 'daily')
    showToast('Added to our timeline ✨')
  }, [customMsg, entries, addEntry, showToast])

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
      <Particles />
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
            message={effectiveMsg}
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
