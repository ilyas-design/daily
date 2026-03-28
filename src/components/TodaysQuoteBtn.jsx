import { useRef } from 'react'

export default function TodaysQuoteBtn({ role, onWriterHint }) {
  const writerHintShown = useRef(false)

  function scrollToQuote() {
    if (role === 'writer' && !writerHintShown.current) {
      writerHintShown.current = true
      onWriterHint?.()
    }

    const el = document.getElementById('todays-quote')
    if (!el) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.classList.remove('todays-quote-highlight')
    void el.offsetWidth
    el.scrollIntoView({
      block: 'center',
      behavior: reduceMotion ? 'auto' : 'smooth',
    })
    el.classList.add('todays-quote-highlight')
    window.setTimeout(() => {
      el.classList.remove('todays-quote-highlight')
    }, 2400)
  }

  return (
    <button
      type="button"
      className="todays-quote-btn"
      onClick={scrollToQuote}
      aria-label={
        role === 'writer'
          ? "Scroll to today's message composer"
          : "Scroll to today's letter"
      }
      title={role === 'writer' ? "Today's message (writer)" : "Today's letter"}
    >
      Today's quote
    </button>
  )
}
