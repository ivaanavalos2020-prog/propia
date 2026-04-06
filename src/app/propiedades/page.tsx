import { createServerSupabaseClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import ListadoConFiltros from './ListadoConFiltros'

export default async function PropiedadesPage({
  searchParams,
}: {
  searchParams: Promise<{
    tipo?: string
    provincia?: string
    zona?: string
    barrio?: string
    q?: string
    orden?: string
    precioMin?: string
    precioMax?: string
    moneda?: string
    ambientes?: string
  }>
}) {
  const filters = await searchParams
  const supabase = await createServerSupabaseClient()

  const { data: propiedades } = await supabase
    .from('properties')
    .select(
      'id, type, address, neighborhood, city, price_usd, bedrooms, bathrooms, area_m2, photo_urls, created_at, contract_type, views_count, status, owner_id'
    )
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(500)

  // Fetch verified owner IDs for badges
  const ownerIds = [...new Set((propiedades ?? []).map((p) => p.owner_id).filter(Boolean))]
  let verifiedOwnerIds: Set<string> = new Set()
  if (ownerIds.length > 0) {
    const { data: verifiedProfiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('verification_status', 'verified')
      .in('id', ownerIds as string[])
    verifiedOwnerIds = new Set((verifiedProfiles ?? []).map((p) => p.id as string))
  }

  const title = (() => {
    if (filters.barrio) return `Propiedades en ${filters.barrio}`
    if (filters.zona) return `Propiedades · ${filters.zona}`
    if (filters.provincia) return `Propiedades en ${filters.provincia}`
    return 'Propiedades disponibles'
  })()

  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-50">
      <Navbar />

      <main className="flex flex-1 flex-col px-6 pt-24 pb-12 md:px-10">
        <div className="mx-auto w-full max-w-5xl flex flex-col gap-6">

          <div>
            <h1 className="text-2xl font-extrabold text-slate-900" style={{ letterSpacing: '-0.02em' }}>
              {title}
            </h1>
          </div>

          <ListadoConFiltros
            propiedades={propiedades ?? []}
            verifiedOwnerIds={[...verifiedOwnerIds]}
            initialFilters={{
              tipo: filters.tipo,
              provincia: filters.provincia,
              zona: filters.zona,
              barrio: filters.barrio,
              busqueda: filters.q,
              orden: filters.orden,
              precioMin: filters.precioMin,
              precioMax: filters.precioMax,
              moneda: filters.moneda,
              ambientes: filters.ambientes,
            }}
          />

        </div>
      </main>
    </div>
  )
}
