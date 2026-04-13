'use client'

import { useState, useTransition } from 'react'
import type { Contract, PaymentConcept, PaymentPeriod, ContractStatus, PaymentStatus } from '@/lib/types'
import {
  PAYMENT_STATUS_CONFIG, CONCEPT_TYPE_LABELS, FREQUENCY_LABELS,
  formatMonto, formatFechaAR, labelVencimiento,
} from '@/lib/utils'

const CONTRACT_STATUS_CONFIG: Record<ContractStatus, { label: string; color: string; bg: string }> = {
  active:  { label: 'Activo',      color: 'text-green-700',  bg: 'bg-green-50 border-green-200' },
  paused:  { label: 'Pausado',     color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
  ended:   { label: 'Finalizado',  color: 'text-slate-500',  bg: 'bg-slate-50 border-slate-200' },
}

interface Props {
  contract: Contract & {
    property: { address: string; neighborhood: string | null; city: string; type: string } | null
  }
  concepts: (PaymentConcept & { payment_periods: PaymentPeriod[] })[]
  todosLosPeriodos: (PaymentPeriod & { concept: PaymentConcept })[]
  isOwner: boolean
  userId: string
}

export default function ContratoDetalle({ contract, concepts, todosLosPeriodos, isOwner, userId }: Props) {
  const [periods, setPeriods] = useState(todosLosPeriodos)
  const [isPending, startTransition] = useTransition()
  const [actionLoading, setActionLoading] = useState<string | null>(null) // periodId en acción
  const [reminderLoading, setReminderLoading] = useState<string | null>(null)
  const [reminderMsg, setReminderMsg] = useState('')
  const [reminderPeriodId, setReminderPeriodId] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [contractStatus, setContractStatus] = useState<ContractStatus>(contract.status)

  function showToast(msg: string) {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3500)
  }

  async function togglePago(period: PaymentPeriod & { concept: PaymentConcept }) {
    const action = period.status === 'paid' ? 'mark_unpaid' : 'mark_paid'
    setActionLoading(period.id)
    try {
      const res = await fetch(`/api/contracts/${contract.id}/periods/${period.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) { showToast(data.error ?? 'Error'); return }
      setPeriods((prev) =>
        prev.map((p) =>
          p.id === period.id
            ? { ...p, status: data.period.status, paid_at: data.period.paid_at }
            : p
        )
      )
      showToast(action === 'mark_paid' ? 'Pago registrado' : 'Pago revertido')
    } finally {
      setActionLoading(null)
    }
  }

  async function enviarRecordatorio(periodId: string) {
    setReminderLoading(periodId)
    try {
      const res = await fetch(`/api/contracts/${contract.id}/reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period_id: periodId, message_custom: reminderMsg || null }),
      })
      const data = await res.json()
      if (!res.ok) { showToast(data.error ?? 'Error al enviar'); return }
      showToast('Recordatorio enviado')
      setReminderPeriodId(null)
      setReminderMsg('')
    } finally {
      setReminderLoading(null)
    }
  }

  async function cambiarEstadoContrato(status: ContractStatus) {
    const res = await fetch(`/api/contracts/${contract.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    const data = await res.json()
    if (res.ok) {
      setContractStatus(status)
      showToast('Estado actualizado')
    } else {
      showToast(data.error ?? 'Error')
    }
  }

  const propDir = contract.property
    ? [contract.property.address, contract.property.neighborhood, contract.property.city].filter(Boolean).join(', ')
    : '—'

  const statusCfg = CONTRACT_STATUS_CONFIG[contractStatus]

  // Agrupar períodos por estado
  const vencidos = periods.filter((p) => p.status === 'overdue')
  const pendientes = periods.filter((p) => p.status === 'pending')
  const proximos = periods.filter((p) => p.status === 'upcoming')
  const pagados = periods.filter((p) => p.status === 'paid')

  return (
    <>
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-xl">
          {toastMsg}
        </div>
      )}

      {/* Header contrato */}
      <div className="rounded-xl border border-slate-300 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusCfg.bg} ${statusCfg.color}`}>
                {statusCfg.label}
              </span>
            </div>
            <h1 className="mt-2 text-xl font-extrabold text-slate-900" style={{ letterSpacing: '-0.02em' }}>
              {contract.tenant_name}
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">{propDir}</p>
          </div>
          {isOwner && (
            <div className="flex gap-2">
              {contractStatus === 'active' && (
                <button
                  onClick={() => cambiarEstadoContrato('paused')}
                  className="rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-1.5 text-xs font-semibold text-yellow-700 hover:bg-yellow-100"
                >
                  Pausar
                </button>
              )}
              {contractStatus === 'paused' && (
                <button
                  onClick={() => cambiarEstadoContrato('active')}
                  className="rounded-lg border border-green-300 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100"
                >
                  Reactivar
                </button>
              )}
              {contractStatus !== 'ended' && (
                <button
                  onClick={() => cambiarEstadoContrato('ended')}
                  className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Finalizar
                </button>
              )}
            </div>
          )}
        </div>

        {/* Info grid */}
        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-slate-100 pt-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-slate-400">Alquiler</p>
            <p className="text-sm font-bold text-blue-600">{formatMonto(contract.rent_amount, contract.currency)}/mes</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Período</p>
            <p className="text-sm font-semibold text-slate-900">{formatFechaAR(contract.start_date).split(' de ')[2] !== undefined ? `${contract.start_date.slice(0,7)} → ${contract.end_date.slice(0,7)}` : '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Email inquilino</p>
            <p className="text-sm font-medium text-slate-700 break-all">{contract.tenant_email}</p>
          </div>
          {contract.tenant_phone && (
            <div>
              <p className="text-xs text-slate-400">Teléfono</p>
              <p className="text-sm font-medium text-slate-700">{contract.tenant_phone}</p>
            </div>
          )}
        </div>
      </div>

      {/* Conceptos */}
      {concepts.length > 0 && (
        <div className="mt-4 rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Conceptos de pago</h2>
          <div className="flex flex-wrap gap-2">
            {concepts.map((c) => (
              <span key={c.id} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                <span className="font-semibold">{c.label}</span>
                <span className="text-slate-400">·</span>
                {formatMonto(c.amount, c.currency)}
                <span className="text-slate-400">·</span>
                {FREQUENCY_LABELS[c.frequency]}
                <span className="text-slate-400">·</span>
                {c.paid_by === 'inquilino' ? 'Paga inquilino' : 'Paga dueño'}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Períodos — resumen */}
      {periods.length > 0 && (
        <div className="mt-4 rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Períodos de pago</h2>

          {/* Stats */}
          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Vencidos', count: vencidos.length, color: 'text-red-600', bg: 'bg-red-50' },
              { label: 'Pendientes', count: pendientes.length, color: 'text-yellow-700', bg: 'bg-yellow-50' },
              { label: 'Próximos', count: proximos.length, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Pagados', count: pagados.length, color: 'text-green-700', bg: 'bg-green-50' },
            ].map((s) => (
              <div key={s.label} className={`rounded-lg ${s.bg} px-3 py-2`}>
                <p className={`text-xl font-extrabold ${s.color}`}>{s.count}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Lista de períodos por grupos */}
          {[
            { label: 'Vencidos', list: vencidos, urgente: true },
            { label: 'Pendientes', list: pendientes, urgente: false },
            { label: 'Próximos', list: proximos, urgente: false },
            { label: 'Pagados', list: pagados, urgente: false },
          ].map(({ label, list, urgente }) =>
            list.length === 0 ? null : (
              <div key={label} className="mb-4">
                <h3 className={`mb-2 text-xs font-bold uppercase tracking-wide ${urgente ? 'text-red-600' : 'text-slate-400'}`}>
                  {label}
                </h3>
                <div className="flex flex-col gap-2">
                  {list.map((p) => {
                    const scfg = PAYMENT_STATUS_CONFIG[p.status as PaymentStatus]
                    const esPagado = p.status === 'paid'
                    const enAccion = actionLoading === p.id
                    const mostrarRecordatorio = reminderPeriodId === p.id

                    return (
                      <div
                        key={p.id}
                        className={`rounded-lg border p-3 ${scfg.borderColor} ${scfg.bgColor}`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-semibold text-slate-900">
                              {p.concept?.label ?? '—'} · {p.period_label}
                            </span>
                            <span className={`text-xs ${scfg.color}`}>
                              {labelVencimiento(p.due_date, p.status as PaymentStatus)}
                            </span>
                            {esPagado && p.paid_at && (
                              <span className="text-xs text-slate-400">
                                Pagado el {new Date(p.paid_at).toLocaleDateString('es-AR')}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold ${scfg.color}`}>
                              {formatMonto(p.amount, (p.currency ?? 'ARS') as 'ARS' | 'USD')}
                            </span>
                            {(isOwner || !esPagado) && (
                              <button
                                onClick={() => togglePago(p)}
                                disabled={enAccion || (!isOwner && esPagado)}
                                className={[
                                  'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                                  esPagado
                                    ? 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                                    : 'bg-green-600 text-white hover:bg-green-700',
                                  (enAccion || (!isOwner && esPagado)) ? 'cursor-not-allowed opacity-50' : '',
                                ].join(' ')}
                              >
                                {enAccion
                                  ? '...'
                                  : esPagado
                                  ? isOwner ? 'Revertir' : 'Pagado'
                                  : 'Marcar pagado'}
                              </button>
                            )}
                            {isOwner && !esPagado && (
                              <button
                                onClick={() => setReminderPeriodId(mostrarRecordatorio ? null : p.id)}
                                className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                                title="Enviar recordatorio"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Panel recordatorio inline */}
                        {mostrarRecordatorio && (
                          <div className="mt-3 border-t border-slate-200 pt-3">
                            <textarea
                              value={reminderMsg}
                              onChange={(e) => setReminderMsg(e.target.value)}
                              placeholder="Mensaje personalizado (opcional)..."
                              rows={2}
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                            />
                            <div className="mt-2 flex gap-2">
                              <button
                                onClick={() => enviarRecordatorio(p.id)}
                                disabled={reminderLoading === p.id}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                              >
                                {reminderLoading === p.id ? 'Enviando...' : 'Enviar recordatorio'}
                              </button>
                              <button
                                onClick={() => { setReminderPeriodId(null); setReminderMsg('') }}
                                className="rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          )}
        </div>
      )}

      {periods.length === 0 && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
          No hay períodos de pago generados aún.
        </div>
      )}
    </>
  )
}
