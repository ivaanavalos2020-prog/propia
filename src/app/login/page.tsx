'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'

type Estado = 'idle' | 'cargando' | 'enviado' | 'error'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [estado, setEstado] = useState<Estado>('idle')
  const [mensajeError, setMensajeError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEstado('cargando')
    setMensajeError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true, emailRedirectTo: 'http://localhost:3000/auth/callback' },
    })

    if (error) {
      setMensajeError(error.message)
      setEstado('error')
    } else {
      setEstado('enviado')
    }
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-50">
      {/* Header simple */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <Link href="/" className="flex flex-col leading-none">
          <span className="text-base font-bold tracking-widest text-slate-900">PROPIA</span>
          <span className="text-[9px] font-semibold uppercase tracking-widest text-blue-600">Sin intermediarios</span>
        </Link>
        <Link href="/" className="text-sm text-slate-500 transition-colors hover:text-slate-900">
          ← Volver
        </Link>
      </header>

      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900" style={{ letterSpacing: '-0.02em' }}>
                Ingresá a PROPIA
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Te enviamos un link mágico a tu email
              </p>
            </div>

            {estado === 'enviado' ? (
              <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <p className="text-base font-semibold text-slate-900">
                  Revisá tu email
                </p>
                <p className="mt-1.5 text-sm text-slate-500">
                  Te enviamos un link a <span className="font-medium">{email}</span>
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="text-sm font-medium text-slate-700">
                    Correo electrónico
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    required
                    disabled={estado === 'cargando'}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10 disabled:opacity-50"
                  />
                </div>

                {estado === 'error' && (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {mensajeError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={estado === 'cargando'}
                  className="w-full rounded-lg bg-blue-600 px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                  {estado === 'cargando' ? 'Enviando...' : 'Entrar'}
                </button>
              </form>
            )}
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            Al ingresar aceptás los términos de uso de PROPIA.
          </p>
        </div>
      </div>
    </div>
  )
}
