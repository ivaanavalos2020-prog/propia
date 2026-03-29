'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'

type TipoPropiedad = 'departamento' | 'casa' | 'habitacion' | 'local'

interface FormData {
  tipo: TipoPropiedad | null
  direccion: string
  precio: string
  incluyeExpensas: boolean | null
  descripcion: string
  ambientes: string
  banos: string
  superficie: string
  aceptaMascotas: boolean | null
  aceptaNinos: boolean | null
}

const TIPOS = [
  { value: 'departamento' as TipoPropiedad, label: 'Departamento', emoji: '🏢' },
  { value: 'casa' as TipoPropiedad, label: 'Casa', emoji: '🏠' },
  { value: 'habitacion' as TipoPropiedad, label: 'Habitación', emoji: '🛏️' },
  { value: 'local' as TipoPropiedad, label: 'Local comercial', emoji: '🏪' },
]

const PASOS = ['Tipo', 'Ubicación y precio', 'Detalles']

const INICIAL: FormData = {
  tipo: null,
  direccion: '',
  precio: '',
  incluyeExpensas: null,
  descripcion: '',
  ambientes: '',
  banos: '',
  superficie: '',
  aceptaMascotas: null,
  aceptaNinos: null,
}

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
          ? 'border-zinc-50 bg-zinc-50 text-zinc-950'
          : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-50'
      }`}
    >
      {valor ? 'Sí' : 'No'}
    </button>
  )
}

export default function PublicarPage() {
  const [paso, setPaso] = useState(0)
  const [form, setForm] = useState<FormData>(INICIAL)
  const [publicando, setPublicando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function puedeAvanzar() {
    if (paso === 0) return form.tipo !== null
    if (paso === 1)
      return form.direccion.trim() !== '' && form.precio.trim() !== '' && form.incluyeExpensas !== null
    return true
  }

  async function handlePublicar() {
    setPublicando(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { error: insertError } = await supabase.from('properties').insert({
      owner_id: user.id,
      tipo: form.tipo,
      direccion: form.direccion,
      precio: Number(form.precio),
      incluye_expensas: form.incluyeExpensas,
      descripcion: form.descripcion || null,
      bedrooms: form.ambientes ? Number(form.ambientes) : null,
      bathrooms: form.banos ? Number(form.banos) : null,
      area_m2: form.superficie ? Number(form.superficie) : null,
      allows_pets: form.aceptaMascotas,
      allows_kids: form.aceptaNinos,
    })

    if (insertError) {
      setError(insertError.message)
      setPublicando(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-950 text-zinc-50">
      {/* Nav */}
      <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-5 md:px-12">
        <span className="text-lg font-bold tracking-widest text-zinc-50">PROPIA</span>
        <Link href="/dashboard" className="text-sm text-zinc-400 transition-colors hover:text-zinc-50">
          Cancelar
        </Link>
      </header>

      <main className="flex flex-1 flex-col items-center px-6 py-10 md:px-12">
        <div className="w-full max-w-lg">

          {/* Indicador de progreso */}
          <div className="mb-10 flex items-center gap-2">
            {PASOS.map((nombre, i) => (
              <div key={nombre} className="flex flex-1 flex-col gap-1.5">
                <div
                  className={`h-1 rounded-full transition-colors ${
                    i <= paso ? 'bg-zinc-50' : 'bg-zinc-800'
                  }`}
                />
                <span
                  className={`text-xs transition-colors ${
                    i === paso ? 'text-zinc-50' : 'text-zinc-600'
                  }`}
                >
                  {nombre}
                </span>
              </div>
            ))}
          </div>

          {/* Paso 1 — Tipo */}
          {paso === 0 && (
            <div className="flex flex-col gap-6">
              <h2 className="text-xl font-semibold">¿Qué tipo de propiedad querés publicar?</h2>
              <div className="grid grid-cols-2 gap-3">
                {TIPOS.map(({ value, label, emoji }) => {
                  const activo = form.tipo === value
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => set('tipo', value)}
                      className={`flex flex-col items-center gap-2 rounded-xl border px-4 py-6 text-sm font-medium transition-colors ${
                        activo
                          ? 'border-zinc-50 bg-zinc-900 text-zinc-50'
                          : 'border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-50'
                      }`}
                    >
                      <span className="text-3xl">{emoji}</span>
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Paso 2 — Ubicación y precio */}
          {paso === 1 && (
            <div className="flex flex-col gap-6">
              <h2 className="text-xl font-semibold">Ubicación y precio</h2>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-400">Dirección</label>
                <input
                  type="text"
                  value={form.direccion}
                  onChange={(e) => set('direccion', e.target.value)}
                  placeholder="Ej: Av. Corrientes 1234, CABA"
                  className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-base text-zinc-50 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-400">Precio mensual (USD)</label>
                <input
                  type="number"
                  value={form.precio}
                  onChange={(e) => set('precio', e.target.value)}
                  placeholder="0"
                  min={0}
                  className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-base text-zinc-50 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-400">¿Incluye expensas?</label>
                <div className="flex gap-3">
                  <BotonSiNo valor={true} seleccionado={form.incluyeExpensas} onChange={(v) => set('incluyeExpensas', v)} />
                  <BotonSiNo valor={false} seleccionado={form.incluyeExpensas} onChange={(v) => set('incluyeExpensas', v)} />
                </div>
              </div>
            </div>
          )}

          {/* Paso 3 — Detalles */}
          {paso === 2 && (
            <div className="flex flex-col gap-6">
              <h2 className="text-xl font-semibold">Detalles de la propiedad</h2>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-400">Descripción</label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => set('descripcion', e.target.value)}
                  placeholder="Describí la propiedad: luminosidad, estado, cercanía a servicios..."
                  rows={4}
                  className="resize-none rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-base text-zinc-50 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: 'ambientes' as const, label: 'Ambientes' },
                  { key: 'banos' as const, label: 'Baños' },
                  { key: 'superficie' as const, label: 'Superficie (m²)' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-zinc-400">{label}</label>
                    <input
                      type="number"
                      value={form[key]}
                      onChange={(e) => set(key, e.target.value)}
                      placeholder="0"
                      min={0}
                      className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-base text-zinc-50 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none"
                    />
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-400">¿Acepta mascotas?</label>
                <div className="flex gap-3">
                  <BotonSiNo valor={true} seleccionado={form.aceptaMascotas} onChange={(v) => set('aceptaMascotas', v)} />
                  <BotonSiNo valor={false} seleccionado={form.aceptaMascotas} onChange={(v) => set('aceptaMascotas', v)} />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-400">¿Acepta niños?</label>
                <div className="flex gap-3">
                  <BotonSiNo valor={true} seleccionado={form.aceptaNinos} onChange={(v) => set('aceptaNinos', v)} />
                  <BotonSiNo valor={false} seleccionado={form.aceptaNinos} onChange={(v) => set('aceptaNinos', v)} />
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="mt-8 rounded-lg border border-red-800 bg-red-950 px-4 py-3 text-sm text-red-400">
              {error}
            </p>
          )}

          {/* Navegación */}
          <div className="mt-6 flex gap-3">
            {paso > 0 && (
              <button
                type="button"
                onClick={() => setPaso((p) => p - 1)}
                className="flex-1 rounded-lg border border-zinc-700 py-3 text-sm font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-50"
              >
                Atrás
              </button>
            )}

            {paso < PASOS.length - 1 ? (
              <button
                type="button"
                onClick={() => setPaso((p) => p + 1)}
                disabled={!puedeAvanzar()}
                className="flex-1 rounded-lg bg-zinc-50 py-3 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-80 disabled:opacity-30"
              >
                Siguiente
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePublicar}
                disabled={publicando}
                className="flex-1 rounded-lg bg-zinc-50 py-3 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-80 disabled:opacity-40"
              >
                {publicando ? 'Publicando...' : 'Publicar'}
              </button>
            )}
          </div>

        </div>
      </main>
    </div>
  )
}
