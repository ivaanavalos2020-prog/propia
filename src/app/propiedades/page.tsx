import { Suspense } from 'react'
import { createServerSupabaseClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Filtros from './FiltroTipo'
import SelectorOrden from './SelectorOrden'
import ListadoConBuscador from './ListadoConBuscador'

export default async function PropiedadesPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; precio?: string; orden?: string; ciudad?: string; barrio?: string }>
}) {
  const { tipo, precio, orden, ciudad, barrio } = await searchParams
  const supabase = await createServerSupabaseClient()

  const ordenMap: Record<string, { column: string; ascending: boolean }> = {
    precio_asc:  { column: 'price_usd',  ascending: true  },
    precio_desc: { column: 'price_usd',  ascending: false },
    recientes:   { column: 'created_at', ascending: false },
  }
  const { column, ascending } = ordenMap[orden ?? ''] ?? ordenMap.recientes

  let query = supabase
    .from('properties')
    .select('id, type, address, neighborhood, city, price_usd, bedrooms, bathrooms, area_m2, photo_urls, created_at, contract_type, status')
    .eq('status', 'active')
    .order(column, { ascending })

  if (tipo)   query = query.eq('type', tipo)
  if (precio) query = query.lte('price_usd', Number(precio))
  if (ciudad) query = query.eq('city', ciudad)
  if (barrio) query = query.eq('neighborhood', barrio)

  const { data: propiedades } = await query

  const barrioActivo = barrio ?? null

  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-50">
      <Navbar />

      <main className="flex flex-1 flex-col px-6 pt-24 pb-12 md:px-10">
        <div className="mx-auto w-full max-w-5xl flex flex-col gap-6">

          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900" style={{ letterSpacing: '-0.02em' }}>
                {barrioActivo ? `Propiedades en ${barrioActivo}` : 'Propiedades disponibles'}
              </h1>
              {barrioActivo && (
                <p className="mt-1 text-sm text-slate-500">
                  Filtrando por barrio. <a href="/propiedades" className="font-medium text-blue-600 hover:underline">Ver todas</a>
                </p>
              )}
            </div>
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
            hayFiltros={!!(tipo || precio || ciudad || barrio)}
          />

        </div>
      </main>
    </div>
  )
}
