'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase-client'
import { PROVINCIAS } from '@/lib/provincias'

type TipoPropiedad = 'departamento' | 'casa' | 'habitacion' | 'local'

interface Props {
  id: string
  propiedadId: string
  tipoInicial: string
  calleInicial: string
  barrioInicial: string
  provinciaInicial: string
  referenciasInicial: string
  precioInicial: number
  hasExpensesInicial: boolean
  expensesAmountInicial: number | null
  expensesIncludedInicial: boolean
  depositMonthsInicial: string
  contractTypeInicial: string
  contractDurationMonthsInicial: number | null
  updateIndexInicial: string
  pricePerNightInicial: number | null
  minNightsInicial: number | null
  maxNightsInicial: number | null
  guaranteesInicial: string[]
  servicesInicial: string[]
  ambientesInicial: number | null
  dormitoriosInicial: number | null
  banosInicial: number | null
  toilettesInicial: number | null
  superficieInicial: number | null
  totalAreaInicial: number | null
  pisoInicial: number | null
  antiguedadInicial: number | null
  propertyConditionInicial: string
  hasCocheraInicial: boolean
  hasBauleraInicial: boolean
  hasJardinInicial: boolean
  hasTerrazaInicial: boolean
  hasPoolInicial: boolean
  hasBBQInicial: boolean
  hasGymInicial: boolean
  hasLaundryInicial: boolean
  hasSecurityInicial: boolean
  hasElevatorInicial: boolean
  hasHeatingInicial: boolean
  hasACInicial: boolean
  isFurnishedInicial: boolean
  hasAppliancesInicial: boolean
  petsPolicyInicial: string
  allowsKidsInicial: boolean | null
  smokingPolicyInicial: string
  allowsWFHInicial: boolean
  descripcionInicial: string
  fotosInicial: string[]
  videosInicial: string[]
  estadoInicial: string
}

const TIPO_LABEL: Record<string, string> = {
  departamento: 'Departamento',
  casa: 'Casa',
  habitacion: 'Habitación',
  local: 'Local comercial',
}

const TIPOS: { value: TipoPropiedad; label: string }[] = [
  { value: 'departamento', label: 'Departamento' },
  { value: 'casa', label: 'Casa' },
  { value: 'habitacion', label: 'Habitación' },
  { value: 'local', label: 'Local comercial' },
]

const inputCls =
  'w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-colors'

function toggleArr(arr: string[], item: string): string[] {
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]
}

// ── Sub-components ────────────────────────────────────────────────────────

function SectionTitle({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <h2 className="mb-5 flex items-center gap-2 text-base font-bold text-slate-800 border-b border-slate-100 pb-3">
      {icon && <span className="text-blue-600">{icon}</span>}
      {children}
    </h2>
  )
}

function HelpText({ children }: { children: React.ReactNode }) {
  return <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{children}</p>
}

function Label({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-slate-700">
      {children}
    </label>
  )
}

function NumericoInput({
  value,
  onChange,
  min = 0,
  max = 99,
}: {
  value: number | null
  onChange: (v: number | null) => void
  min?: number
  max?: number
}) {
  const val = value ?? 0
  return (
    <div className="flex items-center overflow-hidden rounded-xl border border-slate-300">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, val - 1))}
        className="flex h-11 w-11 shrink-0 items-center justify-center border-r border-slate-300 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>
      </button>
      <span className="flex-1 bg-slate-50 py-3 text-center text-base font-semibold text-slate-900">{val}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, val + 1))}
        className="flex h-11 w-11 shrink-0 items-center justify-center border-l border-slate-300 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
      </button>
    </div>
  )
}

function CheckOption({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors ${
        checked ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
      }`}
    >
      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${checked ? 'border-blue-500 bg-blue-500' : 'border-slate-300'}`}>
        {checked && (
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        )}
      </span>
      {label}
    </button>
  )
}

function RadioGroup({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string; desc?: string }[]
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex flex-col items-start rounded-xl border-2 px-4 py-2.5 text-left text-sm transition-all ${
            value === opt.value ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-300 bg-white text-slate-600 hover:border-blue-300'
          }`}
        >
          <span className="font-medium">{opt.label}</span>
          {opt.desc && <span className={`text-xs ${value === opt.value ? 'text-blue-400' : 'text-slate-400'}`}>{opt.desc}</span>}
        </button>
      ))}
    </div>
  )
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex items-center gap-3 text-sm text-slate-700">
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${checked ? 'bg-blue-600' : 'bg-slate-200'}`}>
        <span className={`absolute top-[2px] left-[2px] h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? 'translate-x-[20px]' : 'translate-x-0'}`} />
      </span>
      {label}
    </button>
  )
}

