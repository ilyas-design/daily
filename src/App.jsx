import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { CONFIG, LOVE_MESSAGES } from './data'
import {
  getDayCount, createAudioEngine,
  todayISO, latestWriterMessage, todayMessageFromJournal,
  entrySortTime, getMessageForDay,
} from './utils'
import {
  fetchEntries, saveEntry, deleteEntry, deleteEntriesByDateSource,
  fetchWriterMessages, saveWriterMessageAPI, deleteWriterMessage,
} from './api'

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

const ROLE_KEY = 'user_role'
function loadRole()    { return localStorage.getItem(ROLE_KEY) }
function saveRole(r)   { localStorage.setItem(ROLE_KEY, r) }

// ─────────────────────────────────────────────────────────────
export default function App() {
  // ── State ──────────────────────────────────────────────────
  const [entries,        setEntries]        = useState([])
  const [role,           setRole]           = useState(loadRole)   // null | 'writer' | 'reader'
  const [writerMessages, setWriterMessages] = useState({})
  const [loading,        setLoading]        = useState(true)
  const [easterOpen,     setEasterOpen]     = useState(false)
  const [pinOpen,        setPinOpen]        = useState(false)
  const [toast,          setToast]          = useState(null)
  const [musicOn,        setMusicOn]        = useState(false)
  const [showIntro,      setShowIntro]      = useState(true)

  const audioRef      = useRef(null)
  const toastTimerRef = useRef(null)

  // ── Load data from DB on mount ─────────────────────────────
  useEffect(() => {
    async function loadData() {
      try {
        const [loadedEntries, loadedWM] = await Promise.all([
          fetchEntries(),
          fetchWriterMessages(),
        ])
        setEntries(loadedEntries)
        setWriterMessages(loadedWM)
      } catch (err) {
        console.error('Failed to load data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // ── Derived ────────────────────────────────────────────────
  const dayCount          = getDayCount(CONFIG.startDate)
  const fromJournalToday  = todayMessageFromJournal(entries)
  const latestWriter      = latestWriterMessage(writerMessages)
  const effectiveMsg      = latestWriter || fromJournalToday || null

  const readerDailyMessage = useMemo(() => {
    const t = effectiveMsg && String(effectiveMsg).trim()
    if (t) return t
    if (dayCount < 1) return null
    return getMessageForDay(dayCount, LOVE_MESSAGES)
  }, [effectiveMsg, dayCount])

  const todayJournalMeta = useMemo(() => {
    const t = todayISO()
    const matches = entries.filter(
      e => e.date === t && (e.source === 'daily' || e.source === 'writer'),
    )
    if (matches.length === 0) return { id: null, source: null }
    matches.sort((a, b) => entrySortTime(b) - entrySortTime(a))
    const top = matches[0]
    return { id: top.id, source: top.source }
  }, [entries])

  const todayReaderComment = useMemo(() => {
    const t = todayISO()
    const matches = entries.filter(e => e.date === t && e.source === 'reader')
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
      saveRole('reader')
      setRole('reader')
      showToast('💌 Reader mode')
    } else {
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
  const saveWriterMessage = useCallback(async (text, dateISO) => {
    const day     = dateISO ?? todayISO()
    const trimmed = text.trim()
    const entryId = new Date().toISOString()
    const entry   = { id: entryId, text: trimmed, date: day, source: 'writer' }

    // Optimistic UI update
    setWriterMessages(prev => ({ ...prev, [day]: trimmed }))
    setEntries(prev => {
      const without = prev.filter(e => !(e.source === 'writer' && e.date === day))
      return [...without, entry]
    })

    try {
      await Promise.all([
        saveWriterMessageAPI(day, trimmed),
        saveEntry(entry),
      ])
      showToast('Message saved ♥')
    } catch (err) {
      console.error('Failed to save writer message:', err)
      showToast('Save failed, please retry')
    }
  }, [showToast])

  // ── Journal entries ────────────────────────────────────────
  const addEntry = useCallback(async (text, date, source = null) => {
    const entry = { id: new Date().toISOString(), text, date, source: source || 'daily' }
    setEntries(prev => [...prev, entry])
    if (!source) showToast('Saved 🎀')
    try {
      await saveEntry(entry)
    } catch (err) {
      console.error('Failed to save entry:', err)
    }
  }, [showToast])

  const deleteEntry_ = useCallback(async (id) => {
    const removed = entries.find(e => e.id === id)
    setEntries(prev => prev.filter(e => e.id !== id))
    if (removed?.source === 'writer' && removed?.date) {
      setWriterMessages(wm => {
        const next = { ...wm }
        delete next[removed.date]
        return next
      })
      deleteWriterMessage(removed.date).catch(console.error)
    }
    try {
      await deleteEntry(id)
    } catch (err) {
      console.error('Failed to delete entry:', err)
    }
    showToast('Entry removed')
  }, [entries, showToast])

  // ── Reader reveal → auto-save to timeline ─────────────────
  const handleDailyReveal = useCallback(async () => {
    const text = readerDailyMessage && String(readerDailyMessage).trim()
    if (!text) return
    const today = todayISO()
    const alreadyOnTimeline = entries.some(
      e => e.date === today && (e.source === 'daily' || e.source === 'writer'),
    )
    if (alreadyOnTimeline) return
    const entry = { id: new Date().toISOString(), text, date: today, source: 'daily' }
    setEntries(prev => [...prev, entry])
    showToast('Added to our timeline ✨')
    saveEntry(entry).catch(console.error)
  }, [readerDailyMessage, entries, showToast])

  // ── Reader reply ───────────────────────────────────────────
  const saveReaderComment = useCallback(async (text) => {
    const today   = todayISO()
    const trimmed = String(text ?? '').trim()
    const newEntry = trimmed
      ? { id: new Date().toISOString(), text: trimmed, date: today, source: 'reader' }
      : null

    setEntries(prev => {
      const without = prev.filter(e => !(e.date === today && e.source === 'reader'))
      return newEntry ? [...without, newEntry] : without
    })

    try {
      await deleteEntriesByDateSource(today, 'reader')
      if (newEntry) await saveEntry(newEntry)
    } catch (err) {
      console.error('Failed to save reader comment:', err)
    }
    showToast(trimmed ? 'Reply saved 💌' : 'Reply removed')
  }, [showToast])

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

      {role === null && <RoleSelectModal onSelect={handleRoleSelect} />}

      <div className="app">
        <Header dayCount={dayCount} />

        {role === 'writer' && (
          <WriterComposer
            writerMessages={writerMessages}
            onSave={saveWriterMessage}
            dayCount={dayCount}
          />
        )}

        {role === 'reader' && (
          <DailyMessage
            dayCount={dayCount}
            message={loading ? null : readerDailyMessage}
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

        <Journal
          entries={entries}
          onAdd={addEntry}
          onDelete={deleteEntry_}
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
