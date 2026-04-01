'use client'

import { useState } from 'react'

interface Props {
  value: number          // 0–5, soporta decimales para display
  max?: number
  size?: number
  interactive?: boolean
  onChange?: (rating: number) => void
  className?: string
}

function StarPath({ fill }: { fill: 'full' | 'half' | 'empty' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="w-full h-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`grad-${fill}`} x1="0%" y1="0%" x2="100%" y2="0%">
          {fill === 'full'  && <stop offset="100%" stopColor="#F59E0B" />}
          {fill === 'half'  && <>
            <stop offset="50%"  stopColor="#F59E0B" />
            <stop offset="50%"  stopColor="#E2E8F0" />
          </>}
          {fill === 'empty' && <stop offset="100%" stopColor="#E2E8F0" />}
        </linearGradient>
      </defs>
      <polygon
        points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
        fill={`url(#grad-${fill})`}
        stroke="none"
      />
    </svg>
  )
}

export default function StarRating({
  value,
  max = 5,
  size = 20,
  interactive = false,
  onChange,
  className = '',
}: Props) {
  const [hovered, setHovered] = useState<number | null>(null)

  const display = hovered ?? value

  function fillFor(index: number): 'full' | 'half' | 'empty' {
    const pos = index + 1
    if (display >= pos) return 'full'
    if (display >= pos - 0.5) return 'half'
    return 'empty'
  }

  return (
    <div
      className={`flex items-center gap-0.5 ${className}`}
      style={{ height: size }}
      role={interactive ? 'radiogroup' : undefined}
      aria-label={`Rating: ${value} de ${max} estrellas`}
    >
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          style={{ width: size, height: size }}
          className={interactive ? 'cursor-pointer transition-transform hover:scale-110' : ''}
          onMouseEnter={interactive ? () => setHovered(i + 1) : undefined}
          onMouseLeave={interactive ? () => setHovered(null)  : undefined}
          onClick={interactive && onChange ? () => onChange(i + 1) : undefined}
          role={interactive ? 'radio' : undefined}
          aria-checked={interactive ? value === i + 1 : undefined}
          tabIndex={interactive ? 0 : undefined}
          onKeyDown={interactive && onChange ? (e) => {
            if (e.key === 'Enter' || e.key === ' ') onChange(i + 1)
          } : undefined}
        >
          <StarPath fill={fillFor(i)} />
        </span>
      ))}
    </div>
  )
}
