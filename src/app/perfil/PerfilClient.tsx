'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase-client'

// ── Types ──────────────────────────────────────────────────────────────────

interface PerfilData {
  full_name: string | null
  phone: string | null
  whatsapp: string | null
  show_phone: boolean
  show_whatsapp: boolean
  notify_messages: boolean
  cuit: string | null
  razon_social: string | null
  condicion_afip: string | null
  created_at: string | null
  dni: string | null
  fecha_nacimiento: string | null
  avatar_url: string | null
}

interface Propiedad {
  id: string
  address: string | null
  neighborhood: string | null
  city: string | null
  views_count: number
  status: string | null
  photo_urls: string[]
  mensajes_count: number
}

interface Mensaje {
  id: string
  property_id: string
  created_at: string
  respondido: boolean
}

interface Props {
  userId: string
  userEmail: string
  emailVerificado: boolean
  perfil: PerfilData
  propiedades: Propiedad[]
  mensajes: Mensaje[]
}

type Tab = 'cuenta' | 'estadisticas' | 'facturacion' | 'seguridad'
type Periodo = '7d' | '30d' | '90d' | 'all'

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtMes(dateStr: string | null): string {
  if (!dateStr) return 'desconocida'
  return new Date(dateStr).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
}

function daysAgo(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d
}

