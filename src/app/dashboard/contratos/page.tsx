import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import type { Contract, ContractStatus } from '@/lib/types'
import { formatMesAnioES } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Mis contratos — PROPIA',
  description: 'Gestioná los contratos de alquiler de tus propiedades.',
}

const STATUS_CONFIG: Record<ContractStatus, { label: string; color: string; bg: string }> = {
  active:  { label: 'Activo',   color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  paused:  { label: 'Pausado',  color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
  ended:   { label: 'Finalizado', color: 'text-slate-500', bg: 'bg-slate-50 border-slate-200' },
}

export default async function ContratosPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: contratos } = await supabase
    .from('contracts')
    .select(`
      id, status, tenant_name, tenant_email, tenant_phone,
      start_date, end_date, rent_amount, currency, created_at,
      property:properties(address, neighborhood, city)
    `)
    .eq('owner_id', session.user.id)
    .order('created_at', { ascending: false })

  const lista = (contratos ?? []) as unknown as (Contract & {
    property: { address: string; neighborhood: string | null; city: string } | null
  })[]

  const activos  = lista.filter((c) => c.status === 'active').length
  const finalizados = lista.filter((c) => c.status === 'ended').length

  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-50">
      <Navbar />
      <main className="flex flex-1 flex-col px-4 pt-24 pb-12 sm:px-6 md:px-10">
        <div className="mx-auto w-full max-w-4xl">

          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-propia">
                Mis contratos
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {activos} activo{activos !== 1 ? 's' : ''} · {finalizados} finalizado{finalizados !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-slate-500 hover:text-slate-700"
              >
                ← Dashboard
              </Link>
              <Link
                href="/dashboard/contratos/nuevo"
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                + Nuevo contrato
              </Link>
            </div>
          </div>

          {/* Lista */}
          {lista.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-slate-300 bg-white p-10 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
                <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/>
                  <line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
              </div>
              <h2 className="text-lg font-bold text-slate-900">Todavía no tenés contratos</h2>
              <p className="mt-1 text-sm text-slate-500">
                Creá un contrato para gestionar los pagos de tu inquilino desde acá.
              </p>
              <Link
                href="/dashboard/contratos/nuevo"
                className="mt-6 inline-block rounded-xl bg-blue-600 px-7 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Crear primer contrato
              </Link>
            </div>
          ) : (
            <ul className="mt-6 flex flex-col gap-3">
              {lista.map((c) => {
                const cfg = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.ended
                const propDir = c.property
                  ? [c.property.address, c.property.neighborhood, c.property.city].filter(Boolean).join(', ')
                  : '—'
                return (
                  <li key={c.id}>
                    <Link
                      href={`/dashboard/contratos/${c.id}`}
                      className="flex flex-col gap-3 rounded-xl border border-slate-300 bg-white p-5 shadow-sm transition-all hover:border-blue-300 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
                            {cfg.label}
                          </span>
                          <span className="text-xs text-slate-400">{formatMesAnioES(c.start_date)} → {formatMesAnioES(c.end_date)}</span>
                        </div>
                        <p className="text-sm font-semibold text-slate-900">{c.tenant_name}</p>
                        <p className="text-xs text-slate-500">{propDir}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-base font-bold text-blue-600">
                            {c.currency === 'USD' ? 'USD' : '$'} {Number(c.rent_amount).toLocaleString('es-AR')}
                          </p>
                          <p className="text-xs text-slate-400">/ mes</p>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-slate-300">
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </main>
    </div>
  )
}
