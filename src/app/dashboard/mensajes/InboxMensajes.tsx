'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'

// ── Tipos ─────────────────────────────────────────────────────

export type RespuestaType = {
  id: string
  mensaje_id: string
  contenido: string
  autor: 'dueno' | 'inquilino'
  created_at: string
}

export type MensajeType = {
  id: string
  sender_name: string
  sender_email: string
  message: string
  created_at: string
  property_id: string
  address: string
  property_type: string
  price_usd: number
  photo_url: string | null
  leido: boolean
}

type Toast = { id: string; text: string }

const TIPO_LABEL: Record<string, string> = {
  departamento: 'Departamento',
  casa:         'Casa',
  habitacion:   'Habitación',
  local:        'Local comercial',
}

// ── Helpers ───────────────────────────────────────────────────

function fechaRelativa(dateStr: string): string {
  const diffMs  = Date.now() - new Date(dateStr).getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  const diffH   = Math.floor(diffMs / 3_600_000)
  const diffD   = Math.floor(diffMs / 86_400_000)
  if (diffMin < 1)  return 'ahora'
  if (diffMin < 60) return `hace ${diffMin} min`
  if (diffH < 24)   return `hace ${diffH}h`
  if (diffD === 1)  return 'ayer'
  if (diffD < 7)    return new Date(dateStr).toLocaleDateString('es-AR', { weekday: 'long' })
  return new Date(dateStr).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

function fechaChat(dateStr: string): string {
  const fecha = new Date(dateStr)
  const hora  = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  const hoy   = new Date()
  if (fecha.toDateString() === hoy.toDateString()) return `hoy a las ${hora}`
  const ayer = new Date(hoy)
  ayer.setDate(hoy.getDate() - 1)
  if (fecha.toDateString() === ayer.toDateString()) return `ayer a las ${hora}`
  return `${fecha.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })} a las ${hora}`
}

function avatarColor(name: string): string {
  const palettes = [
    'bg-blue-100 text-blue-700',
    'bg-violet-100 text-violet-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
    'bg-teal-100 text-teal-700',
    'bg-sky-100 text-sky-700',
  ]
  return palettes[name.charCodeAt(0) % palettes.length]
}

function playNotificationSound() {
  try {
    const ctx = new AudioContext()
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.12)
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.4)
  } catch {
    // AudioContext no disponible
  }
}

