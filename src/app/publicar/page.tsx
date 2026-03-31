'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase-client'
import { PROVINCIAS } from '@/lib/provincias'

type TipoPropiedad = 'departamento' | 'casa' | 'habitacion' | 'local'

interface FormData {
  tipo: TipoPropiedad | null
  // Ubicación
  calle: string
  barrio: string
  provincia: string
  referencias: string
  // Precio y contrato
  precio: string
  hasExpenses: boolean
  expensesAmount: string
  expensesIncluded: boolean
  depositMonths: string
  contractType: string
  contractDurationMonths: string
  updateIndex: string
  pricePerNight: string
  minNights: string
  maxNights: string
  pricePerMonth: string
  minMonths: string
  maxMonths: string
  guarantees: string[]
  services: string[]
  // Detalles
  ambientes: string
  dormitorios: string
  banos: string
  toilettes: string
  superficie: string
  totalAreaM2: string
  piso: string
  antiguedad: string
  propertyCondition: string
  hasCochera: boolean
  cocheraIncluida: boolean
  hasBaulera: boolean
  hasJardin: boolean
  hasTerrace: boolean
  hasPool: boolean
  hasBBQ: boolean
  hasGym: boolean
  hasLaundry: boolean
  hasSecurity: boolean
  hasElevator: boolean
  hasHeating: boolean
  hasAC: boolean
  isFurnished: boolean
  hasAppliances: boolean
  petsPolicy: string
  petTypes: string[]
  allowsKids: boolean | null
  smokingPolicy: string
  allowsWFH: boolean
  descripcion: string
}

interface Categoria {
  id: string
  label: string
  instruccion: string
  obligatoria: boolean
  icono: React.ReactNode
}

