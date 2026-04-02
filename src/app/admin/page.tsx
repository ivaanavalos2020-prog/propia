'use client'

import { useEffect, useState } from 'react'
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
  identity_verified: boolean | null
  updated_at: string | null
}

type Tab = 'verificaciones' | 'propiedades' | 'usuarios'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fecha(s: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  active:  { label: 'Activa',    cls: 'bg-green-100 text-green-700' },
  paused:  { label: 'Pausada',   cls: 'bg-amber-100 text-amber-700' },
  deleted: { label: 'Eliminada', cls: 'bg-red-100 text-red-700'    },
  draft:   { label: 'Borrador',  cls: 'bg-slate-100 text-slate-600' },
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function AdminPage() {
  const router = useRouter()
  const supabase = createClient()

  const [cargando, setCargando]   = useState(true)
  const [tab, setTab]             = useState<Tab>('verificaciones')

  const [resumen, setResumen]         = useState<Resumen>({ totalUsuarios: 0, propiedadesActivas: 0, mensajesHoy: 0, verificacionesPendientes: 0 })
  const [verificaciones, setVerifs]   = useState<VerifRow[]>([])
  const [propiedades, setPropiedades] = useState<PropiedadRow[]>([])
  const [usuarios, setUsuarios]       = useState<UsuarioRow[]>([])

  // Modal fotos
  const [modalFotos, setModalFotos]     = useState<{ nombre: string | null; urls: { path: string; url: string | null; error: string | null }[] } | null>(null)
  const [loadingFotos, setLoadingFotos] = useState<string | null>(null)

  // Acción verificación
  const [loadingVerif, setLoadingVerif] = useState<string | null>(null)

  // Acción propiedad
  const [confirmar, setConfirmar]     = useState<{ id: string; address: string | null; accion: 'activar' | 'pausar' | 'eliminar' } | null>(null)
  const [loadingProp, setLoadingProp] = useState<string | null>(null)

  // ── Carga de datos ────────────────────────────────────────────────────────

  useEffect(() => {
    async function cargar() {
      // 1. Verificar que es el admin
      let userEmail: string | null = null
      try {
        const { data: { user } } = await supabase.auth.getUser()
        userEmail = user?.email ?? null
      } catch {
        router.replace('/')
        return
      }
      if (userEmail !== ADMIN_EMAIL) {
        router.replace('/')
        return
      }

      // 2. Queries en paralelo con fallback individual
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
        supabase.from('profiles').select('id, full_name, verification_status, verification_dni_front_url, verification_dni_back_url, verification_selfie_url, updated_at').eq('verification_status', 'pending'),
        supabase.from('properties').select('id, type, address, status, created_at, owner_id').order('created_at', { ascending: false }),
        supabase.from('profiles').select('id, full_name, identity_verified, updated_at').order('updated_at', { ascending: false }),
      ])

      const totalUsuarios      = totalUsuariosRes.status === 'fulfilled' ? (totalUsuariosRes.value.count ?? 0) : 0
      const propiedadesActivas = propActivasRes.status === 'fulfilled'   ? (propActivasRes.value.count ?? 0)  : 0
      const mensajesHoy        = mensajesHoyRes.status === 'fulfilled'   ? (mensajesHoyRes.value.count ?? 0)  : 0

      const verifsData   = verifsRes.status === 'fulfilled'   ? ((verifsRes.value.data   ?? []) as VerifRow[])    : []
      const propsData    = propsRes.status === 'fulfilled'     ? ((propsRes.value.data    ?? []) as PropiedadRow[]) : []
      const usuariosData = usuariosRes.status === 'fulfilled'  ? ((usuariosRes.value.data ?? []) as UsuarioRow[])  : []

      setResumen({ totalUsuarios, propiedadesActivas, mensajesHoy, verificacionesPendientes: verifsData.length })
      setVerifs(verifsData)
      setPropiedades(propsData)
      setUsuarios(usuariosData)
      setCargando(false)
    }

    cargar()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Acción: ver fotos ─────────────────────────────────────────────────────

  async function verFotos(v: VerifRow) {
    setLoadingFotos(v.id)
    const paths = [v.verification_dni_front_url, v.verification_dni_back_url, v.verification_selfie_url].filter(Boolean) as string[]
    if (paths.length === 0) {
      setModalFotos({ nombre: v.full_name, urls: [] })
      setLoadingFotos(null)
      return
    }
    try {
      const res = await fetch('/api/admin/signed-urls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths }),
      })
      const data = await res.json()
      setModalFotos({ nombre: v.full_name, urls: data.urls ?? [] })
    } catch {
      setModalFotos({ nombre: v.full_name, urls: [] })
    }
    setLoadingFotos(null)
  }

  // ── Acción: aprobar/rechazar verificación ─────────────────────────────────

  async function accionVerif(userId: string, accion: 'aprobar' | 'rechazar') {
    setLoadingVerif(userId)
    try {
      const res = await fetch('/api/admin/verificacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, accion }),
      })
      if (res.ok) {
        setVerifs((prev) => prev.filter((v) => v.id !== userId))
        setResumen((prev) => ({ ...prev, verificacionesPendientes: prev.verificacionesPendientes - 1 }))
      }
    } catch { /* silenciar */ }
    setLoadingVerif(null)
  }

  // ── Acción: cambiar estado propiedad ──────────────────────────────────────

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

  // ── Render: panel ─────────────────────────────────────────────────────────

  const TABS: { id: Tab; label: string; badge?: number }[] = [
    { id: 'verificaciones', label: 'Verificaciones', badge: verificaciones.length },
    { id: 'propiedades',    label: 'Propiedades' },
    { id: 'usuarios',       label: 'Usuarios' },
  ]

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
        <div className="mb-5 border-b border-[#CBD5E1]">
          <div className="flex gap-0">
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
            <p className="mb-3 text-sm text-slate-500">
              {verificaciones.length === 0 ? 'No hay verificaciones pendientes.' : `${verificaciones.length} pendiente${verificaciones.length > 1 ? 's' : ''}`}
            </p>
            {verificaciones.length > 0 && (
              <div className="overflow-x-auto rounded-xl border border-[#CBD5E1]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#CBD5E1] bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-3 text-left">Nombre</th>
                      <th className="px-4 py-3 text-left">Registro</th>
                      <th className="px-4 py-3 text-left">Fotos</th>
                      <th className="px-4 py-3 text-left">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#CBD5E1]">
                    {verificaciones.map((v) => (
                      <tr key={v.id} className="bg-white hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {v.full_name ?? <span className="text-slate-400">Sin nombre</span>}
                        </td>
                        <td className="px-4 py-3 text-slate-500">{fecha(v.updated_at)}</td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => verFotos(v)}
                            disabled={loadingFotos === v.id}
                            className="rounded-lg border border-[#CBD5E1] px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                          >
                            {loadingFotos === v.id ? 'Cargando...' : 'Ver fotos'}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => accionVerif(v.id, 'aprobar')}
                              disabled={loadingVerif === v.id}
                              className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                            >
                              {loadingVerif === v.id ? '...' : 'Aprobar'}
                            </button>
                            <button
                              type="button"
                              onClick={() => accionVerif(v.id, 'rechazar')}
                              disabled={loadingVerif === v.id}
                              className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
                            >
                              Rechazar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                        <td className="max-w-[220px] truncate px-4 py-3 font-medium text-slate-800">
                          {p.address ?? '—'}
                        </td>
                        <td className="px-4 py-3 capitalize text-slate-500">{p.type ?? '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${st.cls}`}>
                            {st.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{fecha(p.created_at)}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5">
                            {p.status !== 'active' && (
                              <button
                                type="button"
                                onClick={() => setConfirmar({ id: p.id, address: p.address, accion: 'activar' })}
                                disabled={loadingProp === p.id}
                                className="rounded border border-green-200 bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700 hover:bg-green-100 disabled:opacity-50"
                              >
                                Activar
                              </button>
                            )}
                            {p.status === 'active' && (
                              <button
                                type="button"
                                onClick={() => setConfirmar({ id: p.id, address: p.address, accion: 'pausar' })}
                                disabled={loadingProp === p.id}
                                className="rounded border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                              >
                                Pausar
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setConfirmar({ id: p.id, address: p.address, accion: 'eliminar' })}
                              disabled={loadingProp === p.id}
                              className="rounded border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
                            >
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
                    <th className="px-4 py-3 text-left">Nombre</th>
                    <th className="px-4 py-3 text-left">Última actividad</th>
                    <th className="px-4 py-3 text-left">Verificado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#CBD5E1]">
                  {usuarios.map((u) => (
                    <tr key={u.id} className="bg-white hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {u.full_name ?? <span className="text-slate-400">Sin nombre</span>}
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

      {/* ── Modal fotos ─────────────────────────────────────────────────────── */}
      {modalFotos && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setModalFotos(null) }}
        >
          <div className="w-full max-w-2xl rounded-2xl border border-[#CBD5E1] bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Fotos de verificación</h2>
                <p className="text-xs text-slate-500">{modalFotos.nombre ?? '—'}</p>
              </div>
              <button type="button" onClick={() => setModalFotos(null)} className="text-slate-400 hover:text-slate-700">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            {modalFotos.urls.length === 0 ? (
              <p className="text-sm text-slate-500">No hay fotos disponibles.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-3">
                {modalFotos.urls.map((item, i) => {
                  const labels = ['DNI frente', 'DNI dorso', 'Selfie']
                  return (
                    <div key={item.path} className="flex flex-col gap-2">
                      <p className="text-xs font-semibold text-slate-600">{labels[i] ?? item.path}</p>
                      {item.error ? (
                        <div className="flex h-32 items-center justify-center rounded-lg border border-red-200 bg-red-50">
                          <p className="px-2 text-center text-xs text-red-500">{item.error}</p>
                        </div>
                      ) : item.url ? (
                        <a href={item.url} target="_blank" rel="noopener noreferrer">
                          <img src={item.url} alt={labels[i] ?? item.path} className="h-32 w-full rounded-lg border border-[#CBD5E1] object-cover hover:opacity-90" />
                        </a>
                      ) : (
                        <div className="flex h-32 items-center justify-center rounded-lg border border-[#CBD5E1] bg-slate-50">
                          <p className="text-xs text-slate-400">Sin foto</p>
                        </div>
                      )}
                    </div>
                  )
                })}
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
              <button
                type="button"
                onClick={() => setConfirmar(null)}
                className="flex-1 rounded-lg border border-[#CBD5E1] py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
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

    </div>
  )
}
