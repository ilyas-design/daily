import { useEffect, useRef, useState } from 'react'

export default function SallyIntro({ onDone }) {
  const [fading, setFading] = useState(false)
  const onDoneRef = useRef(onDone)

  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), 3400)
    const t2 = setTimeout(() => onDoneRef.current?.(), 4900)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, []) // runs once on mount, immune to re-renders

  function dismiss() {
    if (fading) return
    setFading(true)
    setTimeout(() => onDoneRef.current?.(), 1500)
  }

  return (
    <div
      className={`sally-intro${fading ? ' sally-intro--out' : ''}`}
      onClick={dismiss}
      aria-hidden="true"
    >
      <div className="sally-intro-bg" />
      <div className="sally-intro-content">
        <span className="sally-intro-decor">✦</span>
        <p className="sally-intro-for">for</p>
        <h1 className="sally-intro-name">Sally</h1>
        <p className="sally-intro-sub">with every beat of my heart</p>
        <span className="sally-intro-heart">♥</span>
      </div>
    </div>
  )
}