const CATEGORIAS: Categoria[] = [
  {
    id: 'frente',
    label: 'Frente del edificio o casa',
    instruccion: 'Sacá desde la vereda de enfrente, con el edificio entero visible y buena luz.',
    obligatoria: true,
    icono: (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" /><path d="M9 21V12h6v9" /></svg>),
  },
  {
    id: 'living',
    label: 'Living o entrada principal',
    instruccion: 'Sacá desde la esquina del ambiente con luz natural, sin objetos personales.',
    obligatoria: true,
    icono: (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" /><line x1="12" y1="12" x2="12" y2="16" /><line x1="10" y1="14" x2="14" y2="14" /></svg>),
  },
  {
    id: 'cocina',
    label: 'Cocina',
    instruccion: 'Mostrá la mesada, los muebles y los electrodomésticos. Limpia y sin platos.',
    obligatoria: true,
    icono: (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4" /><path d="M12 2v4" /><path d="M16 2v4" /><rect x="2" y="6" width="20" height="16" rx="2" /><path d="M6 14h.01" /><path d="M12 14h.01" /><path d="M18 14h.01" /><path d="M6 18h.01" /><path d="M12 18h.01" /><path d="M18 18h.01" /></svg>),
  },
  {
    id: 'dormitorio',
    label: 'Dormitorio',
    instruccion: 'Cama prolija, desde el pie. Si hay más de uno, subí el principal.',
    obligatoria: true,
    icono: (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9V4a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v5" /><path d="M2 9h20v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9z" /><path d="M6 9v4" /><path d="M18 9v4" /><path d="M2 15h20" /></svg>),
  },
  {
    id: 'bano',
    label: 'Baño',
    instruccion: 'Desde la puerta, mostrá el inodoro, ducha o bañadera. Limpio y ordenado.',
    obligatoria: true,
    icono: (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6a3 3 0 0 1 6 0v8H9V6z" /><path d="M3 14h18v2a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5v-2z" /><path d="M5 14V8" /></svg>),
  },
  {
    id: 'extras',
    label: 'Espacios extras',
    instruccion: 'Balcón, patio, terraza o cochera. Omitir si no aplica.',
    obligatoria: false,
    icono: (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="1" /><path d="M3 11V8a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v3" /><path d="M12 7V3" /><path d="M8 7l4-4 4 4" /></svg>),
  },
]

const TIPOS_INFO = [
  { value: 'departamento' as TipoPropiedad, label: 'Departamento', desc: 'Unidad en edificio o PH', emoji: '🏢' },
  { value: 'casa' as TipoPropiedad, label: 'Casa', desc: 'Vivienda independiente', emoji: '🏠' },
  { value: 'habitacion' as TipoPropiedad, label: 'Habitación', desc: 'En casa o depto compartido', emoji: '🛏️' },
  { value: 'local' as TipoPropiedad, label: 'Local comercial', desc: 'Comercial u oficina', emoji: '🏪' },
]

const TIPO_LABEL: Record<string, string> = {
  departamento: 'Departamento',
  casa: 'Casa',
  habitacion: 'Habitación',
  local: 'Local comercial',
}

const CONTRACT_LABEL: Record<string, string> = {
  tradicional: 'Alquiler tradicional',
  temporario: 'Temporario',
  temporada: 'Por temporada',
  a_convenir: 'A convenir',
}

const PASOS = [
  { label: 'Tipo' },
  { label: 'Contrato' },
  { label: 'Detalles' },
]

const INICIAL: FormData = {
  tipo: null,
  calle: '', barrio: '', provincia: '', referencias: '',
  precio: '', hasExpenses: false, expensesAmount: '', expensesIncluded: false,
  depositMonths: 'a_negociar',
  contractType: 'tradicional', contractDurationMonths: '24', updateIndex: 'a_negociar',
  pricePerNight: '', minNights: '', maxNights: '',
  pricePerMonth: '', minMonths: '', maxMonths: '',
  guarantees: [], services: [],
  ambientes: '', dormitorios: '', banos: '', toilettes: '',
  superficie: '', totalAreaM2: '', piso: '', antiguedad: '',
  propertyCondition: 'bueno',
  hasCochera: false, cocheraIncluida: false, hasBaulera: false, hasJardin: false,
  hasTerrace: false, hasPool: false, hasBBQ: false, hasGym: false,
  hasLaundry: false, hasSecurity: false, hasElevator: false,
  hasHeating: false, hasAC: false, isFurnished: false, hasAppliances: false,
  petsPolicy: 'no', petTypes: [], allowsKids: null,
  smokingPolicy: 'no', allowsWFH: true,
  descripcion: '',
}

const inputCls =
  'w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-colors'

const DRAFT_KEY = 'propia_publicar_draft'

// ── Helpers ──────────────────────────────────────────────────────────────

function toggleArr(arr: string[], item: string): string[] {
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]
}

function NumericoInput({ value, onChange, min = 0 }: { value: string; onChange: (v: string) => void; min?: number }) {
  const num = value === '' ? 0 : Number(value)
  return (
    <div className="flex items-center overflow-hidden rounded-xl border border-slate-300">
      <button type="button" onClick={() => onChange(String(Math.max(min, num - 1)))}
        className="flex h-11 w-11 shrink-0 items-center justify-center border-r border-slate-300 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>
      </button>
      <span className="flex-1 bg-slate-50 py-3 text-center text-base font-semibold text-slate-900">{num}</span>
      <button type="button" onClick={() => onChange(String(num + 1))}
        className="flex h-11 w-11 shrink-0 items-center justify-center border-l border-slate-300 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
      </button>
    </div>
  )
}

function CheckOption({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button type="button" onClick={onChange}
      className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors ${checked ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-300 bg-white text-slate-600 hover:border-slate-300'}`}>
      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${checked ? 'border-blue-500 bg-blue-500' : 'border-slate-300'}`}>
        {checked && <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
      </span>
      {label}
    </button>
  )
}

function RadioGroup({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button key={opt.value} type="button" onClick={() => onChange(opt.value)}
          className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${value === opt.value ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white text-slate-600 hover:border-blue-300'}`}>
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 text-sm font-semibold text-slate-700">{children}</p>
}

function HelpText({ children }: { children: React.ReactNode }) {
  return <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{children}</p>
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className="flex items-center gap-3 text-sm text-slate-700">
      <span className={`relative h-6 w-11 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-slate-200'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </span>
      {label}
    </button>
  )
}

// ── Main component ────────────────────────────────────────────────────────

export default function PublicarPage() {
  const [paso, setPaso] = useState(0)
  const [animKey, setAnimKey] = useState(0)
  const [animDir, setAnimDir] = useState<'forward' | 'backward'>('forward')
  const [form, setForm] = useState<FormData>(INICIAL)
  const [fotos, setFotos] = useState<Record<string, File>>({})
  const [previews, setPreviews] = useState<Record<string, string>>({})
  const [publicando, setPublicando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draftToast, setDraftToast] = useState<'guardado' | 'restaurado' | null>(null)
  const [mostrarRestaurar, setMostrarRestaurar] = useState(false)
  const [mejorando, setMejorando] = useState(false)
  const [modalIA, setModalIA] = useState(false)
  const [descripcionMejorada, setDescripcionMejorada] = useState('')
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const router = useRouter()

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as FormData
        if (parsed.tipo || parsed.calle || parsed.precio) setMostrarRestaurar(true)
      }
    } catch { /* noop */ }
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      const isEmpty = !form.tipo && !form.calle && !form.precio
      if (isEmpty) return
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(form))
        setDraftToast('guardado')
        setTimeout(() => setDraftToast(null), 2500)
      } catch { /* noop */ }
    }, 30_000)
    return () => clearInterval(timer)
  }, [form])

  function restaurarBorrador() {
    try {
      const saved = localStorage.getItem(DRAFT_KEY)
      if (saved) {
        setForm(JSON.parse(saved) as FormData)
        setDraftToast('restaurado')
        setTimeout(() => setDraftToast(null), 2500)
      }
    } catch { /* noop */ }
    setMostrarRestaurar(false)
  }

  function descartarBorrador() {
    try { localStorage.removeItem(DRAFT_KEY) } catch { /* noop */ }
    setMostrarRestaurar(false)
  }

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function irAlPaso(nuevoPaso: number) {
    setAnimDir(nuevoPaso > paso ? 'forward' : 'backward')
    setAnimKey((k) => k + 1)
    setPaso(nuevoPaso)
    window.scrollTo(0, 0)
  }

  function handleFotoChange(categoriaId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0]
    if (!archivo) return
    if (previews[categoriaId]) URL.revokeObjectURL(previews[categoriaId])
    setFotos((prev) => ({ ...prev, [categoriaId]: archivo }))
    setPreviews((prev) => ({ ...prev, [categoriaId]: URL.createObjectURL(archivo) }))
    if (inputRefs.current[categoriaId]) inputRefs.current[categoriaId]!.value = ''
  }

  function eliminarFoto(categoriaId: string) {
    if (previews[categoriaId]) URL.revokeObjectURL(previews[categoriaId])
    setFotos((prev) => { const n = { ...prev }; delete n[categoriaId]; return n })
    setPreviews((prev) => { const n = { ...prev }; delete n[categoriaId]; return n })
  }

  const obligatoriasFaltantes = CATEGORIAS.filter((c) => c.obligatoria && !fotos[c.id])

  function puedeAvanzar() {
    if (paso === 0) return form.tipo !== null
    if (paso === 1) return form.calle.trim() !== '' && form.provincia !== '' && form.precio.trim() !== ''
    return obligatoriasFaltantes.length === 0
  }

  const mejorarDescripcion = useCallback(async () => {
    if (form.descripcion.trim().length < 10) return
    setMejorando(true)
    try {
      const res = await fetch('/api/mejorar-descripcion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          descripcion: form.descripcion,
          tipo: TIPO_LABEL[form.tipo ?? ''] ?? '',
          direccion: [form.calle, form.barrio, form.provincia].filter(Boolean).join(', '),
          ambientes: form.ambientes || undefined,
          banos: form.banos || undefined,
          superficie: form.superficie || undefined,
          caracteristicas: [
            form.hasCochera && 'cochera',
            form.hasTerrace && 'balcón/terraza',
            form.petsPolicy === 'si' && 'permite mascotas',
            form.allowsKids === true && 'permite niños',
          ].filter(Boolean),
        }),
      })
      const data = await res.json()
      if (data.descripcion) {
        setDescripcionMejorada(data.descripcion)
        setModalIA(true)
      }
    } catch { /* noop */ }
    setMejorando(false)
  }, [form])

  async function handlePublicar() {
    setPublicando(true)
    setError(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const photoUrls: string[] = []
    for (const cat of CATEGORIAS) {
      const archivo = fotos[cat.id]
      if (!archivo) continue
      const ext = archivo.name.split('.').pop()
      const path = `${user.id}/${cat.id}-${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('propiedades').upload(path, archivo, { upsert: false })
      if (uploadError) { setError(`Error al subir "${cat.label}": ${uploadError.message}`); setPublicando(false); return }
      const { data: { publicUrl } } = supabase.storage.from('propiedades').getPublicUrl(path)
      photoUrls.push(publicUrl)
    }

    const { error: insertError } = await supabase.from('properties').insert({
      owner_id: user.id,
      type: form.tipo,
      address: form.calle,
      neighborhood: form.barrio || null,
      city: form.provincia,
      property_references: form.referencias || null,
      price_usd: Number(form.precio),
      has_expenses: form.hasExpenses,
      expenses_amount: form.hasExpenses && form.expensesAmount ? Number(form.expensesAmount) : null,
      expenses_included: form.hasExpenses ? form.expensesIncluded : false,
      includes_expenses: form.hasExpenses ? form.expensesIncluded : false,
      deposit_months: form.depositMonths,
      contract_type: form.contractType,
      contract_duration_months: form.contractType === 'tradicional' ? Number(form.contractDurationMonths) : null,
      update_index: form.contractType === 'tradicional' ? form.updateIndex : null,
      price_per_night: form.contractType === 'temporario' ? Number(form.pricePerNight) : null,
      min_nights: form.contractType === 'temporario' ? Number(form.minNights) : null,
      max_nights: form.contractType === 'temporario' ? Number(form.maxNights) : null,
      guarantees_accepted: form.guarantees,
      services_included: form.services,
      description: form.descripcion || null,
      bedrooms: form.dormitorios ? Number(form.dormitorios) : (form.ambientes ? Number(form.ambientes) : null),
      bathrooms: form.banos ? Number(form.banos) : null,
      rooms: form.ambientes ? Number(form.ambientes) : null,
      toilettes: form.toilettes ? Number(form.toilettes) : null,
      area_m2: form.superficie ? Number(form.superficie) : null,
      total_area_m2: form.totalAreaM2 ? Number(form.totalAreaM2) : null,
      floor_number: form.piso ? Number(form.piso) : null,
      property_age: form.antiguedad ? Number(form.antiguedad) : null,
      property_condition: form.propertyCondition,
      has_garage: form.hasCochera,
      has_storage: form.hasBaulera,
      has_garden: form.hasJardin,
      has_terrace: form.hasTerrace,
      has_pool: form.hasPool,
      has_bbq: form.hasBBQ,
      has_gym: form.hasGym,
      has_laundry: form.hasLaundry,
      has_security: form.hasSecurity,
      has_elevator: form.hasElevator,
      has_heating: form.hasHeating,
      has_ac: form.hasAC,
      has_balcony: form.hasTerrace,
      is_furnished: form.isFurnished,
      has_appliances: form.hasAppliances,
      allows_pets: form.petsPolicy !== 'no',
      pets_policy: form.petsPolicy,
      allows_kids: form.allowsKids,
      allows_smoking: form.smokingPolicy !== 'no',
      allows_smoking_policy: form.smokingPolicy,
      allows_wfh: form.allowsWFH,
      photo_urls: photoUrls.length > 0 ? photoUrls : null,
    })

    if (insertError) { setError(insertError.message); setPublicando(false); return }
    try { localStorage.removeItem(DRAFT_KEY) } catch { /* noop */ }
    router.push('/dashboard')
  }

  const checklist = [
    { label: 'Tipo de propiedad', done: form.tipo !== null },
    { label: 'Dirección', done: form.calle.trim() !== '' },
    { label: 'Provincia', done: form.provincia !== '' },
    { label: 'Precio mensual', done: form.precio.trim() !== '' && Number(form.precio) > 0 },
    { label: 'Tipo de contrato', done: form.contractType !== '' },
    { label: 'Descripción (80+ caracteres)', done: form.descripcion.length >= 80 },
    { label: 'Fotos principales', done: obligatoriasFaltantes.length === 0 },
  ]
  const completedCount = checklist.filter((i) => i.done).length
  const primeraFoto = Object.keys(previews)[0]

  // Key amenities for preview
  const amenidadesPreview = [
    form.hasCochera && 'Cochera',
    form.hasTerrace && 'Terraza',
    form.hasPool && 'Piscina',
    form.hasGym && 'Gimnasio',
    form.hasElevator && 'Ascensor',
    form.hasHeating && 'Calefacción',
    form.hasAC && 'A/C',
    form.isFurnished && 'Amoblado',
  ].filter(Boolean) as string[]

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">

      {/* Toast */}
      {draftToast && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 shadow-lg">
          <p className="text-sm font-medium text-slate-700">
            {draftToast === 'guardado' ? '💾 Borrador guardado' : '✓ Borrador restaurado'}
          </p>
        </div>
      )}

      {/* Banner restaurar */}
      {mostrarRestaurar && (
        <div className="fixed inset-x-0 top-0 z-[60] flex items-center justify-between gap-4 bg-blue-600 px-6 py-3">
          <p className="text-sm font-medium text-white">Tenés un borrador guardado. ¿Continuás?</p>
          <div className="flex shrink-0 gap-2">
            <button type="button" onClick={restaurarBorrador} className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-blue-600">Continuar</button>
            <button type="button" onClick={descartarBorrador} className="rounded-lg border border-blue-400 px-3 py-1.5 text-xs font-medium text-blue-100">Descartar</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes step-fwd { from { opacity:0; transform:translateX(24px); } to { opacity:1; transform:translateX(0); } }
        @keyframes step-bwd { from { opacity:0; transform:translateX(-24px); } to { opacity:1; transform:translateX(0); } }
        .anim-fwd { animation: step-fwd 0.28s cubic-bezier(0.16,1,0.3,1) forwards; }
        .anim-bwd { animation: step-bwd 0.28s cubic-bezier(0.16,1,0.3,1) forwards; }
      `}</style>

      {/* ── Header ── */}
      <header className="z-10 flex shrink-0 items-center justify-between border-b border-slate-300 bg-white px-6 py-4">
        <Link href="/" className="flex flex-col leading-none">
          <span className="text-base font-bold tracking-widest text-slate-900">PROPIA</span>
          <span className="text-[9px] font-semibold uppercase tracking-widest text-blue-600">Sin intermediarios</span>
        </Link>
        <div className="hidden items-center gap-1 lg:flex">
          {PASOS.map((p, i) => (
            <div key={p.label} className="flex items-center gap-1">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${i < paso ? 'bg-green-100 text-green-600' : i === paso ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                {i < paso ? (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                ) : <span>{i + 1}</span>}
              </div>
              <span className={`text-sm font-medium ${i === paso ? 'text-slate-900' : i < paso ? 'text-slate-500' : 'text-slate-400'}`}>{p.label}</span>
              {i < PASOS.length - 1 && <div className={`mx-2 h-px w-8 transition-colors ${i < paso ? 'bg-green-300' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>
        <Link href="/dashboard" className="text-sm text-slate-500 transition-colors hover:text-slate-900">Cancelar</Link>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left: Form ── */}
        <div className="flex w-full flex-col overflow-hidden lg:w-[45%] lg:border-r lg:border-slate-100">
          <div className="flex shrink-0 gap-1.5 px-6 pb-0 pt-4 lg:hidden">
            {PASOS.map((p, i) => (
              <div key={p.label} className={`h-1 flex-1 rounded-full transition-colors ${i <= paso ? 'bg-blue-600' : 'bg-slate-200'}`} />
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 lg:px-10 lg:py-8">
            <div className="mb-6">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-blue-600">
                Paso {paso + 1} de {PASOS.length}
              </p>
              <h2 className="text-2xl font-extrabold text-slate-900" style={{ letterSpacing: '-0.02em' }}>
                {paso === 0 ? '¿Qué vas a alquilar?' : paso === 1 ? 'Ubicación, precio y contrato' : 'Detalles completos y fotos'}
              </h2>
            </div>

            <div key={animKey} className={animDir === 'forward' ? 'anim-fwd' : 'anim-bwd'}>

              {/* ── Paso 1: Tipo ── */}
              {paso === 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {TIPOS_INFO.map(({ value, label, desc, emoji }) => {
                    const activo = form.tipo === value
                    return (
                      <button key={value} type="button" onClick={() => set('tipo', value)}
                        className={`relative flex flex-col items-center gap-3 rounded-2xl border-2 p-5 text-left transition-all ${activo ? 'border-blue-600 bg-blue-50 shadow-sm' : 'border-slate-300 hover:border-blue-200 hover:bg-blue-50/40'}`}>
                        {activo && (
                          <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                          </div>
                        )}
                        <span className="text-4xl">{emoji}</span>
                        <div className="text-center">
                          <p className={`text-sm font-semibold ${activo ? 'text-blue-700' : 'text-slate-800'}`}>{label}</p>
                          <p className={`mt-0.5 text-xs ${activo ? 'text-blue-400' : 'text-slate-400'}`}>{desc}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* ── Paso 2: Ubicación, precio y contrato ── */}
              {paso === 1 && (
                <div className="flex flex-col gap-7">

                  {/* Ubicación */}
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600" aria-hidden="true"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg>
                      <span className="text-sm font-bold text-slate-700">Ubicación</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-slate-700">Calle y número <span className="font-normal text-slate-400">*</span></label>
                      <input type="text" value={form.calle} onChange={(e) => set('calle', e.target.value)} placeholder="Ej: Av. Corrientes 1234" className={inputCls} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-slate-700">Barrio</label>
                        <input type="text" value={form.barrio} onChange={(e) => set('barrio', e.target.value)} placeholder="Ej: Palermo" className={inputCls} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-slate-700">Provincia <span className="font-normal text-slate-400">*</span></label>
                        <select value={form.provincia} onChange={(e) => set('provincia', e.target.value)} className={inputCls}>
                          <option value="" disabled>Seleccioná</option>
                          {PROVINCIAS.map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-slate-700">Referencias <span className="font-normal text-slate-400">(opcional)</span></label>
                      <input type="text" value={form.referencias} onChange={(e) => set('referencias', e.target.value)} placeholder="Ej: cerca del subte B, frente al parque" className={inputCls} />
                    </div>
                  </div>

                  {/* Precio */}
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600" aria-hidden="true"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                      <span className="text-sm font-bold text-slate-700">Precio</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-slate-700">Precio mensual (USD) <span className="font-normal text-slate-400">*</span></label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">USD</span>
                        <input type="number" value={form.precio} onChange={(e) => set('precio', e.target.value)} placeholder="0" min={0} className={`${inputCls} pl-14`} />
                      </div>
                    </div>

                    {/* Expensas */}
                    <div className="rounded-xl border border-slate-300 bg-slate-50 p-4">
                      <Toggle checked={form.hasExpenses} onChange={(v) => set('hasExpenses', v)} label="¿La propiedad tiene expensas?" />
                      {form.hasExpenses && (
                        <div className="mt-4 flex flex-col gap-3">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-slate-700">Monto de expensas (ARS)</label>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">$</span>
                              <input type="number" value={form.expensesAmount} onChange={(e) => set('expensesAmount', e.target.value)} placeholder="0" min={0} className={`${inputCls} pl-8`} />
                            </div>
                          </div>
                          <Toggle checked={form.expensesIncluded} onChange={(v) => set('expensesIncluded', v)} label="¿Incluidas en el precio?" />
                        </div>
                      )}
                      <HelpText>Las expensas son los gastos comunes del edificio. Es importante aclararlo para evitar malentendidos.</HelpText>
                    </div>

                    {/* Depósito */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-slate-700">Depósito requerido</label>
                      <select value={form.depositMonths} onChange={(e) => set('depositMonths', e.target.value)} className={inputCls}>
                        <option value="sin_deposito">Sin depósito</option>
                        <option value="1_mes">1 mes</option>
                        <option value="2_meses">2 meses</option>
                        <option value="3_meses">3 meses</option>
                        <option value="a_negociar">A negociar</option>
                      </select>
                      <HelpText>El depósito es una garantía que devolvés al finalizar el contrato.</HelpText>
                    </div>
                  </div>

                  {/* Tipo de contrato */}
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                      <span className="text-sm font-bold text-slate-700">Tipo de contrato</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'tradicional', label: 'Tradicional', desc: '2 años según ley' },
                        { value: 'temporario', label: 'Temporario', desc: 'Días o semanas' },
                        { value: 'temporada', label: 'Por temporada', desc: '1-6 meses' },
                        { value: 'a_convenir', label: 'A convenir', desc: 'Con el inquilino' },
                      ].map((opt) => (
                        <button key={opt.value} type="button" onClick={() => set('contractType', opt.value)}
                          className={`flex flex-col items-start rounded-xl border-2 px-3 py-2.5 text-left transition-all ${form.contractType === opt.value ? 'border-blue-600 bg-blue-50' : 'border-slate-300 bg-white hover:border-blue-200'}`}>
                          <span className={`text-sm font-semibold ${form.contractType === opt.value ? 'text-blue-700' : 'text-slate-800'}`}>{opt.label}</span>
                          <span className={`text-xs ${form.contractType === opt.value ? 'text-blue-400' : 'text-slate-400'}`}>{opt.desc}</span>
                        </button>
                      ))}
                    </div>
                    <HelpText>La ley argentina establece contratos de alquiler mínimo de 2 años para uso habitacional.</HelpText>

                    {/* Contract-specific fields */}
                    {form.contractType === 'tradicional' && (
                      <div className="flex flex-col gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-slate-700">Duración (meses)</label>
                            <input type="number" value={form.contractDurationMonths} onChange={(e) => set('contractDurationMonths', e.target.value)} min={12} className={inputCls} />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-slate-700">Índice de actualización</label>
                            <select value={form.updateIndex} onChange={(e) => set('updateIndex', e.target.value)} className={inputCls}>
                              <option value="ich">ICH</option>
                              <option value="ipc">IPC</option>
                              <option value="a_negociar">A negociar</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                    {form.contractType === 'temporario' && (
                      <div className="flex flex-col gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-sm font-medium text-slate-700">Precio por noche (USD)</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">USD</span>
                            <input type="number" value={form.pricePerNight} onChange={(e) => set('pricePerNight', e.target.value)} placeholder="0" min={0} className={`${inputCls} pl-14`} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-slate-700">Mínimo de noches</label>
                            <input type="number" value={form.minNights} onChange={(e) => set('minNights', e.target.value)} placeholder="1" min={1} className={inputCls} />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-slate-700">Máximo de noches</label>
                            <input type="number" value={form.maxNights} onChange={(e) => set('maxNights', e.target.value)} placeholder="30" min={1} className={inputCls} />
                          </div>
                        </div>
                      </div>
                    )}
                    {form.contractType === 'temporada' && (
                      <div className="flex flex-col gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-slate-700">Duración mínima (meses)</label>
                            <input type="number" value={form.minMonths} onChange={(e) => set('minMonths', e.target.value)} placeholder="1" min={1} className={inputCls} />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-slate-700">Duración máxima (meses)</label>
                            <input type="number" value={form.maxMonths} onChange={(e) => set('maxMonths', e.target.value)} placeholder="6" min={1} className={inputCls} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Garantías */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                      <span className="text-sm font-bold text-slate-700">Garantías aceptadas</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: 'recibo_sueldo', label: 'Recibo de sueldo' },
                        { value: 'garantia_propietaria', label: 'Garantía propietaria' },
                        { value: 'seguro_caucion', label: 'Seguro de caución' },
                        { value: 'aval_bancario', label: 'Aval bancario' },
                        { value: 'sin_garantia', label: 'Sin garantía' },
                        { value: 'a_negociar', label: 'A negociar' },
                      ].map((g) => (
                        <CheckOption key={g.value} checked={form.guarantees.includes(g.value)}
                          onChange={() => set('guarantees', toggleArr(form.guarantees, g.value))} label={g.label} />
                      ))}
                    </div>
                    <HelpText>Aclarando qué garantías aceptás ahorrás tiempo evitando consultas de personas que no cumplen el requisito.</HelpText>
                  </div>

                  {/* Servicios */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      <span className="text-sm font-bold text-slate-700">Servicios incluidos</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: 'agua', label: '💧 Agua' },
                        { value: 'gas', label: '🔥 Gas' },
                        { value: 'luz', label: '💡 Luz' },
                        { value: 'wifi', label: '📶 WiFi' },
                        { value: 'cable', label: '📺 Cable' },
                        { value: 'ninguno', label: 'Ninguno' },
                      ].map((s) => (
                        <CheckOption key={s.value} checked={form.services.includes(s.value)}
                          onChange={() => set('services', toggleArr(form.services, s.value))} label={s.label} />
                      ))}
                    </div>
                    <HelpText>Indicá qué servicios están incluidos en el precio del alquiler.</HelpText>
                  </div>
                </div>
              )}

              {/* ── Paso 3: Detalles y fotos ── */}
              {paso === 2 && (
                <div className="flex flex-col gap-7">

                  {/* Características físicas */}
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600" aria-hidden="true"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>
                      <span className="text-sm font-bold text-slate-700">Características físicas</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { key: 'ambientes' as keyof FormData, label: 'Ambientes' },
                        { key: 'dormitorios' as keyof FormData, label: 'Dormitorios' },
                        { key: 'banos' as keyof FormData, label: 'Baños' },
                        { key: 'toilettes' as keyof FormData, label: 'Toilettes' },
                      ].map(({ key, label }) => (
                        <div key={key} className="flex flex-col gap-1.5">
                          <label className="text-center text-xs font-medium text-slate-500">{label}</label>
                          <NumericoInput value={form[key] as string} onChange={(v) => set(key, v)} />
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-slate-700">Sup. cubierta (m²)</label>
                        <input type="number" value={form.superficie} onChange={(e) => set('superficie', e.target.value)} placeholder="Ej: 45" min={0} className={inputCls} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-slate-700">Sup. total (m²)</label>
                        <input type="number" value={form.totalAreaM2} onChange={(e) => set('totalAreaM2', e.target.value)} placeholder="Ej: 60" min={0} className={inputCls} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-slate-700">Piso</label>
                        <input type="number" value={form.piso} onChange={(e) => set('piso', e.target.value)} placeholder="Ej: 3" min={0} className={inputCls} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-slate-700">Antigüedad (años)</label>
                        <input type="number" value={form.antiguedad} onChange={(e) => set('antiguedad', e.target.value)} placeholder="Ej: 10" min={0} className={inputCls} />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-slate-700">Estado general</label>
                      <RadioGroup value={form.propertyCondition} onChange={(v) => set('propertyCondition', v)}
                        options={[
                          { value: 'excelente', label: 'Excelente' },
                          { value: 'muy_bueno', label: 'Muy bueno' },
                          { value: 'bueno', label: 'Bueno' },
                          { value: 'a_reciclar', label: 'A reciclar' },
                        ]} />
                    </div>
                  </div>

                  {/* Comodidades */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600" aria-hidden="true"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                      <span className="text-sm font-bold text-slate-700">Comodidades</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {[
                        { key: 'hasCochera' as keyof FormData, label: '🚗 Cochera' },
                        { key: 'hasBaulera' as keyof FormData, label: '📦 Baulera' },
                        { key: 'hasJardin' as keyof FormData, label: '🌿 Jardín' },
                        { key: 'hasTerrace' as keyof FormData, label: '🏠 Terraza/Azotea' },
                        { key: 'hasPool' as keyof FormData, label: '🏊 Piscina' },
                        { key: 'hasBBQ' as keyof FormData, label: '🔥 Parrilla' },
                        { key: 'hasGym' as keyof FormData, label: '💪 Gimnasio' },
                        { key: 'hasLaundry' as keyof FormData, label: '👕 Laundry' },
                        { key: 'hasSecurity' as keyof FormData, label: '🔒 Seguridad 24hs' },
                        { key: 'hasElevator' as keyof FormData, label: '🛗 Ascensor' },
                        { key: 'hasHeating' as keyof FormData, label: '🌡️ Calefacción' },
                        { key: 'hasAC' as keyof FormData, label: '❄️ Aire acondicionado' },
                        { key: 'isFurnished' as keyof FormData, label: '🛋️ Amoblado' },
                      ].map(({ key, label }) => (
                        <CheckOption key={key} checked={form[key] as boolean}
                          onChange={() => set(key, !form[key] as boolean)} label={label} />
                      ))}
                    </div>
                    {form.hasCochera && (
                      <div className="ml-1">
                        <Toggle checked={form.cocheraIncluida} onChange={(v) => set('cocheraIncluida', v)} label="¿La cochera está incluida en el precio?" />
                      </div>
                    )}
                    {form.isFurnished && (
                      <div className="ml-1">
                        <Toggle checked={form.hasAppliances} onChange={(v) => set('hasAppliances', v)} label="¿Incluye electrodomésticos?" />
                      </div>
                    )}
                  </div>

                  {/* Mascotas y convivencia */}
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <span className="text-base">🐾</span>
                      <span className="text-sm font-bold text-slate-700">Política de convivencia</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <SectionLabel>¿Acepta mascotas?</SectionLabel>
                      <RadioGroup value={form.petsPolicy} onChange={(v) => set('petsPolicy', v)}
                        options={[{ value: 'si', label: 'Sí' }, { value: 'no', label: 'No' }, { value: 'negociar', label: 'A negociar' }]} />
                      {form.petsPolicy === 'si' && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {[
                            { value: 'perros_pequenos', label: '🐕 Perros pequeños' },
                            { value: 'perros_grandes', label: '🐕 Perros grandes' },
                            { value: 'gatos', label: '🐈 Gatos' },
                            { value: 'otros', label: 'Otros' },
                          ].map((pt) => (
                            <CheckOption key={pt.value} checked={form.petTypes.includes(pt.value)}
                              onChange={() => set('petTypes', toggleArr(form.petTypes, pt.value))} label={pt.label} />
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <SectionLabel>¿Acepta niños?</SectionLabel>
                      <div className="flex gap-2">
                        {[{ v: true, l: 'Sí' }, { v: false, l: 'No' }].map(({ v, l }) => (
                          <button key={String(v)} type="button" onClick={() => set('allowsKids', v)}
                            className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${form.allowsKids === v ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 text-slate-600 hover:border-blue-300'}`}>
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <SectionLabel>¿Se permite fumar?</SectionLabel>
                      <RadioGroup value={form.smokingPolicy} onChange={(v) => set('smokingPolicy', v)}
                        options={[{ value: 'si', label: 'Sí' }, { value: 'no', label: 'No' }, { value: 'solo_exteriores', label: 'Solo en exteriores' }]} />
                    </div>
                    <Toggle checked={form.allowsWFH} onChange={(v) => set('allowsWFH', v)} label="Se permite trabajar desde casa (home office)" />
                  </div>

                  {/* Descripción */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                      <span className="text-sm font-bold text-slate-700">Descripción</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-slate-700">Descripción de la propiedad</label>
                      <span className={`text-xs font-medium ${form.descripcion.length < 80 ? 'text-amber-500' : form.descripcion.length > 800 ? 'text-red-500' : 'text-slate-400'}`}>
                        {form.descripcion.length}/800
                      </span>
                    </div>
                    <textarea value={form.descripcion} onChange={(e) => set('descripcion', e.target.value.slice(0, 800))}
                      placeholder="Describí la propiedad: luminosidad, estado, cercanía a servicios, amenidades, qué la hace especial..."
                      rows={5} className={`resize-none ${inputCls}`} />
                    <div className="flex items-start justify-between gap-3">
                      <HelpText>Mínimo 80 caracteres. Mencioná: luminosidad, estado de conservación, piso, orientación, cercanía al transporte, etc.</HelpText>
                      <button type="button" onClick={mejorarDescripcion} disabled={mejorando || form.descripcion.trim().length < 10}
                        className="flex shrink-0 items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-semibold text-purple-700 transition-colors hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-50">
                        {mejorando ? (
                          <svg className="h-3 w-3 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                        ) : '✨'}
                        {mejorando ? 'Mejorando…' : 'Mejorar con IA'}
                      </button>
                    </div>
                  </div>

                  {/* Fotos */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                      <span className="text-sm font-bold text-slate-700">Fotos</span>
                      {obligatoriasFaltantes.length > 0 && (
                        <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                          {obligatoriasFaltantes.length} pendiente{obligatoriasFaltantes.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      {CATEGORIAS.map((cat) => {
                        const preview = previews[cat.id]
                        return (
                          <div key={cat.id} className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${preview ? 'border-green-200 bg-green-50' : 'border-slate-300 bg-white'}`}>
                            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-slate-300 bg-slate-50">
                              {preview ? (
                                <>
                                  <Image src={preview} alt={cat.label} fill className="object-cover" />
                                  <button type="button" onClick={() => eliminarFoto(cat.id)}
                                    className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow-sm hover:text-red-600">
                                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                  </button>
                                </>
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-slate-300">{cat.icono}</div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-slate-900">
                                {cat.label}{cat.obligatoria && <span className="ml-1 text-blue-500">*</span>}
                              </p>
                              <p className="truncate text-xs text-slate-400">{cat.instruccion}</p>
                            </div>
                            <input ref={(el) => { inputRefs.current[cat.id] = el }} type="file" accept="image/*" className="hidden" onChange={(e) => handleFotoChange(cat.id, e)} />
                            <button type="button" onClick={() => inputRefs.current[cat.id]?.click()}
                              className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${preview ? 'border-green-200 bg-white text-green-700 hover:bg-green-50' : 'border-slate-300 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600'}`}>
                              {preview ? '✓ Cambiar' : 'Subir'}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Footer navigation */}
          <div className="shrink-0 border-t border-slate-100 bg-white px-6 py-4 lg:px-10">
            {error && <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-600">{error}</p>}
            <div className="flex gap-3">
              {paso > 0 && (
                <button type="button" onClick={() => irAlPaso(paso - 1)} disabled={publicando}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40">
                  Atrás
                </button>
              )}
              {paso < PASOS.length - 1 ? (
                <button type="button" onClick={() => irAlPaso(paso + 1)} disabled={!puedeAvanzar()}
                  className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-30">
                  Siguiente
                </button>
              ) : (
                <button type="button" onClick={handlePublicar} disabled={publicando || !puedeAvanzar()}
                  className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-40">
                  {publicando ? 'Publicando...' : 'Publicar propiedad'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Right: Preview ── */}
        <div className="hidden flex-col overflow-hidden bg-slate-50 lg:flex lg:w-[55%]">
          <div className="flex-1 overflow-y-auto px-10 py-10">
            <div className="mb-8">
              {paso === 0 && <><h3 className="mb-2 text-xl font-bold text-slate-900" style={{ letterSpacing: '-0.02em' }}>El primer paso es el más importante</h3><p className="text-sm leading-relaxed text-slate-500">Elegir el tipo correcto ayuda a los inquilinos a encontrar lo que buscan. Las publicaciones bien categorizadas reciben hasta un 40% más de consultas.</p></>}
              {paso === 1 && <><h3 className="mb-2 text-xl font-bold text-slate-900" style={{ letterSpacing: '-0.02em' }}>Precio y contrato claros = más confianza</h3><p className="text-sm leading-relaxed text-slate-500">El 80% de las consultas provienen de personas que filtran por zona y precio. Detallar el tipo de contrato y garantías ahorra tiempo a los dos.</p></>}
              {paso === 2 && <><h3 className="mb-2 text-xl font-bold text-slate-900" style={{ letterSpacing: '-0.02em' }}>Los detalles hacen la diferencia</h3><p className="text-sm leading-relaxed text-slate-500">Las propiedades con descripción completa y fotos se alquilan hasta 3 veces más rápido. ¡Ya casi terminás!</p></>}
            </div>

            {/* Checklist */}
            <div className="mb-8 rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">Tu publicación</p>
                <span className={`text-xs font-semibold ${completedCount >= checklist.length ? 'text-green-600' : 'text-blue-600'}`}>
                  {completedCount}/{checklist.length} completo
                </span>
              </div>
              <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-blue-600 transition-all duration-500" style={{ width: `${(completedCount / checklist.length) * 100}%` }} />
              </div>
              <div className="flex flex-col gap-2">
                {checklist.map((item) => (
                  <div key={item.label} className={`flex items-center gap-2.5 text-sm ${item.done ? 'text-slate-700' : 'text-slate-400'}`}>
                    <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors ${item.done ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-300'}`}>
                      {item.done ? (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      ) : <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />}
                    </div>
                    {item.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Preview card */}
            {form.tipo ? (
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Así se verá tu publicación</p>
                <div className="rounded-2xl border border-slate-300 bg-white shadow-sm overflow-hidden">
                  {/* Photo */}
                  {primeraFoto ? (
                    <div className="relative h-44 w-full bg-slate-100">
                      <Image src={previews[primeraFoto]} alt="Foto principal" fill className="object-cover" />
                      {Object.keys(previews).length > 1 && (
                        <div className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
                          +{Object.keys(previews).length - 1} fotos
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex h-44 items-center justify-center bg-slate-100">
                      <div className="text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 text-slate-300"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                        <p className="text-xs text-slate-400">Las fotos aparecerán aquí</p>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-3 p-5">
                    {/* Tipo + contrato */}
                    <div className="flex flex-wrap gap-1.5">
                      <span className="inline-flex w-fit rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600">{TIPO_LABEL[form.tipo]}</span>
                      {form.contractType && (
                        <span className="inline-flex w-fit rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">{CONTRACT_LABEL[form.contractType]}</span>
                      )}
                    </div>

                    {/* Address */}
                    <p className="text-base font-semibold leading-snug text-slate-900">
                      {form.calle ? <>{form.calle}{form.barrio ? `, ${form.barrio}` : ''}</> : <span className="text-slate-300">Dirección de la propiedad</span>}
                    </p>
                    {form.provincia && <p className="text-xs text-slate-400">{form.provincia}</p>}

                    {/* Precio */}
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      {form.precio && Number(form.precio) > 0 ? (
                        <>
                          <span className="text-xl font-bold text-blue-600">USD {Number(form.precio).toLocaleString('es-AR')}</span>
                          <span className="text-sm text-slate-400">/mes</span>
                          {form.hasExpenses && form.expensesIncluded && <span className="text-xs text-green-600">· Expensas incl.</span>}
                          {form.hasExpenses && !form.expensesIncluded && form.expensesAmount && (
                            <span className="text-xs text-slate-400">+ ${Number(form.expensesAmount).toLocaleString('es-AR')} expensas</span>
                          )}
                        </>
                      ) : (
                        <span className="text-xl font-bold text-slate-300">USD —</span>
                      )}
                    </div>

                    {/* Características */}
                    {(Number(form.ambientes) > 0 || Number(form.banos) > 0 || form.superficie || form.totalAreaM2) && (
                      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                        {Number(form.ambientes) > 0 && <span className="rounded-lg bg-slate-100 px-2 py-0.5">{form.ambientes} amb.</span>}
                        {Number(form.dormitorios) > 0 && <span className="rounded-lg bg-slate-100 px-2 py-0.5">{form.dormitorios} dorm.</span>}
                        {Number(form.banos) > 0 && <span className="rounded-lg bg-slate-100 px-2 py-0.5">{form.banos} baño{Number(form.banos) !== 1 ? 's' : ''}</span>}
                        {form.superficie && <span className="rounded-lg bg-slate-100 px-2 py-0.5">{form.superficie} m²</span>}
                      </div>
                    )}

                    {/* Garantías */}
                    {form.guarantees.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {form.guarantees.map((g) => (
                          <span key={g} className="rounded-full border border-slate-300 px-2 py-0.5 text-xs text-slate-500">
                            {g.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Servicios */}
                    {form.services.length > 0 && !form.services.includes('ninguno') && (
                      <div className="flex gap-1">
                        {form.services.includes('agua') && <span title="Agua" className="text-base">💧</span>}
                        {form.services.includes('gas') && <span title="Gas" className="text-base">🔥</span>}
                        {form.services.includes('luz') && <span title="Luz" className="text-base">💡</span>}
                        {form.services.includes('wifi') && <span title="WiFi" className="text-base">📶</span>}
                        {form.services.includes('cable') && <span title="Cable" className="text-base">📺</span>}
                      </div>
                    )}

                    {/* Amenidades */}
                    {amenidadesPreview.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {amenidadesPreview.slice(0, 5).map((a) => (
                          <span key={a} className="rounded-full border border-slate-300 bg-slate-50 px-2 py-0.5 text-xs text-slate-500">{a}</span>
                        ))}
                        {amenidadesPreview.length > 5 && (
                          <span className="rounded-full border border-slate-300 bg-slate-50 px-2 py-0.5 text-xs text-slate-400">+{amenidadesPreview.length - 5}</span>
                        )}
                      </div>
                    )}

                    {/* Políticas */}
                    <div className="flex flex-wrap gap-1.5">
                      {form.petsPolicy === 'si' && <span className="rounded-full border border-slate-300 px-2 py-0.5 text-xs text-slate-500">🐾 Mascotas</span>}
                      {form.allowsKids === true && <span className="rounded-full border border-slate-300 px-2 py-0.5 text-xs text-slate-500">👶 Niños</span>}
                      {form.allowsWFH && <span className="rounded-full border border-slate-300 px-2 py-0.5 text-xs text-slate-500">💻 Home office</span>}
                    </div>

                    {form.descripcion && (
                      <p className="line-clamp-2 text-sm leading-relaxed text-slate-500">{form.descripcion}</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 py-16 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                </div>
                <p className="text-sm font-medium text-slate-500">La preview aparecerá aquí</p>
                <p className="mt-1 text-xs text-slate-400">Completá el formulario para ver cómo queda</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal IA ── */}
      {modalIA && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Descripción mejorada con IA</h3>
              <button type="button" onClick={() => setModalIA(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto rounded-xl bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700">
              {descripcionMejorada}
            </div>
            <p className="mt-3 text-xs text-slate-400">Revisá el texto antes de aplicarlo. Podés editarlo después.</p>
            <div className="mt-4 flex justify-end gap-3">
              <button type="button" onClick={() => setModalIA(false)} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancelar</button>
              <button type="button" onClick={() => { set('descripcion', descripcionMejorada); setModalIA(false) }} className="rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-purple-700">Usar esta descripción</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
