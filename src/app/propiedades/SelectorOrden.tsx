'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const OPCIONES = [
  { value: 'recientes', label: 'Más recientes' },
  { value: 'precio_asc', label: 'Menor precio' },
  { value: 'precio_desc', label: 'Mayor precio' },
]

export default function SelectorOrden() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const actual = searchParams.get('orden') ?? 'recientes'

  function cambiar(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString())
    if (e.target.value === 'recientes') {
      params.delete('orden')
    } else {
      params.set('orden', e.target.value)
    }
    router.push(`/propiedades?${params.toString()}`)
  }

  return (
    <select
      value={actual}
      onChange={cambiar}
      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-600 shadow-sm focus:border-blue-500 focus:outline-none"
    >
      {OPCIONES.map(({ value, label }) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  )
}
