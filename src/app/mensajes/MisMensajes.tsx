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

export type MiMensajeType = {
  id: string
  message: string
  created_at: string
  property_id: string
  address: string
  property_type: string
  price_usd: number
  photo_url: string | null
}

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

function IconCasa({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function IconReloj({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

// ── Componente principal ──────────────────────────────────────

interface Props {
  mensajes: MiMensajeType[]
  respuestasPorMensaje: Record<string, RespuestaType[]>
  userEmail: string
}

export default function MisMensajes({
  mensajes: initial,
  respuestasPorMensaje: initialRespuestas,
  userEmail,
}: Props) {
  const [mensajes,   setMensajes]   = useState<MiMensajeType[]>(initial)
  const [respuestas, setRespuestas] = useState<Record<string, RespuestaType[]>>(initialRespuestas)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [vistaMovil, setVistaMovil] = useState<'lista' | 'detalle'>('lista')
  const [texto,    setTexto]    = useState('')
  const [enviando, setEnviando] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [, setTick] = useState(0)
  const chatRef = useRef<HTMLDivElement>(null)

  const selected   = mensajes.find((m) => m.id === selectedId) ?? null
  const hiloActual = selectedId ? (respuestas[selectedId] ?? []) : []

  // Tick cada minuto para actualizar timestamps relativos
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 60_000)
    return () => clearInterval(timer)
  }, [])

  // Scroll al final cuando cambia la conversación o llegan respuestas
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [selectedId, respuestas])

  // Realtime: suscribirse a respuestas del mensaje seleccionado
  useEffect(() => {
    if (!selectedId) return
    const supabase = createClient()

    const channel = supabase
      .channel(`mis-mensajes-respuestas-${selectedId}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'respuestas_mensajes',
          filter: `mensaje_id=eq.${selectedId}`,
        },
        (payload) => {
          const r = payload.new as RespuestaType
          setRespuestas((prev) => {
            const existing = prev[r.mensaje_id] ?? []
            if (existing.some((x) => x.id === r.id)) return prev
            return { ...prev, [r.mensaje_id]: [...existing, r] }
          })
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [selectedId])

  function seleccionar(id: string) {
    setSelectedId(id)
    setVistaMovil('detalle')
    setTexto('')
    setErrorMsg(null)
  }

  async function enviar() {
    const contenido = texto.trim()
    if (!selected || !contenido) return
    setEnviando(true)
    setErrorMsg(null)

    const { data, error } = await createClient()
      .from('respuestas_mensajes')
      .insert({ mensaje_id: selected.id, contenido, autor: 'inquilino' })
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

  // Última línea de preview para la lista
  function preview(m: MiMensajeType): string {
    const hilo = respuestas[m.id] ?? []
    const last  = hilo[hilo.length - 1]
    const text  = last ? last.contenido : m.message
    return text.length > 60 ? `${text.slice(0, 60)}…` : text
  }

  // Timestamp de la última actividad
  function ultimaFecha(m: MiMensajeType): string {
    const hilo = respuestas[m.id] ?? []
    const last  = hilo[hilo.length - 1]
    return fechaRelativa(last ? last.created_at : m.created_at)
  }

  const hasDuenoReply = hiloActual.some((r) => r.autor === 'dueno')

  return (
    <div className="flex flex-1 overflow-hidden">

      {/* ══ PANEL IZQUIERDO ════════════════════════════════════ */}
      <aside
        className={[
          'flex w-full flex-col border-r border-slate-300 bg-white',
          'md:flex md:w-80 lg:w-96',
          vistaMovil === 'detalle' ? 'hidden md:flex' : 'flex',
        ].join(' ')}
      >
        <div className="shrink-0 border-b border-slate-300 px-5 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-sm font-semibold text-slate-900">Mis consultas</h1>
            <Link href="/propiedades" className="text-xs text-slate-400 transition-colors hover:text-slate-700">
              ← Propiedades
            </Link>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">
            {mensajes.length} consulta{mensajes.length !== 1 ? 's' : ''}
          </p>
        </div>

        {mensajes.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <IconCasa className="h-5 w-5 text-slate-400" />
            </div>
            <p className="text-sm text-slate-500">No enviaste consultas todavía</p>
            <p className="text-xs text-slate-400">Buscá propiedades y contactá al dueño.</p>
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
                    {/* Thumbnail de la propiedad */}
                    {m.photo_url ? (
                      <img
                        src={m.photo_url}
                        alt={m.address}
                        className="h-10 w-10 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-200">
                        <IconCasa className="h-5 w-5 text-slate-400" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-slate-900">
                          {m.address || '—'}
                        </span>
                        <span className="shrink-0 text-xs text-slate-400">{ultimaFecha(m)}</span>
                      </div>
                      {m.price_usd > 0 && (
                        <p className="mt-0.5 text-xs font-medium text-blue-600">
                          USD {Number(m.price_usd).toLocaleString('es-AR')}
                          <span className="font-normal text-slate-400"> / mes</span>
                        </p>
                      )}
                      <p className="mt-1 truncate text-xs text-slate-500">{preview(m)}</p>
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
            <div className="shrink-0 border-b border-slate-300">

              {/* Card de la propiedad */}
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
                      <IconCasa className="h-6 w-6 text-slate-400" />
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
                      <p className="hidden text-xs font-medium text-blue-600 sm:block">
                        USD {Number(selected.price_usd).toLocaleString('es-AR')}
                        <span className="font-normal text-slate-400"> / mes</span>
                      </p>
                    )}
                  </div>

                  <Link
                    href={`/propiedades/${selected.property_id}`}
                    className="shrink-0 whitespace-nowrap rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
                  >
                    Ver propiedad
                  </Link>
                </div>
              </div>

              {/* Subtítulo */}
              <div className="bg-white px-6 py-3">
                <p className="text-sm text-slate-500">Conversación con el dueño</p>
              </div>
            </div>

            {/* Hilo de mensajes */}
            <div ref={chatRef} className="flex-1 overflow-y-auto bg-slate-50 px-6 py-6">
              <div className="flex flex-col gap-4">

                {/* Mensaje original del inquilino → derecha, burbuja azul */}
                <div className="flex items-end justify-end gap-3">
                  <div className="flex max-w-[75%] flex-col items-end gap-1">
                    <div className="rounded-2xl rounded-br-sm bg-blue-600 px-4 py-3 text-sm leading-relaxed text-white whitespace-pre-wrap">
                      {selected.message}
                    </div>
                    <span className="mr-1 text-xs text-slate-400">{fechaChat(selected.created_at)}</span>
                  </div>
                </div>

                {/* Respuestas del hilo */}
                {hiloActual.map((r) =>
                  r.autor === 'dueno' ? (
                    // Dueño → izquierda, burbuja blanca con "D"
                    <div key={r.id} className="flex items-end gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
                        D
                      </div>
                      <div className="flex max-w-[75%] flex-col gap-1">
                        <div className="rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-800 whitespace-pre-wrap shadow-sm">
                          {r.contenido}
                        </div>
                        <span className="ml-1 text-xs text-slate-400">{fechaChat(r.created_at)}</span>
                      </div>
                    </div>
                  ) : (
                    // Inquilino → derecha, burbuja azul
                    <div key={r.id} className="flex items-end justify-end gap-3">
                      <div className="flex max-w-[75%] flex-col items-end gap-1">
                        <div className="rounded-2xl rounded-br-sm bg-blue-600 px-4 py-3 text-sm leading-relaxed text-white whitespace-pre-wrap">
                          {r.contenido}
                        </div>
                        <span className="mr-1 text-xs text-slate-400">{fechaChat(r.created_at)}</span>
                      </div>
                    </div>
                  )
                )}

                {/* Banner: sin respuesta del dueño todavía */}
                {!hasDuenoReply && (
                  <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <IconReloj className="h-4 w-4 shrink-0 text-amber-600" />
                    <p className="text-sm text-amber-800">Tu mensaje fue enviado. El dueño todavía no respondió.</p>
                  </div>
                )}

              </div>
            </div>

            {/* Caja de respuesta */}
            <div className="shrink-0 border-t border-slate-300 bg-white px-6 py-4">
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
                  placeholder="Escribí tu mensaje..."
                  className="flex-1 resize-none rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10 disabled:opacity-50"
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
              <IconCasa className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-600">Seleccioná una conversación</p>
            <p className="text-xs text-slate-400">Tus consultas aparecen aquí</p>
          </div>
        )}
      </section>

    </div>
  )
}
