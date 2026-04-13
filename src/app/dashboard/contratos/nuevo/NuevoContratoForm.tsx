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

interface SuggeridoState {
  concept_type: ConceptType
  label: string
  enabled: boolean
  amount: string
  currency: Currency
  frequency: PaymentFrequency
  paid_by: PaidBy
  due_day_of_month: string
}

interface PropertyCostsData {
  expenses_ordinary_amount?: number | null
  expenses_extraordinary_amount?: number | null
  expenses_paid_by?: 'dueno' | 'inquilino' | 'compartido' | null
  abl_amount?: number | null
  abl_paid_by?: 'dueno' | 'inquilino' | null
  municipal_tax_amount?: number | null
  municipal_tax_paid_by?: 'dueno' | 'inquilino' | null
  arba_amount?: number | null
  arba_paid_by?: 'dueno' | 'inquilino' | null
  building_insurance_amount?: number | null
  building_insurance_paid_by?: 'dueno' | 'inquilino' | null
}

const TIPO_LABEL: Record<string, string> = {
  departamento: 'Dpto.',
  casa: 'Casa',
  habitacion: 'Hab.',
  local: 'Local',
}

const FREQUENCIES: PaymentFrequency[] = ['mensual', 'bimestral', 'trimestral', 'anual', 'unico']

function buildSugeridos(costs: PropertyCostsData | null): SuggeridoState[] {
  const base: SuggeridoState[] = [
    {
      concept_type: 'expensas_ordinarias',
      label: CONCEPT_TYPE_LABELS['expensas_ordinarias'],
      enabled: false,
      amount: '',
      currency: 'ARS',
      frequency: 'mensual',
      paid_by: 'inquilino',
      due_day_of_month: '10',
    },
    {
      concept_type: 'expensas_extraordinarias',
      label: CONCEPT_TYPE_LABELS['expensas_extraordinarias'],
      enabled: false,
      amount: '',
      currency: 'ARS',
      frequency: 'mensual',
      paid_by: 'inquilino',
      due_day_of_month: '10',
    },
    {
      concept_type: 'abl',
      label: CONCEPT_TYPE_LABELS['abl'],
      enabled: false,
      amount: '',
      currency: 'ARS',
      frequency: 'bimestral',
      paid_by: 'dueno',
      due_day_of_month: '10',
    },
    {
      concept_type: 'arba',
      label: CONCEPT_TYPE_LABELS['arba'],
      enabled: false,
      amount: '',
      currency: 'ARS',
      frequency: 'anual',
      paid_by: 'dueno',
      due_day_of_month: '10',
    },
    {
      concept_type: 'municipal',
      label: CONCEPT_TYPE_LABELS['municipal'],
      enabled: false,
      amount: '',
      currency: 'ARS',
      frequency: 'anual',
      paid_by: 'dueno',
      due_day_of_month: '10',
    },
    {
      concept_type: 'seguro_edificio',
      label: CONCEPT_TYPE_LABELS['seguro_edificio'],
      enabled: false,
      amount: '',
      currency: 'ARS',
      frequency: 'mensual',
      paid_by: 'dueno',
      due_day_of_month: '10',
    },
    {
      concept_type: 'seguro_caucion',
      label: CONCEPT_TYPE_LABELS['seguro_caucion'],
      enabled: false,
      amount: '',
      currency: 'ARS',
      frequency: 'unico',
      paid_by: 'inquilino',
      due_day_of_month: '10',
    },
  ]

  if (!costs) return base

  return base.map((s) => {
    switch (s.concept_type) {
      case 'expensas_ordinarias':
        return costs.expenses_ordinary_amount
          ? {
              ...s,
              enabled: true,
              amount: String(costs.expenses_ordinary_amount),
              paid_by: (costs.expenses_paid_by === 'dueno' ? 'dueno' : 'inquilino') as PaidBy,
            }
          : s
      case 'expensas_extraordinarias':
        return costs.expenses_extraordinary_amount
          ? {
              ...s,
              enabled: true,
              amount: String(costs.expenses_extraordinary_amount),
              paid_by: (costs.expenses_paid_by === 'dueno' ? 'dueno' : 'inquilino') as PaidBy,
            }
          : s
      case 'abl':
        return costs.abl_amount
          ? { ...s, enabled: true, amount: String(costs.abl_amount), paid_by: (costs.abl_paid_by ?? 'dueno') as PaidBy }
          : s
      case 'arba':
        return costs.arba_amount
          ? { ...s, enabled: true, amount: String(costs.arba_amount), paid_by: (costs.arba_paid_by ?? 'dueno') as PaidBy }
          : s
      case 'municipal':
        return costs.municipal_tax_amount
          ? { ...s, enabled: true, amount: String(costs.municipal_tax_amount), paid_by: (costs.municipal_tax_paid_by ?? 'dueno') as PaidBy }
          : s
      case 'seguro_edificio':
        return costs.building_insurance_amount
          ? { ...s, enabled: true, amount: String(costs.building_insurance_amount), paid_by: (costs.building_insurance_paid_by ?? 'dueno') as PaidBy }
          : s
      default:
        return s
    }
  })
}

