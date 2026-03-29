import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import PropiedadItem from './PropiedadItem'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const { data: propiedades } = await supabase
    .from('properties')
    .select('id, type, address, price_usd, includes_expenses, status')
    .eq('owner_id', session.user.id)
    .order('created_at', { ascending: false })

  const propertyIds = propiedades?.map((p) => p.id) ?? []
  const { count: mensajesSinLeer } = propertyIds.length > 0
    ? await supabase
        .from('mensajes')
        .select('*', { count: 'exact', head: true })
        .in('property_id', propertyIds)
        .eq('leido', false)
    : { count: 0 }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-50">
      <Navbar />

      <main className="flex flex-1 flex-col px-6 pt-24 pb-12 md:px-10">
        <div className="mx-auto w-full max-w-4xl">

          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900" style={{ letterSpacing: '-0.02em' }}>
                Mis propiedades
              </h1>
              <p className="mt-1 text-sm text-slate-500">{session.user.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/mensajes"
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                Mensajes recibidos
              </Link>
              <Link
                href="/publicar"
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Publicar propiedad
              </Link>
            </div>
          </div>

          {/* Alerta mensajes sin leer */}
          {mensajesSinLeer != null && mensajesSinLeer > 0 && (
            <Link
              href="/dashboard/mensajes"
              className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-5 py-4 transition-colors hover:border-red-300 hover:bg-red-100"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-red-700">
                  Tenés {mensajesSinLeer} mensaje{mensajesSinLeer !== 1 ? 's' : ''} sin leer
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-red-600">
                Ver mensajes →
              </span>
            </Link>
          )}

          {/* Lista de propiedades */}
          {propiedades && propiedades.length > 0 ? (
            <ul className="mt-6 flex flex-col gap-3">
              {propiedades.map((p) => (
                <PropiedadItem key={p.id} {...p} />
              ))}
            </ul>
          ) : (
            <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-slate-200 border-dashed bg-white py-20 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
              <p className="mt-4 text-base font-medium text-slate-600">
                Todavía no publicaste ninguna propiedad.
              </p>
              <Link
                href="/publicar"
                className="mt-4 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
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
