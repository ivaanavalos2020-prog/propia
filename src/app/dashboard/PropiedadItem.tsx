'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { createClient } from '@/lib/supabase-client'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://propia-kappa.vercel.app'

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
  photo_urls: string[] | null
  onEliminar?: () => void
}

export default function PropiedadItem({ id, type, address, price_usd, includes_expenses, status: statusInicial, photo_urls, onEliminar }: Props) {
  const [copiado, setCopiado] = useState(false)
  const [status, setStatus] = useState(statusInicial)
  const [cambiando, setCambiando] = useState(false)
  const [modalEliminar, setModalEliminar] = useState(false)
  const [eliminando, setEliminando] = useState(false)

  const activa = status === 'active'
  const foto = Array.isArray(photo_urls) && photo_urls.length > 0 ? photo_urls[0] : null

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
    const { error } = await supabase.from('properties').update({ status: nuevoStatus }).eq('id', id)
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
              Esta acción no se puede deshacer.
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
                {eliminando ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <li className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        {/* Imagen banner */}
        <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
          {foto ? (
            <Image src={foto} alt={address} fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>
          )}
        </div>

        {/* Contenido */}
        <div className="p-4">
          {/* Tipo + badge estado */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-slate-900">
              {TIPO_LABEL[type] ?? type}
            </span>
            {activa ? (
              <span className="shrink-0 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                Activa
              </span>
            ) : (
              <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-600">
                Pausada
              </span>
            )}
          </div>

          {/* Dirección */}
          <p className="mt-1 text-sm text-slate-500 leading-snug">{address}</p>

          {/* Precio */}
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-base font-bold text-green-600">
              USD {Number(price_usd).toLocaleString('es-AR')}
            </span>
            <span className="text-xs text-slate-400">/mes</span>
            {includes_expenses && (
              <span className="ml-1 text-xs text-slate-400">· Expensas incl.</span>
            )}
          </div>

          {/* Botones fila 1: Ver / Editar / Copiar link */}
          <div className="mt-3 flex gap-2">
            <Link
              href={`/propiedades/${id}`}
              className="flex flex-1 items-center justify-center rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
            >
              Ver
            </Link>
            <Link
              href={`/dashboard/publicaciones/${id}/editar`}
              className="flex flex-1 items-center justify-center rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
            >
              Editar
            </Link>
            <button
              type="button"
              onClick={copiarLink}
              className="flex flex-1 items-center justify-center rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
            >
              {copiado ? '¡Copiado!' : 'Copiar link'}
            </button>
          </div>

          {/* Botones fila 2: Pausar / Eliminar */}
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={toggleStatus}
              disabled={cambiando}
              className={`flex flex-1 items-center justify-center rounded-lg border py-2 text-sm font-medium transition-colors disabled:opacity-40 ${
                activa
                  ? 'border-amber-300 text-amber-600 hover:bg-amber-50'
                  : 'border-green-300 text-green-600 hover:bg-green-50'
              }`}
            >
              {cambiando ? '...' : activa ? 'Pausar' : 'Activar'}
            </button>
            <button
              type="button"
              onClick={() => setModalEliminar(true)}
              className="flex flex-1 items-center justify-center rounded-lg border border-red-200 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              Eliminar
            </button>
          </div>
        </div>
      </li>
    </>
  )
}
