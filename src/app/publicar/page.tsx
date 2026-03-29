'use client'

import { useState, useRef } from 'react'
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
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
    instruccion: 'Cama prolija, desde el pie. Si hay más de un dormitorio, subí el principal.',
    obligatoria: true,
    icono: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="10" rx="1" />
        <path d="M3 11V8a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v3" />
        <path d="M12 7V3" /><path d="M8 7l4-4 4 4" />
      </svg>
    ),
  },
]

const TIPOS = [
  { value: 'departamento' as TipoPropiedad, label: 'Departamento', emoji: '🏢' },
  { value: 'casa' as TipoPropiedad, label: 'Casa', emoji: '🏠' },
  { value: 'habitacion' as TipoPropiedad, label: 'Habitación', emoji: '🛏️' },
  { value: 'local' as TipoPropiedad, label: 'Local comercial', emoji: '🏪' },
]

const PASOS = ['Tipo', 'Ubicación y precio', 'Detalles']

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

const inputCls = 'rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10 disabled:opacity-50'

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
      className={`flex-1 rounded-lg border py-2.5 text-sm font-medium transition-colors ${
        activo
          ? 'border-blue-600 bg-blue-50 text-blue-600'
          : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      {valor ? 'Sí' : 'No'}
    </button>
  )
}

export default function PublicarPage() {
  const [paso, setPaso] = useState(0)
  const [form, setForm] = useState<FormData>(INICIAL)
  const [fotos, setFotos] = useState<Record<string, File>>({})
  const [previews, setPreviews] = useState<Record<string, string>>({})
  const [publicando, setPublicando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const router = useRouter()

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
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
    setFotos((prev) => { const next = { ...prev }; delete next[categoriaId]; return next })
    setPreviews((prev) => { const next = { ...prev }; delete next[categoriaId]; return next })
  }

  const obligatoriasFaltantes = CATEGORIAS.filter(
    (c) => c.obligatoria && !fotos[c.id]
  )

  function puedeAvanzar() {
    if (paso === 0) return form.tipo !== null
    if (paso === 1)
      return form.calle.trim() !== '' && form.provincia !== '' && form.precio.trim() !== '' && form.incluyeExpensas !== null
    return obligatoriasFaltantes.length === 0
  }

  async function handlePublicar() {
    setPublicando(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

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
      const { data: { publicUrl } } = supabase.storage.from('propiedades').getPublicUrl(path)
      photoUrls.push(publicUrl)
    }

    const { error: insertError } = await supabase.from('properties').insert({
      owner_id: user.id,
      type: form.tipo,
      address: form.calle,
      neighborhood: form.barrio || null,
      city: form.provincia,
      referencia: form.referencias || null,
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

    router.push('/dashboard')
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-50">
      {/* Header simple */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <Link href="/" className="flex flex-col leading-none">
          <span className="text-base font-bold tracking-widest text-slate-900">PROPIA</span>
          <span className="text-[9px] font-semibold uppercase tracking-widest text-blue-600">Sin intermediarios</span>
        </Link>
        <Link href="/dashboard" className="text-sm text-slate-500 transition-colors hover:text-slate-900">
          Cancelar
        </Link>
      </header>

      <main className="flex flex-1 flex-col items-center px-6 py-10 md:px-12">
        <div className="w-full max-w-lg">

          {/* Indicador de progreso */}
          <div className="mb-10 flex items-center gap-2">
            {PASOS.map((nombre, i) => (
              <div key={nombre} className="flex flex-1 flex-col gap-1.5">
                <div
                  className={`h-1 rounded-full transition-colors ${
                    i <= paso ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                />
                <span
                  className={`text-xs font-medium transition-colors ${
                    i === paso ? 'text-blue-600' : 'text-slate-400'
                  }`}
                >
                  {nombre}
                </span>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            {/* Paso 1 — Tipo */}
            {paso === 0 && (
              <div className="flex flex-col gap-6">
                <h2 className="text-xl font-bold text-slate-900">¿Qué tipo de propiedad querés publicar?</h2>
                <div className="grid grid-cols-2 gap-3">
                  {TIPOS.map(({ value, label, emoji }) => {
                    const activo = form.tipo === value
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => set('tipo', value)}
                        className={`flex flex-col items-center gap-2 rounded-xl border px-4 py-6 text-sm font-medium transition-colors ${
                          activo
                            ? 'border-blue-600 bg-blue-50 text-blue-600'
                            : 'border-slate-200 text-slate-500 hover:border-blue-300 hover:bg-blue-50/50'
                        }`}
                      >
                        <span className="text-3xl">{emoji}</span>
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Paso 2 — Ubicación y precio */}
            {paso === 1 && (
              <div className="flex flex-col gap-5">
                <h2 className="text-xl font-bold text-slate-900">Ubicación y precio</h2>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Calle y número <span className="text-slate-400">*</span>
                  </label>
                  <input type="text" value={form.calle} onChange={(e) => set('calle', e.target.value)}
                    placeholder="Ej: Av. Corrientes 1234" className={inputCls} />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">Localidad o barrio</label>
                  <input type="text" value={form.barrio} onChange={(e) => set('barrio', e.target.value)}
                    placeholder="Ej: Palermo, San Telmo, Rosario Centro" className={inputCls} />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Provincia <span className="text-slate-400">*</span>
                  </label>
                  <select value={form.provincia} onChange={(e) => set('provincia', e.target.value)} className={inputCls}>
                    <option value="" disabled>Seleccioná una provincia</option>
                    {PROVINCIAS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Referencias <span className="text-slate-400 font-normal">(opcional)</span>
                  </label>
                  <input type="text" value={form.referencias} onChange={(e) => set('referencias', e.target.value)}
                    placeholder="Ej: cerca del subte B, frente al parque" className={inputCls} />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">Precio mensual (USD)</label>
                  <input type="number" value={form.precio} onChange={(e) => set('precio', e.target.value)}
                    placeholder="0" min={0} className={inputCls} />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">¿Incluye expensas?</label>
                  <div className="flex gap-3">
                    <BotonSiNo valor={true} seleccionado={form.incluyeExpensas} onChange={(v) => set('incluyeExpensas', v)} />
                    <BotonSiNo valor={false} seleccionado={form.incluyeExpensas} onChange={(v) => set('incluyeExpensas', v)} />
                  </div>
                </div>
              </div>
            )}

            {/* Paso 3 — Detalles */}
            {paso === 2 && (
              <div className="flex flex-col gap-5">
                <h2 className="text-xl font-bold text-slate-900">Detalles de la propiedad</h2>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">Descripción</label>
                  <textarea value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)}
                    placeholder="Describí la propiedad: luminosidad, estado, cercanía a servicios..."
                    rows={4} className={`resize-none ${inputCls}`} />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: 'ambientes' as const, label: 'Ambientes' },
                    { key: 'banos' as const, label: 'Baños' },
                    { key: 'superficie' as const, label: 'Superficie (m²)' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-slate-700">{label}</label>
                      <input type="number" value={form[key]} onChange={(e) => set(key, e.target.value)}
                        placeholder="0" min={0} className={inputCls} />
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">¿Acepta mascotas?</label>
                  <div className="flex gap-3">
                    <BotonSiNo valor={true} seleccionado={form.aceptaMascotas} onChange={(v) => set('aceptaMascotas', v)} />
                    <BotonSiNo valor={false} seleccionado={form.aceptaMascotas} onChange={(v) => set('aceptaMascotas', v)} />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">¿Acepta niños?</label>
                  <div className="flex gap-3">
                    <BotonSiNo valor={true} seleccionado={form.aceptaNinos} onChange={(v) => set('aceptaNinos', v)} />
                    <BotonSiNo valor={false} seleccionado={form.aceptaNinos} onChange={(v) => set('aceptaNinos', v)} />
                  </div>
                </div>

                {/* Fotos */}
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-slate-700">Fotos</span>
                    <span className="text-xs text-slate-400">Las categorías marcadas con * son obligatorias.</span>
                  </div>

                  <div className="flex flex-col gap-2">
                    {CATEGORIAS.map((cat) => {
                      const preview = previews[cat.id]
                      return (
                        <div key={cat.id} className="flex items-start gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
                            {preview ? (
                              <>
                                <Image src={preview} alt={cat.label} fill className="object-cover" />
                                <button
                                  type="button"
                                  onClick={() => eliminarFoto(cat.id)}
                                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow-sm transition-colors hover:text-red-600"
                                  aria-label="Eliminar foto"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                  </svg>
                                </button>
                              </>
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-slate-300">
                                {cat.icono}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-1 flex-col gap-2">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-sm font-medium text-slate-900">
                                {cat.label}
                                {cat.obligatoria && <span className="ml-1 text-blue-500">*</span>}
                              </span>
                              <span className="text-xs leading-relaxed text-slate-400">{cat.instruccion}</span>
                            </div>

                            <input
                              ref={(el) => { inputRefs.current[cat.id] = el }}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleFotoChange(cat.id, e)}
                            />
                            <button
                              type="button"
                              onClick={() => inputRefs.current[cat.id]?.click()}
                              className="self-start rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
                            >
                              {preview ? 'Cambiar foto' : 'Subir foto'}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {obligatoriasFaltantes.length > 0 && (
                    <p className="text-xs text-slate-500">
                      Faltan fotos obligatorias: {obligatoriasFaltantes.map((c) => c.label).join(', ')}.
                    </p>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Error */}
          {error && (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          {/* Navegación */}
          <div className="mt-4 flex gap-3">
            {paso > 0 && (
              <button
                type="button"
                onClick={() => setPaso((p) => p - 1)}
                className="flex-1 rounded-lg border border-slate-200 bg-white py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                Atrás
              </button>
            )}

            {paso < PASOS.length - 1 ? (
              <button
                type="button"
                onClick={() => setPaso((p) => p + 1)}
                disabled={!puedeAvanzar()}
                className="flex-1 rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-30"
              >
                Siguiente
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePublicar}
                disabled={publicando || !puedeAvanzar()}
                className="flex-1 rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-40"
              >
                {publicando ? 'Publicando...' : 'Publicar'}
              </button>
            )}
          </div>

        </div>
      </main>
    </div>
  )
}
