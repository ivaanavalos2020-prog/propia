'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const TIPOS = [
  { value: '', label: 'Tipo de propiedad' },
  { value: 'departamento', label: 'Departamento' },
  { value: 'casa', label: 'Casa' },
  { value: 'habitacion', label: 'Habitación' },
  { value: 'local', label: 'Local comercial' },
]

export default function HeroBusqueda() {
  const [busqueda, setBusqueda] = useState('')
  const [tipo, setTipo] = useState('')
  const router = useRouter()

  function handleBuscar(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (tipo) params.set('tipo', tipo)
    if (busqueda.trim()) params.set('q', busqueda.trim())
    router.push(`/propiedades${params.size > 0 ? `?${params.toString()}` : ''}`)
  }

  return (
    <form
      onSubmit={handleBuscar}
      className="mt-10 flex w-full max-w-2xl flex-col gap-2 sm:flex-row"
    >
      <input
        type="text"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Dirección, barrio o ciudad..."
        className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900/80 px-5 py-3.5 text-base text-zinc-50 placeholder:text-zinc-500 backdrop-blur-sm focus:border-zinc-500 focus:outline-none"
      />
      <select
        value={tipo}
        onChange={(e) => setTipo(e.target.value)}
        className="rounded-xl border border-zinc-700 bg-zinc-900/80 px-4 py-3.5 text-sm text-zinc-300 backdrop-blur-sm focus:border-zinc-500 focus:outline-none sm:w-52"
      >
        {TIPOS.map((t) => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>
      <button
        type="submit"
        className="rounded-xl bg-orange-500 px-6 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        Buscar
      </button>
    </form>
  )
}
