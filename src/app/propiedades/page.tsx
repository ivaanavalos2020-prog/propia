import { Suspense } from 'react'
import { createServerSupabaseClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Filtros from './FiltroTipo'
import SelectorOrden from './SelectorOrden'
import ListadoConBuscador from './ListadoConBuscador'

export default async function PropiedadesPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; precio?: string; orden?: string; ciudad?: string }>
}) {
  const { tipo, precio, orden, ciudad } = await searchParams
  const supabase = await createServerSupabaseClient()

  const ordenMap: Record<string, { column: string; ascending: boolean }> = {
    precio_asc:  { column: 'price_usd',  ascending: true  },
    precio_desc: { column: 'price_usd',  ascending: false },
    recientes:   { column: 'created_at', ascending: false },
  }
  const { column, ascending } = ordenMap[orden ?? ''] ?? ordenMap.recientes

  let query = supabase
    .from('properties')
    .select('id, type, address, neighborhood, city, price_usd, bedrooms, bathrooms, area_m2, status')
    .eq('status', 'active')
    .order(column, { ascending })

  if (tipo)   query = query.eq('type', tipo)
  if (precio) query = query.lte('price_usd', Number(precio))
  if (ciudad) query = query.eq('city', ciudad)

  const { data: propiedades } = await query

  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-50">
      <Navbar />

      <main className="flex flex-1 flex-col px-6 pt-24 pb-12 md:px-10">
        <div className="mx-auto w-full max-w-5xl flex flex-col gap-6">

          <div className="flex items-center justify-between gap-4">
            <h1 className="text-2xl font-extrabold text-slate-900" style={{ letterSpacing: '-0.02em' }}>
              Propiedades disponibles
            </h1>
            <Suspense>
              <SelectorOrden />
            </Suspense>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <Suspense>
              <Filtros />
            </Suspense>
          </div>

          <ListadoConBuscador
            propiedades={propiedades ?? []}
            hayFiltros={!!(tipo || precio || ciudad)}
          />

        </div>
      </main>
    </div>
  )
}
