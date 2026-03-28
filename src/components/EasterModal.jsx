import { useEffect } from 'react'
import { pickHkPng } from '../hkAssets'
import { EASTER_MESSAGES } from '../data'

const msg = EASTER_MESSAGES[Math.floor(Math.random() * EASTER_MESSAGES.length)]

export default function EasterModal({ onClose, dayCount = 0 }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const onKey = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-card glass-card" role="dialog" aria-modal="true">
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        <img className="easter-hk-mini" src={pickHkPng(dayCount, 53)} alt="" aria-hidden="true" draggable="false" />
        <div className="easter-hearts" aria-hidden="true">♥ ♥ ♥</div>
        <h2 className="easter-title">A Secret Just For You</h2>
        <p className="easter-text">{msg}</p>
        <div className="easter-footer">— always &amp; forever</div>
      </div>
    </div>
  )
}