function IconSobre({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

// ── Componente principal ──────────────────────────────────────

interface Props {
  mensajes: MensajeType[]
  respuestasPorMensaje: Record<string, RespuestaType[]>
  ownerEmail: string
  propertyIds: string[]
}

export default function InboxMensajes({
  mensajes: initial,
  respuestasPorMensaje: initialRespuestas,
  ownerEmail,
  propertyIds,
}: Props) {
  const [mensajes,   setMensajes]   = useState<MensajeType[]>(initial)
  const [respuestas, setRespuestas] = useState<Record<string, RespuestaType[]>>(initialRespuestas)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [vistaMovil, setVistaMovil] = useState<'lista' | 'detalle'>('lista')
  const [texto,    setTexto]    = useState('')
  const [enviando, setEnviando] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [toasts,   setToasts]   = useState<Toast[]>([])
  const [, setTick] = useState(0)
  const chatRef = useRef<HTMLDivElement>(null)

  const selected    = mensajes.find((m) => m.id === selectedId) ?? null
  const hiloActual  = selectedId ? (respuestas[selectedId] ?? []) : []
  const ownerInitial = ownerEmail[0]?.toUpperCase() ?? 'V'

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 60_000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [selectedId, respuestas, mensajes])

  useEffect(() => {
    if (propertyIds.length === 0) return
    const supabase = createClient()

    type PropRow = { address: string; type: string; price_usd: number; photo_urls: string[] | null } | null

    const channel = supabase
      .channel('inbox-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'mensajes' },
        async (payload) => {
          const raw = payload.new as { id: string; property_id: string }
          if (!propertyIds.includes(raw.property_id)) return

          const { data } = await supabase
            .from('mensajes')
            .select('id, sender_name, sender_email, message, created_at, property_id, leido, properties(address, type, price_usd, photo_urls)')
            .eq('id', raw.id)
            .single()

          if (!data) return

          const prop = data.properties as PropRow
          const newMsg: MensajeType = {
            id:            data.id,
            sender_name:   data.sender_name,
            sender_email:  data.sender_email,
            message:       data.message,
            created_at:    data.created_at,
            property_id:   data.property_id,
            leido:         data.leido ?? false,
            address:       prop?.address ?? '',
            property_type: prop?.type ?? '',
            price_usd:     prop?.price_usd ?? 0,
            photo_url:     prop?.photo_urls?.[0] ?? null,
          }

          setMensajes((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev
            return [newMsg, ...prev]
          })

          addToast(`Nuevo mensaje de ${newMsg.sender_name}${newMsg.address ? ` sobre ${newMsg.address}` : ''}`)
          playNotificationSound()
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyIds.join(',')])

  function addToast(text: string) {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, text }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }

  async function seleccionar(id: string) {
    setSelectedId(id)
    setVistaMovil('detalle')
    setTexto('')
    setErrorMsg(null)

    setMensajes((prev) =>
      prev.map((m) => (m.id === id ? { ...m, leido: true } : m)),
    )

    createClient()
      .from('mensajes')
      .update({ leido: true, leido_en: new Date().toISOString() })
      .eq('id', id)
      .eq('leido', false)
      .then(() => {})
  }

  async function enviar() {
    const contenido = texto.trim()
    if (!selected || !contenido) return
    setEnviando(true)
    setErrorMsg(null)

    const { data, error } = await createClient()
      .from('respuestas_mensajes')
      .insert({ mensaje_id: selected.id, contenido, autor: 'dueno' })
      .select('id, mensaje_id, contenido, autor, created_at')
      .single()

    if (error || !data) {
      setErrorMsg('No se pudo enviar. Intentá de nuevo.')
      setEnviando(false)
      return
    }

    setRespuestas((prev) => ({
      ...prev,
      [selected.id]: [...(prev[selected.id] ?? []), data as RespuestaType],
    }))
    setTexto('')
    setEnviando(false)
  }

  return (
    <>
      {/* ── Toasts ───────────────────────────────────────────── */}
      <div className="fixed right-4 top-20 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg"
            style={{ animation: 'toast-in 0.25s ease' }}
          >
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>
            <p className="max-w-[260px] text-sm text-slate-700">{t.text}</p>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="flex flex-1 overflow-hidden">

        {/* ══ PANEL IZQUIERDO ════════════════════════════════════ */}
        <aside
          className={[
            'flex w-full flex-col border-r border-slate-200 bg-white',
            'md:flex md:w-80 lg:w-96',
            vistaMovil === 'detalle' ? 'hidden md:flex' : 'flex',
          ].join(' ')}
        >
          <div className="shrink-0 border-b border-slate-200 px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-sm font-semibold text-slate-900">Mensajes recibidos</h1>
                <p className="mt-0.5 text-xs text-slate-400">
                  {mensajes.length} conversación{mensajes.length !== 1 ? 'es' : ''}
                </p>
              </div>
              <Link href="/dashboard" className="text-xs text-slate-400 transition-colors hover:text-slate-700">
                ← Volver
              </Link>
            </div>
          </div>

          {mensajes.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <IconSobre className="h-5 w-5 text-slate-400" />
              </div>
              <p className="text-sm text-slate-500">No recibiste mensajes todavía</p>
              <p className="text-xs text-slate-400">Aparecerán aquí cuando alguien te contacte.</p>
            </div>
          ) : (
            <ul className="flex-1 divide-y divide-slate-100 overflow-y-auto">
              {mensajes.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => seleccionar(m.id)}
                    className={[
                      'w-full px-5 py-4 text-left transition-colors hover:bg-slate-50',
                      m.id === selectedId ? 'bg-blue-50' : '',
                    ].join(' ')}
                  >
                    <div className="flex items-start gap-3">
                      <div className={['flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold', avatarColor(m.sender_name)].join(' ')}>
                        {m.sender_name[0]?.toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="truncate text-sm font-semibold text-slate-900">{m.sender_name}</span>
                            {!m.leido && (
                              <span className="h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                            )}
                          </div>
                          <span className="shrink-0 text-xs text-slate-400">{fechaRelativa(m.created_at)}</span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-slate-400">{m.address || '—'}</p>
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {m.message.length > 60 ? `${m.message.slice(0, 60)}…` : m.message}
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* ══ PANEL DERECHO ══════════════════════════════════════ */}
        <section
          className={[
            'flex flex-1 flex-col overflow-hidden bg-white',
            vistaMovil === 'lista' ? 'hidden md:flex' : 'flex',
          ].join(' ')}
        >
          {selected ? (
            <>
              {/* Header fijo */}
              <div className="shrink-0 border-b border-slate-200">

                {/* Card de propiedad */}
                <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setVistaMovil('lista')}
                      className="shrink-0 text-slate-400 transition-colors hover:text-slate-900 md:hidden"
                      aria-label="Volver a la lista"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                    </button>

                    {selected.photo_url ? (
                      <img
                        src={selected.photo_url}
                        alt={selected.address}
                        className="h-[60px] w-[60px] shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-lg bg-slate-200">
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                          <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <span className="hidden text-xs font-medium uppercase tracking-wider text-slate-400 sm:block">
                        {TIPO_LABEL[selected.property_type] ?? selected.property_type}
                      </span>
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {selected.address || '—'}
                      </p>
                      {selected.price_usd > 0 && (
                        <p className="hidden text-xs text-blue-600 font-medium sm:block">
                          USD {Number(selected.price_usd).toLocaleString('es-AR')}
                          <span className="text-slate-400 font-normal"> / mes</span>
                        </p>
                      )}
                    </div>

                    <Link
                      href={`/propiedades/${selected.property_id}`}
                      className="shrink-0 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
                    >
                      Ver propiedad
                    </Link>
                  </div>
                </div>

                {/* Datos del inquilino */}
                <div className="bg-white px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div className={['flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold', avatarColor(selected.sender_name)].join(' ')}>
                      {selected.sender_name[0]?.toUpperCase()}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0">
                      <span className="text-sm font-semibold text-slate-900">{selected.sender_name}</span>
                      <a href={`mailto:${selected.sender_email}`} className="text-sm text-slate-400 transition-colors hover:text-slate-700">
                        {selected.sender_email}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hilo de mensajes */}
              <div ref={chatRef} className="flex-1 overflow-y-auto bg-slate-50 px-6 py-6">
                <div className="flex flex-col gap-4">

                  {/* Mensaje original */}
                  <div className="flex items-end gap-3">
                    <div className={['flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold', avatarColor(selected.sender_name)].join(' ')}>
                      {selected.sender_name[0]?.toUpperCase()}
                    </div>
                    <div className="flex max-w-[75%] flex-col gap-1">
                      <div className="rounded-2xl rounded-bl-sm bg-white border border-slate-200 px-4 py-3 text-sm leading-relaxed text-slate-800 whitespace-pre-wrap shadow-sm">
                        {selected.message}
                      </div>
                      <span className="ml-1 text-xs text-slate-400">{fechaChat(selected.created_at)}</span>
                    </div>
                  </div>

                  {/* Respuestas del hilo */}
                  {hiloActual.map((r) =>
                    r.autor === 'dueno' ? (
                      <div key={r.id} className="flex items-end justify-end gap-3">
                        <div className="flex max-w-[75%] flex-col items-end gap-1">
                          <div className="rounded-2xl rounded-br-sm bg-blue-600 px-4 py-3 text-sm leading-relaxed text-white whitespace-pre-wrap">
                            {r.contenido}
                          </div>
                          <span className="mr-1 text-xs text-slate-400">{fechaChat(r.created_at)}</span>
                        </div>
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                          {ownerInitial}
                        </div>
                      </div>
                    ) : (
                      <div key={r.id} className="flex items-end gap-3">
                        <div className={['flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold', avatarColor(selected.sender_name)].join(' ')}>
                          {selected.sender_name[0]?.toUpperCase()}
                        </div>
                        <div className="flex max-w-[75%] flex-col gap-1">
                          <div className="rounded-2xl rounded-bl-sm bg-white border border-slate-200 px-4 py-3 text-sm leading-relaxed text-slate-800 whitespace-pre-wrap shadow-sm">
                            {r.contenido}
                          </div>
                          <span className="ml-1 text-xs text-slate-400">{fechaChat(r.created_at)}</span>
                        </div>
                      </div>
                    )
                  )}

                </div>
              </div>

              {/* Caja de respuesta */}
              <div className="shrink-0 border-t border-slate-200 bg-white px-6 py-4">
                {errorMsg && (
                  <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
                    {errorMsg}
                  </p>
                )}
                <div className="flex items-end gap-3">
                  <textarea
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    rows={3}
                    disabled={enviando}
                    placeholder="Escribí tu respuesta..."
                    className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10 disabled:opacity-50"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) enviar()
                    }}
                  />
                  <button
                    type="button"
                    onClick={enviar}
                    disabled={enviando || !texto.trim()}
                    className="shrink-0 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-40"
                  >
                    {enviando ? '…' : 'Enviar'}
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-slate-400">⌘ + Enter para enviar</p>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center bg-slate-50">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-200">
                <IconSobre className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-600">Seleccioná una conversación</p>
              <p className="text-xs text-slate-400">Los mensajes aparecen aquí</p>
            </div>
          )}
        </section>

      </div>
    </>
  )
}
