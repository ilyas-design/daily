import { useState } from 'react'
import { pickHkPng } from '../hkAssets'
import { todayISO, formatDateLabel, formatTime, isArabic, groupByDate, triggerRipple } from '../utils'

export default function Journal({ entries, onAdd, onDelete, showToast, showComposer = true, dayCount = 0 }) {
  const [text, setText] = useState('')
  const [date, setDate] = useState(todayISO)

  const charCount = text.length
  const arabic    = isArabic(text)
  const groups    = groupByDate(entries)

  function handleSave(e) {
    if (!text.trim()) {
      showToast('Write something first ✍️')
      return
    }
    triggerRipple(e.currentTarget, e.clientX, e.clientY)
    onAdd(text.trim(), date || todayISO())
    setText('')
    setDate(todayISO())
  }

  return (
    <section className="section journal-section">
      <div className="section-eyebrow">Our Journal</div>

      {/* ── Composer ─────────────────────────────── */}
      {showComposer && <div className="journal-composer glass-card">
        <div className="composer-date-row">
          <span className="composer-date-bow">🎀</span>
          <input
            type="date"
            className="date-input"
            value={date}
            max={todayISO()}
            onChange={e => setDate(e.target.value)}
            aria-label="Entry date"
          />
        </div>

        <div className="composer-divider" />

        <textarea
          className="journal-textarea"
          placeholder="Write something beautiful… ✍️"
          rows={3}
          maxLength={1000}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleSave(e) }}
          dir={arabic ? 'rtl' : 'ltr'}
          style={{
            textAlign:  arabic ? 'right' : 'left',
            fontFamily: arabic ? "'Cairo', system-ui, sans-serif" : undefined,
          }}
          aria-label="Write a journal entry"
        />

        <div className="composer-footer">
          <span className="char-count">{charCount} / 1000</span>
          <button className="btn-primary" onClick={handleSave} aria-label="Save entry">
            Save <span aria-hidden="true">♥</span>
          </button>
        </div>
      </div>}

      {/* ── Empty state ───────────────────────────── */}
      {entries.length === 0 && (
        <div className="empty-journal">
          <img src={pickHkPng(dayCount, 9)} alt="" className="empty-hk" />
          <p>Your shared journal is empty.<br />Write the first entry ♥</p>
        </div>
      )}

      {/* ── Timeline ─────────────────────────────── */}
      {entries.length > 0 && (
        <div className="timeline" role="list" aria-label="Journal entries">
          {groups.map(group => (
            <TimelineGroup key={group.date} group={group} onDelete={onDelete} />
          ))}
        </div>
      )}
    </section>
  )
}

function TimelineGroup({ group, onDelete }) {
  return (
    <div className="timeline-group" role="listitem">
      <div className="timeline-date-header">
        <span className="timeline-date-bow">🎀</span>
        <span className="timeline-date-label">{formatDateLabel(group.date)}</span>
      </div>
      <div className="timeline-entries">
        {group.entries.map(entry => (
          <EntryCard key={entry.id} entry={entry} onDelete={onDelete} />
        ))}
      </div>
    </div>
  )
}

function EntryCard({ entry, onDelete }) {
  const [removing, setRemoving] = useState(false)
  const arabic = isArabic(entry.text)

  function handleDelete() {
    setRemoving(true)
    setTimeout(() => onDelete(entry.id), 340)
  }

  return (
    <div className="entry-wrapper">
      <img
        className="entry-hk-sticker"
        src="https://pngimg.com/uploads/hello_kitty/hello_kitty_PNG14.png"
        alt=""
        aria-hidden="true"
        draggable="false"
      />
      <div
        className={`entry-card glass-card ${removing ? 'removing' : ''}`}
        dir={arabic ? 'rtl' : undefined}
        role="listitem"
      >
        <div className="entry-header">
          <span className="entry-timestamp">
            {formatTime(entry.id)}
            {entry.source === 'daily' && <span className="entry-source-badge">💌 Daily</span>}
            {entry.source === 'writer' && <span className="entry-source-badge">✍️ Love note</span>}
            {entry.source === 'reader' && <span className="entry-source-badge">💬 Reply</span>}
          </span>
          <button className="entry-delete" onClick={handleDelete} aria-label="Delete entry">✕</button>
        </div>
        <div className="entry-body">{entry.text}</div>
      </div>
    </div>
  )
}
