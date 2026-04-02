'use client'

import { useState } from 'react'

// ── Tipos ──────────────────────────────────────────────────────

interface Resumen {
  totalUsuarios: number
  propiedadesActivas: number
  mensajesHoy: number
  verificacionesPendientes: number
}

interface VerifRow {
  userId: string
  email: string
  nombre: string | null
  dniFrontPath: string | null
  dniBackPath: string | null
  selfiePath: string | null
  submittedAt: string | null
}

interface PropiedadRow {
  id: string
  address: string
  type: string
  ownerEmail: string
  ownerNombre: string | null
  status: string
  createdAt: string
  priceUsd: number
}

interface UsuarioRow {
  id: string
  email: string
  createdAt: string
  propiedadesCount: number
  nombre: string | null
  isVerified: boolean
  verificationStatus: string
}

interface Props {
  resumen: Resumen
  verificaciones: VerifRow[]
  propiedades: PropiedadRow[]
  usuarios: UsuarioRow[]
}

type Tab = 'resumen' | 'verificaciones' | 'propiedades' | 'usuarios'

// ── Helpers ───────────────────────────────────────────────────

function fecha(s: string) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const TIPO_LABEL: Record<string, string> = {
  departamento: 'Dpto.',
  casa: 'Casa',
  habitacion: 'Hab.',
  local: 'Local',
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  active:  { label: 'Activa',   cls: 'bg-green-100 text-green-700' },
  paused:  { label: 'Pausada',  cls: 'bg-amber-100 text-amber-700' },
  deleted: { label: 'Eliminada',cls: 'bg-red-100 text-red-700'    },
  draft:   { label: 'Borrador', cls: 'bg-slate-100 text-slate-600' },
}

const VERIF_LABEL: Record<string, { label: string; cls: string }> = {
  unverified: { label: 'No verificado', cls: 'bg-slate-100 text-slate-500' },
  pending:    { label: 'Pendiente',     cls: 'bg-amber-100 text-amber-700' },
  verified:   { label: 'Verificado',    cls: 'bg-green-100 text-green-700' },
  rejected:   { label: 'Rechazado',     cls: 'bg-red-100 text-red-700'    },
}

// ── Componente ─────────────────────────────────────────────────

