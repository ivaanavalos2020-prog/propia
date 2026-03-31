'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  PROVINCIAS_ORDENADAS,
  getProvinciaConfig,
  type ProvinciaConfig,
  type Zona,
} from './ubicaciones'

const PAGE_SIZE = 12

const TIPO_LABEL: Record<string, string> = {
  departamento: 'Departamento',
  casa: 'Casa',
  habitacion: 'Habitación',
  local: 'Local comercial',
}

const CONTRATO_LABEL: Record<string, string> = {
  tradicional: 'Alquiler tradicional',
  temporario: 'Alquiler temporario',
  temporada: 'Por temporada',
  a_convenir: 'A convenir',
}

const ORDEN_OPTIONS = [
  { value: 'recientes', label: 'Más recientes' },
  { value: 'precio_asc', label: 'Menor precio' },
  { value: 'precio_desc', label: 'Mayor precio' },
  { value: 'vistas_desc', label: 'Más vistos' },
]

interface Propiedad {
  id: string
  type: string
  address: string
  neighborhood: string | null
  city: string | null
  price_usd: number
  bedrooms: number | null
  bathrooms: number | null
  area_m2: number | null
  photo_urls: string[] | null
  created_at: string | null
  contract_type: string | null
  views_count: number | null
}

interface InitialFilters {
  tipo?: string
  provincia?: string
  zona?: string
  barrio?: string
  busqueda?: string
  orden?: string
  precio?: string
}

// ── Icon helpers ─────────────────────────────────────────────────────────────

function IconPin() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function IconClose() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function IconChevron({ open }: { open: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function IconGrilla() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  )
}

function IconLista() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  )
}

// ── Location selects (extracted to avoid closure re-render issues) ────────────

interface LocationSelectsProps {
  provincia: string
  zona: string
  barrio: string
  localidadTexto: string
  zonasDisponibles: Zona[]
  localidadesDisponibles: string[]
  mostrarTextInput: boolean
  onProvincia: (v: string) => void
  onZona: (v: string) => void
  onBarrio: (v: string) => void
  onLocalidadTexto: (v: string) => void
}

