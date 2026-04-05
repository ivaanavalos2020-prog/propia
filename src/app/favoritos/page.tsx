import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'Mis favoritos — PROPIA',
  description: 'Propiedades que guardaste para consultar más tarde.',
}

const TIPO_LABEL: Record<string, string> = {
  departamento: 'Departamento',
  casa: 'Casa',
  habitacion: 'Habitación',
  local: 'Local comercial',
}

export default async function FavoritosPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const { data: favoritos } = await supabase
    .from('favoritos')
    .select('property_id, properties(id, type, address, price_usd, bedrooms, bathrooms, area_m2)')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })

  interface PropiedadFavorita {
    id: string
    type: string
    address: string
    price_usd: number
    bedrooms: number | null
    bathrooms: number | null
    area_m2: number | null
  }

  const propiedades: PropiedadFavorita[] = (favoritos ?? [])
    .map((f) => f.properties as unknown as PropiedadFavorita | null)
    .filter((p): p is PropiedadFavorita => p !== null)

  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-50">
      <Navbar />

      <main className="flex flex-1 flex-col px-6 pt-24 pb-12 md:px-10">
        <div className="mx-auto w-full max-w-4xl">
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-slate-900" style={{ letterSpacing: '-0.02em' }}>
              Mis favoritos
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {propiedades.length > 0
                ? `${propiedades.length} propiedad${propiedades.length !== 1 ? 'es' : ''} guardada${propiedades.length !== 1 ? 's' : ''}`
                : 'Guardá propiedades para encontrarlas fácilmente'}
            </p>
          </div>

          {propiedades.length > 0 ? (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {propiedades.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/propiedades/${p.id}`}
                    className="flex h-full flex-col gap-4 rounded-xl border border-slate-300 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="inline-flex w-fit rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                        {TIPO_LABEL[p.type] ?? p.type}
                      </span>
                      <span className="line-clamp-2 text-base font-semibold text-slate-900">
                        {p.address}
                      </span>
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
            <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-300 border-dashed bg-white py-20 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </div>
              <p className="mt-4 text-base font-medium text-slate-600">
                Todavía no tenés propiedades guardadas.
              </p>
              <Link
                href="/propiedades"
                className="mt-4 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Ver propiedades
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
