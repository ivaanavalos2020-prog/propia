'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { PaymentConceptDraft, ConceptType, PaymentFrequency, PaidBy, Currency } from '@/lib/types'
import { CONCEPT_TYPE_LABELS, FREQUENCY_LABELS } from '@/lib/utils'
import { createClient } from '@/lib/supabase-client'

interface Propiedad {
  id: string
  address: string
  neighborhood: string | null
  city: string | null
  type: string
}

const TIPO_LABEL: Record<string, string> = {
  departamento: 'Dpto.',
  casa: 'Casa',
  habitacion: 'Hab.',
  local: 'Local',
}

const CONCEPT_TYPES: ConceptType[] = [
  'alquiler', 'expensas_ordinarias', 'expensas_extraordinarias',
  'abl', 'arba', 'municipal', 'seguro_edificio', 'seguro_caucion', 'otro',
]

const FREQUENCIES: PaymentFrequency[] = ['mensual', 'bimestral', 'trimestral', 'anual', 'unico']

const CONCEPTO_VACIO: PaymentConceptDraft = {
  concept_type: 'alquiler',
  label: 'Alquiler',
  amount: '',
  currency: 'ARS',
  frequency: 'mensual',
  paid_by: 'inquilino',
  due_day_of_month: '10',
}

export default function NuevoContratoForm({ propiedades }: { propiedades: Propiedad[] }) {
  const router = useRouter()

  // Paso 1 — datos básicos
  const [propertyId, setPropertyId] = useState(propiedades[0]?.id ?? '')
  const [tenantName, setTenantName] = useState('')
  const [tenantEmail, setTenantEmail] = useState('')
  const [tenantPhone, setTenantPhone] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [rentAmount, setRentAmount] = useState('')
  const [currency, setCurrency] = useState<Currency>('ARS')
  const [notes, setNotes] = useState('')

  // Paso 2 — conceptos
  const [concepts, setConcepts] = useState<PaymentConceptDraft[]>([{ ...CONCEPTO_VACIO }])

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fetchingPrice, setFetchingPrice] = useState(false)

  // Bug 2: pre-cargar precio al cambiar la propiedad seleccionada
  useEffect(() => {
    if (!propertyId) return
    const supabase = createClient()
    setFetchingPrice(true)
    supabase
      .from('properties')
      .select('price_usd')
      .eq('id', propertyId)
      .single()
      .then(({ data }) => {
        if (data?.price_usd) {
          setRentAmount(String(Math.round(Number(data.price_usd))))
        }
        setFetchingPrice(false)
      })
  }, [propertyId])

  function addConcepto() {
    setConcepts((prev) => [...prev, { ...CONCEPTO_VACIO, concept_type: 'otro', label: '' }])
  }

  function removeConcepto(i: number) {
    setConcepts((prev) => prev.filter((_, idx) => idx !== i))
  }

  function updateConcepto(i: number, field: keyof PaymentConceptDraft, value: string) {
    setConcepts((prev) =>
      prev.map((c, idx) => {
        if (idx !== i) return c
        const updated = { ...c, [field]: value }
        // Autocompletar label si cambia el tipo
        if (field === 'concept_type') {
          updated.label = CONCEPT_TYPE_LABELS[value as ConceptType] ?? value
        }
        return updated
      })
    )
  }

  async function handleSubmit() {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: propertyId,
          tenant_name: tenantName,
          tenant_email: tenantEmail,
          tenant_phone: tenantPhone || undefined,
          start_date: startDate,
          end_date: endDate,
          rent_amount: Number(rentAmount),
          currency,
          notes: notes || undefined,
          concepts: concepts.filter((c) => c.amount && Number(c.amount) > 0),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        console.error('[NuevoContratoForm] Error del servidor:', data)
        setError(
          data.detail
            ? `${data.error} (${data.code ?? ''}: ${data.detail})`
            : (data.error ?? 'Ocurrió un error.')
        )
        return
      }
      router.push(`/dashboard/contratos/${data.contractId}`)
    } catch (err) {
      console.error('[NuevoContratoForm] Error de red:', err)
      setError('Error de red. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const paso1Valido = propertyId && tenantName && tenantEmail && startDate && endDate && rentAmount

  return (
    <div className="mt-6">
      {/* Progress */}
      <div className="mb-8 flex items-center gap-0">
        {[1, 2].map((s) => (
          <div key={s} className="flex flex-1 items-center">
            <div className={[
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold',
              step >= s ? 'bg-blue-600 text-white' : 'border-2 border-slate-200 text-slate-400',
            ].join(' ')}>
              {s}
            </div>
            {s < 2 && (
              <div className={`h-0.5 flex-1 ${step > s ? 'bg-blue-600' : 'bg-slate-200'}`} />
            )}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-slate-300 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Propiedad</h2>
            {propiedades.length === 0 ? (
              <p className="text-sm text-slate-500">No tenés propiedades activas. <a href="/publicar" className="text-blue-600 underline">Publicá una primero.</a></p>
            ) : (
              <div className="flex flex-col gap-2">
                {propiedades.map((p) => {
                  const dir = [p.address, p.neighborhood, p.city].filter(Boolean).join(', ')
                  return (
                    <label key={p.id} className={[
                      'flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors',
                      propertyId === p.id
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300',
                    ].join(' ')}>
                      <input
                        type="radio"
                        name="property"
                        value={p.id}
                        checked={propertyId === p.id}
                        onChange={(e) => setPropertyId(e.target.value)}
                        className="accent-blue-600"
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {TIPO_LABEL[p.type] ?? p.type} · {p.address}
                        </p>
                        {(p.neighborhood || p.city) && (
                          <p className="text-xs text-slate-500">{[p.neighborhood, p.city].filter(Boolean).join(', ')}</p>
                        )}
                      </div>
                    </label>
                  )
                })}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-300 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Inquilino</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Nombre completo *</label>
                <input
                  type="text"
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  placeholder="Ej: María García"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Email *</label>
                <input
                  type="email"
                  value={tenantEmail}
                  onChange={(e) => setTenantEmail(e.target.value)}
                  placeholder="inquilino@email.com"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Teléfono / WhatsApp</label>
                <input
                  type="tel"
                  value={tenantPhone}
                  onChange={(e) => setTenantPhone(e.target.value)}
                  placeholder="+54 9 11 1234-5678"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-300 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Contrato</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Inicio *</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Fin *</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-700">Alquiler mensual *</label>
                <div className="flex gap-2">
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as Currency)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="ARS">ARS $</option>
                    <option value="USD">USD U$S</option>
                  </select>
                  <input
                    type="number"
                    value={rentAmount}
                    onChange={(e) => setRentAmount(e.target.value)}
                    placeholder={fetchingPrice ? 'Cargando...' : '650000'}
                    min="0"
                    disabled={fetchingPrice}
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-700">Notas (opcional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Observaciones del contrato..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              // Bug 1: pre-cargar el monto del concepto "Alquiler" con el valor del paso 1
              setConcepts((prev) =>
                prev.map((c) =>
                  c.concept_type === 'alquiler'
                    ? { ...c, amount: rentAmount, currency }
                    : c
                )
              )
              setStep(2)
            }}
            disabled={!paso1Valido}
            className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continuar: Conceptos de pago →
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-slate-300 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Conceptos de pago</h2>
              <button
                onClick={addConcepto}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                + Agregar concepto
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {concepts.map((c, i) => (
                <div key={i} className="relative rounded-lg border border-slate-200 bg-slate-50 p-4">
                  {/* Bug 3: el concepto "Alquiler" es obligatorio y no puede eliminarse */}
                  {c.concept_type !== 'alquiler' && (
                    <button
                      onClick={() => removeConcepto(i)}
                      className="absolute right-3 top-3 text-slate-300 hover:text-red-500"
                      aria-label="Eliminar concepto"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  )}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-700">Tipo</label>
                      <select
                        value={c.concept_type}
                        onChange={(e) => updateConcepto(i, 'concept_type', e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {CONCEPT_TYPES.map((t) => (
                          <option key={t} value={t}>{CONCEPT_TYPE_LABELS[t]}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-700">Descripción</label>
                      <input
                        type="text"
                        value={c.label}
                        onChange={(e) => updateConcepto(i, 'label', e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-700">Monto</label>
                      <div className="flex gap-2">
                        <select
                          value={c.currency}
                          onChange={(e) => updateConcepto(i, 'currency', e.target.value)}
                          className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                        >
                          <option value="ARS">ARS</option>
                          <option value="USD">USD</option>
                        </select>
                        <input
                          type="number"
                          value={c.amount}
                          onChange={(e) => updateConcepto(i, 'amount', e.target.value)}
                          placeholder="0"
                          min="0"
                          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-700">Frecuencia</label>
                      <select
                        value={c.frequency}
                        onChange={(e) => updateConcepto(i, 'frequency', e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {FREQUENCIES.map((f) => (
                          <option key={f} value={f}>{FREQUENCY_LABELS[f]}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-700">Paga</label>
                      <select
                        value={c.paid_by}
                        onChange={(e) => updateConcepto(i, 'paid_by', e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="inquilino">Inquilino</option>
                        <option value="dueno">Dueño</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-700">Día de vto.</label>
                      <input
                        type="number"
                        value={c.due_day_of_month}
                        onChange={(e) => updateConcepto(i, 'due_day_of_month', e.target.value)}
                        min="1"
                        max="28"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 rounded-xl border border-slate-300 bg-white py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              ← Volver
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Creando...' : 'Crear contrato'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
