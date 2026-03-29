'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { PROVINCIAS } from '@/lib/provincias'

const TIPOS = [
  { value: '', label: 'Todos' },
  { value: 'departamento', label: 'Departamento' },
  { value: 'casa', label: 'Casa' },
  { value: 'habitacion', label: 'Habitación' },
  { value: 'local', label: 'Local' },
]

const PRECIOS = [
  { value: '', label: 'Todos' },
  { value: '300', label: 'Hasta USD 300' },
  { value: '500', label: 'Hasta USD 500' },
  { value: '800', label: 'Hasta USD 800' },
  { value: '1200', label: 'Hasta USD 1200' },
]

function GrupoFiltro({
  label,
  opciones,
  paramKey,
}: {
  label: string
  opciones: { value: string; label: string }[]
  paramKey: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const actual = searchParams.get(paramKey) ?? ''

  function seleccionar(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(paramKey, value)
    } else {
      params.delete(paramKey)
    }
    router.push(`/propiedades?${params.toString()}`)
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">{label}</span>
      <div className="flex flex-wrap gap-2">
        {opciones.map(({ value, label: opLabel }) => (
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
            {opLabel}
          </button>
        ))}
      </div>
    </div>
  )
}

function FiltroProvincia() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const actual = searchParams.get('ciudad') ?? ''

  function seleccionar(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set('ciudad', value)
    } else {
      params.delete('ciudad')
    }
    router.push(`/propiedades?${params.toString()}`)
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">Provincia</span>
      <select
        value={actual}
        onChange={(e) => seleccionar(e.target.value)}
        className="w-full max-w-xs rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 focus:border-zinc-500 focus:outline-none"
      >
        <option value="">Todas las provincias</option>
        {PROVINCIAS.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
    </div>
  )
}

export default function Filtros() {
  return (
    <div className="flex flex-col gap-4">
      <GrupoFiltro label="Tipo" opciones={TIPOS} paramKey="tipo" />
      <GrupoFiltro label="Precio máximo" opciones={PRECIOS} paramKey="precio" />
      <FiltroProvincia />
    </div>
  )
}
