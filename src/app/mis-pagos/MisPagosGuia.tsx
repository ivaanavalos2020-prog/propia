'use client'

import { useState, useEffect } from 'react'
import type { ConceptType } from '@/lib/types'
import { PAYMENT_GUIDE } from '@/lib/payment-portals'

const STORAGE_KEY = 'propia_mispagos_guide_open'

type GuiaEntry = { icon: string; title: string; instructions: string }

interface Props {
  conceptTypes: ConceptType[]
}

export default function MisPagosGuia({ conceptTypes }: Props) {
  const [isOpen, setIsOpen] = useState(false)

  // Hidratar desde localStorage evitando mismatch en SSR
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === 'true') setIsOpen(true)
    } catch {
      // Ignorar: SSR o modo privado
    }
  }, [])

  function toggle() {
    setIsOpen((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, String(next))
      } catch {
        // Ignorar
      }
      return next
    })
  }

  // Solo mostrar los conceptos que el inquilino realmente tiene
  const guiasRelevantes = (
    Object.entries(PAYMENT_GUIDE) as [ConceptType, GuiaEntry][]
  ).filter(([key]) => conceptTypes.includes(key))

  if (guiasRelevantes.length === 0) return null

  return (
    <div className="mb-6 rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <span className="text-sm font-semibold text-slate-700">
          💡 ¿Cómo se paga cada concepto?
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`shrink-0 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Animación por max-height */}
      <div
        style={{ maxHeight: isOpen ? '1000px' : '0px' }}
        className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
      >
        <div className="flex flex-col divide-y divide-slate-100 border-t border-slate-100 px-5">
          {guiasRelevantes.map(([key, guia]) => (
            <div key={key} className="py-4">
              <div className="flex items-center gap-2">
                <span aria-hidden="true">{guia.icon}</span>
                <span className="text-sm font-semibold text-slate-800">{guia.title}</span>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">{guia.instructions}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
