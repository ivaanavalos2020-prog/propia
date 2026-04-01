'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'propia_verif_banner_closed'

export default function VerificationBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const closed = localStorage.getItem(STORAGE_KEY)
    if (!closed) setVisible(true)
  }, [])

  function cerrar() {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed left-0 right-0 top-16 z-40 flex items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2.5 md:px-10">
      <div className="flex min-w-0 items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-amber-600">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <p className="truncate text-sm text-amber-800">
          Verificá tu identidad para generar más confianza y recibir 2× más respuestas
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <Link
          href="/verificar-identidad"
          className="whitespace-nowrap text-xs font-semibold text-amber-700 underline underline-offset-2 transition-colors hover:text-amber-900"
        >
          Verificar ahora →
        </Link>
        <button
          type="button"
          onClick={cerrar}
          aria-label="Cerrar banner"
          className="text-amber-500 transition-colors hover:text-amber-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  )
}
