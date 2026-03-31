'use client'

import { useState } from 'react'
import PropiedadItem from './PropiedadItem'

interface Propiedad {
  id: string
  type: string
  address: string
  price_usd: number
  includes_expenses: boolean | null
  status: string
}

const PAGE_SIZE = 10

export default function ListadoPropiedades({ propiedades }: { propiedades: Propiedad[] }) {
  const [busqueda, setBusqueda] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'active' | 'paused'>('todos')
  const [pagina, setPagina] = useState(1)

  const termino = busqueda.trim().toLowerCase()

  const filtradas = propiedades.filter((p) => {
    const coincideTexto = !termino ||
      p.address.toLowerCase().includes(termino) ||
      p.type.toLowerCase().includes(termino)
    const coincideStatus = filtroStatus === 'todos' || p.status === filtroStatus
    return coincideTexto && coincideStatus
  })

  const totalPaginas = Math.ceil(filtradas.length / PAGE_SIZE)
  const paginaActual = Math.min(pagina, totalPaginas || 1)
  const inicio = (paginaActual - 1) * PAGE_SIZE
  const visibles = filtradas.slice(inicio, inicio + PAGE_SIZE)

  function cambiarFiltro(nuevoFiltro: typeof filtroStatus) {
    setFiltroStatus(nuevoFiltro)
    setPagina(1)
  }

  function cambiarBusqueda(valor: string) {
    setBusqueda(valor)
    setPagina(1)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Búsqueda + filtro estado */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => cambiarBusqueda(e.target.value)}
            placeholder="Buscar por dirección..."
            aria-label="Buscar propiedades"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/10"
          />
          {busqueda && (
            <button
              type="button"
              onClick={() => cambiarBusqueda('')}
              aria-label="Limpiar"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex items-center rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden shrink-0">
          {(['todos', 'active', 'paused'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => cambiarFiltro(s)}
              className={`px-3 py-2 text-xs font-medium transition-colors ${
                filtroStatus === s
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              {s === 'todos' ? 'Todas' : s === 'active' ? 'Activas' : 'Pausadas'}
            </button>
          ))}
        </div>
      </div>

      {/* Contador */}
      {filtradas.length > 0 && (
        <p className="text-sm text-slate-500">
          <span className="font-semibold text-slate-700">{filtradas.length}</span>{' '}
          propiedad{filtradas.length !== 1 ? 'es' : ''}
          {termino && <span className="text-slate-400"> para &ldquo;{busqueda}&rdquo;</span>}
        </p>
      )}

      {/* Lista */}
      {visibles.length > 0 ? (
        <>
          <ul className="flex flex-col gap-3">
            {visibles.map((p) => (
              <PropiedadItem key={p.id} {...p} />
            ))}
          </ul>

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <p className="text-xs text-slate-400">
                Página {paginaActual} de {totalPaginas}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  disabled={paginaActual === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Página anterior"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>

                {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                  .filter((n) => Math.abs(n - paginaActual) <= 2)
                  .map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPagina(n)}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-medium transition-colors ${
                        n === paginaActual
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {n}
                    </button>
                  ))}

                <button
                  type="button"
                  onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                  disabled={paginaActual === totalPaginas}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Página siguiente"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-12 text-center">
          <p className="text-sm font-medium text-slate-500">
            {termino ? `Sin resultados para "${busqueda}"` : 'No hay propiedades con este filtro'}
          </p>
          {termino && (
            <button
              type="button"
              onClick={() => cambiarBusqueda('')}
              className="mt-3 text-sm font-semibold text-blue-600 hover:opacity-70"
            >
              Limpiar búsqueda
            </button>
          )}
        </div>
      )}
    </div>
  )
}
