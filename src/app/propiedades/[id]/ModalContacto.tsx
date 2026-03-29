'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'

interface Props {
  abierto: boolean
  onCerrar: () => void
  propertyId: string
  userEmail?: string | null
  mensajeInicial?: string
}

export default function ModalContacto({ abierto, onCerrar, propertyId, userEmail, mensajeInicial = '' }: Props) {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState(userEmail ?? '')
  const [mensaje, setMensaje] = useState(mensajeInicial)
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sincronizar cuando cambia mensajeInicial (al abrir con distinto contexto)
  useEffect(() => {
    if (abierto) {
      setMensaje(mensajeInicial)
      setEmail(userEmail ?? '')
      setEnviado(false)
      setError(null)
    }
  }, [abierto, mensajeInicial, userEmail])

  function cerrar() {
    onCerrar()
    setTimeout(() => {
      setNombre('')
      setEmail(userEmail ?? '')
      setMensaje(mensajeInicial)
      setEnviado(false)
      setError(null)
    }, 200)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEnviando(true)
    setError(null)

    const supabase = createClient()
    const { error: insertError } = await supabase.from('mensajes').insert({
      property_id: propertyId,
      sender_name: nombre.trim(),
      sender_email: email.trim(),
      message: mensaje.trim(),
    })

    if (insertError) {
      setError('No pudimos enviar tu mensaje. Intentá de nuevo.')
      setEnviando(false)
      return
    }

    setEnviado(true)
    setEnviando(false)
  }

  if (!abierto) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) cerrar() }}
    >
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-50">Contactar al dueño</h2>
          <button
            type="button"
            onClick={cerrar}
            className="text-zinc-500 transition-colors hover:text-zinc-50"
            aria-label="Cerrar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {enviado ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-950">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-base font-semibold text-zinc-50">Tu consulta fue enviada.</p>
            <p className="text-sm text-zinc-400">El dueño se contactará con vos pronto.</p>
            <button
              type="button"
              onClick={cerrar}
              className="mt-2 rounded-lg bg-zinc-50 px-6 py-2.5 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-80"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="contacto-nombre" className="text-sm font-medium text-zinc-400">
                Tu nombre
              </label>
              <input
                id="contacto-nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre y apellido"
                required
                disabled={enviando}
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-base text-zinc-50 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none disabled:opacity-50"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="contacto-email" className="text-sm font-medium text-zinc-400">
                Tu email
              </label>
              <input
                id="contacto-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                disabled={enviando}
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-base text-zinc-50 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none disabled:opacity-50"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="contacto-mensaje" className="text-sm font-medium text-zinc-400">
                Mensaje
              </label>
              <textarea
                id="contacto-mensaje"
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                placeholder="¿Qué querés consultar sobre esta propiedad?"
                rows={4}
                required
                disabled={enviando}
                className="resize-none rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-base text-zinc-50 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none disabled:opacity-50"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-red-800 bg-red-950 px-4 py-3 text-sm text-red-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="mt-1 rounded-lg bg-zinc-50 py-3 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-80 disabled:opacity-40"
            >
              {enviando ? 'Enviando...' : 'Enviar mensaje'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
