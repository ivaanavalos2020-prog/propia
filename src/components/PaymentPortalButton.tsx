'use client'

import { useState, useEffect, useRef } from 'react'
import type { ConceptType } from '@/lib/types'
import {
  getPortalesForConcept,
  openPaymentPortal,
  type PaymentPortal,
} from '@/lib/payment-portals'

interface PaymentPortalButtonProps {
  concept_type: ConceptType | string
  // Para contexto en el disclaimer (opcional, reservado para uso futuro)
  period_label?: string
  amount?: number
  // Variante de tamaño para diferentes contextos
  size?: 'sm' | 'md'
  // Callback opcional al hacer clic (para analytics futuro)
  onPortalOpen?: (portal: PaymentPortal) => void
}

export default function PaymentPortalButton({
  concept_type,
  size = 'sm',
  onPortalOpen,
}: PaymentPortalButtonProps) {
  const portales = getPortalesForConcept(concept_type)
  const [open, setOpen] = useState(false)
  const [dropdownDirection, setDropdownDirection] = useState<'down' | 'up'>('down')
  const containerRef = useRef<HTMLDivElement>(null)

  // Cerrar con Escape y click afuera
  useEffect(() => {
    if (!open) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }

    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  // Verificar si hay espacio abajo para el dropdown (evitar salida del viewport en mobile)
  useEffect(() => {
    if (!open || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    setDropdownDirection(spaceBelow < 280 ? 'up' : 'down')
  }, [open])

  if (portales.length === 0) return null

  const sizeClasses =
    size === 'sm'
      ? 'px-2.5 py-1 text-xs'
      : 'px-3 py-1.5 text-sm'

  // Caso de un solo portal: botón directo
  if (portales.length === 1) {
    const portal = portales[0]
    return (
      <button
        type="button"
        onClick={() => {
          openPaymentPortal(portal.url)
          onPortalOpen?.(portal)
        }}
        aria-label={`Pagar ${portal.name} en nueva pestaña`}
        title={portal.name}
        className={`rounded-lg border border-blue-300 bg-white font-semibold text-blue-600 hover:bg-blue-50 ${sizeClasses}`}
      >
        Pagar online ↗
      </button>
    )
  }

  // Caso de múltiples portales: botón con dropdown
  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`rounded-lg border border-blue-300 bg-white font-semibold text-blue-600 hover:bg-blue-50 ${sizeClasses}`}
      >
        Ver opciones {open ? '▲' : '▾'}
      </button>

      {open && (
        <div
          role="listbox"
          className={[
            'absolute right-0 z-50 w-64 rounded-xl border border-slate-200 bg-white shadow-lg',
            dropdownDirection === 'up' ? 'bottom-full mb-1' : 'top-full mt-1',
          ].join(' ')}
        >
          <div className="flex flex-col py-1">
            {portales.map((portal) => (
              <button
                key={portal.id}
                role="option"
                aria-selected={false}
                type="button"
                onClick={() => {
                  openPaymentPortal(portal.url)
                  onPortalOpen?.(portal)
                  setOpen(false)
                }}
                className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50"
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-sm font-semibold text-slate-900">{portal.name}</span>
                  <span className="text-xs text-slate-500">{portal.description}</span>
                </div>
                <span className="mt-0.5 shrink-0 text-slate-400">↗</span>
              </button>
            ))}
          </div>
          <div className="border-t border-slate-100 px-4 py-2">
            <p className="text-xs italic text-slate-400">
              Portales externos. PROPIA no procesa el pago.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
