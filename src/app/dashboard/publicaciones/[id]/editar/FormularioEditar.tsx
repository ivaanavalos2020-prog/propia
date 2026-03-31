'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase-client'
import { PROVINCIAS } from '@/lib/provincias'

type TipoPropiedad = 'departamento' | 'casa' | 'habitacion' | 'local'

interface Props {
  id: string
  tipoInicial: string
  calleInicial: string
  barrioInicial: string
  provinciaInicial: string
  referenciasInicial: string
  precioInicial: number
  incluyeExpensasInicial: boolean | null
  descripcionInicial: string
  ambientesInicial: number | null
  banosInicial: number | null
  superficieInicial: number | null
  pisoInicial: number | null
  antiguedadInicial: number | null
  aceptaMascotasInicial: boolean | null
  aceptaNinosInicial: boolean | null
  tieneCocheraInicial: boolean
  tieneBalconInicial: boolean
  permiteFumarInicial: boolean
  fotosInicial: string[]
  videosInicial: string[]
  estadoInicial: string
  propiedadId: string
}

const TIPO_LABEL: Record<string, string> = {
  departamento: 'Departamento',
  casa: 'Casa',
  habitacion: 'Habitación',
  local: 'Local comercial',
}

const TIPOS: { value: TipoPropiedad; label: string; icono: React.ReactNode }[] = [
  {
    value: 'departamento',
    label: 'Departamento',
    icono: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18" /><path d="M3 9h6" /><path d="M3 15h6" /><path d="M15 9h3" /><path d="M15 15h3" />
      </svg>
    ),
  },
  {
    value: 'casa',
    label: 'Casa',
    icono: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" /><path d="M9 21V12h6v9" />
      </svg>
    ),
  },
  {
    value: 'habitacion',
    label: 'Habitación',
    icono: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" />
      </svg>
    ),
  },
  {
    value: 'local',
    label: 'Local comercial',
    icono: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" /><path d="M3 9l2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.79 1.1L21 9" /><path d="M12 3v6" />
      </svg>
    ),
  },
]

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-800">
      {children}
    </h2>
  )
}

function HelpText({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-sm text-slate-500">{children}</p>
}

function Label({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-slate-700">
      {children}
    </label>
  )
}

function NumericoInput({
  value,
  onChange,
  min = 0,
  max = 99,
  label,
}: {
  value: number | null
  onChange: (v: number | null) => void
  min?: number
  max?: number
  label: string
}) {
  const val = value ?? 0
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, val - 1))}
        className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-300 bg-white text-xl font-bold text-slate-600 transition-colors hover:bg-slate-50 active:bg-slate-100"
        aria-label={`Reducir ${label}`}
      >
        −
      </button>
      <span className="min-w-[2.5rem] text-center text-lg font-bold text-slate-800">
        {val === 0 ? '—' : val}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, val + 1))}
        className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-300 bg-white text-xl font-bold text-slate-600 transition-colors hover:bg-slate-50 active:bg-slate-100"
        aria-label={`Aumentar ${label}`}
      >
        +
      </button>
    </div>
  )
}

