import { useState, useEffect } from 'react'
import { isArabic, triggerRipple, formatTime, todayISO } from '../utils'
import { CONFIG } from '../data'

const READER_COMMENT_MAX = 500

export default function DailyMessage({
  dayCount,
  message,
  journalEntryId = null,
  journalEntrySource = null,
  readerComment = null,
  onSaveReaderComment,
  onEasterEgg,
  onReveal,
}) {
  const [revealed,  setRevealed]  = useState(() => localStorage.getItem('revealedDay') === String(dayCount))
  const [hiding,    setHiding]    = useState(false)
  const [tapCount,  setTapCount]  = useState(0)
  const [pulse,     setPulse]     = useState(false)
  const [replyDraft, setReplyDraft] = useState(() => readerComment ?? '')

  useEffect(() => {
    setReplyDraft(readerComment ?? '')
  }, [readerComment])

  const isFuture = dayCount < 1

  function handleTap(e) {
    triggerRipple(e.currentTarget, e.clientX, e.clientY)

    if (isFuture) return

    if (!revealed) {
      setHiding(true)
      setTimeout(() => {
        setRevealed(true)
        localStorage.setItem('revealedDay', String(dayCount))
        onReveal?.()
      }, 450)
      return
    }

    // Visual pulse feedback
    setPulse(true)
    setTimeout(() => setPulse(false), 160)

    const next = tapCount + 1
    setTapCount(next)
    if (next >= CONFIG.easterTaps) onEasterEgg()
  }

  const arabic = message && isArabic(message)
  const replyArabic = replyDraft.length > 0 && isArabic(replyDraft)
  const timeLabel = formatTime(
    journalEntryId ?? `${todayISO()}T12:00:00.000Z`,
  )

  const replyDirty =
    replyDraft.trim() !== (readerComment ?? '').trim()
  const canSaveReply = replyDirty && (replyDraft.trim().length > 0 || (readerComment ?? '').trim().length > 0)

  function handleSaveReply(e) {
    e.preventDefault()
    e.stopPropagation()
    if (!canSaveReply) return
    onSaveReaderComment?.(replyDraft)
  }

  return (
    <section className="section daily-section">
      <div className="section-eyebrow">Today's Message</div>

      <div
        className={`message-card glass-card ${revealed && !isFuture ? 'message-card--revealed' : ''}`}
        role="button"
        tabIndex={0}
        aria-label="Tap to reveal today's message"
        onClick={handleTap}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleTap(e) } }}
        style={pulse ? { transform: 'scale(0.98)' } : undefined}
      >
        {/* Corner accent — bottom left (reader only) */}
        <img
          className="hk-card-corner"
          src="/stickers/hk-heart.svg"
          alt=""
          aria-hidden="true"
          draggable="false"
        />

        {/* Reveal overlay */}
        {!revealed && !isFuture && (
          <div className={`reveal-overlay ${hiding ? 'hiding' : ''}`}>
            <div className="reveal-heart">♥</div>
            <p className="reveal-hint">Tap to reveal<br />today's message</p>
          </div>
        )}

        {/* Message — same structure + typography as timeline entry cards */}
        {revealed && message && (
          <div className="message-content message-content--like-entry" dir={arabic ? 'rtl' : undefined}>
            <div className="entry-header daily-message-entry-header">
              <span className="entry-timestamp">
                {timeLabel}
                {journalEntrySource === 'writer' ? (
                  <span className="entry-source-badge">✍️ Love note</span>
                ) : (
                  <span className="entry-source-badge">💌 Daily</span>
                )}
              </span>
            </div>
            <div className="entry-body">{message}</div>
          </div>
        )}

        {revealed && !message && !isFuture && (
          <div className="message-content message-content--like-entry message-content-empty">
            <div className="entry-header daily-message-entry-header">
              <span className="entry-timestamp">
                {timeLabel}
                <span className="entry-source-badge">💌 Daily</span>
              </span>
            </div>
            <div className="entry-body">No message yet — they have not written one. 💌</div>
          </div>
        )}

        {/* Future */}
        {isFuture && (
          <div className="future-message">
            <div className="future-icon">⏳</div>
            <p>Not yet… come back tomorrow ❤️</p>
          </div>
        )}
      </div>

      {/* Outside tappable card so typing / buttons don't trigger reveal or easter-egg taps */}
      {revealed && message && !isFuture && (
        <form
          className="reader-comment glass-card"
          onSubmit={handleSaveReply}
          onClick={e => e.stopPropagation()}
        >
          <div className="reader-comment-label">Your reply</div>
          <textarea
            className="journal-textarea reader-comment-textarea"
            rows={3}
            maxLength={READER_COMMENT_MAX}
            placeholder="Leave a comment on this message… 💬"
            value={replyDraft}
            onChange={e => setReplyDraft(e.target.value)}
            onKeyDown={e => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault()
                if (canSaveReply) onSaveReaderComment?.(replyDraft)
              }
            }}
            dir={replyArabic ? 'rtl' : 'ltr'}
            style={{
              textAlign: replyArabic ? 'right' : 'left',
              fontFamily: replyArabic ? "'Cairo', system-ui, sans-serif" : undefined,
            }}
            aria-label="Your reply to today's message"
          />
          <div className="reader-comment-footer">
            <span className="char-count">{replyDraft.length} / {READER_COMMENT_MAX}</span>
            <button
              type="submit"
              className="btn-primary"
              disabled={!canSaveReply}
              aria-label="Save reply"
            >
              Save reply
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
