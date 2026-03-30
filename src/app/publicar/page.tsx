'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase-client'
import { PROVINCIAS } from '@/lib/provincias'

type TipoPropiedad = 'departamento' | 'casa' | 'habitacion' | 'local'

interface FormData {
  tipo: TipoPropiedad | null
  calle: string
  barrio: string
  provincia: string
  referencias: string
  precio: string
  incluyeExpensas: boolean | null
  descripcion: string
  ambientes: string
  banos: string
  superficie: string
  aceptaMascotas: boolean | null
  aceptaNinos: boolean | null
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
    icono: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
        <path d="M9 21V12h6v9" />
      </svg>
    ),
  },
  {
    id: 'living',
    label: 'Living o entrada principal',
    instruccion: 'Sacá desde la esquina del ambiente con luz natural, sin objetos personales.',
    obligatoria: true,
    icono: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" />
        <line x1="12" y1="12" x2="12" y2="16" />
        <line x1="10" y1="14" x2="14" y2="14" />
      </svg>
    ),
  },
  {
    id: 'cocina',
    label: 'Cocina',
    instruccion: 'Mostrá la mesada, los muebles y los electrodomésticos. Limpia y sin platos.',
    obligatoria: true,
    icono: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 2v4" /><path d="M12 2v4" /><path d="M16 2v4" />
        <rect x="2" y="6" width="20" height="16" rx="2" />
        <path d="M6 14h.01" /><path d="M12 14h.01" /><path d="M18 14h.01" />
        <path d="M6 18h.01" /><path d="M12 18h.01" /><path d="M18 18h.01" />
      </svg>
    ),
  },
  {
    id: 'dormitorio',
    label: 'Dormitorio',
    instruccion: 'Cama prolija, desde el pie. Si hay más de uno, subí el principal.',
    obligatoria: true,
    icono: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 9V4a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v5" />
        <path d="M2 9h20v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9z" />
        <path d="M6 9v4" /><path d="M18 9v4" />
        <path d="M2 15h20" />
      </svg>
    ),
  },
  {
    id: 'bano',
    label: 'Baño',
    instruccion: 'Desde la puerta, mostrá el inodoro, ducha o bañadera. Limpio y ordenado.',
    obligatoria: true,
    icono: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 6a3 3 0 0 1 6 0v8H9V6z" />
        <path d="M3 14h18v2a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5v-2z" />
        <path d="M5 14V8" />
      </svg>
    ),
  },
  {
    id: 'extras',
    label: 'Espacios extras',
    instruccion: 'Balcón, patio, terraza o cochera. Omitir si no aplica.',
    obligatoria: false,
    icono: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="10" rx="1" />
        <path d="M3 11V8a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v3" />
        <path d="M12 7V3" /><path d="M8 7l4-4 4 4" />
      </svg>
    ),
  },
]

const TIPOS_INFO = [
  {
    value: 'departamento' as TipoPropiedad,
    label: 'Departamento',
    desc: 'Unidad en edificio o PH',
    emoji: '🏢',
  },
  {
    value: 'casa' as TipoPropiedad,
    label: 'Casa',
    desc: 'Vivienda independiente',
    emoji: '🏠',
  },
  {
    value: 'habitacion' as TipoPropiedad,
    label: 'Habitación',
    desc: 'En casa o depto compartido',
    emoji: '🛏️',
  },
  {
    value: 'local' as TipoPropiedad,
    label: 'Local comercial',
    desc: 'Comercial u oficina',
    emoji: '🏪',
  },
]

const TIPO_LABEL: Record<string, string> = {
  departamento: 'Departamento',
  casa: 'Casa',
  habitacion: 'Habitación',
  local: 'Local comercial',
}

const PASOS = [
  { label: 'Tipo' },
  { label: 'Ubicación' },
  { label: 'Detalles' },
]

const INICIAL: FormData = {
  tipo: null,
  calle: '',
  barrio: '',
  provincia: '',
  referencias: '',
  precio: '',
  incluyeExpensas: null,
  descripcion: '',
  ambientes: '',
  banos: '',
  superficie: '',
  aceptaMascotas: null,
  aceptaNinos: null,
}

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-colors'

