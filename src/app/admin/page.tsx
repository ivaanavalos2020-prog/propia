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
}

interface PropiedadRow {
  id: string
  type: string | null
  address: string | null
  status: string | null
  created_at: string | null
  owner_id: string | null
}

interface UsuarioRow {
  id: string
  full_name: string | null
  email: string | null
  identity_verified: boolean | null
  updated_at: string | null
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
      supabase.from('properties').select('id, type, address, status, created_at, owner_id').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, full_name, email, identity_verified, updated_at').order('updated_at', { ascending: false }),
    ])

    const totalUsuarios      = totalUsuariosRes.status === 'fulfilled' ? (totalUsuariosRes.value.count ?? 0) : 0
    const propiedadesActivas = propActivasRes.status === 'fulfilled'   ? (propActivasRes.value.count ?? 0)  : 0
    const mensajesHoy        = mensajesHoyRes.status === 'fulfilled'   ? (mensajesHoyRes.value.count ?? 0)  : 0

    const verifsData   = verifsRes.status === 'fulfilled'  ? ((verifsRes.value.data   ?? []) as VerifRow[])    : []
    const propsData    = propsRes.status === 'fulfilled'   ? ((propsRes.value.data    ?? []) as PropiedadRow[]) : []
    const usuariosData = usuariosRes.status === 'fulfilled' ? ((usuariosRes.value.data ?? []) as UsuarioRow[])  : []

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
    const displayName = v.email ?? v.full_name ?? v.id
    const LABELS = ['DNI Frente', 'DNI Dorso', 'Selfie con DNI']

    // Inicializar modal con fotos en loading
    const fotosIniciales: FotoState[] = LABELS.map((label) => ({
      label, url: null, loading: true, error: false,
    }))
    setModalVerif({ userId: v.id, displayName, fotos: fotosIniciales, fase: 'fotos', motivoRechazo: '', loadingAccion: false })

    // Usar los paths almacenados en DB o construir desde userId como fallback
    const rawPaths = [
      v.verification_dni_front_url,
      v.verification_dni_back_url,
      v.verification_selfie_url,
    ]
    const paths = rawPaths.map((p, i) => {
      if (p) return p
      const nombres = ['dni-frente.jpg', 'dni-dorso.jpg', 'selfie.jpg']
      return `${v.id}/${nombres[i]}`
    })

    // Generar las 3 URLs firmadas de forma individual con manejo de error por foto
    const fotosResueltas: FotoState[] = await Promise.all(
      paths.map(async (path, i) => {
        try {
          const res = await fetch('/api/admin/signed-urls', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paths: [path] }),
          })
          if (!res.ok) return { label: LABELS[i], url: null, loading: false, error: true }
          const data = await res.json()
          const item = data.urls?.[0]
          if (!item || item.error || !item.url) return { label: LABELS[i], url: null, loading: false, error: true }
          return { label: LABELS[i], url: item.url as string, loading: false, error: false }
        } catch {
          return { label: LABELS[i], url: null, loading: false, error: true }
        }
      })
    )

    setModalVerif((prev) => prev ? { ...prev, fotos: fotosResueltas } : null)
  }

  // ── Aprobar verificación ──────────────────────────────────────────────────

  async function aprobar() {
    if (!modalVerif) return
    setModalVerif((prev) => prev ? { ...prev, loadingAccion: true } : null)

    try {
      const res = await fetch('/api/admin/verificacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: modalVerif.userId, accion: 'aprobar' }),
      })
      if (res.ok) {
        setVerifs((prev) => prev.filter((v) => v.id !== modalVerif.userId))
        setResumen((prev) => ({ ...prev, verificacionesPendientes: Math.max(0, prev.verificacionesPendientes - 1) }))
        setModalVerif(null)
        setToast({ msg: 'Usuario verificado correctamente', tipo: 'ok' })
      } else {
        setModalVerif((prev) => prev ? { ...prev, loadingAccion: false } : null)
        setToast({ msg: 'Error al aprobar. Intentá de nuevo.', tipo: 'error' })
      }
    } catch {
      setModalVerif((prev) => prev ? { ...prev, loadingAccion: false } : null)
      setToast({ msg: 'Error de red. Intentá de nuevo.', tipo: 'error' })
    }
  }

  // ── Rechazar verificación ─────────────────────────────────────────────────

  async function rechazar() {
    if (!modalVerif) return
    setModalVerif((prev) => prev ? { ...prev, loadingAccion: true } : null)

    try {
      const res = await fetch('/api/admin/verificacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: modalVerif.userId, accion: 'rechazar' }),
      })
      if (res.ok) {
        setVerifs((prev) => prev.filter((v) => v.id !== modalVerif.userId))
        setResumen((prev) => ({ ...prev, verificacionesPendientes: Math.max(0, prev.verificacionesPendientes - 1) }))
        setModalVerif(null)
        setToast({ msg: 'Verificación rechazada', tipo: 'ok' })
      } else {
        setModalVerif((prev) => prev ? { ...prev, loadingAccion: false } : null)
        setToast({ msg: 'Error al rechazar. Intentá de nuevo.', tipo: 'error' })
      }
    } catch {
      setModalVerif((prev) => prev ? { ...prev, loadingAccion: false } : null)
      setToast({ msg: 'Error de red. Intentá de nuevo.', tipo: 'error' })
    }
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
    { id: 'propiedades',    label: 'Propiedades' },
    { id: 'usuarios',       label: 'Usuarios' },
  ]

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
          <div>
            <p className="mb-3 text-sm text-slate-500">{propiedades.length} propiedades en total</p>
            <div className="overflow-x-auto rounded-xl border border-[#CBD5E1]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#CBD5E1] bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3 text-left">Dirección</th>
                    <th className="px-4 py-3 text-left">Tipo</th>
                    <th className="px-4 py-3 text-left">Estado</th>
                    <th className="px-4 py-3 text-left">Fecha</th>
                    <th className="px-4 py-3 text-left">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#CBD5E1]">
                  {propiedades.map((p) => {
                    const st = STATUS_LABEL[p.status ?? ''] ?? { label: p.status ?? '—', cls: 'bg-slate-100 text-slate-500' }
                    return (
                      <tr key={p.id} className="bg-white hover:bg-slate-50">
                        <td className="max-w-[220px] truncate px-4 py-3 font-medium text-slate-800">{p.address ?? '—'}</td>
                        <td className="px-4 py-3 capitalize text-slate-500">{p.type ?? '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${st.cls}`}>{st.label}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{fecha(p.created_at)}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5">
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
                              {loadingProp === p.id ? '...' : 'Eliminar'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
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
                    <th className="px-4 py-3 text-left">Última actividad</th>
                    <th className="px-4 py-3 text-left">Verificado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#CBD5E1]">
                  {usuarios.map((u) => (
                    <tr key={u.id} className="bg-white hover:bg-slate-50">
                      <td className="max-w-[220px] truncate px-4 py-3 font-mono text-xs text-slate-700">
                        {u.email ?? <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {u.full_name ?? <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{fecha(u.updated_at)}</td>
                      <td className="px-4 py-3">
                        {u.identity_verified ? (
                          <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-[11px] font-semibold text-green-700">Verificado</span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500">No verificado</span>
                        )}
                      </td>
                    </tr>
                  ))}
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
                    <div className="flex h-[300px] items-center justify-center rounded-lg border border-[#CBD5E1] bg-slate-50">
                      <div className="h-6 w-6 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
                    </div>
                  ) : foto.error || !foto.url ? (
                    <div className="flex h-[300px] flex-col items-center justify-center gap-2 rounded-lg border border-[#CBD5E1] bg-[#F8F9FA]">
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
                        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                      </svg>
                      <p className="text-xs text-slate-400">Foto no disponible</p>
                    </div>
                  ) : (
                    <a href={foto.url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={foto.url}
                        alt={foto.label}
                        className="h-[300px] w-full rounded-lg border border-[#CBD5E1] object-cover hover:opacity-90"
                        onError={(e) => {
                          const el = e.currentTarget.parentElement?.parentElement
                          if (el) el.innerHTML = '<div class="flex h-[300px] flex-col items-center justify-center gap-2 rounded-lg border border-[#CBD5E1] bg-[#F8F9FA]"><p class="text-xs text-slate-400">Foto no disponible</p></div>'
                        }}
                      />
                    </a>
                  )}
                </div>
              ))}
            </div>

            {/* Separador */}
            <div className="border-t border-[#CBD5E1]" />

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
