import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import type { PaymentPeriod, PaymentConcept, PaymentStatus } from '@/lib/types'
import {
  PAYMENT_STATUS_CONFIG, formatMonto, formatFechaAR, labelVencimiento,
} from '@/lib/utils'
import MisPagosAcciones from './MisPagosAcciones'

export const metadata: Metadata = {
  title: 'Mis pagos — PROPIA',
  description: 'Revisá tus obligaciones y estado de pago de tu alquiler.',
}

export default async function MisPagosPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  // Buscar contratos donde el usuario es inquilino (por id o por email)
  const { data: contratos } = await supabase
    .from('contracts')
    .select(`
      id, status, tenant_name, tenant_email, rent_amount, currency,
      start_date, end_date,
      property:properties(address, neighborhood, city),
      payment_concepts(
        id, label, amount, currency, frequency, paid_by,
        payment_periods(*)
      )
    `)
    .or(`tenant_email.eq.${session.user.email},tenant_id.eq.${session.user.id}`)
    .order('created_at', { ascending: false })

  const lista = contratos ?? []

  type ConceptoConPeriodos = { payment_periods: PaymentPeriod[]; [k: string]: unknown }
  // Aplanar períodos de todos los contratos para las stats globales
  const todosLosPeriodos = lista.flatMap((c) =>
    ((c.payment_concepts ?? []) as ConceptoConPeriodos[]).flatMap((concept) =>
      (concept.payment_periods ?? []).map((p) => ({
        ...p,
        contract_id: c.id,
        concept,
      }))
    )
  )

  const vencidos  = todosLosPeriodos.filter((p) => p.status === 'overdue').length
  const pendientes = todosLosPeriodos.filter((p) => p.status === 'pending').length
  const pagados   = todosLosPeriodos.filter((p) => p.status === 'paid').length

  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-50">
      <Navbar />
      <main className="flex flex-1 flex-col px-4 pt-24 pb-16 sm:px-6">
        <div className="mx-auto w-full max-w-3xl">

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-extrabold text-slate-900" style={{ letterSpacing: '-0.02em' }}>
              Mis pagos
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Todas tus obligaciones de alquiler en un lugar.
            </p>
          </div>

          {/* Stats */}
          {todosLosPeriodos.length > 0 && (
            <div className="mb-6 grid grid-cols-3 gap-3">
              {[
                { label: 'Vencidos', count: vencidos, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
                { label: 'Pendientes', count: pendientes, color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
                { label: 'Pagados', count: pagados, color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
              ].map((s) => (
                <div key={s.label} className={`rounded-xl border p-4 ${s.bg}`}>
                  <p className={`text-2xl font-extrabold ${s.color}`}>{s.count}</p>
                  <p className="text-xs text-slate-500">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {lista.length === 0 ? (
            <div className="rounded-2xl border border-slate-300 bg-white p-10 text-center shadow-sm">
              <p className="text-slate-500 text-sm">
                No tenés contratos cargados en PROPIA todavía.
                <br />
                Tu dueño necesita crear el contrato desde su cuenta.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {lista.map((contrato) => {
                const prop = (Array.isArray(contrato.property) ? contrato.property[0] : contrato.property) as { address: string; neighborhood: string | null; city: string } | null
                const propDir = prop
                  ? [prop.address, prop.neighborhood, prop.city].filter(Boolean).join(', ')
                  : '—'

                const conceptos = (contrato.payment_concepts ?? []) as (PaymentConcept & {
                  payment_periods: PaymentPeriod[]
                })[]

                const periodos = conceptos.flatMap((c) =>
                  (c.payment_periods ?? []).map((p) => ({ ...p, concept: c }))
                )

                const periodosPorEstado = {
                  overdue: periodos.filter((p) => p.status === 'overdue'),
                  pending: periodos.filter((p) => p.status === 'pending'),
                  upcoming: periodos.filter((p) => p.status === 'upcoming'),
                  paid: periodos.filter((p) => p.status === 'paid'),
                }

                return (
                  <div key={contrato.id} className="rounded-xl border border-slate-300 bg-white shadow-sm">
                    {/* Cabecera contrato */}
                    <div className="border-b border-slate-100 px-5 py-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{propDir}</p>
                          <p className="mt-0.5 text-xs text-slate-400">
                            {formatFechaAR(contrato.start_date)} → {formatFechaAR(contrato.end_date)}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-bold text-blue-600">
                          {formatMonto(contrato.rent_amount, contrato.currency as 'ARS' | 'USD')}/mes
                        </span>
                      </div>
                    </div>

                    {/* Períodos */}
                    <div className="p-5">
                      {periodos.length === 0 ? (
                        <p className="text-xs text-slate-400">No hay períodos generados aún.</p>
                      ) : (
                        <div className="flex flex-col gap-3">
                          {(['overdue', 'pending', 'upcoming', 'paid'] as PaymentStatus[]).map((estado) => {
                            const lista = periodosPorEstado[estado]
                            if (lista.length === 0) return null
                            const scfg = PAYMENT_STATUS_CONFIG[estado]
                            return (
                              <div key={estado}>
                                <h3 className={`mb-2 text-xs font-bold uppercase tracking-wide ${scfg.color}`}>
                                  {scfg.icon} {scfg.label}
                                </h3>
                                <div className="flex flex-col gap-2">
                                  {lista.map((p) => (
                                    <div
                                      key={p.id}
                                      className={`rounded-lg border p-3 ${scfg.borderColor} ${scfg.bgColor}`}
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <div>
                                          <p className="text-sm font-semibold text-slate-900">
                                            {p.concept?.label ?? '—'} · {p.period_label}
                                          </p>
                                          <p className={`text-xs ${scfg.color}`}>
                                            {labelVencimiento(p.due_date, p.status as PaymentStatus)}
                                          </p>
                                          {p.status === 'paid' && p.paid_at && (
                                            <p className="text-xs text-slate-400">
                                              Pagado el {new Date(p.paid_at).toLocaleDateString('es-AR')}
                                            </p>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className={`text-sm font-bold ${scfg.color}`}>
                                            {formatMonto(p.amount, (p.currency ?? 'ARS') as 'ARS' | 'USD')}
                                          </span>
                                          {p.status !== 'paid' && (
                                            <MisPagosAcciones
                                              contractId={contrato.id}
                                              periodId={p.id}
                                            />
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
