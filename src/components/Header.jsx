import { useEffect, useRef } from 'react'
import { pickHkPng } from '../hkAssets'
import { formatDateLabel, todayISO } from '../utils'

export default function Header({ dayCount }) {
  const headerRef = useRef(null)

  // Parallax on mouse/touch/gyroscope
  useEffect(() => {
    const el = headerRef.current
    if (!el) return

    function apply(xR, yR) {
      const x = (xR - 0.5) * 24
      const y = (yR - 0.5) * 24
      el.style.transform = `translate(${x * 0.4}px, ${y * 0.3}px)`
    }

    const onMouse = e => apply(e.clientX / window.innerWidth, e.clientY / window.innerHeight)
    const onTouch = e => apply(e.touches[0].clientX / window.innerWidth, e.touches[0].clientY / window.innerHeight)
    const onGyro  = e => { if (e.gamma != null) apply((e.gamma + 45) / 90, (e.beta - 10) / 80) }

    document.addEventListener('mousemove', onMouse)
    document.addEventListener('touchmove', onTouch, { passive: true })
    window.addEventListener('deviceorientation', onGyro)
    return () => {
      document.removeEventListener('mousemove', onMouse)
      document.removeEventListener('touchmove', onTouch)
      window.removeEventListener('deviceorientation', onGyro)
    }
  }, [])

  return (
    <>
      {/* Flanking HK figures (visible on wide screens only) */}
      <img className="hk-float hk-float--left"  src={pickHkPng(dayCount, 0)}  alt="" aria-hidden="true" draggable="false" />
      <img className="hk-float hk-float--right" src={pickHkPng(dayCount, 11)} alt="" aria-hidden="true" draggable="false" />

      <header className="header" ref={headerRef}>
        {/* SVG bow */}
        <div className="hk-bow" aria-hidden="true">
          <svg viewBox="0 0 100 56" xmlns="http://www.w3.org/2000/svg">
            <path d="M48 28 C38 16 6 2 2 22 C-1 36 18 50 48 28Z" fill="#FF6B9D"/>
            <path d="M48 28 C38 18 10 8  8 24 C 6 35 22 46 48 28Z" fill="#FFB3CC"/>
            <path d="M52 28 C62 16 94 2 98 22 C101 36 82 50 52 28Z" fill="#FF6B9D"/>
            <path d="M52 28 C62 18 90 8 92 24 C 94 35 78 46 52 28Z" fill="#FFB3CC"/>
            <ellipse cx="50" cy="28" rx="9" ry="9" fill="#E91E8C"/>
            <ellipse cx="50" cy="28" rx="5" ry="5" fill="#FF6B9D"/>
          </svg>
        </div>

        <div className="glass-badge">
          <span className="day-number">Day {Math.max(dayCount, 1)}</span>
          <span className="day-label">of loving you</span>
        </div>

        <h1 className="app-title">Our Little World</h1>
        <p className="today-date">{formatDateLabel(todayISO())}</p>
      </header>
    </>
  )
}
