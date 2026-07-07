import { useState, useCallback } from 'react'
import type { TimelineSliderProps } from '../../types/components'

export function TimelineSlider({ minDate, maxDate, value, onChange, isPlaying, onPlay, onPause }: TimelineSliderProps) {
  const [fromIdx, setFromIdx] = useState(0)
  const [toIdx, setToIdx] = useState(100)

  const minTs = new Date(minDate).getTime()
  const maxTs = new Date(maxDate).getTime()

  const fromTs = minTs + (maxTs - minTs) * (fromIdx / 100)
  const toTs = minTs + (maxTs - minTs) * (toIdx / 100)

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString('es-PA', { year: 'numeric', month: 'short' })
  }

  return (
    <div className="timeline-slider">
      <div className="timeline-label">
        <span>{formatDate(fromTs)}</span>
        <span className="timeline-range-label">Timeline</span>
        <span>{formatDate(toTs)}</span>
      </div>
      <div className="timeline-controls">
        <button className="timeline-play" onClick={isPlaying ? onPause : onPlay}>
          {isPlaying ? '⏸' : '▶'}
        </button>
        <div className="timeline-track">
          <input
            type="range"
            min={0}
            max={100}
            value={fromIdx}
            onChange={e => {
              const v = Number(e.target.value)
              setFromIdx(v)
              if (v >= toIdx) setToIdx(v + 1)
            }}
            className="timeline-input timeline-from"
          />
          <input
            type="range"
            min={0}
            max={100}
            value={toIdx}
            onChange={e => {
              const v = Number(e.target.value)
              setToIdx(v)
              if (v <= fromIdx) setFromIdx(v - 1)
            }}
            className="timeline-input timeline-to"
          />
          <div
            className="timeline-selection"
            style={{
              left: `${fromIdx}%`,
              width: `${toIdx - fromIdx}%`,
            }}
          />
        </div>
      </div>
    </div>
  )
}
