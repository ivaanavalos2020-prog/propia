import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'

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

  const propiedades = (favoritos ?? [])
    .map((f) => f.properties)
    .filter(Boolean) as {
      id: string
      type: string
      address: string
      price_usd: number
      bedrooms: number | null
      bathrooms: number | null
      area_m2: number | null
    }[]

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-950 text-zinc-50">
      {/* Nav */}
      <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-5 md:px-12">
        <Link href="/dashboard" className="text-lg font-bold tracking-widest text-zinc-50">
          PROPIA
        </Link>
        <span className="text-sm text-zinc-400">{session.user.email}</span>
      </header>

      <main className="flex flex-1 flex-col px-6 py-10 md:px-12">
        <div className="mx-auto w-full max-w-4xl">
          <h1 className="text-xl font-semibold text-zinc-50">Mis favoritos</h1>

          {propiedades.length > 0 ? (
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {propiedades.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/propiedades/${p.id}`}
                    className="flex h-full flex-col gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-5 transition-colors hover:border-zinc-600 hover:bg-zinc-800"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                        {TIPO_LABEL[p.type] ?? p.type}
                      </span>
                      <span className="line-clamp-2 text-base font-semibold text-zinc-50">
                        {p.address}
                      </span>
                    </div>

                    <div className="mt-auto flex flex-col gap-3">
                      <span className="text-xl font-bold text-zinc-50">
                        USD {Number(p.price_usd).toLocaleString('es-AR')}
                        <span className="ml-1 text-sm font-normal text-zinc-500">/mes</span>
                      </span>

                      <div className="flex gap-4 text-sm text-zinc-400">
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
            <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 py-20 text-center">
              <p className="text-base text-zinc-400">
                Todavía no tenés propiedades guardadas.
              </p>
              <Link
                href="/propiedades"
                className="mt-4 rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-50 transition-colors hover:border-zinc-500 hover:bg-zinc-900"
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
