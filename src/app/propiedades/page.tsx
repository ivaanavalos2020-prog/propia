import Link from 'next/link'
import { Suspense } from 'react'
import { createServerSupabaseClient } from '@/lib/supabase'
import Filtros from './FiltroTipo'
import SelectorOrden from './SelectorOrden'
import ListadoConBuscador from './ListadoConBuscador'

export default async function PropiedadesPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; precio?: string; orden?: string }>
}) {
  const { tipo, precio, orden } = await searchParams
  const supabase = await createServerSupabaseClient()

  const ordenMap: Record<string, { column: string; ascending: boolean }> = {
    precio_asc:  { column: 'price_usd',  ascending: true  },
    precio_desc: { column: 'price_usd',  ascending: false },
    recientes:   { column: 'created_at', ascending: false },
  }
  const { column, ascending } = ordenMap[orden ?? ''] ?? ordenMap.recientes

  let query = supabase
    .from('properties')
    .select('id, type, address, price_usd, bedrooms, bathrooms, area_m2, status')
    .eq('status', 'active')
    .order(column, { ascending })

  if (tipo) query = query.eq('type', tipo)
  if (precio) query = query.lte('price_usd', Number(precio))

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
        <div className="mx-auto w-full max-w-5xl flex flex-col gap-6">

          {/* Título y orden */}
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-zinc-50">Propiedades disponibles</h1>
            <Suspense>
              <SelectorOrden />
            </Suspense>
          </div>

          {/* Filtros de tipo y precio */}
          <Suspense>
            <Filtros />
          </Suspense>

          {/* Buscador + grilla (client) */}
          <ListadoConBuscador
            propiedades={propiedades ?? []}
            hayFiltros={!!(tipo || precio)}
          />

        </div>
      </main>
    </div>
  )
}
