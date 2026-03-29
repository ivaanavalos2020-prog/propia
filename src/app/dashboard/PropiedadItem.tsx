'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase-client'

const BASE_URL = 'https://propia-kappa.vercel.app'

const TIPO_LABEL: Record<string, string> = {
  departamento: 'Departamento',
  casa: 'Casa',
  habitacion: 'Habitación',
  local: 'Local comercial',
}

interface Props {
  id: string
  type: string
  address: string
  price_usd: number
  includes_expenses: boolean | null
  status: string
}

export default function PropiedadItem({ id, type, address, price_usd, includes_expenses, status: statusInicial }: Props) {
  const [copiado, setCopiado] = useState(false)
  const [status, setStatus] = useState(statusInicial)
  const [cambiando, setCambiando] = useState(false)

  const activa = status === 'active'

  async function copiarLink() {
    await navigator.clipboard.writeText(`${BASE_URL}/propiedades/${id}`)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  async function toggleStatus() {
    setCambiando(true)
    const nuevoStatus = activa ? 'paused' : 'active'
    const supabase = createClient()
    const { error } = await supabase
      .from('properties')
      .update({ status: nuevoStatus })
      .eq('id', id)
    if (!error) setStatus(nuevoStatus)
    setCambiando(false)
  }

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-zinc-50">
            {TIPO_LABEL[type] ?? type}
          </span>
          {activa ? (
            <span className="rounded-full bg-emerald-950 px-2 py-0.5 text-xs font-medium text-emerald-400">
              Activa
            </span>
          ) : (
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-500">
              Pausada
            </span>
          )}
        </div>
        <span className="truncate text-sm text-zinc-400">{address}</span>
      </div>

      <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
        <div className="flex flex-col items-start sm:items-end gap-0.5">
          <span className="text-sm font-semibold text-zinc-50">
            USD {Number(price_usd).toLocaleString('es-AR')}
          </span>
          <span className="text-xs text-zinc-500">
            {includes_expenses ? 'Expensas incluidas' : 'Sin expensas'}
          </span>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/propiedades/${id}`}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-50"
          >
            Ver publicación
          </Link>
          <button
            type="button"
            onClick={copiarLink}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-50"
          >
            {copiado ? '¡Copiado!' : 'Copiar link'}
          </button>
          <button
            type="button"
            onClick={toggleStatus}
            disabled={cambiando}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-50 disabled:opacity-40"
          >
            {cambiando ? '...' : activa ? 'Pausar' : 'Activar'}
          </button>
        </div>
      </div>
    </li>
  )
}
