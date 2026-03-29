'use client'

import { useState } from 'react'
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
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-10 text-center text-3xl font-bold tracking-widest text-foreground">
          PROPIA
        </h1>

        {estado === 'enviado' ? (
          <div className="rounded-xl border border-foreground/10 bg-foreground/5 p-6 text-center">
            <p className="text-base text-foreground">
              Te enviamos un link a <span className="font-medium">{email}</span>.
            </p>
            <p className="mt-2 text-sm text-foreground/60">
              Revisá tu bandeja de entrada y hacé clic en el enlace para ingresar.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-foreground/80">
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
                className="w-full rounded-lg border border-foreground/20 bg-background px-4 py-2.5 text-base text-foreground placeholder:text-foreground/30 focus:border-foreground/50 focus:outline-none disabled:opacity-50"
              />
            </div>

            {estado === 'error' && (
              <p className="text-sm text-red-500">{mensajeError}</p>
            )}

            <button
              type="submit"
              disabled={estado === 'cargando'}
              className="w-full rounded-lg bg-foreground px-4 py-2.5 text-base font-medium text-background transition-opacity hover:opacity-80 disabled:opacity-40"
            >
              {estado === 'cargando' ? 'Enviando...' : 'Entrar'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
