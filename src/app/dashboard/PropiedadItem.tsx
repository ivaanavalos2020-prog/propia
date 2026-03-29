'use client'

import Link from 'next/link'
import { useState } from 'react'

const BASE_URL = 'https://propia-kappa.vercel.app'

const TIPO_LABEL: Record<string, string> = {
  departamento: 'Departamento',
  casa: 'Casa',
  habitacion: 'Habitación',
  local: 'Local comercial',
}

interface Props {
  id: string
  tipo: string
  direccion: string
  precio: number
  incluye_expensas: boolean | null
}

export default function PropiedadItem({ id, tipo, direccion, precio, incluye_expensas }: Props) {
  const [copiado, setCopiado] = useState(false)

  async function copiarLink() {
    await navigator.clipboard.writeText(`${BASE_URL}/propiedades/${id}`)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-zinc-50">
            {TIPO_LABEL[tipo] ?? tipo}
          </span>
          <span className="rounded-full bg-emerald-950 px-2 py-0.5 text-xs font-medium text-emerald-400">
            Activa
          </span>
        </div>
        <span className="truncate text-sm text-zinc-400">{direccion}</span>
      </div>

      <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
        <div className="flex flex-col items-start sm:items-end gap-0.5">
          <span className="text-sm font-semibold text-zinc-50">
            USD {Number(precio).toLocaleString('es-AR')}
          </span>
          <span className="text-xs text-zinc-500">
            {incluye_expensas ? 'Expensas incluidas' : 'Sin expensas'}
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
        </div>
      </div>
    </li>
  )
}
