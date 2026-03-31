'use client'

import { useEffect, useRef, useState } from 'react'

interface LocationInfo {
  zona?: string
  descripcion_general?: string
  transporte?: string[]
  gastronomia?: string[]
  areas_verdes?: string[]
  servicios?: string[]
  educacion?: string[]
  vida_nocturna?: string | null
  perfil_vecinos?: string
  puntaje_conectividad?: number
  puntaje_servicios?: number
  puntaje_verde?: number
  advertencia?: string | null
}

interface Props {
  propertyId: string
  address: string | null
  neighborhood: string | null
  city: string | null
}

// Module-level in-memory cache — persists across navigations in the same session
const memCache = new Map<string, LocationInfo>()

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-4 w-2/3 rounded-lg bg-slate-200" />
      <div className="h-3 w-full rounded-lg bg-slate-200" />
      <div className="h-3 w-5/6 rounded-lg bg-slate-200" />
      <div className="mt-6 grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-slate-200" />
        ))}
      </div>
    </div>
  )
}

function BarraPuntaje({
  label,
  valor,
  color,
  icono,
  activa,
}: {
  label: string
  valor: number
  color: string
  icono: React.ReactNode
  activa: boolean
}) {
  const pct = Math.min(100, Math.max(0, (valor / 10) * 100))
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
          {icono}
          {label}
        </div>
        <span className="text-sm font-bold text-slate-800">{valor}/10</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
          style={{ width: activa ? `${pct}%` : '0%' }}
        />
      </div>
    </div>
  )
}

