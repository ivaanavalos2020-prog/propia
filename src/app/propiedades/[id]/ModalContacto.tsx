'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'

interface Props {
  abierto: boolean
  onCerrar: () => void
  propertyId: string
  userEmail?: string | null
  mensajeInicial?: string
  yaConsulto?: boolean
}

type Intencion = 'visita' | 'consulta' | 'alquiler'

const INTENCIONES: { id: Intencion; label: string; descripcion: string; mensaje: string; icono: React.ReactNode }[] = [
  {
    id: 'visita',
    label: 'Quiero coordinar una visita',
    descripcion: 'Acordar un horario para conocer la propiedad',
    mensaje: 'Hola, me gustaría coordinar una visita a la propiedad. ¿Cuándo estarías disponible?',
    icono: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    id: 'consulta',
    label: 'Tengo una consulta sobre la propiedad',
    descripcion: 'Preguntar sobre características, condiciones o detalles',
    mensaje: '',
    icono: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  {
    id: 'alquiler',
    label: 'Estoy interesado/a en alquilar',
    descripcion: 'Manifestar interés en comenzar el proceso de alquiler',
    mensaje: 'Hola, estoy interesado/a en alquilar esta propiedad. ¿Podría darme más información sobre el proceso?',
    icono: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" />
      </svg>
    ),
  },
]

const inputCls = 'rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10 disabled:opacity-50'

export default function ModalContacto({
  abierto,
  onCerrar,
  propertyId,
  userEmail,
  mensajeInicial = '',
  yaConsulto = false,
}: Props) {
  const [paso, setPaso] = useState<'intencion' | 'formulario'>('intencion')
  const [intencionSeleccionada, setIntencionSeleccionada] = useState<Intencion | null>(null)
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState(userEmail ?? '')
  const [mensaje, setMensaje] = useState(mensajeInicial)
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (abierto) {
      setPaso('intencion')
      setIntencionSeleccionada(null)
      setNombre('')
      setEmail(userEmail ?? '')
      setMensaje(mensajeInicial)
      setEnviado(false)
      setError(null)
    }
  }, [abierto, mensajeInicial, userEmail])

  function cerrar() {
    onCerrar()
    setTimeout(() => {
      setPaso('intencion')
      setIntencionSeleccionada(null)
      setNombre('')
      setEmail(userEmail ?? '')
      setMensaje(mensajeInicial)
      setEnviado(false)
      setError(null)
    }, 200)
  }

  function seleccionarIntencion(int: Intencion) {
    setIntencionSeleccionada(int)
    const found = INTENCIONES.find((i) => i.id === int)
    setMensaje(found?.mensaje ?? mensajeInicial)
    setPaso('formulario')
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEnviando(true)
    setError(null)

    const supabase = createClient()
    const { error: insertError } = await supabase.from('mensajes').insert({
      property_id:  propertyId,
      sender_name:  nombre.trim(),
      sender_email: email.trim(),
      message:      mensaje.trim(),
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) cerrar() }}
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-300 bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {paso === 'formulario' && !yaConsulto && !enviado && (
              <button
                type="button"
                onClick={() => setPaso('intencion')}
                className="text-slate-400 transition-colors hover:text-slate-700"
                aria-label="Volver"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            )}
            <h2 className="text-lg font-bold text-slate-900">Contactar al dueño</h2>
          </div>
          <button
            type="button"
            onClick={cerrar}
            className="text-slate-400 transition-colors hover:text-slate-900"
            aria-label="Cerrar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Estado: ya tiene conversación */}
        {yaConsulto && (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-base font-semibold text-slate-900">Ya tenés una conversación abierta con el dueño.</p>
              <p className="mt-1 text-sm text-slate-500">Podés ver el estado de tu consulta y las respuestas en tu inbox.</p>
            </div>
            <Link
              href="/mensajes"
              onClick={cerrar}
              className="mt-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Ir a mis mensajes
            </Link>
          </div>
        )}

        {/* Estado: enviado con éxito */}
        {!yaConsulto && enviado && (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <p className="text-base font-semibold text-slate-900">Tu consulta fue enviada.</p>
              <p className="mt-1 text-sm text-slate-500">El dueño se contactará con vos pronto.</p>
            </div>
            <div className="mt-2 flex flex-col gap-2 w-full">
              <Link
                href="/mensajes"
                onClick={cerrar}
                className="rounded-lg bg-blue-600 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Ver mi conversación
              </Link>
              <button
                type="button"
                onClick={cerrar}
                className="rounded-lg border border-slate-300 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {/* Paso 1: selector de intención */}
        {!yaConsulto && !enviado && paso === 'intencion' && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-slate-600 mb-1">¿Con qué motivo querés contactar al dueño?</p>
            {INTENCIONES.map((int) => (
              <button
                key={int.id}
                type="button"
                onClick={() => seleccionarIntencion(int.id)}
                className="flex items-start gap-4 rounded-xl border border-slate-300 px-4 py-4 text-left transition-colors hover:border-blue-400 hover:bg-blue-50"
              >
                <span className="mt-0.5 shrink-0 text-blue-600">{int.icono}</span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{int.label}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{int.descripcion}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Paso 2: formulario */}
        {!yaConsulto && !enviado && paso === 'formulario' && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {intencionSeleccionada && (
              <div className="flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2">
                <span className="text-blue-600">
                  {INTENCIONES.find((i) => i.id === intencionSeleccionada)?.icono}
                </span>
                <p className="text-xs font-medium text-blue-700">
                  {INTENCIONES.find((i) => i.id === intencionSeleccionada)?.label}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="contacto-nombre" className="text-sm font-medium text-slate-700">
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
                className={inputCls}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="contacto-email" className="text-sm font-medium text-slate-700">
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
                className={inputCls}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="contacto-mensaje" className="text-sm font-medium text-slate-700">
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
                className={`resize-none ${inputCls}`}
              />
            </div>

            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="mt-1 rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-40"
            >
              {enviando ? 'Enviando...' : 'Enviar mensaje'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