function BotonSiNo({
  valor,
  seleccionado,
  onChange,
}: {
  valor: boolean
  seleccionado: boolean | null
  onChange: (v: boolean) => void
}) {
  const activo = seleccionado === valor
  return (
    <button
      type="button"
      onClick={() => onChange(valor)}
      className={`flex-1 rounded-xl border py-3 text-sm font-medium transition-colors ${
        activo
          ? 'border-blue-600 bg-blue-50 text-blue-600'
          : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      {valor ? 'Sí' : 'No'}
    </button>
  )
}

function NumericoInput({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const num = value === '' ? 0 : Number(value)
  return (
    <div className="flex items-center overflow-hidden rounded-xl border border-slate-200">
      <button
        type="button"
        onClick={() => onChange(String(Math.max(0, num - 1)))}
        className="flex h-11 w-11 shrink-0 items-center justify-center border-r border-slate-200 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
      <span className="flex-1 bg-slate-50 py-3 text-center text-base font-semibold text-slate-900">
        {num}
      </span>
      <button
        type="button"
        onClick={() => onChange(String(num + 1))}
        className="flex h-11 w-11 shrink-0 items-center justify-center border-l border-slate-200 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  )
}

const DRAFT_KEY = 'propia_publicar_draft'

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
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const router = useRouter()

  // Detectar borrador guardado al montar
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as FormData
        if (parsed.tipo || parsed.calle || parsed.precio) {
          setMostrarRestaurar(true)
        }
      }
    } catch {
      // localStorage no disponible
    }
  }, [])

  // Autosave cada 30 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      const isEmpty = !form.tipo && !form.calle && !form.precio
      if (isEmpty) return
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(form))
        setDraftToast('guardado')
        setTimeout(() => setDraftToast(null), 2500)
      } catch {
        // localStorage no disponible
      }
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
    } catch {
      // localStorage no disponible
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
    setFotos((prev) => {
      const next = { ...prev }
      delete next[categoriaId]
      return next
    })
    setPreviews((prev) => {
      const next = { ...prev }
      delete next[categoriaId]
      return next
    })
  }

  const obligatoriasFaltantes = CATEGORIAS.filter((c) => c.obligatoria && !fotos[c.id])

  function puedeAvanzar() {
    if (paso === 0) return form.tipo !== null
    if (paso === 1)
      return (
        form.calle.trim() !== '' &&
        form.provincia !== '' &&
        form.precio.trim() !== '' &&
        form.incluyeExpensas !== null
      )
    return obligatoriasFaltantes.length === 0
  }

  async function handlePublicar() {
    setPublicando(true)
    setError(null)

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const photoUrls: string[] = []
    for (const cat of CATEGORIAS) {
      const archivo = fotos[cat.id]
      if (!archivo) continue
      const ext = archivo.name.split('.').pop()
      const path = `${user.id}/${cat.id}-${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('propiedades')
        .upload(path, archivo, { upsert: false })
      if (uploadError) {
        setError(`Error al subir "${cat.label}": ${uploadError.message}`)
        setPublicando(false)
        return
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from('propiedades').getPublicUrl(path)
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
      includes_expenses: form.incluyeExpensas,
      description: form.descripcion || null,
      bedrooms: form.ambientes ? Number(form.ambientes) : null,
      bathrooms: form.banos ? Number(form.banos) : null,
      area_m2: form.superficie ? Number(form.superficie) : null,
      allows_pets: form.aceptaMascotas,
      allows_kids: form.aceptaNinos,
      photo_urls: photoUrls.length > 0 ? photoUrls : null,
    })

    if (insertError) {
      setError(insertError.message)
      setPublicando(false)
      return
    }

    try { localStorage.removeItem(DRAFT_KEY) } catch { /* noop */ }
    router.push('/dashboard')
  }

  const checklist = [
    { label: 'Tipo de propiedad', done: form.tipo !== null },
    { label: 'Dirección', done: form.calle.trim() !== '' },
    { label: 'Provincia', done: form.provincia !== '' },
    { label: 'Precio mensual', done: form.precio.trim() !== '' && Number(form.precio) > 0 },
    { label: 'Expensas', done: form.incluyeExpensas !== null },
    { label: 'Descripción (50+ caracteres)', done: form.descripcion.length >= 50 },
    { label: 'Fotos principales', done: obligatoriasFaltantes.length === 0 },
  ]

  const completedCount = checklist.filter((i) => i.done).length
  const primeraFoto = Object.keys(previews)[0]

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">

      {/* Toast de autosave */}
      {draftToast && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-lg" style={{ animation: 'fadeSlideUp 0.2s ease' }}>
          <p className="text-sm font-medium text-slate-700">
            {draftToast === 'guardado' ? '💾 Borrador guardado' : '✓ Borrador restaurado'}
          </p>
        </div>
      )}

      {/* Banner restaurar borrador */}
      {mostrarRestaurar && (
        <div className="fixed inset-x-0 top-0 z-[60] flex items-center justify-between gap-4 bg-blue-600 px-6 py-3">
          <p className="text-sm font-medium text-white">
            Tenés un borrador guardado. ¿Querés continuar desde donde lo dejaste?
          </p>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={restaurarBorrador}
              className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-blue-600 transition-opacity hover:opacity-90"
            >
              Continuar
            </button>
            <button
              type="button"
              onClick={descartarBorrador}
              className="rounded-lg border border-blue-400 px-3 py-1.5 text-xs font-medium text-blue-100 transition-opacity hover:opacity-80"
            >
              Descartar
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes step-fwd {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes step-bwd {
          from { opacity: 0; transform: translateX(-24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .anim-fwd { animation: step-fwd 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .anim-bwd { animation: step-bwd 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>

      {/* ── Header ── */}
      <header className="z-10 flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <Link href="/" className="flex flex-col leading-none">
          <span className="text-base font-bold tracking-widest text-slate-900">PROPIA</span>
          <span className="text-[9px] font-semibold uppercase tracking-widest text-blue-600">
            Sin intermediarios
          </span>
        </Link>

        {/* Step progress — desktop */}
        <div className="hidden items-center gap-1 lg:flex">
          {PASOS.map((p, i) => (
            <div key={p.label} className="flex items-center gap-1">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  i < paso
                    ? 'bg-green-100 text-green-600'
                    : i === paso
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {i < paso ? (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>
              <span
                className={`text-sm font-medium ${
                  i === paso ? 'text-slate-900' : i < paso ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                {p.label}
              </span>
              {i < PASOS.length - 1 && (
                <div
                  className={`mx-2 h-px w-8 transition-colors ${
                    i < paso ? 'bg-green-300' : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <Link
          href="/dashboard"
          className="text-sm text-slate-500 transition-colors hover:text-slate-900"
        >
          Cancelar
        </Link>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left column: Form ── */}
        <div className="flex w-full flex-col overflow-hidden lg:w-[45%] lg:border-r lg:border-slate-100">

          {/* Mobile progress bars */}
          <div className="flex shrink-0 gap-1.5 px-6 pb-0 pt-4 lg:hidden">
            {PASOS.map((p, i) => (
              <div
                key={p.label}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= paso ? 'bg-blue-600' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>

          {/* Scrollable form */}
          <div className="flex-1 overflow-y-auto px-6 py-6 lg:px-10 lg:py-8">
            <div className="mb-6">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-blue-600">
                Paso {paso + 1} de {PASOS.length}
              </p>
              <h2
                className="text-2xl font-extrabold text-slate-900"
                style={{ letterSpacing: '-0.02em' }}
              >
                {paso === 0
                  ? '¿Qué vas a alquilar?'
                  : paso === 1
                  ? 'Ubicación y precio'
                  : 'Detalles y fotos'}
              </h2>
            </div>

            {/* Animated step content */}
            <div key={animKey} className={animDir === 'forward' ? 'anim-fwd' : 'anim-bwd'}>

              {/* ── Paso 1: Tipo ── */}
              {paso === 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {TIPOS_INFO.map(({ value, label, desc, emoji }) => {
                    const activo = form.tipo === value
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => set('tipo', value)}
                        className={`relative flex flex-col items-center gap-3 rounded-2xl border-2 p-5 text-left transition-all ${
                          activo
                            ? 'border-blue-600 bg-blue-50 shadow-sm'
                            : 'border-slate-200 hover:border-blue-200 hover:bg-blue-50/40'
                        }`}
                      >
                        {activo && (
                          <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </div>
                        )}
                        <span className="text-4xl">{emoji}</span>
                        <div className="text-center">
                          <p
                            className={`text-sm font-semibold ${
                              activo ? 'text-blue-700' : 'text-slate-800'
                            }`}
                          >
                            {label}
                          </p>
                          <p
                            className={`mt-0.5 text-xs ${
                              activo ? 'text-blue-400' : 'text-slate-400'
                            }`}
                          >
                            {desc}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* ── Paso 2: Ubicación y precio ── */}
              {paso === 1 && (
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Calle y número <span className="text-slate-400 font-normal">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.calle}
                      onChange={(e) => set('calle', e.target.value)}
                      placeholder="Ej: Av. Corrientes 1234"
                      className={inputCls}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-slate-700">
                        Barrio o localidad
                      </label>
                      <input
                        type="text"
                        value={form.barrio}
                        onChange={(e) => set('barrio', e.target.value)}
                        placeholder="Ej: Palermo"
                        className={inputCls}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-slate-700">
                        Provincia <span className="text-slate-400 font-normal">*</span>
                      </label>
                      <select
                        value={form.provincia}
                        onChange={(e) => set('provincia', e.target.value)}
                        className={inputCls}
                      >
                        <option value="" disabled>
                          Seleccioná
                        </option>
                        {PROVINCIAS.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Referencias{' '}
                      <span className="font-normal text-slate-400">(opcional)</span>
                    </label>
                    <input
                      type="text"
                      value={form.referencias}
                      onChange={(e) => set('referencias', e.target.value)}
                      placeholder="Ej: cerca del subte B, frente al parque"
                      className={inputCls}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Precio mensual (USD) <span className="text-slate-400 font-normal">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                        USD
                      </span>
                      <input
                        type="number"
                        value={form.precio}
                        onChange={(e) => set('precio', e.target.value)}
                        placeholder="0"
                        min={0}
                        className={`${inputCls} pl-14`}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-slate-700">
                      ¿Incluye expensas? <span className="text-slate-400 font-normal">*</span>
                    </label>
                    <div className="flex gap-3">
                      <BotonSiNo
                        valor={true}
                        seleccionado={form.incluyeExpensas}
                        onChange={(v) => set('incluyeExpensas', v)}
                      />
                      <BotonSiNo
                        valor={false}
                        seleccionado={form.incluyeExpensas}
                        onChange={(v) => set('incluyeExpensas', v)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── Paso 3: Detalles y fotos ── */}
              {paso === 2 && (
                <div className="flex flex-col gap-6">
                  {/* Descripción con contador */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-end justify-between">
                      <label className="text-sm font-medium text-slate-700">Descripción</label>
                      <span
                        className={`text-xs ${
                          form.descripcion.length > 0 && form.descripcion.length < 50
                            ? 'text-amber-500'
                            : 'text-slate-400'
                        }`}
                      >
                        {form.descripcion.length}/500
                      </span>
                    </div>
                    <textarea
                      value={form.descripcion}
                      onChange={(e) => set('descripcion', e.target.value.slice(0, 500))}
                      placeholder="Describí la propiedad: luminosidad, estado, cercanía a servicios, amenidades..."
                      rows={4}
                      className={`resize-none ${inputCls}`}
                    />
                    {form.descripcion.length > 0 && form.descripcion.length < 50 && (
                      <p className="text-xs text-amber-600">
                        Mínimo recomendado: 50 caracteres ({50 - form.descripcion.length} más)
                      </p>
                    )}
                  </div>

                  {/* Características */}
                  <div className="flex flex-col gap-3">
                    <p className="text-sm font-medium text-slate-700">Características</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-center text-xs font-medium text-slate-500">
                          Ambientes
                        </label>
                        <NumericoInput
                          value={form.ambientes}
                          onChange={(v) => set('ambientes', v)}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-center text-xs font-medium text-slate-500">
                          Baños
                        </label>
                        <NumericoInput
                          value={form.banos}
                          onChange={(v) => set('banos', v)}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-slate-700">
                        Superficie (m²){' '}
                        <span className="font-normal text-slate-400">(opcional)</span>
                      </label>
                      <input
                        type="number"
                        value={form.superficie}
                        onChange={(e) => set('superficie', e.target.value)}
                        placeholder="Ej: 45"
                        min={0}
                        className={inputCls}
                      />
                    </div>
                  </div>

                  {/* Si/No toggles */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-slate-700">¿Acepta mascotas?</label>
                      <div className="flex gap-2">
                        <BotonSiNo
                          valor={true}
                          seleccionado={form.aceptaMascotas}
                          onChange={(v) => set('aceptaMascotas', v)}
                        />
                        <BotonSiNo
                          valor={false}
                          seleccionado={form.aceptaMascotas}
                          onChange={(v) => set('aceptaMascotas', v)}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-slate-700">¿Acepta niños?</label>
                      <div className="flex gap-2">
                        <BotonSiNo
                          valor={true}
                          seleccionado={form.aceptaNinos}
                          onChange={(v) => set('aceptaNinos', v)}
                        />
                        <BotonSiNo
                          valor={false}
                          seleccionado={form.aceptaNinos}
                          onChange={(v) => set('aceptaNinos', v)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Fotos */}
                  <div className="flex flex-col gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-700">Fotos</p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        Las marcadas con * son obligatorias para publicar.
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      {CATEGORIAS.map((cat) => {
                        const preview = previews[cat.id]
                        return (
                          <div
                            key={cat.id}
                            className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${
                              preview
                                ? 'border-green-200 bg-green-50'
                                : 'border-slate-200 bg-white'
                            }`}
                          >
                            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                              {preview ? (
                                <>
                                  <Image
                                    src={preview}
                                    alt={cat.label}
                                    fill
                                    className="object-cover"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => eliminarFoto(cat.id)}
                                    className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow-sm transition-colors hover:text-red-600"
                                    aria-label="Eliminar foto"
                                  >
                                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                                      <line x1="18" y1="6" x2="6" y2="18" />
                                      <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                  </button>
                                </>
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-slate-300">
                                  {cat.icono}
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-slate-900">
                                {cat.label}
                                {cat.obligatoria && (
                                  <span className="ml-1 text-blue-500">*</span>
                                )}
                              </p>
                              <p className="truncate text-xs text-slate-400">
                                {cat.instruccion}
                              </p>
                            </div>

                            <input
                              ref={(el) => {
                                inputRefs.current[cat.id] = el
                              }}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleFotoChange(cat.id, e)}
                            />
                            <button
                              type="button"
                              onClick={() => inputRefs.current[cat.id]?.click()}
                              className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                                preview
                                  ? 'border-green-200 bg-white text-green-700 hover:bg-green-50'
                                  : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600'
                              }`}
                            >
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

          {/* Navigation footer */}
          <div className="shrink-0 border-t border-slate-100 bg-white px-6 py-4 lg:px-10">
            {error && (
              <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-600">
                {error}
              </p>
            )}
            <div className="flex gap-3">
              {paso > 0 && (
                <button
                  type="button"
                  onClick={() => irAlPaso(paso - 1)}
                  disabled={publicando}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40"
                >
                  Atrás
                </button>
              )}
              {paso < PASOS.length - 1 ? (
                <button
                  type="button"
                  onClick={() => irAlPaso(paso + 1)}
                  disabled={!puedeAvanzar()}
                  className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-30"
                >
                  Siguiente
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePublicar}
                  disabled={publicando || !puedeAvanzar()}
                  className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-40"
                >
                  {publicando ? 'Publicando...' : 'Publicar propiedad'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Right column: Preview (desktop only) ── */}
        <div className="hidden flex-col overflow-hidden bg-slate-50 lg:flex lg:w-[55%]">
          <div className="flex-1 overflow-y-auto px-10 py-10">

            {/* Motivational message */}
            <div className="mb-8">
              {paso === 0 && (
                <>
                  <h3 className="mb-2 text-xl font-bold text-slate-900" style={{ letterSpacing: '-0.02em' }}>
                    El primer paso es el más importante
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-500">
                    Elegir el tipo correcto ayuda a los inquilinos a encontrar exactamente lo
                    que buscan. Las publicaciones bien categorizadas reciben hasta un 40% más de
                    consultas.
                  </p>
                </>
              )}
              {paso === 1 && (
                <>
                  <h3 className="mb-2 text-xl font-bold text-slate-900" style={{ letterSpacing: '-0.02em' }}>
                    La ubicación lo es todo
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-500">
                    Una dirección completa y un precio claro generan confianza inmediata.
                    El 80% de las consultas provienen de personas que filtran por zona y precio.
                  </p>
                </>
              )}
              {paso === 2 && (
                <>
                  <h3 className="mb-2 text-xl font-bold text-slate-900" style={{ letterSpacing: '-0.02em' }}>
                    Los detalles hacen la diferencia
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-500">
                    Las propiedades con descripción y fotos completas se alquilan hasta 3 veces
                    más rápido. ¡Ya casi terminás!
                  </p>
                </>
              )}
            </div>

            {/* Checklist */}
            <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">Tu publicación</p>
                <span
                  className={`text-xs font-semibold ${
                    completedCount >= checklist.length ? 'text-green-600' : 'text-blue-600'
                  }`}
                >
                  {completedCount}/{checklist.length} completo
                </span>
              </div>

              <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-500"
                  style={{ width: `${(completedCount / checklist.length) * 100}%` }}
                />
              </div>

              <div className="flex flex-col gap-2">
                {checklist.map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-center gap-2.5 text-sm ${
                      item.done ? 'text-slate-700' : 'text-slate-400'
                    }`}
                  >
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors ${
                        item.done
                          ? 'bg-green-100 text-green-600'
                          : 'bg-slate-100 text-slate-300'
                      }`}
                    >
                      {item.done ? (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                      )}
                    </div>
                    {item.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Preview card */}
            {form.tipo ? (
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Así se verá tu publicación
                </p>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  {/* Photo */}
                  {primeraFoto ? (
                    <div className="relative mb-4 h-44 w-full overflow-hidden rounded-xl bg-slate-100">
                      <Image
                        src={previews[primeraFoto]}
                        alt="Foto principal"
                        fill
                        className="object-cover"
                      />
                      {Object.keys(previews).length > 1 && (
                        <div className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
                          +{Object.keys(previews).length - 1} fotos
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mb-4 flex h-44 items-center justify-center rounded-xl bg-slate-100">
                      <div className="text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 text-slate-300">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                        <p className="text-xs text-slate-400">Las fotos aparecerán aquí</p>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="inline-flex w-fit rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600">
                        {TIPO_LABEL[form.tipo]}
                      </span>
                      <p className="text-base font-semibold leading-snug text-slate-900">
                        {form.calle ? (
                          <>
                            {form.calle}
                            {form.barrio ? `, ${form.barrio}` : ''}
                          </>
                        ) : (
                          <span className="text-slate-300">Dirección de la propiedad</span>
                        )}
                      </p>
                      {form.provincia && (
                        <p className="text-xs text-slate-400">{form.provincia}</p>
                      )}
                    </div>

                    <div className="flex items-baseline gap-1.5">
                      {form.precio && Number(form.precio) > 0 ? (
                        <>
                          <span className="text-xl font-bold text-blue-600">
                            USD {Number(form.precio).toLocaleString('es-AR')}
                          </span>
                          <span className="text-sm text-slate-400">/mes</span>
                          {form.incluyeExpensas && (
                            <span className="text-xs text-green-600">· Expensas incl.</span>
                          )}
                        </>
                      ) : (
                        <span className="text-xl font-bold text-slate-300">USD —</span>
                      )}
                    </div>

                    {(Number(form.ambientes) > 0 ||
                      Number(form.banos) > 0 ||
                      form.superficie) && (
                      <div className="flex gap-4 text-sm text-slate-500">
                        {Number(form.ambientes) > 0 && <span>{form.ambientes} amb.</span>}
                        {Number(form.banos) > 0 && (
                          <span>
                            {form.banos} baño{Number(form.banos) !== 1 ? 's' : ''}
                          </span>
                        )}
                        {form.superficie && <span>{form.superficie} m²</span>}
                      </div>
                    )}

                    {form.descripcion && (
                      <p className="line-clamp-2 text-sm leading-relaxed text-slate-500">
                        {form.descripcion}
                      </p>
                    )}

                    {(form.aceptaMascotas === true || form.aceptaNinos === true) && (
                      <div className="flex flex-wrap gap-2">
                        {form.aceptaMascotas === true && (
                          <span className="rounded-full border border-slate-200 px-2.5 py-0.5 text-xs text-slate-500">
                            🐾 Mascotas
                          </span>
                        )}
                        {form.aceptaNinos === true && (
                          <span className="rounded-full border border-slate-200 px-2.5 py-0.5 text-xs text-slate-500">
                            👶 Niños
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-500">
                  La preview aparecerá aquí
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Completá el formulario para ver cómo queda tu publicación
                </p>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  )
}