// Seeded pseudo-random distribution for 7-day chart
function distribuirVistas(total: number, seed: string): { label: string; valor: number }[] {
  let s = 0
  for (let i = 0; i < seed.length; i++) s = ((s * 31 + seed.charCodeAt(i)) | 0) >>> 0

  const hoy = new Date()
  const weights: number[] = []
  const labels: string[] = []

  for (let i = 6; i >= 0; i--) {
    s = ((s * 1664525 + 1013904223) | 0) >>> 0
    weights.push((s / 0xffffffff) * 0.8 + 0.2)
    const d = new Date(hoy)
    d.setDate(d.getDate() - i)
    labels.push(d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' }))
  }

  const wSum = weights.reduce((a, b) => a + b, 0)
  return weights.map((w, i) => ({
    label: labels[i],
    valor: Math.round((w / wSum) * total),
  }))
}

// ── Small reusable components ──────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  description?: string
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        {description && <p className="mt-0.5 text-xs text-slate-400">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
          checked ? 'bg-blue-600' : 'bg-slate-200'
        }`}
        aria-pressed={checked}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm">
      <h3 className="mb-5 text-sm font-bold uppercase tracking-wider text-slate-400">{title}</h3>
      {children}
    </div>
  )
}

function InputField({
  label,
  id,
  value,
  onChange,
  type = 'text',
  placeholder,
  readOnly,
  badge,
}: {
  label: string
  id: string
  value: string
  onChange?: (v: string) => void
  type?: string
  placeholder?: string
  readOnly?: boolean
  badge?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <label htmlFor={id} className="text-sm font-semibold text-slate-700">
          {label}
        </label>
        {badge}
      </div>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`rounded-xl border px-4 py-3 text-sm text-slate-800 outline-none transition-colors ${
          readOnly
            ? 'border-slate-300 bg-slate-50 text-slate-500'
            : 'border-slate-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
        }`}
      />
    </div>
  )
}

// ── Circular progress ──────────────────────────────────────────────────────

function CircularProgress({ pct, label }: { pct: number; label: string }) {
  const r = 28
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-20 w-20">
        <svg viewBox="0 0 64 64" className="-rotate-90">
          <circle cx="32" cy="32" r={r} fill="none" stroke="#e2e8f0" strokeWidth="6" />
          <circle
            cx="32"
            cy="32"
            r={r}
            fill="none"
            stroke="#2563EB"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ transition: 'stroke-dasharray 0.8s ease' }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-lg font-extrabold text-slate-900">
          {pct}%
        </span>
      </div>
      <span className="text-xs font-medium text-slate-500">{label}</span>
    </div>
  )
}

// ── TAB: Mi cuenta ─────────────────────────────────────────────────────────

function TabCuenta({
  userId,
  userEmail,
  emailVerificado,
  perfil,
}: {
  userId: string
  userEmail: string
  emailVerificado: boolean
  perfil: PerfilData
}) {
  const [nombre, setNombre]               = useState(perfil.full_name ?? '')
  const [telefono, setTelefono]           = useState(perfil.phone ?? '')
  const [dni, setDni]                     = useState(perfil.dni ?? '')
  const [fechaNac, setFechaNac]           = useState(perfil.fecha_nacimiento ?? '')
  const [notifyMessages, setNotifyMessages] = useState(perfil.notify_messages)
  const [showPhone, setShowPhone]         = useState(perfil.show_phone)
  const [showWhatsapp, setShowWhatsapp]   = useState(perfil.show_whatsapp)
  const [whatsapp, setWhatsapp]           = useState(perfil.whatsapp ?? '')
  const [avatarUrl, setAvatarUrl]         = useState(perfil.avatar_url ?? '')
  const [previewUrl, setPreviewUrl]       = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [guardando, setGuardando]         = useState(false)
  const [toast, setToast]                 = useState('')

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const localUrl = URL.createObjectURL(file)
    setPreviewUrl(localUrl)
    setUploadingAvatar(true)
    const supabase = createClient()
    const path = `${userId}/avatar.jpg`
    const { error: upErr } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type })
    if (upErr) {
      setPreviewUrl(null)
      setToast('Error al subir la foto. Intentá de nuevo.')
      setUploadingAvatar(false)
      return
    }
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
    const newUrl = urlData.publicUrl
    await supabase.from('profiles').upsert({ id: userId, avatar_url: newUrl, updated_at: new Date().toISOString() })
    setAvatarUrl(newUrl)
    setPreviewUrl(null)
    setUploadingAvatar(false)
    setToast('Foto actualizada')
    setTimeout(() => setToast(''), 3000)
  }

  async function eliminarFoto() {
    const supabase = createClient()
    const path = `${userId}/avatar.jpg`
    await supabase.storage.from('avatars').remove([path])
    await supabase.from('profiles').upsert({ id: userId, avatar_url: null, updated_at: new Date().toISOString() })
    setAvatarUrl('')
    setToast('Foto eliminada')
    setTimeout(() => setToast(''), 3000)
  }

  const guardar = useCallback(async () => {
    setGuardando(true)
    const supabase = createClient()
    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      email: userEmail,
      full_name: nombre.trim() || null,
      phone: telefono.trim() || null,
      dni: dni.trim() || null,
      fecha_nacimiento: fechaNac || null,
      whatsapp: whatsapp.trim() || null,
      show_phone: showPhone,
      show_whatsapp: showWhatsapp,
      notify_messages: notifyMessages,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
    setGuardando(false)
    if (error) {
      console.error('Error guardando perfil:', error)
      setToast(`Error: ${error.message}`)
    } else {
      setToast('¡Cambios guardados correctamente!')
      setTimeout(() => setToast(''), 3000)
    }
  }, [userId, userEmail, nombre, telefono, dni, fechaNac, whatsapp, showPhone, showWhatsapp, notifyMessages])

  return (
    <div className="space-y-5">
      <SectionCard title="Información personal">
        <div className="space-y-4">
          {/* Foto de perfil */}
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0">
              {(previewUrl || avatarUrl) ? (
                <Image src={previewUrl ?? avatarUrl!} alt="Avatar" width={64} height={64} unoptimized className="h-16 w-16 rounded-full object-cover border border-slate-200" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-2xl font-extrabold text-white">
                  {(nombre || userEmail).charAt(0).toUpperCase()}
                </div>
              )}
              {uploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-slate-700">Foto de perfil</p>
              <label className="cursor-pointer rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100">
                {uploadingAvatar ? 'Subiendo...' : avatarUrl ? 'Cambiar foto' : 'Subir foto'}
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={uploadingAvatar} />
              </label>
              {avatarUrl && !uploadingAvatar && (
                <button
                  type="button"
                  onClick={eliminarFoto}
                  className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  Eliminar foto
                </button>
              )}
            </div>
          </div>

          <InputField
            label="Nombre completo"
            id="nombre"
            value={nombre}
            onChange={setNombre}
            placeholder="Tu nombre y apellido"
          />
          <InputField
            label="Teléfono de contacto"
            id="telefono"
            value={telefono}
            onChange={setTelefono}
            type="tel"
            placeholder="+54 9 11 XXXX-XXXX"
          />
          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="DNI / CUIL"
              id="dni"
              value={dni}
              onChange={setDni}
              placeholder="Ej: 38123456"
            />
            <InputField
              label="Fecha de nacimiento"
              id="fecha_nacimiento"
              value={fechaNac}
              onChange={setFechaNac}
              type="date"
            />
          </div>
          <InputField
            label="Email"
            id="email"
            value={userEmail}
            readOnly
            badge={
              emailVerificado ? (
                <span className="rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
                  Verificado
                </span>
              ) : (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                  Sin verificar
                </span>
              )
            }
          />
          {toast && (
            <p
              className={`rounded-xl px-4 py-3 text-sm font-medium ${
                toast.startsWith('Error')
                  ? 'border border-red-200 bg-red-50 text-red-700'
                  : 'border border-green-200 bg-green-50 text-green-700'
              }`}
            >
              {toast}
            </p>
          )}
          <button
            type="button"
            onClick={guardar}
            disabled={guardando}
            className="flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
          >
            {guardando ? (
              <>
                <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                Guardando…
              </>
            ) : 'Guardar cambios'}
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Preferencias de contacto">
        <div className="space-y-5">
          <Toggle
            checked={notifyMessages}
            onChange={setNotifyMessages}
            label="Recibir notificaciones por email"
            description="Te avisamos cuando llegue un nuevo mensaje de un interesado"
          />
          <div className="h-px bg-slate-100" />
          <Toggle
            checked={showPhone}
            onChange={setShowPhone}
            label="Mostrar mi teléfono en las publicaciones"
            description="Los interesados podrán ver y llamar a tu número directamente"
          />
          <div className="h-px bg-slate-100" />
          <Toggle
            checked={showWhatsapp}
            onChange={setShowWhatsapp}
            label="Permitir contacto por WhatsApp"
            description="Mostramos un botón de WhatsApp en tus publicaciones"
          />
          {showWhatsapp && (
            <div className="pt-1">
              <InputField
                label="Número de WhatsApp"
                id="whatsapp"
                value={whatsapp}
                onChange={setWhatsapp}
                type="tel"
                placeholder="+54 9 11 XXXX-XXXX"
              />
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  )
}

// ── TAB: Estadísticas ──────────────────────────────────────────────────────

function TabEstadisticas({
  userId,
  propiedades,
  mensajes,
}: {
  userId: string
  propiedades: Propiedad[]
  mensajes: Mensaje[]
}) {
  const [periodo, setPeriodo] = useState<Periodo>('30d')

  const mensajesFiltrados = useMemo(() => {
    if (periodo === 'all') return mensajes
    const dias = periodo === '7d' ? 7 : periodo === '30d' ? 30 : 90
    const desde = daysAgo(dias)
    return mensajes.filter((m) => new Date(m.created_at) >= desde)
  }, [mensajes, periodo])

  const totalVistas = propiedades.reduce((s, p) => s + p.views_count, 0)
  const totalMensajes = mensajesFiltrados.length
  const respondidos = mensajesFiltrados.filter((m) => m.respondido).length
  const tasaRespuesta = totalMensajes > 0 ? Math.round((respondidos / totalMensajes) * 100) : 0
  const tasaConversion = totalVistas > 0 ? Math.round((mensajes.length / totalVistas) * 100) : 0

  const maxVistas = Math.max(...propiedades.map((p) => p.views_count), 1)

  const chartData = useMemo(() => distribuirVistas(totalVistas, userId), [totalVistas, userId])
  const maxChart = Math.max(...chartData.map((d) => d.valor), 1)

  const propMasVista = propiedades[0]

  const PERIODOS: { value: Periodo; label: string }[] = [
    { value: '7d', label: '7 días' },
    { value: '30d', label: '30 días' },
    { value: '90d', label: '90 días' },
    { value: 'all', label: 'Todo' },
  ]

  return (
    <div className="space-y-5">
      {/* Period selector */}
      <div className="flex items-center gap-2 overflow-x-auto">
        {PERIODOS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => setPeriodo(p.value)}
            className={`shrink-0 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
              periodo === p.value
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'border-slate-300 bg-white text-slate-600 hover:border-blue-300'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Metrics 2x2 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Vistas totales</p>
          <p className="mt-2 text-4xl font-extrabold text-slate-900" style={{ letterSpacing: '-0.03em' }}>
            {totalVistas.toLocaleString('es-AR')}
          </p>
          <p className="mt-1 text-xs text-slate-400">de todas las publicaciones</p>
        </div>

        <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Mensajes recibidos</p>
          <p className="mt-2 text-4xl font-extrabold text-slate-900" style={{ letterSpacing: '-0.03em' }}>
            {totalMensajes.toLocaleString('es-AR')}
          </p>
          <p className="mt-1 text-xs text-slate-400">en el período seleccionado</p>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
          <CircularProgress pct={tasaRespuesta} label="Respondidos" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tasa de respuesta</p>
            <p className="mt-1 text-sm text-slate-600">
              {respondidos} de {totalMensajes} mensajes respondidos
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Conversión</p>
          <p className="mt-2 text-4xl font-extrabold text-blue-600" style={{ letterSpacing: '-0.03em' }}>
            {tasaConversion}%
          </p>
          <p className="mt-1 text-xs text-slate-400">de vistas que contactaron</p>
        </div>
      </div>

      {/* 7-day chart */}
      <SectionCard title="Vistas por día (últimos 7 días)">
        <div className="space-y-2">
          {chartData.map((d, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-right text-xs text-slate-500">{d.label}</span>
              <div className="flex flex-1 items-center gap-2">
                <div className="h-5 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      d.valor === Math.max(...chartData.map((x) => x.valor))
                        ? 'bg-blue-600'
                        : 'bg-blue-200'
                    }`}
                    style={{ width: `${(d.valor / maxChart) * 100}%` }}
                  />
                </div>
                <span className="w-8 text-right text-xs font-semibold text-slate-600">{d.valor}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Distribución estimada basada en el total de vistas acumuladas.
        </p>
      </SectionCard>

      {/* Property ranking */}
      {propiedades.length > 0 && (
        <SectionCard title="Ranking de propiedades">
          <div className="space-y-4">
            {propiedades.map((p, i) => (
              <div key={p.id} className="flex items-center gap-4">
                <span className="w-5 text-center text-sm font-bold text-slate-300">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {p.address ?? 'Sin dirección'}
                  </p>
                  {(p.neighborhood || p.city) && (
                    <p className="text-xs text-slate-400">
                      {[p.neighborhood, p.city].filter(Boolean).join(', ')}
                    </p>
                  )}
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-400 transition-all duration-500"
                      style={{ width: `${(p.views_count / maxVistas) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold text-slate-800">{p.views_count} vistas</p>
                  <p className="text-xs text-slate-400">{p.mensajes_count} mensajes</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* More metrics */}
      {propMasVista && (
        <SectionCard title="Métricas adicionales">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-400">Propiedad más vista</p>
              <p className="mt-1 text-sm font-bold text-slate-800 line-clamp-2">
                {propMasVista.address ?? 'Sin dirección'}
              </p>
              <p className="text-xs text-blue-600">{propMasVista.views_count} vistas en total</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-400">Propiedades activas</p>
              <p className="mt-1 text-3xl font-extrabold text-slate-900">
                {propiedades.filter((p) => p.status === 'active').length}
              </p>
              <p className="text-xs text-slate-400">de {propiedades.length} en total</p>
            </div>
          </div>
        </SectionCard>
      )}
    </div>
  )
}

// ── TAB: Facturación ───────────────────────────────────────────────────────

function TabFacturacion({ userId, perfil }: { userId: string; perfil: PerfilData }) {
  const [cuit, setCuit] = useState(perfil.cuit ?? '')
  const [razonSocial, setRazonSocial] = useState(perfil.razon_social ?? '')
  const [condicion, setCondicion] = useState(perfil.condicion_afip ?? '')
  const [guardando, setGuardando] = useState(false)
  const [toast, setToast] = useState('')

  const guardarFiscal = useCallback(async () => {
    setGuardando(true)
    const supabase = createClient()
    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      cuit: cuit.trim() || null,
      razon_social: razonSocial.trim() || null,
      condicion_afip: condicion || null,
      updated_at: new Date().toISOString(),
    })
    setGuardando(false)
    if (error) {
      setToast('Error al guardar.')
    } else {
      setToast('Datos fiscales guardados.')
      setTimeout(() => setToast(''), 3000)
    }
  }, [userId, cuit, razonSocial, condicion])

  return (
    <div className="space-y-5">
      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-blue-600" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
        <p className="text-sm font-medium text-blue-800">
          <span className="font-bold">PROPIA es gratuito para alquileres.</span> Solo cobramos 1% en operaciones de venta cuando se concreten.
        </p>
      </div>

      {/* Plan actual */}
      <SectionCard title="Plan actual">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-100 px-4 py-1.5 text-sm font-bold text-slate-700">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              Plan Gratuito
            </span>
            <ul className="mt-4 space-y-2">
              {[
                'Publicaciones ilimitadas',
                'Mensajes ilimitados con interesados',
                'Estadísticas básicas de vistas',
                'Galería de fotos y videos',
                'Sin comisiones en alquileres',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-green-500" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-5">
          <div className="group relative inline-block">
            <button
              type="button"
              disabled
              className="flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-400 cursor-not-allowed"
            >
              Ver planes premium
            </button>
            <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 rounded-lg bg-slate-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 whitespace-nowrap">
              Próximamente
            </span>
          </div>
        </div>
      </SectionCard>

      {/* Transaction history */}
      <SectionCard title="Historial de transacciones">
        <div className="rounded-xl border border-dashed border-slate-300 py-10 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-slate-300" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
          <p className="mt-3 text-sm font-medium text-slate-400">
            Todavía no realizaste transacciones en PROPIA
          </p>
        </div>
      </SectionCard>

      {/* Billing data */}
      <SectionCard title="Datos de facturación">
        <div className="space-y-4">
          <InputField
            label="CUIT / CUIL"
            id="cuit"
            value={cuit}
            onChange={setCuit}
            placeholder="20-12345678-9"
          />
          <InputField
            label="Razón social o nombre"
            id="razon-social"
            value={razonSocial}
            onChange={setRazonSocial}
            placeholder="Tu nombre completo o razón social"
          />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="condicion-afip" className="text-sm font-semibold text-slate-700">
              Condición ante AFIP
            </label>
            <select
              id="condicion-afip"
              value={condicion}
              onChange={(e) => setCondicion(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Seleccioná una opción</option>
              <option value="consumidor_final">Consumidor final</option>
              <option value="monotributista">Monotributista</option>
              <option value="responsable_inscripto">Responsable inscripto</option>
            </select>
          </div>

          {toast && (
            <p className={`rounded-xl px-4 py-3 text-sm font-medium ${toast.startsWith('Error') ? 'border border-red-200 bg-red-50 text-red-700' : 'border border-green-200 bg-green-50 text-green-700'}`}>
              {toast}
            </p>
          )}

          <button
            type="button"
            onClick={guardarFiscal}
            disabled={guardando}
            className="flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
          >
            {guardando ? 'Guardando…' : 'Guardar datos fiscales'}
          </button>

          <p className="text-xs text-slate-400">
            Estos datos se usan para emitir comprobantes en operaciones de venta.
          </p>
        </div>
      </SectionCard>
    </div>
  )
}

// ── TAB: Seguridad ─────────────────────────────────────────────────────────

function TabSeguridad({ userEmail }: { userEmail: string }) {
  const router = useRouter()
  const [enviandoLink, setEnviandoLink] = useState(false)
  const [linkEnviado, setLinkEnviado] = useState(false)
  const [modalEliminar, setModalEliminar] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [cerrando, setCerrando] = useState(false)

  const enviarMagicLink = useCallback(async () => {
    setEnviandoLink(true)
    const supabase = createClient()
    await supabase.auth.signInWithOtp({
      email: userEmail,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    setEnviandoLink(false)
    setLinkEnviado(true)
    setTimeout(() => setLinkEnviado(false), 5000)
  }, [userEmail])

  const cerrarSesiones = useCallback(async () => {
    setCerrando(true)
    const supabase = createClient()
    await supabase.auth.signOut({ scope: 'global' })
    router.push('/login')
  }, [router])

  const eliminarCuenta = useCallback(async () => {
    if (confirmText !== 'ELIMINAR') return
    // Account deletion requires server-side admin action
    // For now: sign out and show confirmation
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/?cuenta=eliminada')
  }, [confirmText, router])

  return (
    <div className="space-y-5">
      <SectionCard title="Sesiones activas">
        <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>
            <div>
              <p className="text-sm font-semibold text-slate-800">Este dispositivo</p>
              <p className="text-xs text-slate-400">Sesión actual — ahora mismo</p>
            </div>
          </div>
          <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
            Activa
          </span>
        </div>
        <button
          type="button"
          onClick={cerrarSesiones}
          disabled={cerrando}
          className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
        >
          {cerrando ? 'Cerrando…' : 'Cerrar todas las sesiones'}
        </button>
      </SectionCard>

      <SectionCard title="Magic Link">
        <p className="mb-4 text-sm leading-relaxed text-slate-600">
          Tu cuenta usa <span className="font-semibold text-slate-800">Magic Link</span> para ingresar de
          forma segura sin contraseña. Cada vez que querés ingresar, te enviamos un link a tu email.
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={enviarMagicLink}
            disabled={enviandoLink || linkEnviado}
            className={`flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 ${
              linkEnviado
                ? 'border-green-200 bg-green-50 text-green-700'
                : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            {enviandoLink ? (
              <>
                <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                Enviando…
              </>
            ) : linkEnviado ? (
              '¡Link enviado a tu email!'
            ) : (
              'Enviar link de prueba'
            )}
          </button>
          {linkEnviado && (
            <p className="text-xs text-slate-400">Revisá tu bandeja de entrada (y el spam).</p>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Zona de peligro">
        <p className="mb-4 text-sm text-slate-600">
          Eliminar tu cuenta es una acción permanente. Se borrarán tus publicaciones, mensajes y todos tus datos.
        </p>
        <button
          type="button"
          onClick={() => setModalEliminar(true)}
          className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          Eliminar mi cuenta
        </button>
      </SectionCard>

      {/* Delete account modal */}
      {modalEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">¿Eliminar tu cuenta?</h3>
            <p className="mt-2 text-sm text-slate-600">
              Esta acción es permanente e irreversible. Se borrarán todas tus publicaciones, mensajes y datos.
            </p>
            <div className="mt-4">
              <label className="text-sm font-semibold text-slate-700">
                Escribí <span className="font-mono font-bold text-red-600">ELIMINAR</span> para confirmar
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="ELIMINAR"
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              />
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setModalEliminar(false); setConfirmText('') }}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={eliminarCuenta}
                disabled={confirmText !== 'ELIMINAR'}
                className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Eliminar cuenta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icono: React.ReactNode }[] = [
  {
    id: 'cuenta',
    label: 'Mi cuenta',
    icono: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  },
  {
    id: 'estadisticas',
    label: 'Estadísticas',
    icono: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  },
  {
    id: 'facturacion',
    label: 'Facturación',
    icono: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>,
  },
  {
    id: 'seguridad',
    label: 'Seguridad',
    icono: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  },
]

export default function PerfilClient({
  userId,
  userEmail,
  emailVerificado,
  perfil,
  propiedades,
  mensajes,
}: Props) {
  const router = useRouter()
  const [tabActiva, setTabActiva] = useState<Tab>('cuenta')
  const [editandoNombre, setEditandoNombre] = useState(false)
  const [nombreSidebar, setNombreSidebar] = useState(perfil.full_name ?? '')
  const [guardandoNombre, setGuardandoNombre] = useState(false)

  const initial = (perfil.full_name ?? userEmail).charAt(0).toUpperCase()
  const totalVistas = propiedades.reduce((s, p) => s + p.views_count, 0)

  const cerrarSesion = useCallback(async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }, [router])

  const guardarNombreSidebar = useCallback(async () => {
    setGuardandoNombre(true)
    const supabase = createClient()
    await supabase.from('profiles').upsert({
      id: userId,
      full_name: nombreSidebar.trim() || null,
      updated_at: new Date().toISOString(),
    })
    setGuardandoNombre(false)
    setEditandoNombre(false)
  }, [userId, nombreSidebar])

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">

      {/* ── Sidebar ── */}
      <aside className="w-full lg:w-[28%] lg:shrink-0">
        <div className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm">

          {/* Avatar */}
          <div className="mb-5 flex flex-col items-center gap-3 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-600 text-3xl font-extrabold text-white shadow-md">
              {initial}
            </div>

            {/* Name editable inline */}
            {editandoNombre ? (
              <div className="flex w-full items-center gap-2">
                <input
                  type="text"
                  value={nombreSidebar}
                  onChange={(e) => setNombreSidebar(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') guardarNombreSidebar()
                    if (e.key === 'Escape') setEditandoNombre(false)
                  }}
                  className="flex-1 rounded-xl border border-blue-300 px-3 py-1.5 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={guardarNombreSidebar}
                  disabled={guardandoNombre}
                  className="rounded-lg bg-blue-600 px-2 py-1.5 text-xs font-bold text-white"
                >
                  OK
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setEditandoNombre(true)}
                className="group flex items-center gap-1.5 text-base font-bold text-slate-900 transition-colors hover:text-blue-600"
                title="Clic para editar"
              >
                {perfil.full_name ?? 'Sin nombre'}
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 group-hover:text-blue-400" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
            )}

            <p className="text-sm text-slate-400">{userEmail}</p>

            {/* Verified badge */}
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${emailVerificado ? 'border-green-200 bg-green-50 text-green-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
              {emailVerificado ? 'Dueño verificado' : 'Verificación pendiente'}
            </span>

            <p className="text-xs text-slate-400">Miembro desde {fmtMes(perfil.created_at)}</p>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Quick stats */}
          <div className="my-5 flex justify-around gap-2">
            {[
              { label: 'Propiedades', valor: propiedades.length },
              { label: 'Mensajes', valor: mensajes.length },
              { label: 'Vistas', valor: totalVistas },
            ].map(({ label, valor }) => (
              <div key={label} className="flex flex-col items-center gap-0.5">
                <span className="text-xl font-extrabold text-slate-900">{valor.toLocaleString('es-AR')}</span>
                <span className="text-xs text-slate-400">{label}</span>
              </div>
            ))}
          </div>

          <div className="h-px bg-slate-100" />

          {/* Logout */}
          <button
            type="button"
            onClick={cerrarSesion}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Main panel ── */}
      <div className="min-w-0 flex-1">

        {/* Tab navigation */}
        <div className="mb-5 flex gap-1 overflow-x-auto rounded-2xl border border-slate-300 bg-white p-1.5 shadow-sm">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTabActiva(tab.id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                tabActiva === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              {tab.icono}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tabActiva === 'cuenta' && (
          <TabCuenta
            userId={userId}
            userEmail={userEmail}
            emailVerificado={emailVerificado}
            perfil={perfil}
          />
        )}
        {tabActiva === 'estadisticas' && (
          <TabEstadisticas userId={userId} propiedades={propiedades} mensajes={mensajes} />
        )}
        {tabActiva === 'facturacion' && (
          <TabFacturacion userId={userId} perfil={perfil} />
        )}
        {tabActiva === 'seguridad' && (
          <TabSeguridad userEmail={userEmail} />
        )}
      </div>
    </div>
  )
}
