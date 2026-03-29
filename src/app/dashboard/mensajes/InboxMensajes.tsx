'use client'

import { useState, useRef, useEffect } from 'react'
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
  if (diffMin < 60) return `hace ${diffMin}m`
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
    'bg-blue-900 text-blue-200',
    'bg-violet-900 text-violet-200',
    'bg-amber-900 text-amber-200',
    'bg-rose-900 text-rose-200',
    'bg-teal-900 text-teal-200',
    'bg-sky-900 text-sky-200',
  ]
  return palettes[name.charCodeAt(0) % palettes.length]
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
}

export default function InboxMensajes({ mensajes: initial, respuestasPorMensaje: initialRespuestas, ownerEmail }: Props) {
  const [mensajes]    = useState(initial)
  const [respuestas, setRespuestas] = useState<Record<string, RespuestaType[]>>(initialRespuestas)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [vistaMovil, setVistaMovil] = useState<'lista' | 'detalle'>('lista')
  const [texto, setTexto]           = useState('')
  const [enviando, setEnviando]     = useState(false)
  const [errorMsg, setErrorMsg]     = useState<string | null>(null)
  const chatRef = useRef<HTMLDivElement>(null)

  const selected       = mensajes.find((m) => m.id === selectedId) ?? null
  const hiloActual     = selectedId ? (respuestas[selectedId] ?? []) : []
  const ownerInitial   = ownerEmail[0]?.toUpperCase() ?? 'V'

  // Scroll al final cuando cambia la conversación o llega un mensaje nuevo
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [selectedId, respuestas])

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

  // El punto azul se muestra si el dueño aún no respondió
  function sinRespuestaDueno(mensajeId: string): boolean {
    return !(respuestas[mensajeId] ?? []).some((r) => r.autor === 'dueno')
  }

  return (
    <div className="flex flex-1 overflow-hidden">

      {/* ══ PANEL IZQUIERDO ══════════════════════════════════════ */}
      <aside
        className={[
          'flex w-full flex-col border-r border-zinc-800 bg-zinc-950',
          'md:flex md:w-80 lg:w-96',
          vistaMovil === 'detalle' ? 'hidden md:flex' : 'flex',
        ].join(' ')}
      >
        <div className="shrink-0 border-b border-zinc-800 px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-sm font-semibold text-zinc-50">Mensajes recibidos</h1>
              <p className="mt-0.5 text-xs text-zinc-500">
                {mensajes.length} conversación{mensajes.length !== 1 ? 'es' : ''}
              </p>
            </div>
            <Link href="/dashboard" className="text-xs text-zinc-500 transition-colors hover:text-zinc-300">
              ← Volver
            </Link>
          </div>
        </div>

        {mensajes.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800">
              <IconSobre className="h-5 w-5 text-zinc-500" />
            </div>
            <p className="text-sm text-zinc-400">No recibiste mensajes todavía</p>
            <p className="text-xs text-zinc-600">Aparecerán aquí cuando alguien te contacte desde una propiedad.</p>
          </div>
        ) : (
          <ul className="flex-1 divide-y divide-zinc-800/50 overflow-y-auto">
            {mensajes.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => seleccionar(m.id)}
                  className={[
                    'w-full px-5 py-4 text-left transition-colors hover:bg-zinc-800/50',
                    m.id === selectedId ? 'bg-zinc-800/70' : '',
                  ].join(' ')}
                >
                  <div className="flex items-start gap-3">
                    <div className={['flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold', avatarColor(m.sender_name)].join(' ')}>
                      {m.sender_name[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="truncate text-sm font-semibold text-zinc-100">{m.sender_name}</span>
                          {sinRespuestaDueno(m.id) && (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                          )}
                        </div>
                        <span className="shrink-0 text-xs text-zinc-500">{fechaRelativa(m.created_at)}</span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-zinc-500">{m.address || '—'}</p>
                      <p className="mt-1 truncate text-xs text-zinc-400">
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

      {/* ══ PANEL DERECHO ════════════════════════════════════════ */}
      <section
        className={[
          'flex flex-1 flex-col overflow-hidden bg-zinc-950',
          vistaMovil === 'lista' ? 'hidden md:flex' : 'flex',
        ].join(' ')}
      >
        {selected ? (
          <>
            {/* Header fijo */}
            <div className="shrink-0 border-b border-zinc-800">

              {/* Card de propiedad */}
              <div className="border-b border-zinc-800 bg-zinc-900 px-6 py-4">
                <div className="flex items-center gap-3">

                  {/* Botón volver — solo mobile, alineado al inicio de la card */}
                  <button
                    type="button"
                    onClick={() => setVistaMovil('lista')}
                    className="shrink-0 text-zinc-400 transition-colors hover:text-zinc-50 md:hidden"
                    aria-label="Volver a la lista"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>

                  {/* Foto o placeholder */}
                  {selected.photo_url ? (
                    <img
                      src={selected.photo_url}
                      alt={selected.address}
                      className="h-[60px] w-[60px] shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-lg bg-zinc-800">
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-600">
                        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                    </div>
                  )}

                  {/* Info de la propiedad */}
                  <div className="min-w-0 flex-1">
                    {/* Tipo — oculto en mobile */}
                    <span className="hidden text-xs font-medium uppercase tracking-wider text-zinc-500 sm:block">
                      {TIPO_LABEL[selected.property_type] ?? selected.property_type}
                    </span>
                    {/* Dirección */}
                    <p className="truncate text-sm font-semibold leading-snug text-zinc-50">
                      {selected.address || '—'}
                    </p>
                    {/* Precio — oculto en mobile */}
                    {selected.price_usd > 0 && (
                      <p className="hidden text-xs text-zinc-400 sm:block">
                        USD {Number(selected.price_usd).toLocaleString('es-AR')}
                        <span className="text-zinc-600"> / mes</span>
                      </p>
                    )}
                  </div>

                  {/* Link a la propiedad */}
                  <Link
                    href={`/propiedades/${selected.property_id}`}
                    className="shrink-0 whitespace-nowrap rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-50"
                  >
                    Ver propiedad
                  </Link>
                </div>
              </div>

              {/* Datos del inquilino */}
              <div className="bg-zinc-950 px-6 py-3">
                <div className="flex items-center gap-3">
                  <div className={['flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold', avatarColor(selected.sender_name)].join(' ')}>
                    {selected.sender_name[0]?.toUpperCase()}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0">
                    <span className="text-sm font-semibold text-zinc-100">{selected.sender_name}</span>
                    <a
                      href={`mailto:${selected.sender_email}`}
                      className="text-sm text-zinc-500 transition-colors hover:text-zinc-300"
                    >
                      {selected.sender_email}
                    </a>
                  </div>
                </div>
              </div>

            </div>

            {/* Hilo de mensajes */}
            <div ref={chatRef} className="flex-1 overflow-y-auto px-6 py-6">
              <div className="flex flex-col gap-4">

                {/* Mensaje original del inquilino */}
                <div className="flex items-end gap-3">
                  <div className={['flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold', avatarColor(selected.sender_name)].join(' ')}>
                    {selected.sender_name[0]?.toUpperCase()}
                  </div>
                  <div className="flex max-w-[75%] flex-col gap-1">
                    <div className="rounded-2xl rounded-bl-sm bg-zinc-800 px-4 py-3 text-sm leading-relaxed text-zinc-200 whitespace-pre-wrap">
                      {selected.message}
                    </div>
                    <span className="ml-1 text-xs text-zinc-600">{fechaChat(selected.created_at)}</span>
                  </div>
                </div>

                {/* Respuestas del hilo */}
                {hiloActual.map((r) =>
                  r.autor === 'dueno' ? (
                    /* Respuesta del dueño — derecha, verde */
                    <div key={r.id} className="flex items-end justify-end gap-3">
                      <div className="flex max-w-[75%] flex-col items-end gap-1">
                        <div className="rounded-2xl rounded-br-sm bg-emerald-900/70 px-4 py-3 text-sm leading-relaxed text-emerald-100 whitespace-pre-wrap">
                          {r.contenido}
                        </div>
                        <span className="mr-1 text-xs text-zinc-600">{fechaChat(r.created_at)}</span>
                      </div>
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-xs font-semibold text-emerald-100">
                        {ownerInitial}
                      </div>
                    </div>
                  ) : (
                    /* Respuesta del inquilino — izquierda, gris */
                    <div key={r.id} className="flex items-end gap-3">
                      <div className={['flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold', avatarColor(selected.sender_name)].join(' ')}>
                        {selected.sender_name[0]?.toUpperCase()}
                      </div>
                      <div className="flex max-w-[75%] flex-col gap-1">
                        <div className="rounded-2xl rounded-bl-sm bg-zinc-800 px-4 py-3 text-sm leading-relaxed text-zinc-200 whitespace-pre-wrap">
                          {r.contenido}
                        </div>
                        <span className="ml-1 text-xs text-zinc-600">{fechaChat(r.created_at)}</span>
                      </div>
                    </div>
                  )
                )}

              </div>
            </div>

            {/* Caja de respuesta — siempre visible */}
            <div className="shrink-0 border-t border-zinc-800 px-6 py-4">
              {errorMsg && (
                <p className="mb-3 rounded-lg border border-red-800 bg-red-950 px-4 py-2.5 text-sm text-red-400">
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
                  className="flex-1 resize-none rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-50 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none disabled:opacity-50"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) enviar()
                  }}
                />
                <button
                  type="button"
                  onClick={enviar}
                  disabled={enviando || !texto.trim()}
                  className="shrink-0 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-40"
                >
                  {enviando ? '…' : 'Enviar'}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-zinc-600">⌘ + Enter para enviar</p>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800">
              <IconSobre className="h-6 w-6 text-zinc-500" />
            </div>
            <p className="text-sm font-medium text-zinc-400">Seleccioná una conversación</p>
            <p className="text-xs text-zinc-600">Los mensajes aparecen aquí</p>
          </div>
        )}
      </section>

    </div>
  )
}
