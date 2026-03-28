export default function MusicBtn({ playing, onToggle }) {
  return (
    <button
      className={`music-btn ${playing ? 'playing' : ''}`}
      onClick={onToggle}
      aria-label={playing ? 'Mute music' : 'Play ambient music'}
      title={playing ? 'Music on' : 'Music off'}
    >
      {playing ? (
        <svg className="music-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 3v10.55A4 4 0 1 0 11 17V7h4V3H9Z"/>
        </svg>
      ) : (
        <svg className="music-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 3v10.55A4 4 0 1 0 11 17V7h4V3H9ZM2.1 2.1 1 3.2l3.15 3.15L2 8h4l5 5V8.8l4.18 4.18A4 4 0 0 1 9 16.55v.01A3.97 3.97 0 0 1 5.73 15H4.27A5 5 0 0 0 9 18.55a5.01 5.01 0 0 0 4.95-4.33L20.8 21.9l1.1-1.1L2.1 2.1Z"/>
        </svg>
      )}
    </button>
  )
}
