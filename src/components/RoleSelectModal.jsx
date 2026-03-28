import { useEffect } from 'react'

export default function RoleSelectModal({ onSelect }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div className="modal-overlay role-overlay">
      <div className="modal-card glass-card role-modal">

        {/* Bow */}
        <div className="hk-bow" aria-hidden="true" style={{ marginBottom: '12px' }}>
          <svg viewBox="0 0 100 56" xmlns="http://www.w3.org/2000/svg">
            <path d="M48 28 C38 16 6 2 2 22 C-1 36 18 50 48 28Z" fill="#FF6B9D"/>
            <path d="M48 28 C38 18 10 8  8 24 C 6 35 22 46 48 28Z" fill="#FFB3CC"/>
            <path d="M52 28 C62 16 94 2 98 22 C101 36 82 50 52 28Z" fill="#FF6B9D"/>
            <path d="M52 28 C62 18 90 8 92 24 C 94 35 78 46 52 28Z" fill="#FFB3CC"/>
            <ellipse cx="50" cy="28" rx="9" ry="9" fill="#E91E8C"/>
            <ellipse cx="50" cy="28" rx="5" ry="5" fill="#FF6B9D"/>
          </svg>
        </div>

        <h2 className="easter-title" style={{ marginBottom: '6px' }}>Our Little World</h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '28px' }}>
          Who are you today?
        </p>

        <div className="role-modal-cards">
          <button className="role-card" onClick={() => onSelect('writer')}>
            <span className="role-card-icon">✍️</span>
            <span className="role-card-title">Writer</span>
            <span className="role-card-desc">You write today's<br />love message</span>
          </button>

          <button className="role-card" onClick={() => onSelect('reader')}>
            <span className="role-card-icon">💌</span>
            <span className="role-card-title">Reader</span>
            <span className="role-card-desc">You receive today's<br />love message</span>
          </button>
        </div>

      </div>
    </div>
  )
}