function CardBeneficio({
  titulo,
  icono,
  items,
}: {
  titulo: string
  icono: React.ReactNode
  items: string[]
}) {
  if (!items || items.length === 0) return null
  return (
    <div className="rounded-xl border border-slate-300 bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xl">{icono}</span>
        <span className="text-sm font-bold text-slate-800">{titulo}</span>
      </div>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function VentajasUbicacion({ propertyId, address, neighborhood, city }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [info, setInfo] = useState<LocationInfo | null>(null)
  const [barrasActivas, setBarrasActivas] = useState(false)

  // Detect slow connection
  const isSlowConnection =
    typeof navigator !== 'undefined' &&
    'connection' in navigator &&
    (
      (navigator as { connection?: { effectiveType?: string; saveData?: boolean } }).connection
        ?.effectiveType === '2g' ||
      (navigator as { connection?: { effectiveType?: string; saveData?: boolean } }).connection
        ?.saveData === true
    )

  // IntersectionObserver — trigger fetch when section scrolls into view
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          obs.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Fetch when visible
  useEffect(() => {
    if (!visible) return

    const cacheKey = propertyId
    if (memCache.has(cacheKey)) {
      setInfo(memCache.get(cacheKey)!)
      return
    }

    setCargando(true)
    fetch('/api/ubicacion-info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ property_id: propertyId, address, neighborhood, city }),
    })
      .then(async (r) => {
        const text = await r.text()
        console.log('[VentajasUbicacion] response status:', r.status, 'body:', text.slice(0, 300))
        try {
          return JSON.parse(text) as LocationInfo
        } catch (e) {
          console.error('[VentajasUbicacion] JSON parse error:', e, 'raw:', text)
          throw new Error('Respuesta no válida del servidor')
        }
      })
      .then((data) => {
        memCache.set(cacheKey, data)
        setInfo(data)
      })
      .catch((err) => {
        console.error('[VentajasUbicacion] fetch error:', err)
        setInfo({ advertencia: 'No se pudo obtener información de la zona en este momento.' })
      })
      .finally(() => setCargando(false))
  }, [visible, propertyId, address, neighborhood, city])

  // Animate bars after data loads
  useEffect(() => {
    if (!info) return
    const t = setTimeout(() => setBarrasActivas(true), 100)
    return () => clearTimeout(t)
  }, [info])

  // If there's literally no location data to query, render nothing
  if (!address && !neighborhood && !city) return null

  return (
    <div ref={containerRef} className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        ¿Por qué vivir acá?
      </h2>

      <div className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
        <p className="mb-5 text-xs text-slate-400">
          Información generada automáticamente basada en la ubicación
        </p>

        {/* ── Loading skeleton ── */}
        {cargando && <Skeleton />}

        {/* ── No data yet and not loading ── */}
        {!cargando && !info && (
          <p className="py-6 text-center text-sm text-slate-400">
            No pudimos obtener información de esta zona por el momento.
          </p>
        )}

        {/* ── Data loaded ── */}
        {!cargando && info && (
          <div className="flex flex-col gap-6">

            {/* Advertencia */}
            {info.advertencia && (
              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mt-0.5 shrink-0 text-amber-500"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
                <p className="text-sm text-amber-800">
                  <span className="font-semibold">Nota:</span> {info.advertencia}
                </p>
              </div>
            )}

            {/* Descripción general */}
            {info.descripcion_general && (
              <div
                className="rounded-r-xl py-3 pl-4 pr-4 text-sm leading-relaxed text-blue-900 italic"
                style={{
                  background: '#EFF6FF',
                  borderLeft: '3px solid #2563EB',
                }}
              >
                {info.descripcion_general}
              </div>
            )}

            {/* Perfil del barrio */}
            {info.perfil_vecinos && (
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  {info.perfil_vecinos}
                </span>
              </div>
            )}

            {/* Puntajes — versión completa o simplificada en mobile lento */}
            {!isSlowConnection && (
              <>
                {(info.puntaje_conectividad != null ||
                  info.puntaje_servicios != null ||
                  info.puntaje_verde != null) && (
                  <div className="flex flex-col gap-3 rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Puntajes de la zona
                    </p>
                    {info.puntaje_conectividad != null && (
                      <BarraPuntaje
                        label="Conectividad"
                        valor={info.puntaje_conectividad}
                        color="bg-blue-500"
                        activa={barrasActivas}
                        icono={
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                        }
                      />
                    )}
                    {info.puntaje_servicios != null && (
                      <BarraPuntaje
                        label="Servicios"
                        valor={info.puntaje_servicios}
                        color="bg-green-500"
                        activa={barrasActivas}
                        icono={
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                        }
                      />
                    )}
                    {info.puntaje_verde != null && (
                      <BarraPuntaje
                        label="Espacios verdes"
                        valor={info.puntaje_verde}
                        color="bg-emerald-400"
                        activa={barrasActivas}
                        icono={
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 8C8 10 5.9 16.17 3.82 22"/><path d="M9.5 2.82C11 7 15 8.5 22 8.5"/></svg>
                        }
                      />
                    )}
                  </div>
                )}

                {/* Grilla de beneficios */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <CardBeneficio titulo="Transporte" icono="🚇" items={info.transporte ?? []} />
                  <CardBeneficio titulo="Gastronomía" icono="☕" items={info.gastronomia ?? []} />
                  <CardBeneficio titulo="Áreas verdes" icono="🌳" items={info.areas_verdes ?? []} />
                  <CardBeneficio titulo="Servicios" icono="🏪" items={info.servicios ?? []} />
                  {(info.educacion?.length ?? 0) > 0 && (
                    <CardBeneficio titulo="Educación" icono="📚" items={info.educacion!} />
                  )}
                </div>

                {/* Vida nocturna */}
                {info.vida_nocturna && (
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800">
                      <span>🌙</span>
                      Vida nocturna
                    </div>
                    <p className="text-sm leading-relaxed text-slate-600">{info.vida_nocturna}</p>
                  </div>
                )}
              </>
            )}

            {/* Disclaimer */}
            <p className="text-xs leading-relaxed text-slate-400">
              Esta información es orientativa y fue generada por inteligencia artificial basándose en conocimiento general de la zona. Te recomendamos verificar la información antes de tomar una decisión.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