export default function NuevoContratoForm({ propiedades }: { propiedades: Propiedad[] }) {
  const router = useRouter()

  // ── Paso 1 ─────────────────────────────────────────────────────────────────
  const [propertyId, setPropertyId] = useState(propiedades[0]?.id ?? '')
  const [tenantName, setTenantName] = useState('')
  const [tenantEmail, setTenantEmail] = useState('')
  const [tenantPhone, setTenantPhone] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [rentAmount, setRentAmount] = useState('')
  const [currency, setCurrency] = useState<Currency>('ARS')
  const [notes, setNotes] = useState('')
  const [fetchingPrice, setFetchingPrice] = useState(false)

  // ── Paso 2 ─────────────────────────────────────────────────────────────────
  const [alquilerDia, setAlquilerDia] = useState('10')
  const [sugeridos, setSugeridos] = useState<SuggeridoState[]>(() => buildSugeridos(null))
  const [loadingCosts, setLoadingCosts] = useState(false)
  const [costsLoaded, setCostsLoaded] = useState(false)

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Pre-cargar precio al cambiar propiedad
  useEffect(() => {
    if (!propertyId) return
    const supabase = createClient()
    setFetchingPrice(true)
    setCostsLoaded(false) // forza recarga de costs si el dueño cambia la propiedad
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

  // Cargar property_costs al entrar al paso 2
  useEffect(() => {
    if (step !== 2 || costsLoaded || !propertyId) return
    const supabase = createClient()
    setLoadingCosts(true)
    supabase
      .from('property_costs')
      .select('*')
      .eq('property_id', propertyId)
      .maybeSingle()
      .then(({ data }) => {
        setSugeridos(buildSugeridos(data as PropertyCostsData | null))
        setCostsLoaded(true)
        setLoadingCosts(false)
      })
  }, [step, propertyId, costsLoaded])

  function toggleSugerido(idx: number) {
    setSugeridos((prev) => prev.map((s, i) => i === idx ? { ...s, enabled: !s.enabled } : s))
  }

  function updateSugerido(idx: number, field: keyof SuggeridoState, value: string) {
    setSugeridos((prev) => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s))
    setValidationErrors((prev) => {
      const next = { ...prev }
      delete next[`s_${idx}`]
      delete next[`s_${idx}_dia`]
      return next
    })
  }

  function clearVErr(key: string) {
    setValidationErrors((prev) => { const n = { ...prev }; delete n[key]; return n })
  }

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!rentAmount || Number(rentAmount) <= 0) errs['alquiler'] = 'Ingresá el monto del alquiler.'
    const diaAlq = Number(alquilerDia)
    if (!diaAlq || diaAlq < 1 || diaAlq > 28) errs['alquiler_dia'] = 'Debe ser entre 1 y 28.'
    sugeridos.forEach((s, i) => {
      if (!s.enabled) return
      if (!s.amount || Number(s.amount) <= 0) errs[`s_${i}`] = 'Ingresá el monto.'
      const d = Number(s.due_day_of_month)
      if (!d || d < 1 || d > 28) errs[`s_${i}_dia`] = 'Debe ser entre 1 y 28.'
    })
    setValidationErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    setError(null)
    setLoading(true)

    const alquilerConcepto: PaymentConceptDraft = {
      concept_type: 'alquiler',
      label: 'Alquiler',
      amount: rentAmount,
      currency,
      frequency: 'mensual',
      paid_by: 'inquilino',
      due_day_of_month: alquilerDia,
    }

    const conceptosExtra: PaymentConceptDraft[] = sugeridos
      .filter((s) => s.enabled && Number(s.amount) > 0)
      .map((s) => ({
        concept_type: s.concept_type,
        label: s.label,
        amount: s.amount,
        currency: s.currency,
        frequency: s.frequency,
        paid_by: s.paid_by,
        due_day_of_month: s.due_day_of_month,
      }))

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
          concepts: [alquilerConcepto, ...conceptosExtra],
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

  // Resumen de costos en tiempo real
  const totalInquilino =
    (Number(rentAmount) || 0) +
    sugeridos
      .filter((s) => s.enabled && s.paid_by === 'inquilino')
      .reduce((acc, s) => acc + (Number(s.amount) || 0), 0)

  const totalDueno = sugeridos
    .filter((s) => s.enabled && s.paid_by === 'dueno')
    .reduce((acc, s) => acc + (Number(s.amount) || 0), 0)

  const paso1Valido = !!(propertyId && tenantName && tenantEmail && startDate && endDate && rentAmount)

  return (
    <div className="mt-6">
      {/* Progress indicator */}
      <div className="mb-8 flex items-center">
        {[1, 2].map((s) => (
          <div key={s} className="flex flex-1 items-center">
            <div className={[
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold',
              step >= s ? 'bg-blue-600 text-white' : 'border-2 border-slate-200 text-slate-400',
            ].join(' ')}>
              {s}
            </div>
            {s < 2 && <div className={`h-0.5 flex-1 ${step > s ? 'bg-blue-600' : 'bg-slate-200'}`} />}
          </div>
        ))}
      </div>

      {/* ── PASO 1 ── */}
      {step === 1 && (
        <div className="flex flex-col gap-5">
          {/* Propiedad */}
          <div className="rounded-xl border border-slate-300 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Propiedad</h2>
            {propiedades.length === 0 ? (
              <p className="text-sm text-slate-500">
                No tenés propiedades activas.{' '}
                <a href="/publicar" className="text-blue-600 underline">Publicá una primero.</a>
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {propiedades.map((p) => (
                  <label key={p.id} className={[
                    'flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors',
                    propertyId === p.id ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-slate-300',
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
                        <p className="text-xs text-slate-500">
                          {[p.neighborhood, p.city].filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Inquilino */}
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

          {/* Contrato */}
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
            onClick={() => setStep(2)}
            disabled={!paso1Valido}
            className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continuar: Conceptos de pago →
          </button>
        </div>
      )}

      {/* ── PASO 2 ── */}
      {step === 2 && (
        <div className="flex flex-col gap-5">

          {/* SECCIÓN A — Alquiler (siempre obligatorio) */}
          <div className="rounded-xl border border-blue-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-900">Alquiler</h2>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700">
                Obligatorio
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-700">Monto mensual</label>
                <div className="flex gap-2">
                  <span className="flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-600">
                    {currency}
                  </span>
                  <input
                    type="number"
                    value={rentAmount}
                    onChange={(e) => { setRentAmount(e.target.value); clearVErr('alquiler') }}
                    min="0"
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${validationErrors['alquiler'] ? 'border-red-400 bg-red-50' : 'border-slate-300'}`}
                  />
                </div>
                {validationErrors['alquiler'] && (
                  <p className="mt-1 text-xs text-red-600">{validationErrors['alquiler']}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Día de vto.</label>
                <input
                  type="number"
                  value={alquilerDia}
                  onChange={(e) => { setAlquilerDia(e.target.value); clearVErr('alquiler_dia') }}
                  min="1"
                  max="28"
                  className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${validationErrors['alquiler_dia'] ? 'border-red-400 bg-red-50' : 'border-slate-300'}`}
                />
                {validationErrors['alquiler_dia'] && (
                  <p className="mt-1 text-xs text-red-600">{validationErrors['alquiler_dia']}</p>
                )}
              </div>
            </div>
          </div>

          {/* SECCIÓN B — Conceptos sugeridos con toggles */}
          <div className="rounded-xl border border-slate-300 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Conceptos adicionales</h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  Activá los que apliquen. Pre-cargados desde tu propiedad.
                </p>
              </div>
              {loadingCosts && (
                <span className="text-xs text-slate-400">Cargando…</span>
              )}
            </div>

            <div className="divide-y divide-slate-100 px-5">
              {sugeridos.map((s, i) => (
                <div key={s.concept_type} className="py-3.5">
                  {/* Fila del toggle */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => toggleSugerido(i)}
                        className={[
                          'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none',
                          s.enabled ? 'bg-blue-600' : 'bg-slate-200',
                        ].join(' ')}
                        role="switch"
                        aria-checked={s.enabled}
                      >
                        <span
                          className={[
                            'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition duration-200',
                            s.enabled ? 'translate-x-4' : 'translate-x-0',
                          ].join(' ')}
                        />
                      </button>
                      <span className={`text-sm font-medium ${s.enabled ? 'text-slate-900' : 'text-slate-500'}`}>
                        {s.label}
                      </span>
                      {s.enabled && s.amount && Number(s.amount) > 0 && (
                        <span className="text-xs text-slate-400">
                          {s.currency} {Number(s.amount).toLocaleString('es-AR')}
                        </span>
                      )}
                    </div>
                    <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${s.paid_by === 'inquilino' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                      {s.paid_by === 'inquilino' ? 'Inquilino' : 'Dueño'}
                    </span>
                  </div>

                  {/* Campos expandidos cuando está activo */}
                  {s.enabled && (
                    <div className="mt-3 grid grid-cols-2 gap-3 pl-12 sm:grid-cols-4">
                      {/* Monto */}
                      <div className="col-span-2 sm:col-span-1">
                        <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-slate-500">Monto</label>
                        <div className="flex gap-1.5">
                          <select
                            value={s.currency}
                            onChange={(e) => updateSugerido(i, 'currency', e.target.value)}
                            className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                          >
                            <option value="ARS">ARS</option>
                            <option value="USD">USD</option>
                          </select>
                          <input
                            type="number"
                            value={s.amount}
                            onChange={(e) => updateSugerido(i, 'amount', e.target.value)}
                            placeholder="0"
                            min="0"
                            className={`min-w-0 flex-1 rounded-md border px-2 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${validationErrors[`s_${i}`] ? 'border-red-400 bg-red-50' : 'border-slate-300'}`}
                          />
                        </div>
                        {validationErrors[`s_${i}`] && (
                          <p className="mt-0.5 text-[10px] text-red-600">{validationErrors[`s_${i}`]}</p>
                        )}
                      </div>

                      {/* Frecuencia */}
                      <div>
                        <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-slate-500">Frecuencia</label>
                        <select
                          value={s.frequency}
                          onChange={(e) => updateSugerido(i, 'frequency', e.target.value)}
                          className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                        >
                          {FREQUENCIES.map((f) => (
                            <option key={f} value={f}>{FREQUENCY_LABELS[f]}</option>
                          ))}
                        </select>
                      </div>

                      {/* Paga */}
                      <div>
                        <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-slate-500">Paga</label>
                        <select
                          value={s.paid_by}
                          onChange={(e) => updateSugerido(i, 'paid_by', e.target.value)}
                          className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                        >
                          <option value="inquilino">Inquilino</option>
                          <option value="dueno">Dueño</option>
                        </select>
                      </div>

                      {/* Día vto */}
                      <div>
                        <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-slate-500">Día vto.</label>
                        <input
                          type="number"
                          value={s.due_day_of_month}
                          onChange={(e) => updateSugerido(i, 'due_day_of_month', e.target.value)}
                          min="1"
                          max="28"
                          className={`w-full rounded-md border px-2 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${validationErrors[`s_${i}_dia`] ? 'border-red-400 bg-red-50' : 'border-slate-300'}`}
                        />
                        {validationErrors[`s_${i}_dia`] && (
                          <p className="mt-0.5 text-[10px] text-red-600">{validationErrors[`s_${i}_dia`]}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* SECCIÓN C — Resumen en tiempo real */}
          {totalInquilino > 0 && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Resumen de costos</h3>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex-1 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-xs font-medium text-amber-700">Total inquilino / mes</p>
                  <p className="mt-0.5 text-xl font-extrabold text-amber-800">
                    {currency} {totalInquilino.toLocaleString('es-AR')}
                  </p>
                  <div className="mt-2 flex flex-col gap-0.5">
                    <span className="text-xs text-amber-600">
                      Alquiler: {currency} {(Number(rentAmount) || 0).toLocaleString('es-AR')}
                    </span>
                    {sugeridos
                      .filter((s) => s.enabled && s.paid_by === 'inquilino' && Number(s.amount) > 0)
                      .map((s) => (
                        <span key={s.concept_type} className="text-xs text-amber-600">
                          {s.label}: {s.currency} {Number(s.amount).toLocaleString('es-AR')}
                        </span>
                      ))}
                  </div>
                </div>

                {totalDueno > 0 && (
                  <div className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-3">
                    <p className="text-xs font-medium text-slate-500">Costos dueño / mes</p>
                    <p className="mt-0.5 text-xl font-extrabold text-slate-700">
                      ARS {totalDueno.toLocaleString('es-AR')}
                    </p>
                    <div className="mt-2 flex flex-col gap-0.5">
                      {sugeridos
                        .filter((s) => s.enabled && s.paid_by === 'dueno' && Number(s.amount) > 0)
                        .map((s) => (
                          <span key={s.concept_type} className="text-xs text-slate-400">
                            {s.label}: {s.currency} {Number(s.amount).toLocaleString('es-AR')}
                          </span>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

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
