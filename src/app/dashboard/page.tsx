import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import PropiedadItem from './PropiedadItem'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const { data: propiedades } = await supabase
    .from('properties')
    .select('id, type, address, price_usd, status')
    .eq('owner_id', session.user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-950 text-zinc-50">
      {/* Nav */}
      <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-5 md:px-12">
        <span className="text-lg font-bold tracking-widest text-zinc-50">PROPIA</span>
        <span className="text-sm text-zinc-400">{session.user.email}</span>
      </header>

      {/* Contenido */}
      <main className="flex flex-1 flex-col px-6 py-10 md:px-12">
        <div className="mx-auto w-full max-w-4xl">

          {/* Encabezado de sección */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-zinc-50">Mis propiedades</h2>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/mensajes"
                className="flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                Mensajes recibidos
              </Link>
              <Link
                href="/publicar"
                className="rounded-lg bg-zinc-50 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-80"
              >
                Publicar propiedad
              </Link>
            </div>
          </div>

          {/* Lista o estado vacío */}
          {propiedades && propiedades.length > 0 ? (
            <ul className="mt-8 flex flex-col gap-3">
              {propiedades.map((p) => (
                <PropiedadItem key={p.id} {...p} />
              ))}
            </ul>
          ) : (
            <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 py-20 text-center">
              <p className="text-base text-zinc-400">
                Todavía no publicaste ninguna propiedad.
              </p>
              <Link
                href="/publicar"
                className="mt-4 text-sm font-medium text-zinc-50 underline underline-offset-4 transition-opacity hover:opacity-70"
              >
                Publicá tu primera propiedad
              </Link>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
