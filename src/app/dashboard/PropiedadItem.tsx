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
    <li className="flex flex-col gap-3 rounded-xl border border-slate-300 bg-white px-5 py-4 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-900">
            {TIPO_LABEL[type] ?? type}
          </span>
          {activa ? (
            <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
              Activa
            </span>
          ) : (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
              Pausada
            </span>
          )}
        </div>
        <span className="truncate text-sm text-slate-500">{address}</span>
      </div>

      <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
        <div className="flex flex-col items-start sm:items-end gap-0.5">
          <span className="text-sm font-bold text-blue-600">
            USD {Number(price_usd).toLocaleString('es-AR')}
            <span className="ml-1 text-xs font-normal text-slate-400">/mes</span>
          </span>
          <span className="text-xs text-slate-400">
            {includes_expenses ? 'Expensas incluidas' : 'Sin expensas'}
          </span>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/propiedades/${id}`}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
          >
            Ver publicación
          </Link>
          <Link
            href={`/dashboard/publicaciones/${id}/editar`}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
          >
            Editar
          </Link>
          <button
            type="button"
            onClick={copiarLink}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
          >
            {copiado ? '¡Copiado!' : 'Copiar link'}
          </button>
          <button
            type="button"
            onClick={toggleStatus}
            disabled={cambiando}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 ${
              activa
                ? 'border-red-200 text-red-600 hover:bg-red-50'
                : 'border-green-200 text-green-600 hover:bg-green-50'
            }`}
          >
            {cambiando ? '...' : activa ? 'Pausar' : 'Activar'}
          </button>
        </div>
      </div>
    </li>
  )
}
