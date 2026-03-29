'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'

export type MensajeType = {
  id: string
  sender_name: string
  sender_email: string
  message: string
  created_at: string
  respuesta: string | null
  respondido_en: string | null
  property_id: string
  address: string
}

// ── Helpers ──────────────────────────────────────────────────

function fechaRelativa(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime()
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
  ownerEmail: string
}

export default function InboxMensajes({ mensajes: initial, ownerEmail }: Props) {
  const [mensajes, setMensajes]           = useState(initial)
  const [selectedId, setSelectedId]       = useState<string | null>(null)
  const [vistaMovil, setVistaMovil]       = useState<'lista' | 'detalle'>('lista')
  const [textoRespuesta, setTextoRespuesta] = useState('')
  const [enviando, setEnviando]           = useState(false)
  const [editandoId, setEditandoId]       = useState<string | null>(null)
  const [textoEdicion, setTextoEdicion]   = useState('')
  const [errorMsg, setErrorMsg]           = useState<string | null>(null)
  const chatRef = useRef<HTMLDivElement>(null)

  const selected = mensajes.find((m) => m.id === selectedId) ?? null
  const ownerInitial = ownerEmail[0]?.toUpperCase() ?? 'V'

  // Scroll al final cuando cambia la conversación seleccionada o llega una respuesta nueva
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [selectedId, mensajes])

  function seleccionar(id: string) {
    setSelectedId(id)
    setVistaMovil('detalle')
    setTextoRespuesta('')
    setEditandoId(null)
    setTextoEdicion('')
    setErrorMsg(null)
  }

  async function enviarRespuesta() {
    if (!selected || !textoRespuesta.trim()) return
    setEnviando(true)
    setErrorMsg(null)
    const ahora = new Date().toISOString()
    const { error } = await createClient()
      .from('mensajes')
      .update({ respuesta: textoRespuesta.trim(), respondido_en: ahora })
      .eq('id', selected.id)
    if (error) {
      setErrorMsg('No se pudo enviar. Intentá de nuevo.')
      setEnviando(false)
      return
    }
    setMensajes((prev) =>
      prev.map((m) =>
        m.id === selected.id
          ? { ...m, respuesta: textoRespuesta.trim(), respondido_en: ahora }
          : m,
      ),
    )
    setTextoRespuesta('')
    setEnviando(false)
  }

  async function guardarEdicion() {
    if (!editandoId || !textoEdicion.trim()) return
    setEnviando(true)
    setErrorMsg(null)
    const ahora = new Date().toISOString()
    const { error } = await createClient()
      .from('mensajes')
      .update({ respuesta: textoEdicion.trim(), respondido_en: ahora })
      .eq('id', editandoId)
    if (error) {
      setErrorMsg('No se pudo guardar. Intentá de nuevo.')
      setEnviando(false)
      return
    }
    setMensajes((prev) =>
      prev.map((m) =>
        m.id === editandoId
          ? { ...m, respuesta: textoEdicion.trim(), respondido_en: ahora }
          : m,
      ),
    )
    setEditandoId(null)
    setTextoEdicion('')
    setEnviando(false)
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
        {/* Cabecera del panel */}
        <div className="shrink-0 border-b border-zinc-800 px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-sm font-semibold text-zinc-50">Mensajes recibidos</h1>
              <p className="mt-0.5 text-xs text-zinc-500">
                {mensajes.length} conversación{mensajes.length !== 1 ? 'es' : ''}
              </p>
            </div>
            <Link
              href="/dashboard"
              className="text-xs text-zinc-500 transition-colors hover:text-zinc-300"
            >
              ← Volver
            </Link>
          </div>
        </div>

        {/* Lista de conversaciones / estado vacío */}
        {mensajes.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800">
              <IconSobre className="h-5 w-5 text-zinc-500" />
            </div>
            <p className="text-sm text-zinc-400">No recibiste mensajes todavía</p>
            <p className="text-xs text-zinc-600">
              Aparecerán aquí cuando alguien te contacte desde una propiedad.
            </p>
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
                    {/* Avatar con inicial */}
                    <div
                      className={[
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                        avatarColor(m.sender_name),
                      ].join(' ')}
                    >
                      {m.sender_name[0]?.toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      {/* Nombre + punto azul + fecha */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="truncate text-sm font-semibold text-zinc-100">
                            {m.sender_name}
                          </span>
                          {!m.respuesta && (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                          )}
                        </div>
                        <span className="shrink-0 text-xs text-zinc-500">
                          {fechaRelativa(m.created_at)}
                        </span>
                      </div>

                      {/* Dirección */}
                      <p className="mt-0.5 truncate text-xs text-zinc-500">{m.address || '—'}</p>

                      {/* Preview del mensaje */}
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
            {/* Header del detalle */}
            <div className="shrink-0 border-b border-zinc-800 px-6 py-4">
              <div className="flex items-center gap-4">
                {/* Botón volver — solo mobile */}
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

                <div
                  className={[
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                    avatarColor(selected.sender_name),
                  ].join(' ')}
                >
                  {selected.sender_name[0]?.toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="font-semibold text-zinc-50">{selected.sender_name}</span>
                    <a
                      href={`mailto:${selected.sender_email}`}
                      className="truncate text-sm text-zinc-400 transition-colors hover:text-zinc-200"
                    >
                      {selected.sender_email}
                    </a>
                  </div>
                  <p className="truncate text-xs text-zinc-500">{selected.address || '—'}</p>
                </div>
              </div>
            </div>

            {/* Área de mensajes con scroll */}
            <div ref={chatRef} className="flex-1 overflow-y-auto px-6 py-6">
              <div className="flex flex-col gap-5">

                {/* Burbuja del inquilino */}
                <div className="flex items-end gap-3">
                  <div
                    className={[
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                      avatarColor(selected.sender_name),
                    ].join(' ')}
                  >
                    {selected.sender_name[0]?.toUpperCase()}
                  </div>
                  <div className="flex max-w-[75%] flex-col gap-1">
                    <div className="rounded-2xl rounded-bl-sm bg-zinc-800 px-4 py-3 text-sm leading-relaxed text-zinc-200 whitespace-pre-wrap">
                      {selected.message}
                    </div>
                    <span className="ml-1 text-xs text-zinc-600">
                      {fechaChat(selected.created_at)}
                    </span>
                  </div>
                </div>

                {/* Burbuja de respuesta del dueño (si existe y no está en edición) */}
                {selected.respuesta && editandoId !== selected.id && (
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-end gap-3">
                      <div className="flex max-w-[75%] flex-col items-end gap-1">
                        <div className="rounded-2xl rounded-br-sm bg-emerald-900/70 px-4 py-3 text-sm leading-relaxed text-emerald-100 whitespace-pre-wrap">
                          {selected.respuesta}
                        </div>
                        <span className="mr-1 text-xs text-zinc-600">
                          {selected.respondido_en ? fechaChat(selected.respondido_en) : ''}
                        </span>
                      </div>
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-xs font-semibold text-emerald-100">
                        {ownerInitial}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditandoId(selected.id)
                        setTextoEdicion(selected.respuesta ?? '')
                        setErrorMsg(null)
                      }}
                      className="mr-10 text-xs text-zinc-600 underline-offset-2 transition-colors hover:text-zinc-400 hover:underline"
                    >
                      Editar respuesta
                    </button>
                  </div>
                )}

              </div>
            </div>

            {/* Zona inferior: nueva respuesta o edición */}
            <div className="shrink-0 border-t border-zinc-800 px-6 py-4">
              {errorMsg && (
                <p className="mb-3 rounded-lg border border-red-800 bg-red-950 px-4 py-2.5 text-sm text-red-400">
                  {errorMsg}
                </p>
              )}

              {editandoId === selected.id ? (
                /* Formulario de edición */
                <div className="flex flex-col gap-3">
                  <textarea
                    value={textoEdicion}
                    onChange={(e) => setTextoEdicion(e.target.value)}
                    rows={3}
                    disabled={enviando}
                    placeholder="Editá tu respuesta..."
                    className="resize-none rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-50 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none disabled:opacity-50"
                  />
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={guardarEdicion}
                      disabled={enviando || !textoEdicion.trim()}
                      className="rounded-lg bg-emerald-700 px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-40"
                    >
                      {enviando ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEditandoId(null); setTextoEdicion(''); setErrorMsg(null) }}
                      disabled={enviando}
                      className="text-sm text-zinc-500 transition-colors hover:text-zinc-300 disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : !selected.respuesta ? (
                /* Formulario de nueva respuesta */
                <div className="flex flex-col gap-3">
                  <textarea
                    value={textoRespuesta}
                    onChange={(e) => setTextoRespuesta(e.target.value)}
                    rows={3}
                    disabled={enviando}
                    placeholder="Escribí tu respuesta..."
                    className="resize-none rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-50 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none disabled:opacity-50"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) enviarRespuesta()
                    }}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-600">⌘ + Enter para enviar</span>
                    <button
                      type="button"
                      onClick={enviarRespuesta}
                      disabled={enviando || !textoRespuesta.trim()}
                      className="rounded-lg bg-emerald-700 px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-40"
                    >
                      {enviando ? 'Enviando...' : 'Enviar respuesta'}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </>
        ) : (
          /* Estado: sin conversación seleccionada */
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