export default function AdminClient({ resumen, verificaciones, propiedades, usuarios }: Props) {
  const [tab, setTab] = useState<Tab>('resumen')

  // Verificaciones
  const [verifList, setVerifList]       = useState<VerifRow[]>(verificaciones)
  const [modalFotos, setModalFotos]     = useState<{ email: string; urls: { path: string; url: string | null; error: string | null }[] } | null>(null)
  const [loadingFotos, setLoadingFotos] = useState<string | null>(null) // userId
  const [loadingVerif, setLoadingVerif] = useState<string | null>(null) // userId

  // Propiedades
  const [propList, setPropList]       = useState<PropiedadRow[]>(propiedades)
  const [confirmar, setConfirmar]     = useState<{ id: string; address: string; accion: 'activar' | 'pausar' | 'eliminar' } | null>(null)
  const [loadingProp, setLoadingProp] = useState<string | null>(null)

  // Usuarios
  const [busqUsuario, setBusqUsuario] = useState('')

  // ── Acciones verificación ─────────────────────────────────────

  async function verFotos(row: VerifRow) {
    setLoadingFotos(row.userId)
    const paths = [row.dniFrontPath, row.dniBackPath, row.selfiePath].filter(Boolean) as string[]
    if (paths.length === 0) {
      setModalFotos({ email: row.email, urls: [] })
      setLoadingFotos(null)
      return
    }
    const res = await fetch('/api/admin/signed-urls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paths }),
    })
    const data = await res.json()
    setModalFotos({ email: row.email, urls: data.urls ?? [] })
    setLoadingFotos(null)
  }

  async function accionVerif(userId: string, accion: 'aprobar' | 'rechazar') {
    setLoadingVerif(userId)
    const res = await fetch('/api/admin/verificacion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, accion }),
    })
    if (res.ok) {
      setVerifList((prev) => prev.filter((v) => v.userId !== userId))
    }
    setLoadingVerif(null)
  }

  // ── Acciones propiedad ────────────────────────────────────────

  async function ejecutarAccionProp(id: string, accion: 'activar' | 'pausar' | 'eliminar') {
    setLoadingProp(id)
    setConfirmar(null)
    const res = await fetch('/api/admin/propiedad', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ propiedadId: id, accion }),
    })
    if (res.ok) {
      if (accion === 'eliminar') {
        setPropList((prev) => prev.filter((p) => p.id !== id))
      } else {
        const nuevoStatus = accion === 'activar' ? 'active' : 'paused'
        setPropList((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: nuevoStatus } : p))
        )
      }
    }
    setLoadingProp(null)
  }

  // ── Filtros ───────────────────────────────────────────────────

  const usuariosFiltrados = busqUsuario.trim()
    ? usuarios.filter(
        (u) =>
          u.email.toLowerCase().includes(busqUsuario.toLowerCase()) ||
          (u.nombre ?? '').toLowerCase().includes(busqUsuario.toLowerCase())
      )
    : usuarios

  const TABS: { id: Tab; label: string; badge?: number }[] = [
    { id: 'resumen',       label: 'Resumen' },
    { id: 'verificaciones',label: 'Verificaciones', badge: verifList.length },
    { id: 'propiedades',   label: 'Propiedades' },
    { id: 'usuarios',      label: 'Usuarios' },
  ]

  // ── Render ────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-white">

      {/* Header */}
      <div className="border-b border-[#CBD5E1] px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Panel de administración</h1>
            <p className="text-xs text-slate-400">PROPIA · Solo acceso admin</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#CBD5E1]">
        <div className="mx-auto flex max-w-7xl gap-0 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={[
                'flex shrink-0 items-center gap-2 border-b-2 px-5 py-3.5 text-sm font-medium transition-colors',
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

      <div className="mx-auto max-w-7xl px-6 py-8">

        {/* ═══════ RESUMEN ═══════════════════════════════════════ */}
        {tab === 'resumen' && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Usuarios registrados', value: resumen.totalUsuarios,            color: 'text-slate-900' },
              { label: 'Propiedades activas',  value: resumen.propiedadesActivas,        color: 'text-green-700' },
              { label: 'Mensajes hoy',         value: resumen.mensajesHoy,              color: 'text-blue-700'  },
              { label: 'Verificaciones pendientes', value: resumen.verificacionesPendientes, color: 'text-amber-700' },
            ].map((c) => (
              <div key={c.label} className="rounded-xl border border-[#CBD5E1] bg-white p-5">
                <p className="text-xs font-medium text-slate-500">{c.label}</p>
                <p className={`mt-2 text-4xl font-extrabold ${c.color}`} style={{ letterSpacing: '-0.02em' }}>
                  {c.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ═══════ VERIFICACIONES ════════════════════════════════ */}
        {tab === 'verificaciones' && (
          <div>
            <h2 className="mb-4 text-sm font-semibold text-slate-700">
              Solicitudes pendientes ({verifList.length})
            </h2>

            {verifList.length === 0 ? (
              <p className="text-sm text-slate-400">No hay verificaciones pendientes.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#CBD5E1]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#CBD5E1] bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-3 text-left">Usuario</th>
                      <th className="px-4 py-3 text-left">Email</th>
                      <th className="px-4 py-3 text-left">Registro</th>
                      <th className="px-4 py-3 text-left">Fotos</th>
                      <th className="px-4 py-3 text-left">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#CBD5E1]">
                    {verifList.map((v) => (
                      <tr key={v.userId} className="bg-white hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {v.nombre ?? <span className="text-slate-400">Sin nombre</span>}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{v.email}</td>
                        <td className="px-4 py-3 text-slate-500">{fecha(v.submittedAt ?? '')}</td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => verFotos(v)}
                            disabled={loadingFotos === v.userId}
                            className="rounded-lg border border-[#CBD5E1] px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
                          >
                            {loadingFotos === v.userId ? 'Cargando...' : 'Ver fotos'}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => accionVerif(v.userId, 'aprobar')}
                              disabled={loadingVerif === v.userId}
                              className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                            >
                              {loadingVerif === v.userId ? '…' : 'Aprobar'}
                            </button>
                            <button
                              type="button"
                              onClick={() => accionVerif(v.userId, 'rechazar')}
                              disabled={loadingVerif === v.userId}
                              className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
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

        {/* ═══════ PROPIEDADES ═══════════════════════════════════ */}
        {tab === 'propiedades' && (
          <div>
            <h2 className="mb-4 text-sm font-semibold text-slate-700">
              Todas las propiedades ({propList.length})
            </h2>
            <div className="overflow-x-auto rounded-xl border border-[#CBD5E1]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#CBD5E1] bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3 text-left">Dirección</th>
                    <th className="px-4 py-3 text-left">Tipo</th>
                    <th className="px-4 py-3 text-left">Dueño</th>
                    <th className="px-4 py-3 text-left">Precio</th>
                    <th className="px-4 py-3 text-left">Estado</th>
                    <th className="px-4 py-3 text-left">Fecha</th>
                    <th className="px-4 py-3 text-left">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#CBD5E1]">
                  {propList.map((p) => {
                    const st = STATUS_LABEL[p.status] ?? { label: p.status, cls: 'bg-slate-100 text-slate-500' }
                    return (
                      <tr key={p.id} className="bg-white hover:bg-slate-50">
                        <td className="max-w-[200px] truncate px-4 py-3 font-medium text-slate-800">
                          {p.address}
                        </td>
                        <td className="px-4 py-3 text-slate-500">{TIPO_LABEL[p.type] ?? p.type}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            {p.ownerNombre && (
                              <span className="font-medium text-slate-800">{p.ownerNombre}</span>
                            )}
                            <span className="text-xs text-slate-400">{p.ownerEmail}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          USD {Number(p.priceUsd).toLocaleString('es-AR')}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${st.cls}`}>
                            {st.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{fecha(p.createdAt)}</td>
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
          </div>
        )}

        {/* ═══════ USUARIOS ══════════════════════════════════════ */}
        {tab === 'usuarios' && (
          <div>
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-sm font-semibold text-slate-700">
                Todos los usuarios ({usuariosFiltrados.length})
              </h2>
              <input
                type="text"
                value={busqUsuario}
                onChange={(e) => setBusqUsuario(e.target.value)}
                placeholder="Buscar por email o nombre..."
                className="w-64 rounded-lg border border-[#CBD5E1] bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="overflow-x-auto rounded-xl border border-[#CBD5E1]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#CBD5E1] bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Nombre</th>
                    <th className="px-4 py-3 text-left">Registro</th>
                    <th className="px-4 py-3 text-center">Propiedades</th>
                    <th className="px-4 py-3 text-left">Verificación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#CBD5E1]">
                  {usuariosFiltrados.map((u) => {
                    const vs = VERIF_LABEL[u.verificationStatus] ?? VERIF_LABEL.unverified
                    return (
                      <tr key={u.id} className="bg-white hover:bg-slate-50">
                        <td className="max-w-[220px] truncate px-4 py-3 font-mono text-xs text-slate-700">
                          {u.email}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {u.nombre ?? <span className="text-slate-400">—</span>}
                        </td>
                        <td className="px-4 py-3 text-slate-500">{fecha(u.createdAt)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-semibold ${u.propiedadesCount > 0 ? 'text-blue-600' : 'text-slate-400'}`}>
                            {u.propiedadesCount}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${vs.cls}`}>
                            {vs.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* ═══════ MODAL FOTOS ═══════════════════════════════════════ */}
      {modalFotos && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setModalFotos(null) }}
        >
          <div className="w-full max-w-2xl rounded-2xl border border-[#CBD5E1] bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Fotos de verificación</h2>
                <p className="text-xs text-slate-500">{modalFotos.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setModalFotos(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {modalFotos.urls.length === 0 ? (
              <p className="text-sm text-slate-500">No hay fotos disponibles para este usuario.</p>
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
                          <img
                            src={item.url}
                            alt={labels[i] ?? item.path}
                            className="h-32 w-full rounded-lg border border-[#CBD5E1] object-cover hover:opacity-90"
                          />
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

      {/* ═══════ MODAL CONFIRMACIÓN ════════════════════════════════ */}
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
                ? <>¿Seguro que querés eliminar <strong>{confirmar.address}</strong>? Esta acción no se puede deshacer.</>
                : <>¿Confirmar <strong>{confirmar.accion}</strong> la propiedad <strong>{confirmar.address}</strong>?</>
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
                  'flex-1 rounded-lg py-2.5 text-sm font-semibold text-white transition-colors',
                  confirmar.accion === 'eliminar'
                    ? 'bg-red-600 hover:bg-red-700'
                    : confirmar.accion === 'activar'
                      ? 'bg-green-600 hover:bg-green-700'
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