function TriState({
  value,
  onChange,
}: {
  value: boolean | null
  onChange: (v: boolean | null) => void
}) {
  return (
    <div className="flex gap-2">
      {([
        { v: true as boolean | null, label: 'Sí' },
        { v: false as boolean | null, label: 'No' },
        { v: null, label: 'No sé' },
      ] as { v: boolean | null; label: string }[]).map(({ v, label }) => (
        <button
          key={String(v)}
          type="button"
          onClick={() => onChange(v)}
          className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
            value === v
              ? 'border-blue-600 bg-blue-600 text-white'
              : 'border-slate-300 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function Toast({ msg, onClose }: { msg: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])
  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-medium text-white shadow-xl">
      {msg}
    </div>
  )
}

export default function FormularioEditar({
  id,
  tipoInicial,
  calleInicial,
  barrioInicial,
  provinciaInicial,
  referenciasInicial,
  precioInicial,
  incluyeExpensasInicial,
  descripcionInicial,
  ambientesInicial,
  banosInicial,
  superficieInicial,
  pisoInicial,
  antiguedadInicial,
  aceptaMascotasInicial,
  aceptaNinosInicial,
  tieneCocheraInicial,
  tieneBalconInicial,
  permiteFumarInicial,
  fotosInicial,
  videosInicial,
  estadoInicial,
  propiedadId,
}: Props) {
  const router = useRouter()

  // Form state
  const [tipo, setTipo] = useState<TipoPropiedad>(tipoInicial as TipoPropiedad)
  const [calle, setCalle] = useState(calleInicial)
  const [barrio, setBarrio] = useState(barrioInicial)
  const [provincia, setProvincia] = useState(provinciaInicial)
  const [referencias, setReferencias] = useState(referenciasInicial)
  const [precio, setPrecio] = useState(String(precioInicial || ''))
  const [incluyeExpensas, setIncluyeExpensas] = useState<boolean | null>(incluyeExpensasInicial)
  const [descripcion, setDescripcion] = useState(descripcionInicial)
  const [ambientes, setAmbientes] = useState<number | null>(ambientesInicial)
  const [banos, setBanos] = useState<number | null>(banosInicial)
  const [superficie, setSuperficie] = useState(superficieInicial ? String(superficieInicial) : '')
  const [piso, setPiso] = useState(pisoInicial ? String(pisoInicial) : '')
  const [antiguedad, setAntiguedad] = useState(antiguedadInicial ? String(antiguedadInicial) : '')
  const [aceptaMascotas, setAceptaMascotas] = useState<boolean | null>(aceptaMascotasInicial)
  const [aceptaNinos, setAceptaNinos] = useState<boolean | null>(aceptaNinosInicial)
  const [tieneCochera, setTieneCochera] = useState(tieneCocheraInicial)
  const [tieneBalcon, setTieneBalcon] = useState(tieneBalconInicial)
  const [permiteFumar, setPermiteFumar] = useState(permiteFumarInicial)
  const [fotos, setFotos] = useState<string[]>(fotosInicial)
  const [videos, setVideos] = useState<string[]>(videosInicial)
  const [estado, setEstado] = useState(estadoInicial)

  // UI state
  const [guardando, setGuardando] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null)

  // Photo upload
  const [subiendoFotos, setSubiendoFotos] = useState(false)
  const [progresoFoto, setProgresoFoto] = useState(0)
  const fotoInputRef = useRef<HTMLInputElement>(null)
  const dragFotoIdx = useRef<number | null>(null)

  // Video upload
  const [subiendoVideo, setSubiendoVideo] = useState(false)
  const videoInputRef = useRef<HTMLInputElement>(null)

  // AI description
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
        setToast('Solo podés tener hasta 2 videos por publicación.')
        return
      }
      if (file.size > 100 * 1024 * 1024) {
        setToast('El video no puede superar los 100 MB.')
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
        setToast('No se pudo subir el video. Intentá de nuevo.')
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
            tieneCochera && 'cochera',
            tieneBalcon && 'balcón',
            aceptaMascotas === true && 'permite mascotas',
            aceptaNinos === true && 'permite niños',
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
  }, [descripcion, tipo, calle, barrio, provincia, ambientes, banos, superficie, tieneCochera, tieneBalcon, aceptaMascotas, aceptaNinos])

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
        includes_expenses: incluyeExpensas,
        description: descripcion.trim() || null,
        bedrooms: ambientes,
        bathrooms: banos,
        area_m2: superficie ? Number(superficie) : null,
        floor_number: piso ? Number(piso) : null,
        property_age: antiguedad ? Number(antiguedad) : null,
        allows_pets: aceptaMascotas,
        allows_kids: aceptaNinos,
        has_garage: tieneCochera,
        has_balcony: tieneBalcon,
        allows_smoking: permiteFumar,
        photo_urls: fotos,
        video_urls: videos,
        status: estado,
      })
      .eq('id', id)

    setGuardando(false)

    if (error) {
      setErrorGuardar('No se pudo guardar. Intentá de nuevo.')
    } else {
      setToast('¡Cambios guardados correctamente!')
      router.refresh()
    }
  }, [
    id, tipo, calle, barrio, provincia, referencias, precio, incluyeExpensas,
    descripcion, ambientes, banos, superficie, piso, antiguedad,
    aceptaMascotas, aceptaNinos, tieneCochera, tieneBalcon, permiteFumar,
    fotos, videos, estado, router,
  ])

  // ── Preview ───────────────────────────────────────────────────────
  const precioNum = Number(precio) || 0
  const direccionPreview = [calle, barrio, provincia].filter(Boolean).join(', ')

  return (
    <>
      <div className="flex gap-8 lg:items-start">

        {/* ── LEFT: Form ───────────────────────────────────────────── */}
        <div className="w-full space-y-8 lg:w-[55%]">

          {/* Tipo */}
          <section className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm">
            <SectionTitle>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>
              Tipo de propiedad
            </SectionTitle>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {TIPOS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTipo(t.value)}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 px-3 py-4 text-sm font-semibold transition-all ${
                    tipo === t.value
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-slate-300 bg-white text-slate-600 hover:border-blue-300'
                  }`}
                >
                  {t.icono}
                  {t.label}
                </button>
              ))}
            </div>
          </section>

          {/* Ubicación */}
          <section className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm">
            <SectionTitle>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg>
              Ubicación
            </SectionTitle>
            <div className="space-y-4">
              <div>
                <Label htmlFor="calle">Dirección (calle y número)</Label>
                <input
                  id="calle"
                  type="text"
                  value={calle}
                  onChange={(e) => setCalle(e.target.value)}
                  placeholder="Ej: Av. Corrientes 1234"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-800 placeholder-slate-400 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <HelpText>Escribí el nombre de la calle y el número de puerta.</HelpText>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="barrio">Barrio</Label>
                  <input
                    id="barrio"
                    type="text"
                    value={barrio}
                    onChange={(e) => setBarrio(e.target.value)}
                    placeholder="Ej: Palermo"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-800 placeholder-slate-400 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <Label htmlFor="provincia">Provincia</Label>
                  <select
                    id="provincia"
                    value={provincia}
                    onChange={(e) => setProvincia(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-800 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-800 placeholder-slate-400 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <HelpText>Puntos de referencia para que el inquilino encuentre el lugar fácilmente.</HelpText>
              </div>
            </div>
          </section>

          {/* Precio */}
          <section className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm">
            <SectionTitle>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              Precio
            </SectionTitle>
            <div className="space-y-4">
              <div>
                <Label htmlFor="precio">Alquiler mensual (USD)</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-bold text-slate-400">USD</span>
                  <input
                    id="precio"
                    type="number"
                    min="0"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-300 py-3 pl-14 pr-4 text-base text-slate-800 placeholder-slate-400 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <HelpText>Ingresá el monto en dólares estadounidenses (USD).</HelpText>
              </div>
              <div>
                <Label>¿El precio incluye expensas?</Label>
                <TriState value={incluyeExpensas} onChange={setIncluyeExpensas} />
                <HelpText>Indicá si el precio ya incluye los gastos comunes del edificio.</HelpText>
              </div>
            </div>
          </section>

          {/* Descripción */}
          <section className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm">
            <SectionTitle>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
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
                onChange={(e) => setDescripcion(e.target.value)}
                rows={6}
                placeholder="Describí la propiedad: luminosidad, estado de conservación, comodidades, cercanía a transporte, etc."
                className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-800 placeholder-slate-400 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <div className="mt-2 flex items-start justify-between gap-3">
                <HelpText>Mínimo 80 caracteres. Contá lo que hace especial a esta propiedad.</HelpText>
                <button
                  type="button"
                  onClick={mejorarDescripcion}
                  disabled={mejorando || descripcion.trim().length < 10}
                  className="flex shrink-0 items-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-700 transition-colors hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {mejorando ? (
                    <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>
                  )}
                  {mejorando ? 'Mejorando…' : 'Mejorar con IA'}
                </button>
              </div>
              {errorIA && <p className="mt-2 text-sm text-red-600">{errorIA}</p>}
            </div>
          </section>

          {/* Características */}
          <section className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm">
            <SectionTitle>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
              Características
            </SectionTitle>
            <div className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <Label>Ambientes</Label>
                  <NumericoInput value={ambientes} onChange={setAmbientes} min={0} max={20} label="ambientes" />
                  <HelpText>Incluye dormitorios, living, comedor.</HelpText>
                </div>
                <div>
                  <Label>Baños</Label>
                  <NumericoInput value={banos} onChange={setBanos} min={0} max={10} label="baños" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="superficie">Superficie (m²)</Label>
                  <input
                    id="superficie"
                    type="number"
                    min="0"
                    value={superficie}
                    onChange={(e) => setSuperficie(e.target.value)}
                    placeholder="—"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-800 placeholder-slate-400 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <Label htmlFor="piso">Piso (si aplica)</Label>
                  <input
                    id="piso"
                    type="number"
                    min="0"
                    value={piso}
                    onChange={(e) => setPiso(e.target.value)}
                    placeholder="—"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-800 placeholder-slate-400 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                    placeholder="—"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-800 placeholder-slate-400 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <Label>¿Acepta mascotas?</Label>
                  <TriState value={aceptaMascotas} onChange={setAceptaMascotas} />
                </div>
                <div>
                  <Label>¿Acepta niños?</Label>
                  <TriState value={aceptaNinos} onChange={setAceptaNinos} />
                </div>
              </div>

              <div>
                <Label>Amenidades</Label>
                <div className="mt-2 flex flex-wrap gap-3">
                  {(
                    [
                      { val: tieneCochera, set: setTieneCochera, label: 'Cochera' },
                      { val: tieneBalcon, set: setTieneBalcon, label: 'Balcón / terraza' },
                      { val: permiteFumar, set: setPermiteFumar, label: 'Se puede fumar' },
                    ] as { val: boolean; set: (v: boolean) => void; label: string }[]
                  ).map(({ val, set, label }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => set(!val)}
                      className={`flex items-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition-all ${
                        val
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-slate-300 bg-white text-slate-600 hover:border-blue-300'
                      }`}
                    >
                      <span className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${val ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>
                        {val && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        )}
                      </span>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Fotos */}
          <section className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm">
            <SectionTitle>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              Fotos ({fotos.length})
            </SectionTitle>
            <HelpText>Arrastrá las fotos para reordenarlas. La primera es la imagen principal.</HelpText>

            {fotos.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
                {fotos.map((url, i) => (
                  <div
                    key={url}
                    draggable
                    onDragStart={() => onDragStart(i)}
                    onDragOver={(e) => onDragOver(e, i)}
                    className="group relative aspect-square cursor-grab overflow-hidden rounded-xl border-2 border-slate-300 bg-slate-100 active:cursor-grabbing"
                  >
                    <Image src={url} alt={`Foto ${i + 1}`} fill className="object-cover" />
                    {i === 0 && (
                      <span className="absolute left-1.5 top-1.5 rounded-lg bg-blue-600 px-2 py-0.5 text-xs font-bold text-white">
                        Principal
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
          <section className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm">
            <SectionTitle>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
              Videos ({videos.length}/2)
            </SectionTitle>
            <HelpText>Podés agregar hasta 2 videos. Máximo 100 MB cada uno.</HelpText>

            {videos.length > 0 && (
              <div className="mt-4 space-y-3">
                {videos.map((url, i) => (
                  <div key={url} className="flex items-center gap-3 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-slate-400"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                    <span className="flex-1 truncate text-sm text-slate-700">Video {i + 1}</span>
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:underline">Ver</a>
                    <button
                      type="button"
                      onClick={() => {
                        if (!confirm('¿Eliminar este video?')) return
                        setVideos((prev) => prev.filter((_, idx) => idx !== i))
                      }}
                      className="ml-2 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
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
                  onChange={(e) => {
                    if (e.target.files?.[0]) subirVideo(e.target.files[0])
                  }}
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
          <section className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm">
            <SectionTitle>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Estado de la publicación
            </SectionTitle>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setEstado('active')}
                className={`flex items-center gap-2 rounded-xl border-2 px-5 py-3 text-sm font-semibold transition-all ${
                  estado === 'active'
                    ? 'border-green-600 bg-green-50 text-green-700'
                    : 'border-slate-300 bg-white text-slate-600 hover:border-green-400'
                }`}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${estado === 'active' ? 'bg-green-500' : 'bg-slate-300'}`} />
                Activa
              </button>
              <button
                type="button"
                onClick={() => setEstado('paused')}
                className={`flex items-center gap-2 rounded-xl border-2 px-5 py-3 text-sm font-semibold transition-all ${
                  estado === 'paused'
                    ? 'border-amber-500 bg-amber-50 text-amber-700'
                    : 'border-slate-300 bg-white text-slate-600 hover:border-amber-400'
                }`}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${estado === 'paused' ? 'bg-amber-400' : 'bg-slate-300'}`} />
                Pausada
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              {estado === 'active'
                ? 'La publicación es visible para todos los usuarios.'
                : 'La publicación está oculta. Podés reactivarla en cualquier momento.'}
            </p>
          </section>

          {/* Guardar */}
          {errorGuardar && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {errorGuardar}
            </p>
          )}
          <div className="flex justify-end pb-2">
            <button
              type="button"
              onClick={guardar}
              disabled={guardando}
              className="flex h-12 items-center gap-2 rounded-xl bg-blue-600 px-8 text-base font-bold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
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
        <div className="hidden lg:block lg:w-[45%]">
          <div className="sticky top-28">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
              Vista previa
            </p>
            <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-md">
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
                    {incluyeExpensas === true && (
                      <p className="text-xs text-slate-400">Incluye expensas</p>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {ambientes ? (
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{ambientes} amb.</span>
                  ) : null}
                  {banos ? (
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{banos} baño{banos !== 1 ? 's' : ''}</span>
                  ) : null}
                  {superficie ? (
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{superficie} m²</span>
                  ) : null}
                  {tieneCochera && <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">Cochera</span>}
                  {tieneBalcon && <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">Balcón</span>}
                </div>
                {descripcion && (
                  <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-slate-600">{descripcion}</p>
                )}
              </div>
            </div>
            {fotos.length > 1 && (
              <p className="mt-3 text-center text-xs text-slate-400">
                {fotos.length} fotos · arrastrá para reordenar
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal IA ─────────────────────────────────────────────────── */}
      {modalIA && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Descripción mejorada con IA</h3>
              <button
                type="button"
                onClick={() => setModalIA(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto rounded-xl bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700">
              {descripcionMejorada}
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Revisá el texto antes de aplicarlo. Podés editarlo una vez que lo apliques.
            </p>
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalIA(false)}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setDescripcion(descripcionMejorada)
                  setModalIA(false)
                  setToast('Descripción actualizada. Revisá y guardá los cambios.')
                }}
                className="rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-purple-700"
              >
                Usar esta descripción
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ────────────────────────────────────────────────────── */}
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
    </>
  )
}
