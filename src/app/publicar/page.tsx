'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase-client'
import { PROVINCIAS } from '@/lib/provincias'
import NavbarClient from '@/components/NavbarClient'
import { parsearErrorSupabase } from '@/lib/utils'
import { UBICACIONES } from '@/app/propiedades/ubicaciones'

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
const TAMANIO_MAX = 10 * 1024 * 1024 // 10 MB

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
    instruccion: 'Sacá desde la vereda de enfrente mostrando toda la fachada. Incluí la entrada principal. Mejor en hora dorada.',
    obligatoria: true,
    icono: (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" /><path d="M9 21V12h6v9" /></svg>),
  },
  {
    id: 'living',
    label: 'Living o entrada principal',
    instruccion: 'Desde la esquina más alejada de la entrada, mostrando toda la habitación. Asegurate de que haya buena luz y esté ordenado.',
    obligatoria: true,
    icono: (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" /><line x1="12" y1="12" x2="12" y2="16" /><line x1="10" y1="14" x2="14" y2="14" /></svg>),
  },
  {
    id: 'cocina',
    label: 'Cocina',
    instruccion: 'Mostrá la mesada, los muebles y los electrodomésticos. Limpia y sin platos. Abrí las persianas.',
    obligatoria: true,
    icono: (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4" /><path d="M12 2v4" /><path d="M16 2v4" /><rect x="2" y="6" width="20" height="16" rx="2" /><path d="M6 14h.01" /><path d="M12 14h.01" /><path d="M18 14h.01" /><path d="M6 18h.01" /><path d="M12 18h.01" /><path d="M18 18h.01" /></svg>),
  },
  {
    id: 'dormitorio',
    label: 'Dormitorio',
    instruccion: 'Cama tendida prolija, desde el pie hacia la cabecera. Mostrá las ventanas y el placard si es posible.',
    obligatoria: true,
    icono: (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9V4a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v5" /><path d="M2 9h20v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9z" /><path d="M6 9v4" /><path d="M18 9v4" /><path d="M2 15h20" /></svg>),
  },
  {
    id: 'bano',
    label: 'Baño',
    instruccion: 'Desde la puerta, mostrando el inodoro, ducha o bañadera. Limpio y ordenado, sin artículos personales visibles.',
    obligatoria: true,
    icono: (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6a3 3 0 0 1 6 0v8H9V6z" /><path d="M3 14h18v2a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5v-2z" /><path d="M5 14V8" /></svg>),
  },
  {
    id: 'extras',
    label: 'Espacios extras',
    instruccion: 'Mostrá el balcón, terraza, jardín, cochera o cualquier espacio adicional que sume valor a la propiedad.',
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
  { label: 'Tipo',      fullLabel: 'Tipo de propiedad',  minutes: 1 },
  { label: 'Ubicación', fullLabel: 'Ubicación y precio', minutes: 2 },
  { label: 'Detalles',  fullLabel: 'Detalles y fotos',   minutes: 3 },
]

const INICIAL: FormData = {
  tipo: null,
  calle: '', barrio: '', provincia: '', referencias: '',
  precio: '', hasExpenses: false, expensesAmount: '', expensesIncluded: false,
  depositMonths: 'a_negociar',
  contractType: 'tradicional', contractDurationMonths: '24', updateIndex: 'ipc_trimestral',
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
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${checked ? 'bg-blue-600' : 'bg-slate-200'}`}>
        <span className={`absolute top-[2px] left-[2px] h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? 'translate-x-[20px]' : 'translate-x-0'}`} />
      </span>
      {label}
    </button>
  )
}

// ── Localidad autocomplete data ───────────────────────────────────────────

function getLocalidades(provincia: string): string[] | null {
  const config = UBICACIONES.find((u) => u.label === provincia)
  if (!config) return null
  if (config.localidades) return config.localidades
  if (config.zonas) {
    return config.zonas.flatMap((z) => z.localidades ?? [])
  }
  return null
}

function LocalidadInput({
  value,
  onChange,
  provincia,
  inputCls,
}: {
  value: string
  onChange: (v: string) => void
  provincia: string
  inputCls: string
}) {
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const localidades = useMemo(() => getLocalidades(provincia), [provincia])

  const sugerencias = useMemo(() => {
    if (!localidades || query.length < 2) return []
    const q = query.toLowerCase()
    return localidades.filter((l) => l.toLowerCase().includes(q)).slice(0, 8)
  }, [localidades, query])

  // Sync query when value changes externally
  useEffect(() => { setQuery(value) }, [value])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (!localidades) {
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ej: Temperley, Banfield, Palermo..."
        className={inputCls}
        style={{ fontSize: 16 }}
      />
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        placeholder="Ej: Temperley, Banfield, Palermo..."
        className={inputCls}
        style={{ fontSize: 16 }}
        autoComplete="off"
      />
      {open && sugerencias.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
          {sugerencias.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setQuery(s)
                onChange(s)
                setOpen(false)
              }}
              className="flex w-full items-center px-4 py-3 text-left text-base text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-700"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
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

  const [draftDate, setDraftDate] = useState<string | null>(null)
  const [navInfo, setNavInfo] = useState<{ email: string | null; name: string | null; avatar: string | null }>({ email: null, name: null, avatar: null })
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('profiles').select('full_name, avatar_url, verification_status').eq('id', user.id).single().then(({ data }) => {
        setNavInfo({ email: user.email ?? null, name: data?.full_name ?? null, avatar: data?.avatar_url ?? null })
        setVerificationStatus((data?.verification_status as string) ?? 'unverified')
      })
    })
  }, [])

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as { data: FormData; savedAt: string }
        const data = parsed.data ?? (parsed as unknown as FormData)
        if (data.tipo || data.calle || data.precio) {
          setMostrarRestaurar(true)
          if (parsed.savedAt) {
            const d = new Date(parsed.savedAt)
            setDraftDate(d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }))
          }
        }
      }
    } catch {
      // Draft corrupted — clean it up silently
      try { localStorage.removeItem(DRAFT_KEY) } catch { /* noop */ }
    }
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      const isEmpty = !form.tipo && !form.calle && !form.precio
      if (isEmpty) return
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ data: form, savedAt: new Date().toISOString() }))
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
        const parsed = JSON.parse(saved) as { data: FormData; savedAt: string }
        setForm(parsed.data ?? (parsed as unknown as FormData))
        setDraftToast('restaurado')
        setTimeout(() => setDraftToast(null), 2500)
      }
    } catch {
      // Draft corrupted — clean it up silently
      try { localStorage.removeItem(DRAFT_KEY) } catch { /* noop */ }
    }
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

    // Full form validation
    if (!form.tipo) {
      setError('Seleccioná el tipo de propiedad.')
      setPublicando(false)
      return
    }
    if (!form.calle || form.calle.trim().length < 5) {
      setError('Ingresá una dirección válida (mínimo 5 caracteres).')
      setPublicando(false)
      return
    }

    const obligatorias = CATEGORIAS.filter((c) => c.obligatoria)
    const faltantes = obligatorias.filter((c) => !fotos[c.id])
    if (faltantes.length > 0) {
      setError(`Faltan fotos obligatorias: ${faltantes.map((c) => c.label).join(', ')}.`)
      setPublicando(false)
      return
    }

    // Validate price
    const price = parseFloat(form.precio)
    if (isNaN(price) || price <= 0) {
      setError('El precio debe ser un número mayor a cero.')
      setPublicando(false)
      return
    }

    // Validate numeric fields
    const numericFields: Array<{ value: string; label: string }> = [
      { value: form.ambientes, label: 'Ambientes' },
      { value: form.dormitorios, label: 'Dormitorios' },
      { value: form.banos, label: 'Baños' },
      { value: form.toilettes, label: 'Toilettes' },
      { value: form.superficie, label: 'Superficie' },
      { value: form.totalAreaM2, label: 'Superficie total' },
      { value: form.piso, label: 'Piso' },
      { value: form.antiguedad, label: 'Antigüedad' },
    ]
    for (const field of numericFields) {
      if (field.value && (isNaN(Number(field.value)) || Number(field.value) < 0)) {
        setError(`El campo "${field.label}" debe ser un número válido.`)
        setPublicando(false)
        return
      }
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const photoUrls: string[] = []
    for (const cat of CATEGORIAS) {
      const archivo = fotos[cat.id]
      if (!archivo) continue

      // File type and size validation
      if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
        setError(`"${cat.label}": solo se permiten imágenes JPG, PNG, WebP o HEIC.`)
        setPublicando(false)
        return
      }
      if (archivo.size > TAMANIO_MAX) {
        setError(`"${cat.label}": la imagen no puede superar los 10 MB.`)
        setPublicando(false)
        return
      }

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
      price_usd: price,
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

    if (insertError) { setError(parsearErrorSupabase(insertError)); setPublicando(false); return }
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
    <div className="min-h-screen bg-[#F8F9FA]">

      {/* ── Toast (bottom-right, dark) ── */}
      {draftToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-lg px-4 py-2.5 shadow-lg" style={{ background: '#1A1A2E' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>
          </svg>
          <p className="text-sm font-medium text-white">
            {draftToast === 'guardado' ? 'Borrador guardado' : 'Borrador restaurado'}
          </p>
        </div>
      )}

      {/* ── Banner restaurar borrador ── */}
      {mostrarRestaurar && (
        <div className="fixed inset-x-0 top-0 z-[60] flex items-center justify-between gap-4 bg-blue-600 px-6 py-3">
          <p className="text-sm font-medium text-white">Tenés un borrador guardado{draftDate ? ` del ${draftDate}` : ''}. ¿Continuás?</p>
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

      {/* ── Navbar ── */}
      <NavbarClient
        isLoggedIn={!!navInfo.email}
        userName={navInfo.name}
        userEmail={navInfo.email}
        avatarUrl={navInfo.avatar}
        isDueno={false}
      />

      {/* ── Progress stepper ── */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[860px] px-6">

          {/* Desktop stepper */}
          <div className="hidden items-center justify-center py-5 lg:flex">
            {PASOS.map((p, i) => (
              <div key={p.label} className="flex items-center">
                <button
                  type="button"
                  onClick={() => { if (i < paso) irAlPaso(i) }}
                  className={`flex items-center gap-2.5 ${i < paso ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all ${
                    i <= paso ? 'bg-blue-600 text-white' : 'border-2 border-slate-300 bg-white text-slate-400'
                  }`}>
                    {i < paso ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : <span>{i + 1}</span>}
                  </div>
                  <span className={`text-sm transition-colors ${
                    i === paso ? 'font-bold text-blue-600' : i < paso ? 'font-medium text-slate-500' : 'font-medium text-slate-400'
                  }`}>
                    {p.fullLabel}
                  </span>
                </button>
                {i < PASOS.length - 1 && (
                  <div className={`mx-6 h-px w-14 transition-colors ${i < paso ? 'bg-blue-400' : 'bg-slate-200'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Mobile progress */}
          <div className="flex flex-col gap-2 py-3 lg:hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Paso {paso + 1} de {PASOS.length} · {PASOS[paso].fullLabel}
              </span>
              <span className="text-xs text-slate-400">~{PASOS[paso].minutes} min</span>
            </div>
            <div className="flex gap-1.5">
              {PASOS.map((p, i) => (
                <div key={p.label} className={`h-1 flex-1 rounded-full transition-colors ${i <= paso ? 'bg-blue-600' : 'bg-slate-200'}`} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main ── */}
      <main className="mx-auto max-w-[860px] px-6 pb-28 pt-8 lg:pb-12">

        {/* ── PASO 1: Tipo — full width ── */}
        {paso === 0 && (
          <div key={animKey} className={animDir === 'forward' ? 'anim-fwd' : 'anim-bwd'}>

            {/* Banner verificación */}
            {verificationStatus && verificationStatus !== 'verified' && (
              <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0" aria-hidden="true">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>
                  </svg>
                  <p className="text-sm text-blue-800">
                    <span className="font-bold">Las publicaciones con identidad verificada reciben 3x más consultas.</span>
                    {' '}Verificá tu DNI gratis antes de publicar.
                  </p>
                </div>
                <Link href="/verificar-identidad"
                  className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700">
                  Verificar mi identidad
                </Link>
              </div>
            )}

            <h2 className="mb-8 text-center text-[28px] font-extrabold text-slate-900" style={{ letterSpacing: '-0.02em' }}>
              ¿Qué tipo de propiedad vas a publicar?
            </h2>

            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {TIPOS_INFO.map(({ value, label, desc, emoji }) => {
                  const activo = form.tipo === value
                  return (
                    <button key={value} type="button" onClick={() => set('tipo', value)}
                      className={`relative flex flex-col items-center gap-3 rounded-2xl border-2 p-6 text-center transition-all duration-200 ${
                        activo
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-blue-600 hover:shadow-[0_4px_12px_rgba(37,99,235,0.15)]'
                      }`}
                    >
                      {activo && (
                        <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      )}
                      <span className="text-[40px] leading-none">{emoji}</span>
                      <div>
                        <p className={`text-base font-bold ${activo ? 'text-blue-700' : 'text-[#1A1A2E]'}`}>{label}</p>
                        <p className={`mt-0.5 text-[13px] ${activo ? 'text-blue-400' : 'text-[#6B7280]'}`}>{desc}</p>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Tip contextual */}
              <div className="flex items-start gap-3 rounded-lg px-4 py-3 transition-all duration-200"
                style={{ background: '#EFF6FF', borderLeft: '3px solid #2563EB' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p className="text-sm leading-relaxed text-blue-800">
                  {!form.tipo
                    ? 'Elegí el tipo que mejor describe tu propiedad. Esto es lo primero que ven los interesados al buscar.'
                    : form.tipo === 'departamento'
                    ? '🏢 Tip: Los departamentos son los más buscados en CABA y GBA. Destacá el piso, la luminosidad y si tiene balcón.'
                    : form.tipo === 'casa'
                    ? '🏠 Tip: Las casas con jardín o patio tienen mucha demanda. Mencioná si tiene cochera y espacios al aire libre.'
                    : form.tipo === 'habitacion'
                    ? '🛏️ Tip: Indicá claramente qué espacios son compartidos (cocina, baño, living) y qué está incluido en el precio.'
                    : '🏪 Tip: Especificá los m² totales, si tiene depósito, baño propio y habilitación municipal.'
                  }
                </p>
              </div>

              {error && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-600">{error}</p>
              )}

              {/* Desktop next button — right aligned */}
              <div className="group relative hidden justify-end lg:flex">
                <button type="button" onClick={() => irAlPaso(1)} disabled={!puedeAvanzar()}
                  className="rounded-xl px-8 py-3 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed"
                  style={{ background: puedeAvanzar() ? '#2563EB' : '#CBD5E1' }}>
                  Siguiente paso →
                </button>
                {!puedeAvanzar() && (
                  <div className="pointer-events-none absolute bottom-full right-0 mb-2 hidden w-56 rounded-lg bg-slate-800 px-3 py-2 text-center text-xs text-white shadow-lg group-hover:block">
                    Seleccioná un tipo de propiedad para continuar
                    <div className="absolute right-6 top-full border-4 border-transparent border-t-slate-800" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── PASOS 2 y 3: two-column layout ── */}
        {paso > 0 && (
          <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_340px] lg:items-start">

            {/* Form column */}
            <div>
              <div key={animKey} className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${animDir === 'forward' ? 'anim-fwd' : 'anim-bwd'}`}>

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
                        <label className="text-sm font-medium text-slate-700">Localidad</label>
                        <LocalidadInput value={form.barrio} onChange={(v) => set('barrio', v)} provincia={form.provincia} inputCls={inputCls} />
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
                      <p className="mt-0.5 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-700">
                        💡 <strong>Tip:</strong> Las propiedades con precio actualizado reciben 40% más consultas. Revisá precios similares en tu zona antes de publicar.
                      </p>
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
                              <option value="ipc_trimestral">IPC trimestral (cada 3 meses)</option>
                              <option value="ipc_semestral">IPC semestral (cada 6 meses)</option>
                              <option value="ipc_anual">IPC anual (cada 12 meses)</option>
                              <option value="icl_trimestral">ICL trimestral (cada 3 meses)</option>
                              <option value="icl_semestral">ICL semestral (cada 6 meses)</option>
                              <option value="cvs_trimestral">CVS trimestral (cada 3 meses)</option>
                              <option value="a_negociar">A negociar con el inquilino</option>
                            </select>
                            <p className="mt-1 text-xs leading-relaxed text-slate-400">El índice de actualización determina cómo se ajusta el precio del alquiler. El más común en Argentina es el IPC trimestral.</p>
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
                    <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 px-4 py-3 text-xs leading-relaxed text-blue-800">
                      ✍️ <strong>Una buena descripción puede duplicar tus consultas.</strong> Mencioná: luminosidad, estado del inmueble, qué hay cerca (transporte, comercios, colegios) y cualquier detalle que lo haga especial.
                      <p className="mt-1.5 text-blue-600 opacity-80">Ej: &ldquo;Departamento luminoso con vista al parque, cocina renovada, a 2 cuadras del subte B. Edificio con portería 24hs y gimnasio.&rdquo;</p>
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
                    {/* Photo importance banner */}
                    <div style={{ border: '2px solid #16A34A', borderRadius: 16, background: '#fff' }}>
                      {/* Header */}
                      <div style={{ background: '#16A34A', borderRadius: '12px 12px 0 0', padding: '16px 24px' }}>
                        <p style={{ color: '#fff', fontSize: 20, fontWeight: 700, lineHeight: 1.3, margin: 0 }}>
                          📸 Las fotos deciden si te contactan
                        </p>
                        <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, marginTop: 4, marginBottom: 0 }}>
                          El 87% de los interesados decide basándose solo en las fotos
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="flex flex-col gap-2 p-5 pb-0 sm:grid sm:grid-cols-3 sm:gap-3">
                        {[
                          { stat: '3x', desc: '3 veces más consultas con buenas fotos' },
                          { stat: '87%', desc: '87% decide si contactar solo mirando las fotos' },
                          { stat: '3 sem', desc: '3 semanas antes se alquila con fotos de calidad' },
                        ].map(({ stat, desc }) => (
                          <div key={stat} className="flex items-center gap-4 rounded-xl px-4 py-3 sm:flex-col sm:items-center sm:gap-1 sm:p-3 sm:text-center"
                            style={{ background: '#DCFCE7', borderRadius: 12 }}>
                            <span className="shrink-0 sm:text-4xl" style={{ fontSize: 48, fontWeight: 700, color: '#16A34A', lineHeight: 1, minWidth: 70, textAlign: 'center' }}>{stat}</span>
                            <span style={{ fontSize: 14, color: '#166534', lineHeight: 1.4 }}>{desc}</span>
                          </div>
                        ))}
                      </div>

                      {/* Recommendations */}
                      <div className="px-5 pb-0 pt-5">
                        <p style={{ fontSize: 16, fontWeight: 600, color: '#1A1A2E', marginBottom: 12 }}>
                          Cómo sacar las mejores fotos:
                        </p>
                        <ol className="flex flex-col gap-3.5">
                          {[
                            { title: 'Usá luz natural', body: 'Abrí todas las persianas y cortinas. Sacá las fotos durante el día.' },
                            { title: 'Ordená y limpiá antes', body: 'Retirá objetos personales y dejá cada ambiente despejado.' },
                            { title: 'Fotografiá desde las esquinas', body: 'Posicionarte en la esquina del ambiente muestra más espacio.' },
                            { title: 'Sin personas ni mascotas', body: 'Las fotos deben mostrar la propiedad, no a sus habitantes.' },
                            { title: 'Exterior en día soleado', body: 'Sacá desde la vereda de enfrente mostrando toda la fachada.' },
                          ].map(({ title, body }, i) => (
                            <li key={i} className="flex gap-3">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                                style={{ background: '#16A34A', minWidth: 28 }}>
                                {i + 1}
                              </span>
                              <div>
                                <p style={{ fontSize: 15, fontWeight: 700, color: '#1A1A2E', marginBottom: 1 }}>{title}</p>
                                <p style={{ fontSize: 13, color: '#6b7280' }}>{body}</p>
                              </div>
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* Closing stat */}
                      <div className="m-5 flex items-center gap-2.5 rounded-lg px-4 py-3" style={{ background: '#DCFCE7' }}>
                        <span className="shrink-0 text-base font-bold" style={{ color: '#16A34A' }}>✓</span>
                        <p className="text-sm italic" style={{ color: '#166534' }}>
                          Las propiedades con fotos de calidad se alquilan en promedio 3 semanas antes
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                      <span className="text-sm font-bold text-slate-700">Fotos</span>
                      {obligatoriasFaltantes.length > 0 && (
                        <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                          {obligatoriasFaltantes.length} pendiente{obligatoriasFaltantes.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-4">
                      {CATEGORIAS.map((cat) => {
                        const preview = previews[cat.id]
                        return (
                          <div key={cat.id}>
                            <input ref={(el) => { inputRefs.current[cat.id] = el }} type="file" accept="image/*" className="hidden" onChange={(e) => handleFotoChange(cat.id, e)} />

                            {preview ? (
                              /* ── Estado con foto ── */
                              <div className="rounded-2xl p-4" style={{ border: '2px solid #16A34A', background: '#F0FDF4' }}>
                                <div className="relative mb-3 overflow-hidden rounded-xl" style={{ height: 200 }}>
                                  <Image src={preview} alt={cat.label} fill className="object-cover" />
                                  {/* Badge categoría */}
                                  <div className="absolute bottom-2 left-2 rounded-full px-2.5 py-1 text-xs font-bold text-white" style={{ background: '#16A34A' }}>
                                    {cat.label}
                                  </div>
                                  {/* Check verde */}
                                  <div className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full shadow-md" style={{ background: '#16A34A' }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button type="button" onClick={() => inputRefs.current[cat.id]?.click()}
                                    className="flex h-11 flex-1 items-center justify-center rounded-xl border-2 border-blue-600 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-50">
                                    Cambiar
                                  </button>
                                  <button type="button" onClick={() => eliminarFoto(cat.id)}
                                    className="flex h-11 flex-1 items-center justify-center rounded-xl border-2 border-red-300 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50">
                                    Eliminar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* ── Estado sin foto ── */
                              <div className="rounded-2xl p-5" style={{ border: '2px dashed #CBD5E1' }}>
                                {/* Zona de drop */}
                                <div className="mb-4 flex flex-col items-center justify-center rounded-xl" style={{ background: '#F8FAFC', height: 120 }}>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                                  </svg>
                                </div>
                                {/* Nombre categoría */}
                                <p className="mb-2 text-base font-bold text-slate-800">
                                  {cat.label}
                                  {cat.obligatoria && <span className="ml-1 text-red-500">*</span>}
                                </p>
                                {/* Instrucción completa */}
                                <p className="mb-4 text-sm leading-relaxed text-slate-500">{cat.instruccion}</p>
                                {/* Botón upload */}
                                <button type="button" onClick={() => inputRefs.current[cat.id]?.click()}
                                  className="flex h-12 w-full items-center justify-center rounded-xl bg-blue-600 text-base font-semibold text-white transition-colors hover:bg-blue-700"
                                  style={{ fontSize: 16 }}>
                                  Subir foto
                                </button>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              </div>

              {/* Desktop navigation */}
              {error && (
                <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-600">{error}</p>
              )}
              {paso === PASOS.length - 1 && (
                <p className="mt-4 text-center text-xs text-slate-400">
                  Al publicar aceptás nuestros{' '}
                  <Link href="/terminos" className="underline underline-offset-2 hover:text-slate-600" target="_blank" rel="noopener noreferrer">términos de uso</Link>.
                  {' '}Tu publicación será visible para todos los usuarios.
                </p>
              )}
              <div className="mt-4 hidden items-center justify-between lg:flex">
                <button type="button" onClick={() => irAlPaso(paso - 1)} disabled={publicando}
                  className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40">
                  ← Atrás
                </button>
                <div className="group relative">
                  {paso < PASOS.length - 1 ? (
                    <button type="button" onClick={() => irAlPaso(paso + 1)} disabled={!puedeAvanzar()}
                      className="rounded-xl px-8 py-3 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed"
                      style={{ background: puedeAvanzar() ? '#2563EB' : '#CBD5E1' }}>
                      Siguiente paso →
                    </button>
                  ) : (
                    <button type="button" onClick={handlePublicar} disabled={publicando || !puedeAvanzar()}
                      className="rounded-xl px-8 py-3 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed"
                      style={{ background: puedeAvanzar() && !publicando ? '#2563EB' : '#CBD5E1' }}>
                      {publicando ? 'Publicando…' : 'Publicar propiedad'}
                    </button>
                  )}
                  {!puedeAvanzar() && !publicando && (
                    <div className="pointer-events-none absolute bottom-full right-0 mb-2 hidden w-56 rounded-lg bg-slate-800 px-3 py-2 text-center text-xs text-white shadow-lg group-hover:block">
                      {paso === 1 ? 'Completá la dirección, provincia y precio para continuar' : 'Subí las fotos obligatorias para publicar'}
                      <div className="absolute right-6 top-full border-4 border-transparent border-t-slate-800" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Sidebar ── */}
            <aside className="hidden lg:block">
              <div className="sticky top-6 flex flex-col gap-4">

                {/* Checklist */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-900">Tu publicación</p>
                    <span className={`text-xs font-semibold ${completedCount >= checklist.length ? 'text-green-600' : 'text-blue-600'}`}>
                      {completedCount} de {checklist.length}
                    </span>
                  </div>
                  <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-blue-600 transition-all duration-500" style={{ width: `${(completedCount / checklist.length) * 100}%` }} />
                  </div>
                  <div className="flex flex-col gap-2">
                    {checklist.map((item) => (
                      <div key={item.label} className={`flex items-center gap-2.5 text-sm transition-colors ${item.done ? 'text-slate-700' : 'text-slate-400'}`}>
                        <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-all ${item.done ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-300'}`}>
                          {item.done ? (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                          ) : <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />}
                        </div>
                        {item.label}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                {form.tipo ? (
                  <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Así se verá tu publicación</p>
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                      {primeraFoto ? (
                        <div className="relative h-32 w-full bg-slate-100">
                          <Image src={previews[primeraFoto]} alt="Foto principal" fill className="object-cover" />
                          {Object.keys(previews).length > 1 && (
                            <div className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
                              +{Object.keys(previews).length - 1} fotos
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex h-24 items-center justify-center bg-slate-100">
                          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300" aria-hidden="true">
                            <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                          </svg>
                        </div>
                      )}
                      <div className="p-4">
                        <div className="mb-2 flex flex-wrap gap-1">
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-600">{TIPO_LABEL[form.tipo]}</span>
                          {form.contractType && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">{CONTRACT_LABEL[form.contractType]}</span>}
                        </div>
                        <p className="text-sm font-semibold text-slate-900">
                          {form.calle ? <>{form.calle}{form.barrio ? `, ${form.barrio}` : ''}</> : <span className="text-slate-300">Dirección</span>}
                        </p>
                        {form.provincia && <p className="mt-0.5 text-xs text-slate-400">{form.provincia}</p>}
                        <div className="mt-2">
                          {form.precio && Number(form.precio) > 0 ? (
                            <span className="text-lg font-bold text-blue-600">
                              USD {Number(form.precio).toLocaleString('es-AR')}
                              <span className="ml-1 text-xs font-normal text-slate-400">/mes</span>
                            </span>
                          ) : (
                            <span className="text-sm text-slate-300">Precio no definido</span>
                          )}
                        </div>
                        {(Number(form.ambientes) > 0 || Number(form.banos) > 0 || form.superficie) && (
                          <div className="mt-2 flex gap-3 text-xs text-slate-400">
                            {Number(form.ambientes) > 0 && <span>{form.ambientes} amb.</span>}
                            {Number(form.banos) > 0 && <span>{form.banos} baño{Number(form.banos) !== 1 ? 's' : ''}</span>}
                            {form.superficie && <span>{form.superficie} m²</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center">
                    <p className="text-xs text-slate-400">Completá los datos para ver el preview</p>
                  </div>
                )}

              </div>
            </aside>
          </div>
        )}
      </main>

      {/* ── Mobile sticky footer ── */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white px-4 py-4 lg:hidden"
        style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
        <div className="flex gap-3">
          {paso > 0 && (
            <button type="button" onClick={() => irAlPaso(paso - 1)} disabled={publicando}
              className="rounded-xl border border-slate-300 bg-white px-5 text-base font-medium text-slate-600 transition-colors disabled:opacity-40"
              style={{ height: 52, fontSize: 16 }}>
              Atrás
            </button>
          )}
          {paso < PASOS.length - 1 ? (
            <button type="button" onClick={() => irAlPaso(paso + 1)} disabled={!puedeAvanzar()}
              className="flex-1 rounded-xl text-base font-semibold text-white transition-colors disabled:cursor-not-allowed"
              style={{ background: puedeAvanzar() ? '#2563EB' : '#CBD5E1', height: 52, fontSize: 16 }}>
              Siguiente
            </button>
          ) : (
            <button type="button" onClick={handlePublicar} disabled={publicando || !puedeAvanzar()}
              className="flex-1 rounded-xl text-base font-semibold text-white transition-colors disabled:cursor-not-allowed"
              style={{ background: puedeAvanzar() && !publicando ? '#2563EB' : '#CBD5E1', height: 52, fontSize: 16 }}>
              {publicando ? 'Publicando…' : 'Publicar propiedad'}
            </button>
          )}
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
