'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'

const ADMIN_EMAIL = 'ivaan.avalos2020@gmail.com'

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Resumen {
  totalUsuarios: number
  propiedadesActivas: number
  mensajesHoy: number
  verificacionesPendientes: number
}

interface VerifRow {
  id: string
  full_name: string | null
  email: string | null
  verification_status: string | null
  verification_dni_front_url: string | null
  verification_dni_back_url: string | null
  verification_selfie_url: string | null
  updated_at: string | null
}

interface FotoState {
  label: string
  url: string | null
  loading: boolean
  error: boolean
}

interface VerifModal {
  userId: string
  displayName: string
  fotos: FotoState[]
  fase: 'fotos' | 'rechazando'
  motivoRechazo: string
  loadingAccion: boolean
  errorMsg: string | null
}

interface PropiedadRow {
  id: string
  type: string | null
  address: string | null
  status: string | null
  created_at: string | null
  owner_id: string | null
  photo_urls: string[] | null
  price_usd: number | null
  rooms: number | null
  city: string | null
  owner_email: string | null
}

interface UsuarioRow {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  dni: string | null
  identity_verified: boolean | null
  verification_status: string | null
  updated_at: string | null
  propiedadesCount: number
}

interface ToastState {
  msg: string
  tipo: 'ok' | 'error'
}