function Toast({ msg, isError, onClose }: { msg: string; isError?: boolean; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [onClose])
  return (
    <div className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-2xl px-6 py-3 text-sm font-medium text-white shadow-xl ${isError ? 'bg-red-600' : 'bg-slate-900'}`}>
      {msg}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────

export default function FormularioEditar({
  id,
  propiedadId,
  tipoInicial,
  calleInicial,
  barrioInicial,
  provinciaInicial,
  referenciasInicial,
  precioInicial,
  hasExpensesInicial,
  expensesAmountInicial,
  expensesIncludedInicial,
  depositMonthsInicial,
  contractTypeInicial,
  contractDurationMonthsInicial,
  updateIndexInicial,
  pricePerNightInicial,
  minNightsInicial,
  maxNightsInicial,
  guaranteesInicial,
  servicesInicial,
  ambientesInicial,
  dormitoriosInicial,
  banosInicial,
  toilettesInicial,
  superficieInicial,
  totalAreaInicial,
  pisoInicial,
  antiguedadInicial,
  propertyConditionInicial,
  hasCocheraInicial,
  hasBauleraInicial,
  hasJardinInicial,
  hasTerrazaInicial,
  hasPoolInicial,
  hasBBQInicial,
  hasGymInicial,
  hasLaundryInicial,
  hasSecurityInicial,
  hasElevatorInicial,
  hasHeatingInicial,
  hasACInicial,
  isFurnishedInicial,
  hasAppliancesInicial,
  petsPolicyInicial,
  allowsKidsInicial,
  smokingPolicyInicial,
  allowsWFHInicial,
  descripcionInicial,
  fotosInicial,
  videosInicial,
  estadoInicial,
}: Props) {
  const router = useRouter()

  // ── Form state ────────────────────────────────────────────────────
  const [tipo, setTipo] = useState<TipoPropiedad>(tipoInicial as TipoPropiedad)
  const [calle, setCalle] = useState(calleInicial)
  const [barrio, setBarrio] = useState(barrioInicial)
  const [provincia, setProvincia] = useState(provinciaInicial)
  const [referencias, setReferencias] = useState(referenciasInicial)

  const [precio, setPrecio] = useState(String(precioInicial || ''))
  const [hasExpenses, setHasExpenses] = useState(hasExpensesInicial)
  const [expensesAmount, setExpensesAmount] = useState(expensesAmountInicial ? String(expensesAmountInicial) : '')
  const [expensesIncluded, setExpensesIncluded] = useState(expensesIncludedInicial)
  const [depositMonths, setDepositMonths] = useState(depositMonthsInicial || 'a_negociar')

  const [contractType, setContractType] = useState(contractTypeInicial || 'tradicional')
  const [contractDurationMonths, setContractDurationMonths] = useState(
    contractDurationMonthsInicial ? String(contractDurationMonthsInicial) : '24'
  )
  const [updateIndex, setUpdateIndex] = useState(updateIndexInicial || 'ipc_trimestral')
  const [pricePerNight, setPricePerNight] = useState(pricePerNightInicial ? String(pricePerNightInicial) : '')
  const [minNights, setMinNights] = useState(minNightsInicial ? String(minNightsInicial) : '')
  const [maxNights, setMaxNights] = useState(maxNightsInicial ? String(maxNightsInicial) : '')
  const [guarantees, setGuarantees] = useState<string[]>(guaranteesInicial)
  const [services, setServices] = useState<string[]>(servicesInicial)

  const [ambientes, setAmbientes] = useState<number | null>(ambientesInicial)
  const [dormitorios, setDormitorios] = useState<number | null>(dormitoriosInicial)
  const [banos, setBanos] = useState<number | null>(banosInicial)
  const [toilettes, setToilettes] = useState<number | null>(toilettesInicial)
  const [superficie, setSuperficie] = useState(superficieInicial ? String(superficieInicial) : '')
  const [totalArea, setTotalArea] = useState(totalAreaInicial ? String(totalAreaInicial) : '')
  const [piso, setPiso] = useState(pisoInicial !== null ? String(pisoInicial) : '')
  const [antiguedad, setAntiguedad] = useState(antiguedadInicial ? String(antiguedadInicial) : '')
  const [propertyCondition, setPropertyCondition] = useState(propertyConditionInicial || 'bueno')

  const [hasCochera, setHasCochera] = useState(hasCocheraInicial)
  const [hasBaulera, setHasBaulera] = useState(hasBauleraInicial)
  const [hasJardin, setHasJardin] = useState(hasJardinInicial)
  const [hasTerrace, setHasTerrace] = useState(hasTerrazaInicial)
  const [hasPool, setHasPool] = useState(hasPoolInicial)
  const [hasBBQ, setHasBBQ] = useState(hasBBQInicial)
  const [hasGym, setHasGym] = useState(hasGymInicial)
  const [hasLaundry, setHasLaundry] = useState(hasLaundryInicial)
  const [hasSecurity, setHasSecurity] = useState(hasSecurityInicial)
  const [hasElevator, setHasElevator] = useState(hasElevatorInicial)
  const [hasHeating, setHasHeating] = useState(hasHeatingInicial)
  const [hasAC, setHasAC] = useState(hasACInicial)
  const [isFurnished, setIsFurnished] = useState(isFurnishedInicial)
  const [hasAppliances, setHasAppliances] = useState(hasAppliancesInicial)

  const [petsPolicy, setPetsPolicy] = useState(petsPolicyInicial || 'no')
  const [allowsKids, setAllowsKids] = useState<boolean | null>(allowsKidsInicial)
  const [smokingPolicy, setSmokingPolicy] = useState(smokingPolicyInicial || 'no')
  const [allowsWFH, setAllowsWFH] = useState(allowsWFHInicial)

  const [descripcion, setDescripcion] = useState(descripcionInicial)
  const [fotos, setFotos] = useState<string[]>(fotosInicial)
  const [videos, setVideos] = useState<string[]>(videosInicial)
  const [estado, setEstado] = useState(estadoInicial)

  // ── UI state ──────────────────────────────────────────────────────
  const [guardando, setGuardando] = useState(false)
  const [toast, setToast] = useState<{ msg: string; isError?: boolean } | null>(null)
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null)

  // ── Photo upload ──────────────────────────────────────────────────
  const [subiendoFotos, setSubiendoFotos] = useState(false)
  const [progresoFoto, setProgresoFoto] = useState(0)
  const fotoInputRef = useRef<HTMLInputElement>(null)
  const dragFotoIdx = useRef<number | null>(null)

  // ── Video upload ──────────────────────────────────────────────────
  const [subiendoVideo, setSubiendoVideo] = useState(false)
  const videoInputRef = useRef<HTMLInputElement>(null)

  // ── AI description ────────────────────────────────────────────────
  const [mejorando, setMejorando] = useState(false)
  const [modalIA, setModalIA] = useState(false)
  const [descripcionMejorada, setDescripcionMejorada] = useState('')
  const [errorIA, setErrorIA] = useState('')

  // ── Photo drag reorder ────────────────────────────────────────────
  const onDragStart = useCallback((idx: number) => {
    dragFotoIdx.current = idx
  }, [])

  const onDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault()
    const from = dragFotoIdx.current
    if (from === null || from === idx) return
    setFotos((prev) => {
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(idx, 0, item)
      dragFotoIdx.current = idx
      return next
    })
  }, [])

  const onDragEnd = useCallback(() => {
    dragFotoIdx.current = null
  }, [])

  // ── Photo upload ──────────────────────────────────────────────────
  const subirFotos = useCallback(
    async (archivos: FileList | null) => {
      if (!archivos || archivos.length === 0) return
      const supabase = createClient()
      const nuevas: string[] = []
      setSubiendoFotos(true)
      setProgresoFoto(0)
      const total = archivos.length

      for (let i = 0; i < total; i++) {
        const file = archivos[i]
        const ext = file.name.split('.').pop()
        const path = `${propiedadId}/${Date.now()}-${i}.${ext}`
        const { error } = await supabase.storage
          .from('propiedades')
          .upload(path, file, { upsert: true })
        if (!error) {
          const { data } = supabase.storage.from('propiedades').getPublicUrl(path)
          nuevas.push(data.publicUrl)
        }
        setProgresoFoto(Math.round(((i + 1) / total) * 100))
      }

      setFotos((prev) => [...prev, ...nuevas])
      setSubiendoFotos(false)
    },
    [propiedadId]
  )

  // ── Video upload ──────────────────────────────────────────────────
  const subirVideo = useCallback(
    async (file: File) => {
      if (videos.length >= 2) {
        setToast({ msg: 'Solo podés tener hasta 2 videos por publicación.' })
        return
      }
      if (file.size > 100 * 1024 * 1024) {
        setToast({ msg: 'El video no puede superar los 100 MB.' })
        return
      }
      const supabase = createClient()
      setSubiendoVideo(true)
      const ext = file.name.split('.').pop()
      const path = `${propiedadId}/${Date.now()}.${ext}`
      const { error } = await supabase.storage
        .from('propiedades-videos')
        .upload(path, file, { upsert: true })
      if (!error) {
        const { data } = supabase.storage.from('propiedades-videos').getPublicUrl(path)
        setVideos((prev) => [...prev, data.publicUrl])
      } else {
        setToast({ msg: 'No se pudo subir el video. Intentá de nuevo.', isError: true })
      }
      setSubiendoVideo(false)
    },
    [propiedadId, videos.length]
  )

  // ── AI description ────────────────────────────────────────────────
  const mejorarDescripcion = useCallback(async () => {
    setMejorando(true)
    setErrorIA('')
    setDescripcionMejorada('')
    try {
      const res = await fetch('/api/mejorar-descripcion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          descripcion,
          tipo: TIPO_LABEL[tipo] ?? tipo,
          direccion: [calle, barrio, provincia].filter(Boolean).join(', '),
          ambientes: ambientes || undefined,
          banos: banos || undefined,
          superficie: superficie || undefined,
          caracteristicas: [
            hasCochera && 'cochera',
            hasTerrace && 'balcón/terraza',
            petsPolicy === 'si' && 'permite mascotas',
            allowsKids === true && 'permite niños',
          ].filter(Boolean),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorIA(data.error ?? 'Error al mejorar la descripción.')
      } else {
        setDescripcionMejorada(data.descripcion)
        setModalIA(true)
      }
    } catch {
      setErrorIA('No se pudo conectar. Intentá de nuevo.')
    }
    setMejorando(false)
  }, [descripcion, tipo, calle, barrio, provincia, ambientes, banos, superficie, hasCochera, hasTerrace, petsPolicy, allowsKids])

  // ── Save ──────────────────────────────────────────────────────────
  const guardar = useCallback(async () => {
    setGuardando(true)
    setErrorGuardar(null)
    const supabase = createClient()

    const { error } = await supabase
      .from('properties')
      .update({
        type: tipo,
        address: calle.trim() || null,
        neighborhood: barrio.trim() || null,
        city: provincia || null,
        property_references: referencias.trim() || null,
        price_usd: precio ? Number(precio) : null,
        has_expenses: hasExpenses,
        expenses_amount: hasExpenses && expensesAmount ? Number(expensesAmount) : null,
        expenses_included: hasExpenses ? expensesIncluded : false,
        includes_expenses: hasExpenses ? expensesIncluded : false,
        deposit_months: depositMonths,
        contract_type: contractType,
        contract_duration_months: contractType === 'tradicional' ? Number(contractDurationMonths) : null,
        update_index: contractType === 'tradicional' ? updateIndex : null,
        price_per_night: contractType === 'temporario' ? (pricePerNight ? Number(pricePerNight) : null) : null,
        min_nights: contractType === 'temporario' ? (minNights ? Number(minNights) : null) : null,
        max_nights: contractType === 'temporario' ? (maxNights ? Number(maxNights) : null) : null,
        guarantees_accepted: guarantees,
        services_included: services,
        description: descripcion.trim() || null,
        rooms: ambientes,
        bedrooms: dormitorios ?? ambientes,
        bathrooms: banos,
        toilettes: toilettes,
        area_m2: superficie ? Number(superficie) : null,
        total_area_m2: totalArea ? Number(totalArea) : null,
        floor_number: piso ? Number(piso) : null,
        property_age: antiguedad ? Number(antiguedad) : null,
        property_condition: propertyCondition,
        has_garage: hasCochera,
        has_storage: hasBaulera,
        has_garden: hasJardin,
        has_terrace: hasTerrace,
        has_balcony: hasTerrace,
        has_pool: hasPool,
        has_bbq: hasBBQ,
        has_gym: hasGym,
        has_laundry: hasLaundry,
        has_security: hasSecurity,
        has_elevator: hasElevator,
        has_heating: hasHeating,
        has_ac: hasAC,
        is_furnished: isFurnished,
        has_appliances: hasAppliances,
        allows_pets: petsPolicy !== 'no',
        pets_policy: petsPolicy,
        allows_kids: allowsKids,
        allows_smoking: smokingPolicy !== 'no',
        allows_smoking_policy: smokingPolicy,
        allows_wfh: allowsWFH,
        photo_urls: fotos,
        video_urls: videos,
        status: estado,
      })
      .eq('id', id)

    setGuardando(false)

    if (error) {
      setErrorGuardar(error.message)
      setToast({ msg: `Error: ${error.message}`, isError: true })
    } else {
      setToast({ msg: '¡Cambios guardados correctamente!' })
      router.refresh()
    }
  }, [
    id, tipo, calle, barrio, provincia, referencias,
    precio, hasExpenses, expensesAmount, expensesIncluded, depositMonths,
    contractType, contractDurationMonths, updateIndex, pricePerNight, minNights, maxNights,
    guarantees, services, descripcion,
    ambientes, dormitorios, banos, toilettes, superficie, totalArea, piso, antiguedad, propertyCondition,
    hasCochera, hasBaulera, hasJardin, hasTerrace, hasPool, hasBBQ, hasGym, hasLaundry,
    hasSecurity, hasElevator, hasHeating, hasAC, isFurnished, hasAppliances,
    petsPolicy, allowsKids, smokingPolicy, allowsWFH,
    fotos, videos, estado, router,
  ])

  const precioNum = Number(precio) || 0
  const direccionPreview = [calle, barrio, provincia].filter(Boolean).join(', ')

  return (
    <>
      {toast && (
        <Toast msg={toast.msg} isError={toast.isError} onClose={() => setToast(null)} />
      )}

      {/* IA modal */}
      {modalIA && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="mb-3 text-base font-bold text-slate-900">Descripción mejorada por IA</h3>
            <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
              {descripcionMejorada}
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalIA(false)}
                className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => { setDescripcion(descripcionMejorada); setModalIA(false) }}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
              >
                Usar esta descripción
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-8 lg:items-start">

        {/* ── LEFT: Form ───────────────────────────────────────────── */}
        <div className="w-full space-y-6 lg:w-[60%]">

          {/* Tipo de propiedad */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <SectionTitle
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>
              }
            >
              Tipo de propiedad
            </SectionTitle>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {TIPOS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTipo(t.value)}
                  className={`rounded-xl border-2 px-3 py-3 text-sm font-semibold transition-all ${
                    tipo === t.value
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-slate-300 bg-white text-slate-600 hover:border-blue-300'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </section>

          {/* Ubicación */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <SectionTitle
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg>
              }
            >
              Ubicación
            </SectionTitle>
            <div className="space-y-4">
              <div>
                <Label htmlFor="calle">Calle y número</Label>
                <input
                  id="calle"
                  type="text"
                  value={calle}
                  onChange={(e) => setCalle(e.target.value)}
                  placeholder="Ej: Av. Corrientes 1234"
                  className={inputCls}
                />
                <HelpText>Escribí el nombre de la calle y el número de puerta.</HelpText>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="barrio">Barrio / Localidad</Label>
                  <input
                    id="barrio"
                    type="text"
                    value={barrio}
                    onChange={(e) => setBarrio(e.target.value)}
                    placeholder="Ej: Palermo"
                    className={inputCls}
                  />
                </div>
                <div>
                  <Label htmlFor="provincia">Provincia</Label>
                  <select
                    id="provincia"
                    value={provincia}
                    onChange={(e) => setProvincia(e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Seleccioná provincia</option>
                    {PROVINCIAS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="referencias">Referencias adicionales (opcional)</Label>
                <input
                  id="referencias"
                  type="text"
                  value={referencias}
                  onChange={(e) => setReferencias(e.target.value)}
                  placeholder="Ej: Entre Thames y Uriarte, frente al parque"
                  className={inputCls}
                />
                <HelpText>Puntos de referencia para que el inquilino encuentre el lugar fácilmente.</HelpText>
              </div>
            </div>
          </section>

          {/* Precio */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <SectionTitle
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              }
            >
              Precio
            </SectionTitle>
            <div className="space-y-4">
              <div>
                <Label htmlFor="precio">Alquiler mensual (USD)</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">USD</span>
                  <input
                    id="precio"
                    type="number"
                    min="0"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    placeholder="0"
                    className={`${inputCls} pl-14`}
                  />
                </div>
                <HelpText>Ingresá el monto en dólares estadounidenses (USD).</HelpText>
              </div>

              {/* Expensas */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <Toggle checked={hasExpenses} onChange={setHasExpenses} label="¿La propiedad tiene expensas?" />
                {hasExpenses && (
                  <div className="mt-4 space-y-3">
                    <div>
                      <Label htmlFor="expensesAmount">Monto de expensas (ARS)</Label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">$</span>
                        <input
                          id="expensesAmount"
                          type="number"
                          min="0"
                          value={expensesAmount}
                          onChange={(e) => setExpensesAmount(e.target.value)}
                          placeholder="0"
                          className={`${inputCls} pl-8`}
                        />
                      </div>
                    </div>
                    <Toggle checked={expensesIncluded} onChange={setExpensesIncluded} label="¿Las expensas están incluidas en el precio?" />
                  </div>
                )}
                <HelpText>Las expensas son los gastos comunes del edificio. Es importante aclararlo para evitar malentendidos.</HelpText>
              </div>

              {/* Depósito */}
              <div>
                <Label htmlFor="depositMonths">Depósito requerido</Label>
                <select
                  id="depositMonths"
                  value={depositMonths}
                  onChange={(e) => setDepositMonths(e.target.value)}
                  className={inputCls}
                >
                  <option value="sin_deposito">Sin depósito</option>
                  <option value="1_mes">1 mes</option>
                  <option value="2_meses">2 meses</option>
                  <option value="3_meses">3 meses</option>
                  <option value="a_negociar">A negociar</option>
                </select>
                <HelpText>El depósito es una garantía que devolvés al finalizar el contrato.</HelpText>
              </div>
            </div>
          </section>

          {/* Contrato */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <SectionTitle
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              }
            >
              Contrato
            </SectionTitle>
            <div className="space-y-5">
              {/* Tipo */}
              <div>
                <Label>Tipo de contrato</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'tradicional', label: 'Tradicional', desc: '2 años según ley' },
                    { value: 'temporario', label: 'Temporario', desc: 'Días o semanas' },
                    { value: 'temporada', label: 'Por temporada', desc: '1-6 meses' },
                    { value: 'a_convenir', label: 'A convenir', desc: 'Con el inquilino' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setContractType(opt.value)}
                      className={`flex flex-col items-start rounded-xl border-2 px-3 py-2.5 text-left transition-all ${
                        contractType === opt.value ? 'border-blue-600 bg-blue-50' : 'border-slate-300 bg-white hover:border-blue-200'
                      }`}
                    >
                      <span className={`text-sm font-semibold ${contractType === opt.value ? 'text-blue-700' : 'text-slate-800'}`}>{opt.label}</span>
                      <span className={`text-xs ${contractType === opt.value ? 'text-blue-400' : 'text-slate-400'}`}>{opt.desc}</span>
                    </button>
                  ))}
                </div>
                <HelpText>La ley argentina establece contratos de alquiler mínimo de 2 años para uso habitacional.</HelpText>
              </div>

              {/* Tradicional */}
              {contractType === 'tradicional' && (
                <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="contractDuration">Duración (meses)</Label>
                      <input
                        id="contractDuration"
                        type="number"
                        min="12"
                        value={contractDurationMonths}
                        onChange={(e) => setContractDurationMonths(e.target.value)}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <Label htmlFor="updateIndex">Índice de actualización</Label>
                      <select
                        id="updateIndex"
                        value={updateIndex}
                        onChange={(e) => setUpdateIndex(e.target.value)}
                        className={inputCls}
                      >
                        <option value="ipc_trimestral">IPC trimestral (cada 3 meses)</option>
                        <option value="ipc_semestral">IPC semestral (cada 6 meses)</option>
                        <option value="ipc_anual">IPC anual (cada 12 meses)</option>
                        <option value="icl_trimestral">ICL trimestral (cada 3 meses)</option>
                        <option value="icl_semestral">ICL semestral (cada 6 meses)</option>
                        <option value="cvs_trimestral">CVS trimestral (cada 3 meses)</option>
                        <option value="a_negociar">A negociar con el inquilino</option>
                      </select>
                      <HelpText>El más común en Argentina es el IPC trimestral.</HelpText>
                    </div>
                  </div>
                </div>
              )}

              {/* Temporario */}
              {contractType === 'temporario' && (
                <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 space-y-3">
                  <div>
                    <Label htmlFor="pricePerNight">Precio por noche (USD)</Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">USD</span>
                      <input
                        id="pricePerNight"
                        type="number"
                        min="0"
                        value={pricePerNight}
                        onChange={(e) => setPricePerNight(e.target.value)}
                        placeholder="0"
                        className={`${inputCls} pl-14`}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="minNights">Mínimo de noches</Label>
                      <input id="minNights" type="number" min="1" value={minNights} onChange={(e) => setMinNights(e.target.value)} placeholder="1" className={inputCls} />
                    </div>
                    <div>
                      <Label htmlFor="maxNights">Máximo de noches</Label>
                      <input id="maxNights" type="number" min="1" value={maxNights} onChange={(e) => setMaxNights(e.target.value)} placeholder="30" className={inputCls} />
                    </div>
                  </div>
                </div>
              )}

              {/* Garantías */}
              <div>
                <Label>Garantías aceptadas</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'recibo_sueldo', label: 'Recibo de sueldo' },
                    { value: 'garantia_propietaria', label: 'Garantía propietaria' },
                    { value: 'seguro_caucion', label: 'Seguro de caución' },
                    { value: 'aval_bancario', label: 'Aval bancario' },
                    { value: 'sin_garantia', label: 'Sin garantía' },
                    { value: 'a_negociar', label: 'A negociar' },
                  ].map((g) => (
                    <CheckOption
                      key={g.value}
                      checked={guarantees.includes(g.value)}
                      onChange={() => setGuarantees(toggleArr(guarantees, g.value))}
                      label={g.label}
                    />
                  ))}
                </div>
                <HelpText>Aclarando qué garantías aceptás ahorrás tiempo evitando consultas de personas que no cumplen el requisito.</HelpText>
              </div>

              {/* Servicios */}
              <div>
                <Label>Servicios incluidos en el precio</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'agua', label: '💧 Agua' },
                    { value: 'gas', label: '🔥 Gas' },
                    { value: 'luz', label: '💡 Luz' },
                    { value: 'wifi', label: '📶 WiFi' },
                    { value: 'cable', label: '📺 Cable' },
                    { value: 'ninguno', label: 'Ninguno' },
                  ].map((s) => (
                    <CheckOption
                      key={s.value}
                      checked={services.includes(s.value)}
                      onChange={() => setServices(toggleArr(services, s.value))}
                      label={s.label}
                    />
                  ))}
                </div>
                <HelpText>Indicá qué servicios están incluidos en el precio del alquiler.</HelpText>
              </div>
            </div>
          </section>

          {/* Características */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <SectionTitle
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>
              }
            >
              Características
            </SectionTitle>
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {([
                  { label: 'Ambientes', value: ambientes, set: setAmbientes },
                  { label: 'Dormitorios', value: dormitorios, set: setDormitorios },
                  { label: 'Baños', value: banos, set: setBanos },
                  { label: 'Toilettes', value: toilettes, set: setToilettes },
                ] as { label: string; value: number | null; set: (v: number | null) => void }[]).map(({ label, value, set }) => (
                  <div key={label}>
                    <p className="mb-2 text-center text-xs font-medium text-slate-500">{label}</p>
                    <NumericoInput value={value} onChange={set} max={20} />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="superficie">Superficie cubierta (m²)</Label>
                  <input
                    id="superficie"
                    type="number"
                    min="0"
                    value={superficie}
                    onChange={(e) => setSuperficie(e.target.value)}
                    placeholder="Ej: 45"
                    className={inputCls}
                  />
                </div>
                <div>
                  <Label htmlFor="totalArea">Superficie total (m²)</Label>
                  <input
                    id="totalArea"
                    type="number"
                    min="0"
                    value={totalArea}
                    onChange={(e) => setTotalArea(e.target.value)}
                    placeholder="Ej: 60"
                    className={inputCls}
                  />
                </div>
                <div>
                  <Label htmlFor="piso">Piso</Label>
                  <input
                    id="piso"
                    type="number"
                    min="0"
                    value={piso}
                    onChange={(e) => setPiso(e.target.value)}
                    placeholder="Ej: 3"
                    className={inputCls}
                  />
                  <HelpText>Ej: 3 para tercer piso.</HelpText>
                </div>
                <div>
                  <Label htmlFor="antiguedad">Antigüedad (años)</Label>
                  <input
                    id="antiguedad"
                    type="number"
                    min="0"
                    value={antiguedad}
                    onChange={(e) => setAntiguedad(e.target.value)}
                    placeholder="Ej: 10"
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <Label>Estado general</Label>
                <RadioGroup
                  value={propertyCondition}
                  onChange={setPropertyCondition}
                  options={[
                    { value: 'excelente', label: 'Excelente' },
                    { value: 'muy_bueno', label: 'Muy bueno' },
                    { value: 'bueno', label: 'Bueno' },
                    { value: 'a_reciclar', label: 'A reciclar' },
                  ]}
                />
              </div>
            </div>
          </section>

          {/* Comodidades */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <SectionTitle
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
              }
            >
              Comodidades
            </SectionTitle>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {([
                { label: '🚗 Cochera', value: hasCochera, set: setHasCochera },
                { label: '📦 Baulera', value: hasBaulera, set: setHasBaulera },
                { label: '🌿 Jardín', value: hasJardin, set: setHasJardin },
                { label: '🏠 Terraza/Azotea', value: hasTerrace, set: setHasTerrace },
                { label: '🏊 Piscina', value: hasPool, set: setHasPool },
                { label: '🔥 Parrilla', value: hasBBQ, set: setHasBBQ },
                { label: '💪 Gimnasio', value: hasGym, set: setHasGym },
                { label: '👕 Laundry', value: hasLaundry, set: setHasLaundry },
                { label: '🔒 Portería/Seguridad', value: hasSecurity, set: setHasSecurity },
                { label: '🛗 Ascensor', value: hasElevator, set: setHasElevator },
                { label: '❄️ Aire acondicionado', value: hasAC, set: setHasAC },
                { label: '🌡️ Calefacción', value: hasHeating, set: setHasHeating },
                { label: '🛋️ Amoblado', value: isFurnished, set: setIsFurnished },
              ] as { label: string; value: boolean; set: (v: boolean) => void }[]).map(({ label, value, set }) => (
                <CheckOption key={label} checked={value} onChange={() => set(!value)} label={label} />
              ))}
            </div>
            {isFurnished && (
              <div className="mt-3 ml-1">
                <Toggle checked={hasAppliances} onChange={setHasAppliances} label="¿Incluye electrodomésticos?" />
              </div>
            )}
          </section>

          {/* Políticas */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <SectionTitle icon={<span className="text-base">🐾</span>}>
              Políticas de convivencia
            </SectionTitle>
            <div className="space-y-5">
              <div>
                <Label>Acepta mascotas</Label>
                <RadioGroup
                  value={petsPolicy}
                  onChange={setPetsPolicy}
                  options={[
                    { value: 'si', label: 'Sí' },
                    { value: 'no', label: 'No' },
                    { value: 'negociar', label: 'A negociar' },
                  ]}
                />
              </div>

              <div>
                <Label>Acepta niños</Label>
                <div className="flex gap-2">
                  {[{ v: true, l: 'Sí' }, { v: false, l: 'No' }].map(({ v, l }) => (
                    <button
                      key={String(v)}
                      type="button"
                      onClick={() => setAllowsKids(v)}
                      className={`rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                        allowsKids === v ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 text-slate-600 hover:border-blue-300'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Permite fumar</Label>
                <RadioGroup
                  value={smokingPolicy}
                  onChange={setSmokingPolicy}
                  options={[
                    { value: 'si', label: 'Sí' },
                    { value: 'no', label: 'No' },
                    { value: 'solo_exteriores', label: 'Solo en exteriores' },
                  ]}
                />
              </div>

              <Toggle checked={allowsWFH} onChange={setAllowsWFH} label="Permite home office (trabajar desde casa)" />
            </div>
          </section>

          {/* Descripción */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <SectionTitle
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              }
            >
              Descripción
            </SectionTitle>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <Label>Descripción de la propiedad</Label>
                <span className={`text-xs font-medium ${descripcion.length < 80 ? 'text-amber-500' : descripcion.length > 800 ? 'text-red-500' : 'text-slate-400'}`}>
                  {descripcion.length}/800
                </span>
              </div>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value.slice(0, 800))}
                rows={6}
                placeholder="Describí la propiedad: luminosidad, estado de conservación, comodidades, cercanía a transporte, etc."
                className={`resize-none ${inputCls}`}
              />
              <div className="mt-2 flex items-start justify-between gap-3">
                <HelpText>Mínimo 80 caracteres. Contá lo que hace especial a esta propiedad.</HelpText>
                <button
                  type="button"
                  onClick={mejorarDescripcion}
                  disabled={mejorando || descripcion.trim().length < 10}
                  className="flex shrink-0 items-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-4 py-2 text-xs font-semibold text-purple-700 transition-colors hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {mejorando ? (
                    <svg className="h-3 w-3 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  ) : '✨'}
                  {mejorando ? 'Mejorando…' : 'Mejorar con IA'}
                </button>
              </div>
              {errorIA && <p className="mt-2 text-sm text-red-600">{errorIA}</p>}
            </div>
          </section>

          {/* Fotos */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <SectionTitle
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              }
            >
              Fotos ({fotos.length})
            </SectionTitle>
            <HelpText>Arrastrá las fotos para reordenarlas. La primera es la imagen principal (portada).</HelpText>

            {fotos.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
                {fotos.map((url, i) => (
                  <div
                    key={url}
                    draggable
                    onDragStart={() => onDragStart(i)}
                    onDragOver={(e) => onDragOver(e, i)}
                    onDragEnd={onDragEnd}
                    className="group relative aspect-square cursor-grab overflow-hidden rounded-xl border-2 border-slate-200 bg-slate-100 active:cursor-grabbing"
                  >
                    <Image src={url} alt={`Foto ${i + 1}`} fill className="object-cover" />
                    {i === 0 && (
                      <span className="absolute left-1.5 top-1.5 rounded-lg bg-blue-600 px-2 py-0.5 text-xs font-bold text-white">
                        Portada
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (!confirm('¿Eliminar esta foto?')) return
                        setFotos((prev) => prev.filter((_, idx) => idx !== i))
                      }}
                      className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label="Eliminar foto"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4">
              <input
                ref={fotoInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => subirFotos(e.target.files)}
              />
              <button
                type="button"
                onClick={() => fotoInputRef.current?.click()}
                disabled={subiendoFotos}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-600 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {subiendoFotos ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    Subiendo… {progresoFoto}%
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    Agregar fotos
                  </>
                )}
              </button>
            </div>
          </section>

          {/* Videos */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <SectionTitle
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
              }
            >
              Videos ({videos.length}/2)
            </SectionTitle>
            <HelpText>Podés agregar hasta 2 videos. Máximo 100 MB cada uno.</HelpText>

            {videos.length > 0 && (
              <div className="mt-4 space-y-3">
                {videos.map((url, i) => (
                  <div key={url} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-slate-400"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                    <span className="flex-1 truncate text-sm text-slate-700">Video {i + 1}</span>
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:underline">Ver</a>
                    <button
                      type="button"
                      onClick={() => {
                        if (!confirm('¿Eliminar este video?')) return
                        setVideos((prev) => prev.filter((_, idx) => idx !== i))
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      aria-label="Eliminar video"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {videos.length < 2 && (
              <div className="mt-4">
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => { if (e.target.files?.[0]) subirVideo(e.target.files[0]) }}
                />
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={subiendoVideo}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-600 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {subiendoVideo ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                      Subiendo video…
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      Agregar video
                    </>
                  )}
                </button>
              </div>
            )}
          </section>

          {/* Estado */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <SectionTitle
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              }
            >
              Estado de la publicación
            </SectionTitle>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setEstado('active')}
                className={`flex flex-1 flex-col items-start rounded-xl border-2 px-5 py-4 text-left transition-all ${
                  estado === 'active'
                    ? 'border-green-500 bg-green-50'
                    : 'border-slate-300 bg-white hover:border-green-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${estado === 'active' ? 'bg-green-500' : 'bg-slate-300'}`} />
                  <span className={`text-sm font-bold ${estado === 'active' ? 'text-green-700' : 'text-slate-600'}`}>Activa</span>
                </div>
                <p className={`mt-1 text-xs ${estado === 'active' ? 'text-green-600' : 'text-slate-400'}`}>
                  Visible para todos los usuarios que busquen propiedades.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setEstado('paused')}
                className={`flex flex-1 flex-col items-start rounded-xl border-2 px-5 py-4 text-left transition-all ${
                  estado === 'paused'
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-slate-300 bg-white hover:border-amber-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${estado === 'paused' ? 'bg-amber-400' : 'bg-slate-300'}`} />
                  <span className={`text-sm font-bold ${estado === 'paused' ? 'text-amber-700' : 'text-slate-600'}`}>Pausada</span>
                </div>
                <p className={`mt-1 text-xs ${estado === 'paused' ? 'text-amber-600' : 'text-slate-400'}`}>
                  Oculta para el público. Podés reactivarla en cualquier momento.
                </p>
              </button>
            </div>
          </section>

          {/* Error guardar */}
          {errorGuardar && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <strong>Error al guardar:</strong> {errorGuardar}
            </div>
          )}

          {/* Guardar (sticky bottom on mobile, bottom of form on desktop) */}
          <div className="sticky bottom-0 z-10 -mx-6 border-t border-slate-200 bg-white/90 px-6 py-4 backdrop-blur lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none">
            <button
              type="button"
              onClick={guardar}
              disabled={guardando}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-base font-bold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 lg:w-auto lg:px-10"
            >
              {guardando ? (
                <>
                  <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Guardando…
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Guardar cambios
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── RIGHT: Preview ───────────────────────────────────────── */}
        <div className="hidden lg:block lg:w-[40%]">
          <div className="sticky top-28">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
              Vista previa
            </p>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md">
              <div className="relative h-52 bg-slate-100">
                {fotos[0] ? (
                  <Image src={fotos[0]} alt="Foto principal" fill className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  </div>
                )}
                <div className="absolute left-3 top-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${estado === 'active' ? 'bg-green-500 text-white' : 'bg-amber-400 text-white'}`}>
                    {estado === 'active' ? 'Activa' : 'Pausada'}
                  </span>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                      {TIPO_LABEL[tipo] ?? tipo}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-500 line-clamp-1">
                      {direccionPreview || 'Sin dirección'}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-lg font-extrabold text-slate-900">
                      {precioNum > 0 ? `USD ${precioNum.toLocaleString('es-AR')}` : '—'}
                    </p>
                    {hasExpenses && expensesIncluded && (
                      <p className="text-xs text-slate-400">Expensas incluidas</p>
                    )}
                    {hasExpenses && !expensesIncluded && expensesAmount && (
                      <p className="text-xs text-slate-400">+ ${Number(expensesAmount).toLocaleString('es-AR')} expensas</p>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {ambientes ? (
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{ambientes} amb.</span>
                  ) : null}
                  {banos ? (
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{banos} baño{banos !== 1 ? 's' : ''}</span>
                  ) : null}
                  {superficie ? (
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{superficie} m²</span>
                  ) : null}
                  {hasCochera && <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">Cochera</span>}
                  {hasTerrace && <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">Terraza</span>}
                  {hasPool && <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">Piscina</span>}
                </div>
                {descripcion && (
                  <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-slate-600">{descripcion}</p>
                )}
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <p className="text-xs text-slate-400">
                    {fotos.length} foto{fotos.length !== 1 ? 's' : ''} · {TIPO_LABEL[contractType] ?? contractType ?? 'Contrato a definir'}
                  </p>
                </div>
              </div>
            </div>

            {fotos.length > 1 && (
              <p className="mt-3 text-center text-xs text-slate-400">
                {fotos.length - 1} foto{fotos.length - 1 !== 1 ? 's' : ''} más además de la portada
              </p>
            )}
          </div>
        </div>

      </div>
    </>
  )
}
