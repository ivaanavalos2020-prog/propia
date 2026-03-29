'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-client'

interface Props {
  userId: string
  nombreInicial: string
  telefonoInicial: string
}

type Estado = 'idle' | 'guardando' | 'guardado' | 'error'

export default function FormularioPerfil({ userId, nombreInicial, telefonoInicial }: Props) {
  const [nombre, setNombre] = useState(nombreInicial)
  const [telefono, setTelefono] = useState(telefonoInicial)
  const [estado, setEstado] = useState<Estado>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEstado('guardando')
    setError(null)

    const supabase = createClient()
    const { error: upsertError } = await supabase.from('profiles').upsert({
      id: userId,
      nombre: nombre.trim() || null,
      telefono: telefono.trim() || null,
      updated_at: new Date().toISOString(),
    })

    if (upsertError) {
      setError(upsertError.message)
      setEstado('error')
      return
    }

    setEstado('guardado')
    setTimeout(() => setEstado('idle'), 3000)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="nombre" className="text-sm font-medium text-zinc-400">
          Nombre completo
        </label>
        <input
          id="nombre"
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Tu nombre y apellido"
          disabled={estado === 'guardando'}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-base text-zinc-50 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none disabled:opacity-50"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="telefono" className="text-sm font-medium text-zinc-400">
          Teléfono de contacto
        </label>
        <input
          id="telefono"
          type="tel"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          placeholder="Ej: +54 9 11 1234-5678"
          disabled={estado === 'guardando'}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-base text-zinc-50 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none disabled:opacity-50"
        />
      </div>

      {error && (
        <p className="rounded-lg border border-red-800 bg-red-950 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={estado === 'guardando'}
        className="rounded-lg bg-zinc-50 py-3 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-80 disabled:opacity-40"
      >
        {estado === 'guardando'
          ? 'Guardando...'
          : estado === 'guardado'
          ? '¡Cambios guardados!'
          : 'Guardar cambios'}
      </button>
    </form>
  )
}
