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
      className="mt-10 flex w-full max-w-2xl flex-col gap-2 sm:flex-row shadow-sm rounded-2xl border border-slate-200 bg-white p-2"
    >
      <input
        type="text"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Dirección, barrio o ciudad..."
        className="flex-1 rounded-xl px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none"
      />
      <select
        value={tipo}
        onChange={(e) => setTipo(e.target.value)}
        className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 focus:border-blue-500 focus:outline-none sm:w-48"
      >
        {TIPOS.map((t) => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>
      <button
        type="submit"
        className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
      >
        Buscar
      </button>
    </form>
  )
}
