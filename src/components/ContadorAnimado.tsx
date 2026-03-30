'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  target: number
  suffix?: string
  prefix?: string
  duration?: number
  className?: string
}

export default function ContadorAnimado({
  target,
  suffix = '',
  prefix = '',
  duration = 1500,
  className = '',
}: Props) {
  const [current, setCurrent] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          observer.disconnect()

          const startTime = performance.now()
          function tick(now: number) {
            const progress = Math.min((now - startTime) / duration, 1)
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3)
            setCurrent(Math.round(target * eased))
            if (progress < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.5 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [target, duration])

  return (
    <span ref={ref} className={className}>
      {prefix}
      {current}
      {suffix}
    </span>
  )
}
