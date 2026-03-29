'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'

const TIPO_LABEL: Record<string, string> = {
  departamento: 'Departamento',
  casa: 'Casa',
  habitacion: 'Habitación',
  local: 'Local comercial',
}

interface Propiedad {
  id: string
  type: string
  address: string
  neighborhood: string | null
  city: string | null
  price_usd: number
  bedrooms: number | null
  bathrooms: number | null
  area_m2: number | null
}

export default function ListadoConBuscador({
  propiedades,
  hayFiltros,
}: {
  propiedades: Propiedad[]
  hayFiltros: boolean
}) {
  const searchParams = useSearchParams()
  const [busqueda, setBusqueda] = useState(searchParams.get('q') ?? '')

  const termino = busqueda.trim().toLowerCase()
  const resultado = termino
    ? propiedades.filter((p) =>
        p.address.toLowerCase().includes(termino) ||
        p.neighborhood?.toLowerCase().includes(termino) ||
        p.city?.toLowerCase().includes(termino)
      )
    : propiedades

  const sinResultados = resultado.length === 0

  return (
    <div className="flex flex-col gap-5">
      {/* Buscador */}
      <div className="relative">
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
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscá por dirección o barrio..."
          className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-base text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
        />
        {busqueda && (
          <button
            type="button"
            onClick={() => setBusqueda('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
            aria-label="Limpiar búsqueda"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Grilla o vacío */}
      {!sinResultados ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resultado.map((p) => (
            <li key={p.id}>
              <Link
                href={`/propiedades/${p.id}`}
                className="flex h-full cursor-pointer flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex flex-col gap-1">
                  <span className="inline-flex w-fit rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                    {TIPO_LABEL[p.type] ?? p.type}
                  </span>
                  <span className="line-clamp-2 text-base font-semibold text-slate-900">
                    {p.address}
                  </span>
                  {(p.neighborhood || p.city) && (
                    <span className="text-xs text-slate-400">
                      {[p.neighborhood, p.city].filter(Boolean).join(', ')}
                    </span>
                  )}
                </div>

                <div className="mt-auto flex flex-col gap-3">
                  <span className="text-xl font-bold text-blue-600">
                    USD {Number(p.price_usd).toLocaleString('es-AR')}
                    <span className="ml-1 text-sm font-normal text-slate-400">/mes</span>
                  </span>
                  <div className="flex gap-4 text-sm text-slate-400">
                    {p.bedrooms != null && <span>{p.bedrooms} amb.</span>}
                    {p.bathrooms != null && <span>{p.bathrooms} baño{p.bathrooms !== 1 ? 's' : ''}</span>}
                    {p.area_m2 != null && <span>{p.area_m2} m²</span>}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 border-dashed bg-white py-20 text-center">
          <p className="text-base text-slate-500">
            {termino
              ? `No encontramos propiedades para "${busqueda}".`
              : hayFiltros
              ? 'No encontramos propiedades con esos filtros.'
              : 'No hay propiedades disponibles.'}
          </p>
          {termino && (
            <button
              type="button"
              onClick={() => setBusqueda('')}
              className="mt-4 text-sm font-semibold text-blue-600 transition-opacity hover:opacity-70"
            >
              Limpiar búsqueda
            </button>
          )}
        </div>
      )}
    </div>
  )
}
