import { useState, useEffect } from 'react'
import { pickHkPng } from '../hkAssets'
import { CONFIG } from '../data'
import { todayISO, formatDateLabel, isArabic, triggerRipple } from '../utils'

export default function WriterComposer({ writerMessages, onSave, dayCount = 0 }) {
  const today = todayISO()
  const [selectedDate, setSelectedDate] = useState(today)

  const existing = writerMessages[selectedDate] ?? null

  const [text, setText] = useState(() => writerMessages[today] ?? '')
  const [saved, setSaved] = useState(!!(writerMessages[today] ?? null))

  useEffect(() => {
    const ex = writerMessages[selectedDate] ?? null
    setText(ex ?? '')
    setSaved(!!ex)
  }, [selectedDate, writerMessages])

  const charCount = text.length
  const arabic    = isArabic(text)
  const isDirty   = text.trim() !== (existing ?? '').trim()

  const [sendConfirmOpen, setSendConfirmOpen] = useState(false)

  useEffect(() => {
    if (!sendConfirmOpen) return
    const onKey = e => { if (e.key === 'Escape') setSendConfirmOpen(false) }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [sendConfirmOpen])

  function openSendConfirm() {
    if (!text.trim() || !isDirty) return
    setSendConfirmOpen(true)
  }

  function handleConfirmSend(e) {
    if (!text.trim()) return
    triggerRipple(e.currentTarget, e.clientX, e.clientY)
    onSave(text.trim(), selectedDate)
    setSaved(true)
    setSendConfirmOpen(false)
  }

  return (
    <section className="section daily-section">
      <div className="section-eyebrow">Write Today's Message</div>

      <div className="journal-composer glass-card writer-composer" id="todays-quote">
        <img className="writer-hk-corner" src={pickHkPng(dayCount, 41)} alt="" aria-hidden="true" draggable="false" />
        <div className="composer-date-row">
          <span className="composer-date-bow">🎀</span>
          <input
            type="date"
            className="date-input writer-date-input"
            value={selectedDate}
            min={CONFIG.startDate}
            max={today}
            onChange={e => setSelectedDate(e.target.value)}
            aria-label="Choose date for this message"
          />
        </div>

        <div className="composer-divider" />

        <textarea
          className="journal-textarea"
          placeholder="Write a love message for today… 💌"
          rows={4}
          maxLength={600}
          value={text}
          onChange={e => { setText(e.target.value); setSaved(false) }}
          onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') openSendConfirm() }}
          dir={arabic ? 'rtl' : 'ltr'}
          style={{
            textAlign:  arabic ? 'right' : 'left',
            fontFamily: arabic ? "'Cairo', system-ui, sans-serif" : undefined,
          }}
          aria-label="Write today's love message"
        />

        <div className="composer-footer">
          <span className="char-count">{charCount} / 600</span>
          <button
            type="button"
            className="btn-primary"
            onClick={openSendConfirm}
            disabled={!text.trim() || !isDirty}
            aria-label="Review and send message"
          >
            {existing && !isDirty ? 'Saved ✓' : existing ? 'Update ♥' : 'Send ♥'}
          </button>
        </div>

        {saved && !isDirty && (
          <div className="writer-saved-banner">
            💌 Saved — it appears on your timeline below
          </div>
        )}
      </div>

      {sendConfirmOpen && (
        <div
          className="modal-overlay"
          role="presentation"
          onClick={e => { if (e.target === e.currentTarget) setSendConfirmOpen(false) }}
        >
          <div className="modal-card glass-card writer-send-confirm" role="dialog" aria-modal="true" aria-labelledby="writer-send-title">
            <h2 id="writer-send-title" className="writer-send-title">Send this message?</h2>
            <p className="writer-send-meta">{formatDateLabel(selectedDate)}</p>
            <p className="writer-send-preview">{text.trim()}</p>
            <p className="writer-send-hint">This adds it to <strong>Our Journal</strong> and shares it with the reader for that day. You can remove it from the timeline anytime.</p>
            <div className="writer-send-actions">
              <button type="button" className="btn-secondary" onClick={() => setSendConfirmOpen(false)}>
                Cancel
              </button>
              <button type="button" className="btn-primary" onClick={handleConfirmSend} aria-label="Confirm send">
                Send ♥
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
