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
  onEliminar?: () => void
}

export default function PropiedadItem({ id, type, address, price_usd, includes_expenses, status: statusInicial, onEliminar }: Props) {
  const [copiado, setCopiado] = useState(false)
  const [status, setStatus] = useState(statusInicial)
  const [cambiando, setCambiando] = useState(false)
  const [modalEliminar, setModalEliminar] = useState(false)
  const [eliminando, setEliminando] = useState(false)

  const activa = status === 'active'

  async function copiarLink() {
    await navigator.clipboard.writeText(`${BASE_URL}/propiedades/${id}`)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  async function confirmarEliminar() {
    setEliminando(true)
    const supabase = createClient()
    const { error } = await supabase.from('properties').delete().eq('id', id)
    setEliminando(false)
    if (!error) {
      setModalEliminar(false)
      onEliminar?.()
    }
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
    <>
    {modalEliminar && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
          <h3 className="text-base font-bold text-slate-900">¿Eliminar esta propiedad?</h3>
          <p className="mt-2 text-sm text-slate-500">
            ¿Estás seguro que querés eliminar esta propiedad? Esta acción no se puede deshacer.
          </p>
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={() => setModalEliminar(false)}
              disabled={eliminando}
              className="flex-1 rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmarEliminar}
              disabled={eliminando}
              className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-40"
            >
              {eliminando ? 'Eliminando...' : 'Eliminar definitivamente'}
            </button>
          </div>
        </div>
      </div>
    )}
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
                ? 'border-amber-200 text-amber-600 hover:bg-amber-50'
                : 'border-green-200 text-green-600 hover:bg-green-50'
            }`}
          >
            {cambiando ? '...' : activa ? 'Pausar' : 'Activar'}
          </button>
          <button
            type="button"
            onClick={() => setModalEliminar(true)}
            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            Eliminar
          </button>
        </div>
      </div>
    </li>
    </>
  )
}
