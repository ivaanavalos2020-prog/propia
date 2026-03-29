'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-client'

interface Props {
  mensajeId: string
  respuestaInicial: string | null
  respondidoEnInicial: string | null
}

export default function FormularioRespuesta({ mensajeId, respuestaInicial, respondidoEnInicial }: Props) {
  const [abierto, setAbierto] = useState(false)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [respuesta, setRespuesta] = useState<string | null>(respuestaInicial)
  const [respondidoEn, setRespondidoEn] = useState<string | null>(respondidoEnInicial)

  async function enviar() {
    const limpio = texto.trim()
    if (!limpio) return

    setEnviando(true)
    setError(null)

    const ahora = new Date().toISOString()
    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('mensajes')
      .update({ respuesta: limpio, respondido_en: ahora })
      .eq('id', mensajeId)

    if (updateError) {
      setError('No se pudo guardar la respuesta. Intentá de nuevo.')
      setEnviando(false)
      return
    }

    setRespuesta(limpio)
    setRespondidoEn(ahora)
    setTexto('')
    setAbierto(false)
    setEnviando(false)
  }

  const fechaRespondido = respondidoEn
    ? new Date(respondidoEn).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  // Ya respondido: mostrar la respuesta guardada
  if (respuesta) {
    return (
      <div className="flex flex-col gap-2 border-t border-zinc-800 pt-5">
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Tu respuesta
          </span>
          {fechaRespondido && (
            <span className="text-xs text-zinc-600">{fechaRespondido}</span>
          )}
        </div>
        <p className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap">
          {respuesta}
        </p>
      </div>
    )
  }

  // Sin respuesta: botón + formulario expandible
  return (
    <div className="border-t border-zinc-800 pt-5">
      {!abierto ? (
        <button
          type="button"
          onClick={() => setAbierto(true)}
          className="flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 17 4 12 9 7" />
            <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
          </svg>
          Responder
        </button>
      ) : (
        <div className="flex flex-col gap-3">
          <label htmlFor={`respuesta-${mensajeId}`} className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Tu respuesta
          </label>
          <textarea
            id={`respuesta-${mensajeId}`}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escribí tu respuesta..."
            rows={4}
            disabled={enviando}
            className="resize-none rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-50 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none disabled:opacity-50"
          />
          {error && (
            <p className="rounded-lg border border-red-800 bg-red-950 px-4 py-3 text-sm text-red-400">
              {error}
            </p>
          )}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={enviar}
              disabled={enviando || texto.trim().length === 0}
              className="rounded-lg bg-zinc-50 px-5 py-2 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-80 disabled:opacity-40"
            >
              {enviando ? 'Enviando...' : 'Enviar respuesta'}
            </button>
            <button
              type="button"
              onClick={() => { setAbierto(false); setTexto(''); setError(null) }}
              disabled={enviando}
              className="text-sm text-zinc-500 transition-colors hover:text-zinc-300 disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
