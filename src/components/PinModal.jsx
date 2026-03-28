import { useState, useEffect, useRef } from 'react'
import { CONFIG } from '../data'

export default function PinModal({ onSuccess, onCancel }) {
  const [digits, setDigits]   = useState(['', '', '', ''])
  const [error,  setError]    = useState(false)
  const [shake,  setShake]    = useState(false)
  const inputRefs = [useRef(), useRef(), useRef(), useRef()]

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    inputRefs[0].current?.focus()
    const onKey = e => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKey)
    }
  }, [onCancel])

  function handleDigit(index, value) {
    const clean = value.replace(/\D/g, '').slice(-1)
    const next  = [...digits]
    next[index] = clean
    setDigits(next)
    setError(false)

    if (clean && index < 3) {
      inputRefs[index + 1].current?.focus()
    }

    // Auto-check when all 4 filled
    if (clean && index === 3) {
      const pin = [...next.slice(0, 3), clean].join('')
      verify(pin)
    }
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs[index - 1].current?.focus()
    }
  }

  function verify(pin) {
    if (pin === String(CONFIG.writerPin)) {
      onSuccess()
    } else {
      setError(true)
      setShake(true)
      setDigits(['', '', '', ''])
      setTimeout(() => {
        setShake(false)
        inputRefs[0].current?.focus()
      }, 600)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onCancel() }}>
      <div className={`modal-card glass-card pin-modal ${shake ? 'pin-shake' : ''}`}>
        <button className="modal-close" onClick={onCancel} aria-label="Cancel">×</button>

        <div className="pin-icon">🔐</div>
        <h2 className="easter-title">Writer Mode</h2>
        <p className="pin-subtitle">Enter your PIN to continue</p>

        <div className="pin-dots">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={inputRefs[i]}
              className={`pin-dot ${d ? 'filled' : ''} ${error ? 'error' : ''}`}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={e => handleDigit(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              aria-label={`PIN digit ${i + 1}`}
            />
          ))}
        </div>

        {error && <p className="pin-error">Wrong PIN, try again</p>}
      </div>
    </div>
  )
}