type Tab = 'verificaciones' | 'propiedades' | 'usuarios'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fecha(s: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function inicial(s: string | null): string {
  if (!s) return '?'
  return s.charAt(0).toUpperCase()
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  active:  { label: 'Activa',    cls: 'bg-green-100 text-green-700' },
  paused:  { label: 'Pausada',   cls: 'bg-amber-100 text-amber-700' },
  deleted: { label: 'Eliminada', cls: 'bg-red-100 text-red-700'    },
  draft:   { label: 'Borrador',  cls: 'bg-slate-100 text-slate-600' },
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ toast, onClose }: { toast: ToastState; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className={[
      'fixed bottom-6 right-6 z-[100] flex items-center gap-3 rounded-xl px-5 py-3.5 shadow-xl',
      toast.tipo === 'ok' ? 'bg-green-600 text-white' : 'bg-red-600 text-white',
    ].join(' ')}>
      <span className="text-sm font-medium">{toast.msg}</span>
      <button type="button" onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">✕</button>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function AdminPage() {
  const router = useRouter()
  const supabase = createClient()

  const [cargando, setCargando]   = useState(true)
  const [tab, setTab]             = useState<Tab>('verificaciones')
  const [toast, setToast]         = useState<ToastState | null>(null)

  const [resumen, setResumen]         = useState<Resumen>({ totalUsuarios: 0, propiedadesActivas: 0, mensajesHoy: 0, verificacionesPendientes: 0 })
  const [verificaciones, setVerifs]   = useState<VerifRow[]>([])
  const [propiedades, setPropiedades] = useState<PropiedadRow[]>([])
  const [usuarios, setUsuarios]       = useState<UsuarioRow[]>([])

  // Modal verificación
  const [modalVerif, setModalVerif] = useState<VerifModal | null>(null)

  // Modal confirmación propiedad
  const [confirmar, setConfirmar]     = useState<{ id: string; address: string | null; accion: 'activar' | 'pausar' | 'eliminar' } | null>(null)
  const [loadingProp, setLoadingProp] = useState<string | null>(null)

  // Filtros propiedades
  const [busquedaProp,        setBusquedaProp]        = useState('')
  const [filtroStatusProp,    setFiltroStatusProp]    = useState('all')
  const [filtroTipoProp,      setFiltroTipoProp]      = useState('all')
  const [filtroCiudadProp,    setFiltroCiudadProp]    = useState('all')
  const [filtroPrecioProp,    setFiltroPrecioProp]    = useState('all')
  const [filtroAmbientesProp, setFiltroAmbientesProp] = useState('all')
  const [paginaProp,          setPaginaProp]          = useState(1)

  function limpiarFiltrosProp() {
    setBusquedaProp(''); setFiltroStatusProp('all'); setFiltroTipoProp('all')
    setFiltroCiudadProp('all'); setFiltroPrecioProp('all'); setFiltroAmbientesProp('all')
    setPaginaProp(1)
  }

  function cambiarFiltroProp<T>(setter: (v: T) => void, val: T) {
    setter(val)
    setPaginaProp(1)
  }

  // Ref estable para el toast callback
  const cerrarToast = useRef(() => setToast(null))

  // ── Carga de datos ────────────────────────────────────────────────────────

  async function cargarDatos() {
    const hoy = new Date().toISOString().split('T')[0]

    const [
      totalUsuariosRes,
      propActivasRes,
      mensajesHoyRes,
      verifsRes,
      propsRes,
      usuariosRes,
    ] = await Promise.allSettled([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('properties').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('mensajes').select('id', { count: 'exact', head: true }).gte('created_at', hoy),
      supabase.from('profiles')
        .select('id, full_name, email, verification_status, verification_dni_front_url, verification_dni_back_url, verification_selfie_url, updated_at')
        .eq('verification_status', 'pending'),
      supabase.from('properties').select('id, type, address, status, created_at, owner_id, photo_urls, price_usd, rooms, city').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, full_name, email, phone, dni, identity_verified, verification_status, updated_at').order('updated_at', { ascending: false }),
    ])

    const totalUsuarios      = totalUsuariosRes.status === 'fulfilled' ? (totalUsuariosRes.value.count ?? 0) : 0
    const propiedadesActivas = propActivasRes.status === 'fulfilled'   ? (propActivasRes.value.count ?? 0)  : 0
    const mensajesHoy        = mensajesHoyRes.status === 'fulfilled'   ? (mensajesHoyRes.value.count ?? 0)  : 0

    const verifsData = verifsRes.status === 'fulfilled'  ? ((verifsRes.value.data ?? []) as VerifRow[])    : []
    const propsRaw   = propsRes.status === 'fulfilled'   ? (propsRes.value.data  ?? []) : []
    const rawUsers   = usuariosRes.status === 'fulfilled' ? ((usuariosRes.value.data ?? []) as Omit<UsuarioRow, 'propiedadesCount'>[]) : []

    // Email map: owner_id → email
    const ownerEmailMap = new Map<string, string>()
    rawUsers.forEach((u) => { if (u.email) ownerEmailMap.set(u.id, u.email) })

    // Contar propiedades por owner
    const propsPorOwner = new Map<string, number>()
    propsRaw.forEach((p) => {
      const oid = p.owner_id as string | null
      if (oid) propsPorOwner.set(oid, (propsPorOwner.get(oid) ?? 0) + 1)
    })

    // Hydrate PropiedadRow con owner_email
    const propsData: PropiedadRow[] = propsRaw.map((p) => ({
      id:          p.id          as string,
      type:        p.type        as string | null,
      address:     p.address     as string | null,
      status:      p.status      as string | null,
      created_at:  p.created_at  as string | null,
      owner_id:    p.owner_id    as string | null,
      photo_urls:  p.photo_urls  as string[] | null,
      price_usd:   p.price_usd   as number | null,
      rooms:       p.rooms       as number | null,
      city:        p.city        as string | null,
      owner_email: p.owner_id ? (ownerEmailMap.get(p.owner_id as string) ?? null) : null,
    }))

    const usuariosData: UsuarioRow[] = rawUsers.map((u) => ({
      ...u,
      propiedadesCount: propsPorOwner.get(u.id) ?? 0,
    }))

    setResumen({ totalUsuarios, propiedadesActivas, mensajesHoy, verificacionesPendientes: verifsData.length })
    setVerifs(verifsData)
    setPropiedades(propsData)
    setUsuarios(usuariosData)
  }

  useEffect(() => {
    async function init() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || user.email !== ADMIN_EMAIL) {
          router.replace('/')
          return
        }
      } catch {
        router.replace('/')
        return
      }
      await cargarDatos()
      setCargando(false)
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Abrir modal y cargar fotos firmadas ───────────────────────────────────

  async function abrirModal(v: VerifRow) {
    // Email > nombre > id truncado como display
    const displayName = v.email ?? v.full_name ?? `${v.id.slice(0, 8)}...`
    const LABELS = ['DNI Frente', 'DNI Dorso', 'Selfie con DNI']
    const userId = v.id  // siempre el profile.id

    // Abrir modal inmediatamente con fotos en estado loading
    const fotosIniciales: FotoState[] = LABELS.map((label) => ({
      label, url: null, loading: true, error: false,
    }))
    setModalVerif({ userId, displayName, fotos: fotosIniciales, fase: 'fotos', motivoRechazo: '', loadingAccion: false, errorMsg: null })

    // Paths exactos en Storage: {userId}/dni-frente.jpg, etc.
    const PATHS = [
      `${userId}/dni-frente.jpg`,
      `${userId}/dni-dorso.jpg`,
      `${userId}/selfie.jpg`,
    ]

    console.log('[admin] Generando signed URLs para userId:', userId)
    console.log('[admin] Paths a firmar:', PATHS)

    // Generar las 3 URLs firmadas individualmente con try/catch por foto
    const fotosResueltas: FotoState[] = await Promise.all(
      PATHS.map(async (path, i) => {
        try {
          const result = await supabase.storage
            .from('verificaciones')
            .createSignedUrl(path, 3600)

          console.log(`[admin] ${LABELS[i]} →`, result.error ? `ERROR: ${result.error.message}` : result.data?.signedUrl)

          const url = result.error ? null : (result.data?.signedUrl ?? null)
          return { label: LABELS[i], url, loading: false, error: !url }
        } catch (e) {
          console.error(`[admin] Excepción generando URL para ${path}:`, e)
          return { label: LABELS[i], url: null, loading: false, error: true }
        }
      })
    )

    setModalVerif((prev) => prev ? { ...prev, fotos: fotosResueltas } : null)
  }

  // ── Aprobar verificación ──────────────────────────────────────────────────

  async function aprobar() {
    if (!modalVerif) return
    const userId = modalVerif.userId
    setModalVerif((prev) => prev ? { ...prev, loadingAccion: true, errorMsg: null } : null)

    const { error } = await supabase
      .from('profiles')
      .update({
        identity_verified: true,
        verification_status: 'verified',
        identity_verified_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (error) {
      console.error('[admin] Error aprobando verificación:', error)
      const msg = `Error: ${error.message} (code: ${error.code})`
      setModalVerif((prev) => prev ? { ...prev, loadingAccion: false, errorMsg: msg } : null)
      return
    }

    console.log('[admin] Verificación aprobada para userId:', userId)
    setVerifs((prev) => prev.filter((v) => v.id !== userId))
    setResumen((prev) => ({ ...prev, verificacionesPendientes: Math.max(0, prev.verificacionesPendientes - 1) }))
    setModalVerif(null)
    setToast({ msg: 'Usuario verificado correctamente', tipo: 'ok' })
  }

  // ── Rechazar verificación ─────────────────────────────────────────────────

  async function rechazar() {
    if (!modalVerif) return
    const userId = modalVerif.userId
    setModalVerif((prev) => prev ? { ...prev, loadingAccion: true, errorMsg: null } : null)

    const { error } = await supabase
      .from('profiles')
      .update({
        verification_status: 'rejected',
      })
      .eq('id', userId)

    if (error) {
      console.error('[admin] Error rechazando verificación:', error)
      const msg = `Error: ${error.message} (code: ${error.code})`
      setModalVerif((prev) => prev ? { ...prev, loadingAccion: false, errorMsg: msg } : null)
      return
    }

    console.log('[admin] Verificación rechazada para userId:', userId)
    setVerifs((prev) => prev.filter((v) => v.id !== userId))
    setResumen((prev) => ({ ...prev, verificacionesPendientes: Math.max(0, prev.verificacionesPendientes - 1) }))
    setModalVerif(null)
    setToast({ msg: 'Verificación rechazada', tipo: 'ok' })
  }

  // ── Acciones propiedad ────────────────────────────────────────────────────

  async function ejecutarAccionProp(id: string, accion: 'activar' | 'pausar' | 'eliminar') {
    setLoadingProp(id)
    setConfirmar(null)
    try {
      const res = await fetch('/api/admin/propiedad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propiedadId: id, accion }),
      })
      if (res.ok) {
        if (accion === 'eliminar') {
          setPropiedades((prev) => prev.filter((p) => p.id !== id))
        } else {
          const nuevoStatus = accion === 'activar' ? 'active' : 'paused'
          setPropiedades((prev) => prev.map((p) => p.id === id ? { ...p, status: nuevoStatus } : p))
        }
      }
    } catch { /* silenciar */ }
    setLoadingProp(null)
  }

  // ── Render: cargando ──────────────────────────────────────────────────────

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
          <p className="text-sm text-slate-500">Cargando panel...</p>
        </div>
      </div>
    )
  }

  const TABS: { id: Tab; label: string; badge?: number }[] = [
    { id: 'verificaciones', label: 'Verificaciones', badge: verificaciones.length },
    { id: 'propiedades',    label: 'Propiedades',    badge: propiedades.length },
    { id: 'usuarios',       label: 'Usuarios' },
  ]

  // ── Derivados: propiedades filtradas + paginadas ───────────────────────────
  const ciudadesProp = [...new Set(propiedades.map((p) => p.city).filter((c): c is string => !!c))].sort()

  const filteredProps = propiedades.filter((p) => {
    if (busquedaProp) {
      const q = busquedaProp.toLowerCase()
      if (!p.address?.toLowerCase().includes(q) && !p.owner_email?.toLowerCase().includes(q)) return false
    }
    if (filtroStatusProp !== 'all' && p.status !== filtroStatusProp) return false
    if (filtroTipoProp   !== 'all' && p.type   !== filtroTipoProp)   return false
    if (filtroCiudadProp !== 'all' && p.city   !== filtroCiudadProp) return false
    if (filtroPrecioProp !== 'all') {
      const precio = Number(p.price_usd ?? 0)
      if (filtroPrecioProp === '300'   && precio >  300)  return false
      if (filtroPrecioProp === '500'   && precio >  500)  return false
      if (filtroPrecioProp === '800'   && precio >  800)  return false
      if (filtroPrecioProp === '1200'  && precio > 1200)  return false
      if (filtroPrecioProp === '1200+' && precio <= 1200) return false
    }
    if (filtroAmbientesProp !== 'all') {
      const r = p.rooms ?? 0
      if (filtroAmbientesProp === '1'  && r !== 1) return false
      if (filtroAmbientesProp === '2'  && r !== 2) return false
      if (filtroAmbientesProp === '3'  && r !== 3) return false
      if (filtroAmbientesProp === '4+' && r <   4) return false
    }
    return true
  })

  const PROP_PAGE_SIZE = 20
  const totalPaginasProp = Math.max(1, Math.ceil(filteredProps.length / PROP_PAGE_SIZE))
  const pagPropActual    = Math.min(paginaProp, totalPaginasProp)
  const propsPagina      = filteredProps.slice((pagPropActual - 1) * PROP_PAGE_SIZE, pagPropActual * PROP_PAGE_SIZE)
  const hayFiltrosProp   = busquedaProp || filtroStatusProp !== 'all' || filtroTipoProp !== 'all' || filtroCiudadProp !== 'all' || filtroPrecioProp !== 'all' || filtroAmbientesProp !== 'all'

  const TIPO_LABEL: Record<string, string> = {
    departamento: 'Departamento', casa: 'Casa', habitacion: 'Habitación', local: 'Local',
  }

  // ── Render: panel ─────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-white">

      {/* Header */}
      <div className="border-b border-[#CBD5E1] px-6 py-4">
        <h1 className="text-lg font-bold text-slate-900">Panel Admin</h1>
        <p className="text-xs text-slate-400">Solo acceso para {ADMIN_EMAIL}</p>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6">

        {/* Cards resumen */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Usuarios',                 value: resumen.totalUsuarios,            color: 'text-slate-900' },
            { label: 'Propiedades activas',       value: resumen.propiedadesActivas,       color: 'text-green-700' },
            { label: 'Mensajes hoy',              value: resumen.mensajesHoy,              color: 'text-blue-700'  },
            { label: 'Verificaciones pendientes', value: resumen.verificacionesPendientes, color: 'text-amber-700' },
          ].map((c) => (
            <div key={c.label} className="rounded-xl border border-[#CBD5E1] bg-white p-5">
              <p className="text-xs font-medium text-slate-500">{c.label}</p>
              <p className={`mt-2 text-4xl font-extrabold ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-[#CBD5E1]">
          <div className="flex">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={[
                  'flex shrink-0 items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium',
                  tab === t.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800',
                ].join(' ')}
              >
                {t.label}
                {t.badge != null && t.badge > 0 && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                    {t.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab: Verificaciones ─────────────────────────────────────────── */}
        {tab === 'verificaciones' && (
          <div>
            {verificaciones.length === 0 ? (
              <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-6 py-5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-green-800">No hay verificaciones pendientes</p>
                  <p className="text-xs text-green-600">Todas las solicitudes fueron procesadas.</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {verificaciones.map((v) => {
                  const display = v.email ?? v.full_name ?? v.id
                  const avatarChar = inicial(v.email ?? v.full_name)
                  return (
                    <div
                      key={v.id}
                      className="flex items-center gap-4 rounded-xl border border-[#CBD5E1] bg-white px-5 py-4"
                    >
                      {/* Avatar */}
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                        {avatarChar}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800">{display}</p>
                        {v.full_name && v.email && (
                          <p className="truncate text-xs text-slate-500">{v.full_name}</p>
                        )}
                        <p className="text-xs text-slate-400">Enviado el {fecha(v.updated_at)}</p>
                      </div>

                      {/* Badge */}
                      <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold text-amber-700">
                        Pendiente de revisión
                      </span>

                      {/* Botón */}
                      <button
                        type="button"
                        onClick={() => abrirModal(v)}
                        className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                      >
                        Revisar fotos y verificar
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Propiedades ────────────────────────────────────────────── */}
        {tab === 'propiedades' && (
          <div className="flex flex-col gap-4">

            {/* ── Filtros ── */}
            <div className="rounded-xl border border-[#CBD5E1] bg-white p-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">

                {/* Búsqueda */}
                <div className="col-span-2 sm:col-span-3 lg:col-span-2 flex flex-col gap-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Buscar</label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input
                      type="text"
                      value={busquedaProp}
                      onChange={(e) => cambiarFiltroProp(setBusquedaProp, e.target.value)}
                      placeholder="Dirección o dueño..."
                      className="w-full rounded-lg border border-[#CBD5E1] py-2 pl-8 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Estado */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Estado</label>
                  <select value={filtroStatusProp} onChange={(e) => cambiarFiltroProp(setFiltroStatusProp, e.target.value)}
                    className="rounded-lg border border-[#CBD5E1] py-2 px-3 text-sm text-slate-700 focus:border-blue-500 focus:outline-none">
                    <option value="all">Todas</option>
                    <option value="active">Activas</option>
                    <option value="paused">Pausadas</option>
                    <option value="deleted">Eliminadas</option>
                  </select>
                </div>

                {/* Tipo */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Tipo</label>
                  <select value={filtroTipoProp} onChange={(e) => cambiarFiltroProp(setFiltroTipoProp, e.target.value)}
                    className="rounded-lg border border-[#CBD5E1] py-2 px-3 text-sm text-slate-700 focus:border-blue-500 focus:outline-none">
                    <option value="all">Todos</option>
                    <option value="departamento">Departamento</option>
                    <option value="casa">Casa</option>
                    <option value="habitacion">Habitación</option>
                    <option value="local">Local comercial</option>
                  </select>
                </div>

                {/* Provincia / Ciudad */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Provincia</label>
                  <select value={filtroCiudadProp} onChange={(e) => cambiarFiltroProp(setFiltroCiudadProp, e.target.value)}
                    className="rounded-lg border border-[#CBD5E1] py-2 px-3 text-sm text-slate-700 focus:border-blue-500 focus:outline-none">
                    <option value="all">Todas</option>
                    {ciudadesProp.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Precio */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Precio máx.</label>
                  <select value={filtroPrecioProp} onChange={(e) => cambiarFiltroProp(setFiltroPrecioProp, e.target.value)}
                    className="rounded-lg border border-[#CBD5E1] py-2 px-3 text-sm text-slate-700 focus:border-blue-500 focus:outline-none">
                    <option value="all">Todos</option>
                    <option value="300">Hasta USD 300</option>
                    <option value="500">Hasta USD 500</option>
                    <option value="800">Hasta USD 800</option>
                    <option value="1200">Hasta USD 1200</option>
                    <option value="1200+">Más de USD 1200</option>
                  </select>
                </div>

                {/* Ambientes */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Ambientes</label>
                  <select value={filtroAmbientesProp} onChange={(e) => cambiarFiltroProp(setFiltroAmbientesProp, e.target.value)}
                    className="rounded-lg border border-[#CBD5E1] py-2 px-3 text-sm text-slate-700 focus:border-blue-500 focus:outline-none">
                    <option value="all">Todos</option>
                    <option value="1">1 amb.</option>
                    <option value="2">2 amb.</option>
                    <option value="3">3 amb.</option>
                    <option value="4+">4+ amb.</option>
                  </select>
                </div>
              </div>

              {/* Footer filtros: contador + limpiar */}
              <div className="mt-3 flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  Mostrando{' '}
                  <span className="font-semibold text-slate-800">{filteredProps.length}</span>
                  {' '}de{' '}
                  <span className="font-semibold text-slate-800">{propiedades.length}</span>
                  {' '}propiedades
                </p>
                {hayFiltrosProp && (
                  <button type="button" onClick={limpiarFiltrosProp}
                    className="flex items-center gap-1.5 rounded-lg border border-[#CBD5E1] px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    Limpiar filtros
                  </button>
                )}
              </div>
            </div>

            {/* ── Tabla ── */}
            {filteredProps.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#CBD5E1] py-16 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                <p className="mt-3 text-sm font-medium text-slate-500">No hay propiedades con esos filtros</p>
                <button type="button" onClick={limpiarFiltrosProp} className="mt-2 text-sm font-semibold text-blue-600 hover:opacity-70">Limpiar filtros</button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#CBD5E1]">
                <table className="w-full min-w-[860px] text-sm">
                  <thead>
                    <tr className="border-b border-[#CBD5E1] bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-3 text-left w-14">Foto</th>
                      <th className="px-4 py-3 text-left">Tipo / Dirección</th>
                      <th className="px-4 py-3 text-left">Dueño</th>
                      <th className="px-4 py-3 text-right">Precio</th>
                      <th className="px-4 py-3 text-center">Amb.</th>
                      <th className="px-4 py-3 text-left">Estado</th>
                      <th className="px-4 py-3 text-left">Publicado</th>
                      <th className="px-4 py-3 text-left">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#CBD5E1]">
                    {propsPagina.map((p) => {
                      const st = STATUS_LABEL[p.status ?? ''] ?? { label: p.status ?? '—', cls: 'bg-slate-100 text-slate-500' }
                      const thumb = p.photo_urls?.[0] ?? null
                      return (
                        <tr key={p.id} className="bg-white transition-colors hover:bg-slate-50">
                          {/* Foto */}
                          <td className="px-4 py-3">
                            {thumb ? (
                              <img src={thumb} alt="" className="h-12 w-12 rounded-lg object-cover border border-[#CBD5E1]" />
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-[#CBD5E1] bg-slate-50">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                              </div>
                            )}
                          </td>
                          {/* Tipo + Dirección */}
                          <td className="px-4 py-3">
                            <p className="text-[11px] font-semibold text-slate-400">{TIPO_LABEL[p.type ?? ''] ?? (p.type ?? '—')}</p>
                            <p className="max-w-[200px] truncate font-medium text-slate-800">{p.address ?? '—'}</p>
                            {p.city && <p className="text-[11px] text-slate-400">{p.city}</p>}
                          </td>
                          {/* Dueño */}
                          <td className="px-4 py-3">
                            <p className="max-w-[180px] truncate font-mono text-xs text-slate-600">{p.owner_email ?? '—'}</p>
                          </td>
                          {/* Precio */}
                          <td className="px-4 py-3 text-right">
                            {p.price_usd != null ? (
                              <span className="font-semibold text-blue-600">USD {Number(p.price_usd).toLocaleString('es-AR')}</span>
                            ) : <span className="text-slate-400">—</span>}
                          </td>
                          {/* Ambientes */}
                          <td className="px-4 py-3 text-center text-slate-600">
                            {p.rooms ?? <span className="text-slate-400">—</span>}
                          </td>
                          {/* Estado */}
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${st.cls}`}>{st.label}</span>
                          </td>
                          {/* Fecha */}
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{fecha(p.created_at)}</td>
                          {/* Acciones */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <a href={`/propiedades/${p.id}`} target="_blank" rel="noopener noreferrer"
                                className="rounded border border-[#CBD5E1] bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50">
                                Ver
                              </a>
                              {p.status !== 'active' && (
                                <button type="button" onClick={() => setConfirmar({ id: p.id, address: p.address, accion: 'activar' })} disabled={loadingProp === p.id}
                                  className="rounded border border-green-200 bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700 hover:bg-green-100 disabled:opacity-50">
                                  Activar
                                </button>
                              )}
                              {p.status === 'active' && (
                                <button type="button" onClick={() => setConfirmar({ id: p.id, address: p.address, accion: 'pausar' })} disabled={loadingProp === p.id}
                                  className="rounded border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-50">
                                  Pausar
                                </button>
                              )}
                              <button type="button" onClick={() => setConfirmar({ id: p.id, address: p.address, accion: 'eliminar' })} disabled={loadingProp === p.id}
                                className="rounded border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50">
                                {loadingProp === p.id ? '…' : 'Eliminar'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── Paginación ── */}
            {totalPaginasProp > 1 && (
              <div className="flex items-center justify-between border-t border-[#CBD5E1] pt-3">
                <p className="text-xs text-slate-400">
                  Página <span className="font-semibold text-slate-700">{pagPropActual}</span> de <span className="font-semibold text-slate-700">{totalPaginasProp}</span>
                </p>
                <div className="flex items-center gap-1.5">
                  <button type="button" onClick={() => setPaginaProp((n) => Math.max(1, n - 1))} disabled={pagPropActual === 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#CBD5E1] text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                  {Array.from({ length: totalPaginasProp }, (_, i) => i + 1)
                    .filter((n) => n === 1 || n === totalPaginasProp || Math.abs(n - pagPropActual) <= 1)
                    .reduce<(number | '…')[]>((acc, n, i, arr) => {
                      if (i > 0 && (n as number) - (arr[i - 1] as number) > 1) acc.push('…')
                      acc.push(n)
                      return acc
                    }, [])
                    .map((n, i) =>
                      n === '…' ? (
                        <span key={`ellipsis-${i}`} className="px-1 text-xs text-slate-400">…</span>
                      ) : (
                        <button key={n} type="button" onClick={() => setPaginaProp(n as number)}
                          className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-medium transition-colors ${n === pagPropActual ? 'border-blue-600 bg-blue-600 text-white' : 'border-[#CBD5E1] text-slate-600 hover:bg-slate-50'}`}>
                          {n}
                        </button>
                      )
                    )
                  }
                  <button type="button" onClick={() => setPaginaProp((n) => Math.min(totalPaginasProp, n + 1))} disabled={pagPropActual === totalPaginasProp}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#CBD5E1] text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ── Tab: Usuarios ───────────────────────────────────────────────── */}
        {tab === 'usuarios' && (
          <div>
            <p className="mb-3 text-sm text-slate-500">{usuarios.length} usuarios registrados</p>
            <div className="overflow-x-auto rounded-xl border border-[#CBD5E1]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#CBD5E1] bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Nombre</th>
                    <th className="px-4 py-3 text-left">Teléfono</th>
                    <th className="px-4 py-3 text-left">DNI</th>
                    <th className="px-4 py-3 text-left">Verificación</th>
                    <th className="px-4 py-3 text-center">Props</th>
                    <th className="px-4 py-3 text-left">Actividad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#CBD5E1]">
                  {usuarios.map((u) => {
                    const vs = u.verification_status ?? 'unverified'
                    const vsBadge =
                      vs === 'verified'   ? { label: 'Verificado',  cls: 'bg-green-100 text-green-700' } :
                      vs === 'pending'    ? { label: 'Pendiente',   cls: 'bg-amber-100 text-amber-700' } :
                      vs === 'rejected'   ? { label: 'Rechazado',   cls: 'bg-red-100 text-red-700'    } :
                                           { label: 'Sin verif.',   cls: 'bg-slate-100 text-slate-500' }
                    return (
                      <tr key={u.id} className="bg-white hover:bg-slate-50">
                        <td className="max-w-[200px] truncate px-4 py-3 font-mono text-xs text-slate-700">
                          {u.email ?? <span className="text-slate-400">—</span>}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {u.full_name ?? <span className="text-slate-400">—</span>}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {u.phone ?? <span className="text-slate-400">—</span>}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600">
                          {u.dni ?? <span className="text-slate-400">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${vsBadge.cls}`}>
                            {vsBadge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-semibold ${u.propiedadesCount > 0 ? 'text-blue-600' : 'text-slate-400'}`}>
                            {u.propiedadesCount}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{fecha(u.updated_at)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* ── Modal verificación ───────────────────────────────────────────────── */}
      {modalVerif && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-12"
          onClick={(e) => { if (e.target === e.currentTarget && !modalVerif.loadingAccion) setModalVerif(null) }}
        >
          <div className="w-full max-w-3xl rounded-2xl border border-[#CBD5E1] bg-white shadow-2xl">

            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-[#CBD5E1] px-6 py-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Verificación de identidad</h2>
                <p className="mt-0.5 text-xs text-slate-500">{modalVerif.displayName}</p>
              </div>
              <button
                type="button"
                onClick={() => { if (!modalVerif.loadingAccion) setModalVerif(null) }}
                disabled={modalVerif.loadingAccion}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Fotos */}
            <div className="grid grid-cols-3 gap-4 p-6">
              {modalVerif.fotos.map((foto) => (
                <div key={foto.label} className="flex flex-col gap-2">
                  <p className="text-xs font-semibold text-slate-600">{foto.label}</p>
                  {foto.loading ? (
                    <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: '1px solid #CBD5E1', background: '#F8F9FA' }}>
                      <div className="h-6 w-6 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
                    </div>
                  ) : foto.url ? (
                    <a href={foto.url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={foto.url}
                        alt={foto.label}
                        style={{ width: '100%', height: 300, objectFit: 'cover', borderRadius: 8, border: '1px solid #CBD5E1', display: 'block' }}
                      />
                    </a>
                  ) : (
                    <div style={{ height: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 8, border: '1px solid #CBD5E1', background: '#F8F9FA' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#CBD5E1' }}>
                        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                      </svg>
                      <p style={{ fontSize: 12, color: '#94A3B8' }}>Foto no disponible</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Separador */}
            <div className="border-t border-[#CBD5E1]" />

            {/* Error en pantalla */}
            {modalVerif.errorMsg && (
              <div className="mx-6 mb-1 mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-xs font-mono text-red-700">{modalVerif.errorMsg}</p>
              </div>
            )}

            {/* Fase fotos: botones aprobar/rechazar */}
            {modalVerif.fase === 'fotos' && (
              <div className="flex gap-3 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setModalVerif((prev) => prev ? { ...prev, fase: 'rechazando' } : null)}
                  disabled={modalVerif.loadingAccion}
                  className="flex-1 rounded-lg border border-red-300 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40"
                >
                  Rechazar
                </button>
                <button
                  type="button"
                  onClick={aprobar}
                  disabled={modalVerif.loadingAccion || modalVerif.fotos.some((f) => f.loading)}
                  className="flex-1 rounded-lg py-3 text-sm font-semibold text-white disabled:opacity-40"
                  style={{ backgroundColor: '#16A34A' }}
                >
                  {modalVerif.loadingAccion ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Aprobando...
                    </span>
                  ) : 'Aprobar verificación'}
                </button>
              </div>
            )}

            {/* Fase rechazando: textarea + confirmar */}
            {modalVerif.fase === 'rechazando' && (
              <div className="flex flex-col gap-4 px-6 py-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Motivo del rechazo <span className="text-slate-400 font-normal">(opcional)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={modalVerif.motivoRechazo}
                    onChange={(e) => setModalVerif((prev) => prev ? { ...prev, motivoRechazo: e.target.value } : null)}
                    placeholder="Ej: Las fotos están borrosas, el DNI no es legible..."
                    className="w-full rounded-lg border border-[#CBD5E1] bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none resize-none"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setModalVerif((prev) => prev ? { ...prev, fase: 'fotos', motivoRechazo: '' } : null)}
                    disabled={modalVerif.loadingAccion}
                    className="flex-1 rounded-lg border border-[#CBD5E1] py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                  >
                    Volver
                  </button>
                  <button
                    type="button"
                    onClick={rechazar}
                    disabled={modalVerif.loadingAccion}
                    className="flex-1 rounded-lg bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-40"
                  >
                    {modalVerif.loadingAccion ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        Rechazando...
                      </span>
                    ) : 'Confirmar rechazo'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ── Modal confirmación propiedad ─────────────────────────────────────── */}
      {confirmar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmar(null) }}
        >
          <div className="w-full max-w-sm rounded-2xl border border-[#CBD5E1] bg-white p-6 shadow-2xl">
            <h2 className="mb-2 text-base font-bold text-slate-900">
              {confirmar.accion === 'activar'  && 'Activar propiedad'}
              {confirmar.accion === 'pausar'   && 'Pausar propiedad'}
              {confirmar.accion === 'eliminar' && 'Eliminar propiedad'}
            </h2>
            <p className="mb-5 text-sm text-slate-600">
              {confirmar.accion === 'eliminar'
                ? <><strong>{confirmar.address ?? 'esta propiedad'}</strong> será eliminada. Esta acción no se puede deshacer.</>
                : <>¿Confirmar <strong>{confirmar.accion}</strong> la propiedad <strong>{confirmar.address ?? ''}</strong>?</>
              }
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setConfirmar(null)}
                className="flex-1 rounded-lg border border-[#CBD5E1] py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => ejecutarAccionProp(confirmar.id, confirmar.accion)}
                className={[
                  'flex-1 rounded-lg py-2.5 text-sm font-semibold text-white',
                  confirmar.accion === 'eliminar' ? 'bg-red-600 hover:bg-red-700'
                  : confirmar.accion === 'activar' ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-amber-500 hover:bg-amber-600',
                ].join(' ')}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ────────────────────────────────────────────────────────────── */}
      {toast && <Toast toast={toast} onClose={cerrarToast.current} />}

    </div>
  )
}
