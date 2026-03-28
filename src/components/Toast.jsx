export default function Toast({ message }) {
  return (
    <div className={`toast ${message ? 'visible' : ''}`} role="status" aria-live="polite">
      {message}
    </div>
  )
}