function LocationSelects({
  provincia, zona, barrio, localidadTexto,
  zonasDisponibles, localidadesDisponibles, mostrarTextInput,
  onProvincia, onZona, onBarrio, onLocalidadTexto,
}: LocationSelectsProps) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-500">Provincia</label>
        <select
          value={provincia}
          onChange={e => onProvincia(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
        >
          <option value="">Todas las provincias</option>
          {PROVINCIAS_ORDENADAS.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {provincia && zonasDisponibles.length > 0 && (
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500">Zona</label>
          <select
            value={zona}
            onChange={e => onZona(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
          >
            <option value="">Todas las zonas</option>
            {zonasDisponibles.map(z => (
              <option key={z.value} value={z.value}>{z.label}</option>
            ))}
          </select>
        </div>
      )}

      {localidadesDisponibles.length > 0 && (
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500">Barrio / Localidad</label>
          <select
            value={barrio}
            onChange={e => onBarrio(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
          >
            <option value="">Todos los barrios</option>
            {localidadesDisponibles.map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
      )}

      {mostrarTextInput && (
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500">Ciudad</label>
          <input
            type="text"
            value={localidadTexto}
            onChange={e => onLocalidadTexto(e.target.value)}
            placeholder="Escribí la ciudad..."
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
          />
        </div>
      )}
    </div>
  )
}

// ── Card helpers ─────────────────────────────────────────────────────────────

function esNueva(created_at: string | null) {
  if (!created_at) return false
  return Date.now() - new Date(created_at).getTime() < 7 * 24 * 60 * 60 * 1000
}

function FotoPlaceholder() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-slate-100">
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300" aria-hidden="true">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    </div>
  )
}

function CardGrilla({ p }: { p: Propiedad }) {
  const nueva = esNueva(p.created_at)
  const foto = p.photo_urls?.[0] ?? null
  return (
    <Link
      href={`/propiedades/${p.id}`}
      className="group flex h-full cursor-pointer flex-col rounded-xl border border-slate-300 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md overflow-hidden"
    >
      <div className="relative h-44 w-full shrink-0 overflow-hidden bg-slate-100">
        {foto ? (
          <Image
            src={foto}
            alt={p.address}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <FotoPlaceholder />
        )}
        {nueva && (
          <span className="absolute left-3 top-3 rounded-full bg-green-500 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm">
            Nuevo
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex w-fit rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
              {TIPO_LABEL[p.type] ?? p.type}
            </span>
            {p.contract_type && p.contract_type !== 'a_convenir' && (
              <span className="inline-flex w-fit rounded-full border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600">
                {CONTRATO_LABEL[p.contract_type] ?? p.contract_type}
              </span>
            )}
          </div>
          <span className="line-clamp-2 text-base font-semibold text-slate-900">{p.address}</span>
          {(p.neighborhood || p.city) && (
            <span className="text-xs text-slate-400">
              {[p.neighborhood, p.city].filter(Boolean).join(', ')}
            </span>
          )}
        </div>
        <div className="mt-auto flex flex-col gap-2">
          <span className="text-xl font-bold text-blue-600">
            USD {Number(p.price_usd).toLocaleString('es-AR')}
            <span className="ml-1 text-sm font-normal text-slate-400">/mes</span>
          </span>
          <div className="flex gap-4 text-sm text-slate-400">
            {p.bedrooms != null && <span>{p.bedrooms} amb.</span>}
            {p.bathrooms != null && <span>{p.bathrooms} baño{p.bathrooms !== 1 ? 's' : ''}</span>}
            {p.area_m2 != null && <span>{p.area_m2} m²</span>}
          </div>
        </div>
      </div>
    </Link>
  )
}

function CardLista({ p }: { p: Propiedad }) {
  const nueva = esNueva(p.created_at)
  const foto = p.photo_urls?.[0] ?? null
  return (
    <Link
      href={`/propiedades/${p.id}`}
      className="flex items-center gap-4 rounded-xl border border-slate-300 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md"
    >
      <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">
        {foto ? (
          <Image src={foto} alt={p.address} fill sizes="96px" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300" aria-hidden="true">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex flex-col gap-0.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex w-fit rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                {TIPO_LABEL[p.type] ?? p.type}
              </span>
              {nueva && (
                <span className="inline-flex w-fit rounded-full bg-green-500 px-2 py-0.5 text-[11px] font-bold text-white">
                  Nuevo
                </span>
              )}
            </div>
            <p className="truncate text-sm font-semibold text-slate-900">{p.address}</p>
            {(p.neighborhood || p.city) && (
              <p className="text-xs text-slate-400">
                {[p.neighborhood, p.city].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
          <div className="shrink-0 text-right">
            <p className="text-base font-bold text-blue-600">
              USD {Number(p.price_usd).toLocaleString('es-AR')}
            </p>
            <p className="text-xs text-slate-400">/mes</p>
          </div>
        </div>
        <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-400">
          {p.bedrooms != null && <span>{p.bedrooms} amb.</span>}
          {p.bathrooms != null && <span>{p.bathrooms} baño{p.bathrooms !== 1 ? 's' : ''}</span>}
          {p.area_m2 != null && <span>{p.area_m2} m²</span>}
          {p.contract_type && p.contract_type !== 'a_convenir' && (
            <span className="text-blue-500">{CONTRATO_LABEL[p.contract_type] ?? p.contract_type}</span>
          )}
        </div>
      </div>
    </Link>
  )
}

// ── Filter helpers ────────────────────────────────────────────────────────────

function getProvinceCities(config: ProvinciaConfig): string[] {
  const cities = new Set<string>([config.cityValue])
  config.zonas?.forEach(z => { if (z.filterCity) cities.add(z.filterCity) })
  return [...cities]
}

function buildPageNumbers(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '…')[] = []
  const always = new Set([1, total, current, current - 1, current + 1].filter(n => n >= 1 && n <= total))
  let prev: number | null = null
  for (let n = 1; n <= total; n++) {
    if (always.has(n)) {
      if (prev !== null && n - prev > 1) pages.push('…')
      pages.push(n)
      prev = n
    }
  }
  return pages
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ListadoConFiltros({
  propiedades,
  initialFilters = {},
}: {
  propiedades: Propiedad[]
  initialFilters?: InitialFilters
}) {
  const [tipo, setTipo] = useState(initialFilters.tipo ?? '')
  const [provincia, setProvincia] = useState(initialFilters.provincia ?? '')
  const [zona, setZona] = useState(initialFilters.zona ?? '')
  const [barrio, setBarrio] = useState(initialFilters.barrio ?? '')
  const [localidadTexto, setLocalidadTexto] = useState('')
  const [busqueda, setBusqueda] = useState(initialFilters.busqueda ?? '')
  const [orden, setOrden] = useState(initialFilters.orden ?? 'recientes')
  const [precioMax, setPrecioMax] = useState(initialFilters.precio ?? '')
  const [vista, setVista] = useState<'grilla' | 'lista'>('grilla')
  const [ubicacionOpen, setUbicacionOpen] = useState(false)
  const [mobileModalOpen, setMobileModalOpen] = useState(false)
  const [pagina, setPagina] = useState(1)

  const provinciaConfig = provincia ? getProvinciaConfig(provincia) : null

  const zonasDisponibles = useMemo<Zona[]>(() => {
    return provinciaConfig?.zonas ?? []
  }, [provinciaConfig])

  const zonaConfig = zona ? zonasDisponibles.find(z => z.value === zona) ?? null : null

  const localidadesDisponibles = useMemo<string[]>(() => {
    if (zonaConfig?.localidades) return zonaConfig.localidades
    if (!zona && provinciaConfig?.localidades) return provinciaConfig.localidades
    return []
  }, [zona, zonaConfig, provinciaConfig])

  // Interior zones have no filterCity → show text input
  const mostrarTextInput = !!(zona && zonaConfig && !zonaConfig.filterCity)

  // Reset pagination when filters change
  useEffect(() => { setPagina(1) }, [tipo, provincia, zona, barrio, localidadTexto, busqueda, orden, precioMax])

  // URL sync
  useEffect(() => {
    const params = new URLSearchParams()
    if (tipo) params.set('tipo', tipo)
    if (provincia) params.set('provincia', provincia)
    if (zona) params.set('zona', zona)
    if (barrio) params.set('barrio', barrio)
    if (busqueda.trim()) params.set('q', busqueda.trim())
    if (orden !== 'recientes') params.set('orden', orden)
    if (precioMax) params.set('precio', precioMax)
    const qs = params.toString()
    window.history.replaceState(null, '', `/propiedades${qs ? `?${qs}` : ''}`)
  }, [tipo, provincia, zona, barrio, busqueda, orden, precioMax])

  const resultado = useMemo(() => {
    let list = [...propiedades]

    const termino = busqueda.trim().toLowerCase()
    if (termino) {
      list = list.filter(p =>
        p.address.toLowerCase().includes(termino) ||
        p.neighborhood?.toLowerCase().includes(termino) ||
        p.city?.toLowerCase().includes(termino)
      )
    }

    if (tipo) list = list.filter(p => p.type === tipo)
    if (precioMax) list = list.filter(p => p.price_usd <= Number(precioMax))

    // Location hierarchy
    if (barrio) {
      list = list.filter(p => p.neighborhood === barrio)
    } else if (localidadTexto.trim()) {
      const lt = localidadTexto.trim().toLowerCase()
      list = list.filter(p =>
        p.city?.toLowerCase().includes(lt) ||
        p.neighborhood?.toLowerCase().includes(lt)
      )
    } else if (zona && zonaConfig?.filterCity) {
      list = list.filter(p => p.city === zonaConfig.filterCity)
    } else if (!zona && provincia && provinciaConfig) {
      const cities = getProvinceCities(provinciaConfig)
      list = list.filter(p => p.city != null && cities.includes(p.city))
    }

    switch (orden) {
      case 'precio_asc':  list.sort((a, b) => a.price_usd - b.price_usd); break
      case 'precio_desc': list.sort((a, b) => b.price_usd - a.price_usd); break
      case 'vistas_desc': list.sort((a, b) => (b.views_count ?? 0) - (a.views_count ?? 0)); break
      default:
        list.sort((a, b) =>
          new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
        )
    }
    return list
  }, [propiedades, busqueda, tipo, precioMax, barrio, localidadTexto, zona, zonaConfig, provincia, provinciaConfig, orden])

  const totalPaginas = Math.ceil(resultado.length / PAGE_SIZE)
  const paginados = resultado.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE)
  const pageNumbers = buildPageNumbers(pagina, totalPaginas)

  // Pills
  const pills: { key: string; label: string }[] = []
  if (tipo) pills.push({ key: 'tipo', label: TIPO_LABEL[tipo] ?? tipo })
  if (provincia && !zona) pills.push({ key: 'provincia', label: provincia })
  if (zona && zonaConfig) pills.push({ key: 'zona', label: `${provincia} · ${zonaConfig.label}` })
  if (barrio) pills.push({ key: 'barrio', label: barrio })
  if (localidadTexto.trim()) pills.push({ key: 'localidad', label: localidadTexto.trim() })
  if (precioMax) pills.push({ key: 'precio', label: `Hasta USD ${Number(precioMax).toLocaleString('es-AR')}` })

  function removePill(key: string) {
    if (key === 'tipo') setTipo('')
    if (key === 'provincia') { setProvincia(''); setZona(''); setBarrio(''); setLocalidadTexto('') }
    if (key === 'zona') { setZona(''); setBarrio(''); setLocalidadTexto('') }
    if (key === 'barrio') setBarrio('')
    if (key === 'localidad') setLocalidadTexto('')
    if (key === 'precio') setPrecioMax('')
  }

  function clearAll() {
    setTipo(''); setProvincia(''); setZona(''); setBarrio('')
    setLocalidadTexto(''); setBusqueda(''); setPrecioMax('')
  }

  const hayFiltros = pills.length > 0

  const locationLabel = (() => {
    if (!provincia) return 'Ubicación'
    if (barrio) return barrio
    if (zonaConfig) return `${provincia} · ${zonaConfig.label}`
    return provincia
  })()

  const locationSelectProps: LocationSelectsProps = {
    provincia, zona, barrio, localidadTexto,
    zonasDisponibles, localidadesDisponibles, mostrarTextInput,
    onProvincia: v => { setProvincia(v); setZona(''); setBarrio(''); setLocalidadTexto('') },
    onZona: v => { setZona(v); setBarrio(''); setLocalidadTexto('') },
    onBarrio: setBarrio,
    onLocalidadTexto: setLocalidadTexto,
  }

  return (
    <div className="flex flex-col gap-4">

      {/* ── Filter bar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">

        {/* Search */}
        <div className="relative min-w-0 flex-1 basis-48">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Dirección, barrio..."
            aria-label="Buscar propiedades"
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-8 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-blue-500 focus:outline-none"
          />
          {busqueda && (
            <button type="button" onClick={() => setBusqueda('')} aria-label="Limpiar búsqueda"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
              <IconClose />
            </button>
          )}
        </div>

        {/* Tipo */}
        <select value={tipo} onChange={e => setTipo(e.target.value)}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none">
          <option value="">Tipo de propiedad</option>
          <option value="departamento">Departamento</option>
          <option value="casa">Casa</option>
          <option value="habitacion">Habitación</option>
          <option value="local">Local comercial</option>
        </select>

        {/* Ubicación — desktop dropdown */}
        <div className="relative hidden sm:block">
          <button type="button" onClick={() => setUbicacionOpen(v => !v)}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm shadow-sm transition-colors focus:outline-none ${
              provincia
                ? 'border-blue-300 bg-blue-50 text-blue-700'
                : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
            }`}>
            <IconPin />
            <span className="max-w-[140px] truncate">{locationLabel}</span>
            <IconChevron open={ubicacionOpen} />
          </button>

          {ubicacionOpen && (
            <>
              {/* Click-outside overlay */}
              <div className="fixed inset-0 z-20" onClick={() => setUbicacionOpen(false)} />
              <div className="absolute left-0 top-full z-30 mt-2 w-72 rounded-xl border border-slate-300 bg-white p-4 shadow-lg animate-dropdown">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-800">Ubicación</span>
                  <div className="flex items-center gap-3">
                    {provincia && (
                      <button type="button"
                        onClick={() => { setProvincia(''); setZona(''); setBarrio(''); setLocalidadTexto('') }}
                        className="text-xs font-medium text-blue-600 hover:underline">
                        Limpiar
                      </button>
                    )}
                    <button type="button" onClick={() => setUbicacionOpen(false)}
                      className="text-slate-400 hover:text-slate-700"><IconClose /></button>
                  </div>
                </div>
                <LocationSelects {...locationSelectProps} />
              </div>
            </>
          )}
        </div>

        {/* Ubicación — mobile button */}
        <button type="button" onClick={() => setMobileModalOpen(true)}
          className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm shadow-sm sm:hidden ${
            provincia ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-300 bg-white text-slate-700'
          }`}>
          <IconPin />
          <span>{provincia ? provincia : 'Ubicación'}</span>
        </button>

        {/* Precio */}
        <select value={precioMax} onChange={e => setPrecioMax(e.target.value)}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none">
          <option value="">Precio máximo</option>
          <option value="300">Hasta USD 300</option>
          <option value="500">Hasta USD 500</option>
          <option value="800">Hasta USD 800</option>
          <option value="1200">Hasta USD 1.200</option>
          <option value="2000">Hasta USD 2.000</option>
        </select>

        {/* Orden */}
        <select value={orden} onChange={e => setOrden(e.target.value)}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none">
          {ORDEN_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Vista toggle */}
        <div className="flex overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
          <button type="button" onClick={() => setVista('grilla')} aria-label="Vista grilla" aria-pressed={vista === 'grilla'}
            className={`flex h-10 w-10 items-center justify-center transition-colors ${vista === 'grilla' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'}`}>
            <IconGrilla />
          </button>
          <button type="button" onClick={() => setVista('lista')} aria-label="Vista lista" aria-pressed={vista === 'lista'}
            className={`flex h-10 w-10 items-center justify-center transition-colors ${vista === 'lista' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'}`}>
            <IconLista />
          </button>
        </div>
      </div>

      {/* ── Active filter pills ──────────────────────────────────────────────── */}
      {hayFiltros && (
        <div className="flex flex-wrap items-center gap-2">
          {pills.map(pill => (
            <button key={pill.key} type="button" onClick={() => removePill(pill.key)}
              className="flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 transition-colors hover:border-blue-300 hover:bg-blue-100">
              {pill.label}
              <IconClose />
            </button>
          ))}
          {pills.length > 1 && (
            <button type="button" onClick={clearAll}
              className="text-xs font-medium text-slate-400 hover:text-slate-700 hover:underline">
              Limpiar todo
            </button>
          )}
        </div>
      )}

      {/* ── Result counter ───────────────────────────────────────────────────── */}
      {resultado.length > 0 && (
        <p className="text-sm text-slate-500">
          <span className="font-semibold text-slate-700">{resultado.length}</span>{' '}
          propiedad{resultado.length !== 1 ? 'es' : ''} encontrada{resultado.length !== 1 ? 's' : ''}
          {busqueda.trim() && <span className="text-slate-400"> para &ldquo;{busqueda}&rdquo;</span>}
          {totalPaginas > 1 && (
            <span className="text-slate-400"> · Página {pagina} de {totalPaginas}</span>
          )}
        </p>
      )}

      {/* ── Results ─────────────────────────────────────────────────────────── */}
      {paginados.length > 0 ? (
        vista === 'grilla' ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginados.map((p, i) => (
              <li key={p.id}
                className="opacity-0 animate-[fadeSlideUp_0.4s_ease-out_forwards]"
                style={{ animationDelay: `${Math.min(i * 50, 400)}ms` }}>
                <CardGrilla p={p} />
              </li>
            ))}
          </ul>
        ) : (
          <ul className="flex flex-col gap-2">
            {paginados.map((p, i) => (
              <li key={p.id}
                className="opacity-0 animate-[fadeSlideUp_0.4s_ease-out_forwards]"
                style={{ animationDelay: `${Math.min(i * 40, 300)}ms` }}>
                <CardLista p={p} />
              </li>
            ))}
          </ul>
        )
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400" aria-hidden="true">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <p className="text-base font-medium text-slate-600">
            {busqueda.trim()
              ? `Sin resultados para "${busqueda}"`
              : hayFiltros
              ? 'No hay propiedades con esos filtros'
              : 'No hay propiedades disponibles'}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            {busqueda.trim()
              ? 'Probá con otro término de búsqueda.'
              : 'Volvé pronto, se agregan nuevas propiedades todos los días.'}
          </p>
          {(hayFiltros || busqueda.trim()) && (
            <button type="button" onClick={clearAll}
              className="mt-4 text-sm font-semibold text-blue-600 transition-opacity hover:opacity-70">
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* ── Pagination ───────────────────────────────────────────────────────── */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-2">
          <button type="button" onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-500 shadow-sm transition-colors hover:border-slate-400 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {pageNumbers.map((n, i) =>
            n === '…' ? (
              <span key={`ellipsis-${i}`} className="flex h-9 w-9 items-center justify-center text-sm text-slate-400">…</span>
            ) : (
              <button key={n} type="button" onClick={() => setPagina(n)}
                className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-medium shadow-sm transition-colors ${
                  n === pagina
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-800'
                }`}>
                {n}
              </button>
            )
          )}

          <button type="button" onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-500 shadow-sm transition-colors hover:border-slate-400 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      )}

      {/* ── Mobile bottom-sheet modal ────────────────────────────────────────── */}
      {mobileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileModalOpen(false)} />
          <div className="relative w-full rounded-t-2xl bg-white p-6 pb-10 animate-[slideUp_0.25s_ease-out_forwards]">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Filtrar por ubicación</h2>
              <button type="button" onClick={() => setMobileModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200">
                <IconClose />
              </button>
            </div>
            <LocationSelects {...locationSelectProps} />
            <div className="mt-5 flex gap-3">
              {provincia && (
                <button type="button"
                  onClick={() => { setProvincia(''); setZona(''); setBarrio(''); setLocalidadTexto('') }}
                  className="flex-1 rounded-xl border border-slate-300 bg-white py-3 text-sm font-medium text-slate-600">
                  Limpiar
                </button>
              )}
              <button type="button" onClick={() => setMobileModalOpen(false)}
                className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700">
                Ver {resultado.length} {resultado.length !== 1 ? 'propiedades' : 'propiedad'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
