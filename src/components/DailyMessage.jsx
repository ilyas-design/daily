import { useState } from 'react'
import { pickHkPng } from '../hkAssets'
import { isArabic, triggerRipple } from '../utils'
import { CONFIG } from '../data'

export default function DailyMessage({ dayCount, message, onEasterEgg, onReveal }) {
  const [revealed,  setRevealed]  = useState(() => localStorage.getItem('revealedDay') === String(dayCount))
  const [hiding,    setHiding]    = useState(false)
  const [tapCount,  setTapCount]  = useState(0)
  const [pulse,     setPulse]     = useState(false)

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

  return (
    <section className="section daily-section">
      <div className="section-eyebrow">Today's Message</div>

      <div
        className="message-card glass-card"
        role="button"
        tabIndex={0}
        aria-label="Tap to reveal today's message"
        onClick={handleTap}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleTap(e) } }}
        style={pulse ? { transform: 'scale(0.98)' } : undefined}
      >
        {/* HK face peeking */}
        <img
          className="hk-card-peek"
          src={pickHkPng(dayCount, 3)}
          alt="" aria-hidden="true" draggable="false"
        />

        {/* Reveal overlay */}
        {!revealed && !isFuture && (
          <div className={`reveal-overlay ${hiding ? 'hiding' : ''}`}>
            <div className="reveal-heart">♥</div>
            <p className="reveal-hint">Tap to reveal<br />today's message</p>
          </div>
        )}

        {/* Message */}
        {revealed && message && (
          <div className="message-content">
            <span className="quote-mark open">"</span>
            <p
              className="message-text"
              dir={arabic ? 'rtl' : undefined}
              style={arabic ? { textAlign: 'right', fontFamily: "'Cairo', system-ui, sans-serif", fontStyle: 'normal' } : undefined}
            >
              {message}
            </p>
            <span className="quote-mark close">"</span>
            <div className="message-day-tag">Day {dayCount}</div>
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
    </section>
  )
}
