'use client'

import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  baseRadius: number
  color: string
  opacity: number
  pulseSpeed: number
  pulsePhase: number
}

export default function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const isMobile = window.innerWidth < 768
    if (isMobile) return // sin canvas en mobile

    const N = 80
    const COLORS = ['#2563EB', '#16A34A']
    const CONNECTION_DIST = 150

    let W = 0
    let H = 0
    let frameId = 0
    let t = 0
    let particles: Particle[] = []

    function resize() {
      const parent = canvas.parentElement
      W = parent ? parent.offsetWidth : window.innerWidth
      H = parent ? parent.offsetHeight : window.innerHeight
      canvas.width = W
      canvas.height = H
    }

    function createParticles() {
      particles = Array.from({ length: N }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        baseRadius: 1.5 + Math.random() * 3,
        radius: 2,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        opacity: 0.25 + Math.random() * 0.35,
        pulseSpeed: 0.015 + Math.random() * 0.02,
        pulsePhase: Math.random() * Math.PI * 2,
      }))
    }

    function hexToRgba(hex: string, alpha: number): string {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      return `rgba(${r},${g},${b},${alpha})`
    }

    function draw() {
      ctx.clearRect(0, 0, W, H)
      t++

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < -10) p.x = W + 10
        if (p.x > W + 10) p.x = -10
        if (p.y < -10) p.y = H + 10
        if (p.y > H + 10) p.y = -10

        const pulse = Math.sin(t * p.pulseSpeed + p.pulsePhase) * 0.3
        const alpha = Math.max(0, Math.min(1, p.opacity + pulse))
        p.radius = p.baseRadius * (1 + Math.sin(t * p.pulseSpeed + p.pulsePhase) * 0.15)

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = hexToRgba(p.color, alpha)
        ctx.fill()
      }

      // Líneas de conexión
      for (let i = 0; i < particles.length - 1; i++) {
        const a = particles[i]
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < CONNECTION_DIST) {
            const alpha = (1 - dist / CONNECTION_DIST) * 0.12
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.strokeStyle = `rgba(37,99,235,${alpha})`
            ctx.lineWidth = 0.8
            ctx.stroke()
          }
        }
      }

      frameId = requestAnimationFrame(draw)
    }

    resize()
    createParticles()
    draw()

    const resizeObs = new ResizeObserver(resize)
    if (canvas.parentElement) resizeObs.observe(canvas.parentElement)

    return () => {
      cancelAnimationFrame(frameId)
      resizeObs.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  )
}
