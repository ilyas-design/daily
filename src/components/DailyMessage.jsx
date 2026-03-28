import { useState, useEffect } from 'react'
import { isArabic, triggerRipple, formatTime, todayISO } from '../utils'
import { CONFIG } from '../data'

const READER_COMMENT_MAX = 500

const OPEN_MS = 880

/** Session-only: each new visit starts with the closed envelope (letter first, then tap to open). */
const SESSION_REVEAL_KEY = 'revealedLetterDay'

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
  const [revealed, setRevealed] = useState(
    () => typeof sessionStorage !== 'undefined' && sessionStorage.getItem(SESSION_REVEAL_KEY) === String(dayCount),
  )
  const [opening, setOpening] = useState(false)
  const [tapCount, setTapCount] = useState(0)
  const [pulse, setPulse] = useState(false)
  const [replyDraft, setReplyDraft] = useState(() => readerComment ?? '')

  useEffect(() => {
    setReplyDraft(readerComment ?? '')
  }, [readerComment])

  useEffect(() => {
    setRevealed(sessionStorage.getItem(SESSION_REVEAL_KEY) === String(dayCount))
  }, [dayCount])

  const isFuture = dayCount < 1

  function finishReveal() {
    setRevealed(true)
    setOpening(false)
    try {
      sessionStorage.setItem(SESSION_REVEAL_KEY, String(dayCount))
    } catch {}
    onReveal?.()
  }

  function resetEnvelope() {
    try { sessionStorage.removeItem(SESSION_REVEAL_KEY) } catch {}
    setRevealed(false)
    setOpening(false)
    setTapCount(0)
  }

  function handleTap(e) {
    if (isFuture) return

    if (!revealed) {
      if (opening) return
      triggerRipple(e.currentTarget, e.clientX, e.clientY)
      setOpening(true)
      window.setTimeout(finishReveal, OPEN_MS)
      return
    }

    triggerRipple(e.currentTarget, e.clientX, e.clientY)

    setPulse(true)
    window.setTimeout(() => setPulse(false), 160)

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

  function handleSaveReply(ev) {
    ev.preventDefault()
    ev.stopPropagation()
    if (!canSaveReply) return
    onSaveReaderComment?.(replyDraft)
  }

  return (
    <section className="section daily-section">
      <div className="section-eyebrow">Today's Message</div>

      <div
        id="todays-quote"
        className={`message-card glass-card ${revealed && !isFuture ? 'message-card--revealed' : ''} ${opening ? 'message-card--opening' : ''}`}
        role="button"
        tabIndex={0}
        aria-label={revealed ? "Today's message" : "Open today's letter"}
        onClick={handleTap}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleTap(e) } }}
        style={pulse ? { transform: 'scale(0.98)' } : undefined}
      >
        <img
          className="hk-card-corner"
          src="/stickers/hk-heart.svg"
          alt=""
          aria-hidden="true"
          draggable="false"
        />

        {/* Floating closed letter */}
        {!revealed && !isFuture && (
          <div className={`letter-scene ${opening ? 'letter-scene--opening' : ''}`}>
            <div className="letter-float" aria-hidden="true">
              <div className="envelope">
                <div className="envelope-glow" />
                <div className="paper-peek">
                  <span className="paper-peek-line" />
                  <span className="paper-peek-line" />
                  <span className="paper-peek-line short" />
                </div>
                <div className="envelope-back" />
                <div className="envelope-pocket" />
                <div className="envelope-flap" />
                <div className="envelope-stamp" aria-hidden="true">♡</div>
                <div className="envelope-seal">
                  <span>♥</span>
                </div>
              </div>
            </div>
            <p className="letter-hint">Tap to open your letter</p>
          </div>
        )}

        {revealed && message && (
          <div
            className="message-content message-content--like-entry message-content--paper message-content--letter-out"
            dir={arabic ? 'rtl' : undefined}
          >
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
          <div className="message-content message-content--like-entry message-content-empty message-content--paper message-content--letter-out">
            <div className="entry-header daily-message-entry-header">
              <span className="entry-timestamp">
                {timeLabel}
                <span className="entry-source-badge">💌 Daily</span>
              </span>
            </div>
            <div className="entry-body">No message yet — they have not written one. 💌</div>
          </div>
        )}

        {isFuture && (
          <div className="future-message">
            <div className="future-icon">⏳</div>
            <p>Not yet… come back tomorrow ❤️</p>
          </div>
        )}
      </div>

      {revealed && !isFuture && (
        <button
          type="button"
          className="btn-replay-envelope"
          onClick={resetEnvelope}
          aria-label="Replay envelope animation"
        >
          ↺ replay
        </button>
      )}

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
