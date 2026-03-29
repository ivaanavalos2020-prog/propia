import Link from 'next/link'
import { Suspense } from 'react'
import { createServerSupabaseClient } from '@/lib/supabase'
import Filtros from './FiltroTipo'
import SelectorOrden from './SelectorOrden'

const TIPO_LABEL: Record<string, string> = {
  departamento: 'Departamento',
  casa: 'Casa',
  habitacion: 'Habitación',
  local: 'Local comercial',
}

export default async function PropiedadesPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; precio?: string; orden?: string }>
}) {
  const { tipo, precio, orden } = await searchParams
  const supabase = await createServerSupabaseClient()

  const ordenMap: Record<string, { column: string; ascending: boolean }> = {
    precio_asc:  { column: 'precio',     ascending: true  },
    precio_desc: { column: 'precio',     ascending: false },
    recientes:   { column: 'created_at', ascending: false },
  }
  const { column, ascending } = ordenMap[orden ?? ''] ?? ordenMap.recientes

  let query = supabase
    .from('properties')
    .select('id, tipo, direccion, precio, ambientes, banos, superficie')
    .order(column, { ascending })

  if (tipo) {
    query = query.eq('tipo', tipo)
  }
  if (precio) {
    query = query.lte('precio', Number(precio))
  }

  const { data: propiedades } = await query

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-950 text-zinc-50">
      {/* Nav */}
      <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-5 md:px-12">
        <Link href="/" className="text-lg font-bold tracking-widest text-zinc-50">
          PROPIA
        </Link>
        <Link href="/login" className="text-sm text-zinc-400 transition-colors hover:text-zinc-50">
          Ingresar
        </Link>
      </header>

      <main className="flex flex-1 flex-col px-6 py-10 md:px-12">
        <div className="mx-auto w-full max-w-5xl">

          {/* Encabezado */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-2xl font-bold text-zinc-50">Propiedades disponibles</h1>
              <Suspense>
                <SelectorOrden />
              </Suspense>
            </div>
            <Suspense>
              <Filtros />
            </Suspense>
          </div>

          {/* Grilla */}
          {propiedades && propiedades.length > 0 ? (
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {propiedades.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/propiedades/${p.id}`}
                    className="flex h-full flex-col gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-5 transition-colors hover:border-zinc-600 hover:bg-zinc-800"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                        {TIPO_LABEL[p.tipo] ?? p.tipo}
                      </span>
                      <span className="line-clamp-2 text-base font-semibold text-zinc-50">
                        {p.direccion}
                      </span>
                    </div>

                    <div className="mt-auto flex flex-col gap-3">
                      <span className="text-xl font-bold text-zinc-50">
                        USD {Number(p.precio).toLocaleString('es-AR')}
                        <span className="ml-1 text-sm font-normal text-zinc-500">/mes</span>
                      </span>

                      <div className="flex gap-4 text-sm text-zinc-400">
                        {p.ambientes != null && <span>{p.ambientes} amb.</span>}
                        {p.banos != null && <span>{p.banos} baño{p.banos !== 1 ? 's' : ''}</span>}
                        {p.superficie != null && <span>{p.superficie} m²</span>}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 py-20 text-center">
              <p className="text-base text-zinc-400">
                {tipo || precio
                  ? 'No encontramos propiedades con esos filtros.'
                  : 'No hay propiedades disponibles.'}
              </p>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
