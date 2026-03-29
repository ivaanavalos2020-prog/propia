'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'

interface Props {
  id: string
  precioInicial: number
  descripcionInicial: string | null
  incluyeExpensasInicial: boolean | null
  aceptaMascotasInicial: boolean | null
  aceptaNinosInicial: boolean | null
}

type Estado = 'idle' | 'guardando' | 'error'

const inputCls = 'rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10 disabled:opacity-50'

function BotonSiNo({
  valor,
  seleccionado,
  onChange,
}: {
  valor: boolean
  seleccionado: boolean | null
  onChange: (v: boolean) => void
}) {
  const activo = seleccionado === valor
  return (
    <button
      type="button"
      onClick={() => onChange(valor)}
      className={`flex-1 rounded-lg border py-2.5 text-sm font-medium transition-colors ${
        activo
          ? 'border-blue-600 bg-blue-50 text-blue-600'
          : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      {valor ? 'Sí' : 'No'}
    </button>
  )
}

export default function FormularioEditar({
  id,
  precioInicial,
  descripcionInicial,
  incluyeExpensasInicial,
  aceptaMascotasInicial,
  aceptaNinosInicial,
}: Props) {
  const [precio, setPrecio] = useState(String(precioInicial))
  const [descripcion, setDescripcion] = useState(descripcionInicial ?? '')
  const [incluyeExpensas, setIncluyeExpensas] = useState<boolean | null>(incluyeExpensasInicial)
  const [aceptaMascotas, setAceptaMascotas] = useState<boolean | null>(aceptaMascotasInicial)
  const [aceptaNinos, setAceptaNinos] = useState<boolean | null>(aceptaNinosInicial)
  const [estado, setEstado] = useState<Estado>('idle')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEstado('guardando')
    setError(null)

    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('properties')
      .update({
        price_usd: Number(precio),
        description: descripcion.trim() || null,
        includes_expenses: incluyeExpensas,
        allows_pets: aceptaMascotas,
        allows_kids: aceptaNinos,
      })
      .eq('id', id)

    if (updateError) {
      setError(updateError.message)
      setEstado('error')
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="precio" className="text-sm font-medium text-slate-700">
          Precio mensual (USD)
        </label>
        <input
          id="precio"
          type="number"
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
          min={0}
          required
          disabled={estado === 'guardando'}
          className={inputCls}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="descripcion" className="text-sm font-medium text-slate-700">
          Descripción
        </label>
        <textarea
          id="descripcion"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={4}
          disabled={estado === 'guardando'}
          placeholder="Describí la propiedad..."
          className={`resize-none ${inputCls}`}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700">¿Incluye expensas?</label>
        <div className="flex gap-3">
          <BotonSiNo valor={true} seleccionado={incluyeExpensas} onChange={setIncluyeExpensas} />
          <BotonSiNo valor={false} seleccionado={incluyeExpensas} onChange={setIncluyeExpensas} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700">¿Acepta mascotas?</label>
        <div className="flex gap-3">
          <BotonSiNo valor={true} seleccionado={aceptaMascotas} onChange={setAceptaMascotas} />
          <BotonSiNo valor={false} seleccionado={aceptaMascotas} onChange={setAceptaMascotas} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700">¿Acepta niños?</label>
        <div className="flex gap-3">
          <BotonSiNo valor={true} seleccionado={aceptaNinos} onChange={setAceptaNinos} />
          <BotonSiNo valor={false} seleccionado={aceptaNinos} onChange={setAceptaNinos} />
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          disabled={estado === 'guardando'}
          className="flex-1 rounded-lg border border-slate-200 bg-white py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={estado === 'guardando'}
          className="flex-1 rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-40"
        >
          {estado === 'guardando' ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  )
}
