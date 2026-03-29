'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const OPCIONES = [
  { value: '', label: 'Todos' },
  { value: 'departamento', label: 'Departamento' },
  { value: 'casa', label: 'Casa' },
  { value: 'habitacion', label: 'Habitación' },
  { value: 'local', label: 'Local' },
]

export default function FiltroTipo() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const actual = searchParams.get('tipo') ?? ''

  function seleccionar(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set('tipo', value)
    } else {
      params.delete('tipo')
    }
    router.push(`/propiedades?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-2">
      {OPCIONES.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => seleccionar(value)}
          className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
            actual === value
              ? 'border-zinc-50 bg-zinc-50 text-zinc-950'
              : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-50'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
