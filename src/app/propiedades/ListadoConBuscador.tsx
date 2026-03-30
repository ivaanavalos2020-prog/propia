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

function IconGrilla() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  )
}

function IconLista() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  )
}

function CardGrilla({ p }: { p: Propiedad }) {
  return (
    <Link
      href={`/propiedades/${p.id}`}
      className="group flex h-full cursor-pointer flex-col rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md overflow-hidden"
    >
      <div className="h-44 w-full bg-slate-100 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300" aria-hidden="true">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-col gap-1">
          <span className="inline-flex w-fit rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
            {TIPO_LABEL[p.type] ?? p.type}
          </span>
          <span className="line-clamp-2 text-base font-semibold text-slate-900">{p.address}</span>
          {(p.neighborhood || p.city) && (
            <span className="text-xs text-slate-400">
              {[p.neighborhood, p.city].filter(Boolean).join(', ')}
            </span>
          )}
        </div>
        <div className="mt-auto flex flex-col gap-2">
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
      </div>
    </Link>
  )
}

function CardLista({ p }: { p: Propiedad }) {
  return (
    <Link
      href={`/propiedades/${p.id}`}
      className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:border-slate-300"
    >
      <div className="h-16 w-16 shrink-0 rounded-lg bg-slate-100 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300" aria-hidden="true">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="inline-flex w-fit rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
              {TIPO_LABEL[p.type] ?? p.type}
            </span>
            <p className="mt-0.5 truncate text-sm font-semibold text-slate-900">{p.address}</p>
            {(p.neighborhood || p.city) && (
              <p className="text-xs text-slate-400">
                {[p.neighborhood, p.city].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
          <div className="shrink-0 text-right">
            <p className="text-base font-bold text-blue-600">
              USD {Number(p.price_usd).toLocaleString('es-AR')}
            </p>
            <p className="text-xs text-slate-400">/mes</p>
          </div>
        </div>
        <div className="mt-1 flex gap-4 text-xs text-slate-400">
          {p.bedrooms != null && <span>{p.bedrooms} amb.</span>}
          {p.bathrooms != null && <span>{p.bathrooms} baño{p.bathrooms !== 1 ? 's' : ''}</span>}
          {p.area_m2 != null && <span>{p.area_m2} m²</span>}
        </div>
      </div>
    </Link>
  )
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
  const [vista, setVista] = useState<'grilla' | 'lista'>('grilla')

  const termino = busqueda.trim().toLowerCase()
  const resultado = termino
    ? propiedades.filter(
        (p) =>
          p.address.toLowerCase().includes(termino) ||
          p.neighborhood?.toLowerCase().includes(termino) ||
          p.city?.toLowerCase().includes(termino)
      )
    : propiedades

  const sinResultados = resultado.length === 0

  return (
    <div className="flex flex-col gap-4">
      {/* Barra de búsqueda + controles */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
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
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscá por dirección o barrio..."
            aria-label="Buscar propiedades"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-base text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
          />
          {busqueda && (
            <button
              type="button"
              onClick={() => setBusqueda('')}
              aria-label="Limpiar búsqueda"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Toggle grilla / lista */}
        <div className="flex items-center rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setVista('grilla')}
            aria-label="Vista en grilla"
            aria-pressed={vista === 'grilla'}
            className={`flex h-10 w-10 items-center justify-center transition-colors ${
              vista === 'grilla'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <IconGrilla />
          </button>
          <button
            type="button"
            onClick={() => setVista('lista')}
            aria-label="Vista en lista"
            aria-pressed={vista === 'lista'}
            className={`flex h-10 w-10 items-center justify-center transition-colors ${
              vista === 'lista'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <IconLista />
          </button>
        </div>
      </div>

      {/* Contador de resultados */}
      {!sinResultados && (
        <p className="text-sm text-slate-500">
          <span className="font-semibold text-slate-700">{resultado.length}</span>{' '}
          propiedad{resultado.length !== 1 ? 'es' : ''} encontrada{resultado.length !== 1 ? 's' : ''}
          {termino && (
            <span className="text-slate-400"> para &ldquo;{busqueda}&rdquo;</span>
          )}
        </p>
      )}

      {/* Resultados */}
      {!sinResultados ? (
        vista === 'grilla' ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resultado.map((p, i) => (
              <li
                key={p.id}
                className="opacity-0 animate-[fadeSlideUp_0.4s_ease-out_forwards]"
                style={{ animationDelay: `${Math.min(i * 50, 400)}ms` }}
              >
                <CardGrilla p={p} />
              </li>
            ))}
          </ul>
        ) : (
          <ul className="flex flex-col gap-2">
            {resultado.map((p, i) => (
              <li
                key={p.id}
                className="opacity-0 animate-[fadeSlideUp_0.4s_ease-out_forwards]"
                style={{ animationDelay: `${Math.min(i * 40, 300)}ms` }}
              >
                <CardLista p={p} />
              </li>
            ))}
          </ul>
        )
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <p className="text-base font-medium text-slate-600">
            {termino
              ? `Sin resultados para "${busqueda}"`
              : hayFiltros
              ? 'No hay propiedades con esos filtros'
              : 'No hay propiedades disponibles'}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            {termino ? 'Probá con otro término de búsqueda.' : 'Volvé pronto, se agregan nuevas propiedades todos los días.'}
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

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
