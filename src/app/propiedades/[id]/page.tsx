import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase'

const TIPO_LABEL: Record<string, string> = {
  departamento: 'Departamento',
  casa: 'Casa',
  habitacion: 'Habitación',
  local: 'Local comercial',
}

function Detalle({ label, valor }: { label: string; valor: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">{label}</span>
      <span className="text-base text-zinc-50">{valor}</span>
    </div>
  )
}

export default async function PropiedadPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: propiedad } = await supabase
    .from('properties')
    .select(
      'id, tipo, direccion, precio, incluye_expensas, descripcion, ambientes, banos, superficie, acepta_mascotas, acepta_ninos'
    )
    .eq('id', id)
    .single()

  if (!propiedad) {
    return (
      <div className="flex min-h-full flex-1 flex-col bg-zinc-950 text-zinc-50">
        <header className="flex items-center border-b border-zinc-800 px-6 py-5 md:px-12">
          <Link href="/" className="text-lg font-bold tracking-widest text-zinc-50">
            PROPIA
          </Link>
        </header>
        <main className="flex flex-1 items-center justify-center">
          <p className="text-base text-zinc-400">Propiedad no encontrada.</p>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-950 text-zinc-50">
      {/* Nav */}
      <header className="flex items-center border-b border-zinc-800 px-6 py-5 md:px-12">
        <Link href="/" className="text-lg font-bold tracking-widest text-zinc-50">
          PROPIA
        </Link>
      </header>

      <main className="flex flex-1 flex-col items-center px-6 py-10 md:px-12">
        <div className="w-full max-w-2xl">

          {/* Encabezado */}
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-zinc-500">
              {TIPO_LABEL[propiedad.tipo] ?? propiedad.tipo}
            </span>
            <h1 className="text-2xl font-bold text-zinc-50">{propiedad.direccion}</h1>
          </div>

          {/* Precio */}
          <div className="mt-6 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-zinc-50">
              USD {Number(propiedad.precio).toLocaleString('es-AR')}
            </span>
            <span className="text-sm text-zinc-500">/ mes</span>
            {propiedad.incluye_expensas && (
              <span className="ml-1 rounded-full border border-zinc-700 px-2.5 py-0.5 text-xs text-zinc-400">
                Expensas incluidas
              </span>
            )}
          </div>

          {/* Descripción */}
          {propiedad.descripcion && (
            <p className="mt-6 text-base leading-relaxed text-zinc-400">
              {propiedad.descripcion}
            </p>
          )}

          {/* Grilla de detalles */}
          <div className="mt-8 grid grid-cols-2 gap-6 rounded-xl border border-zinc-800 bg-zinc-900 p-6 sm:grid-cols-3">
            {propiedad.ambientes != null && (
              <Detalle label="Ambientes" valor={propiedad.ambientes} />
            )}
            {propiedad.banos != null && (
              <Detalle label="Baños" valor={propiedad.banos} />
            )}
            {propiedad.superficie != null && (
              <Detalle label="Superficie" valor={`${propiedad.superficie} m²`} />
            )}
            <Detalle
              label="Mascotas"
              valor={
                propiedad.acepta_mascotas == null
                  ? 'A consultar'
                  : propiedad.acepta_mascotas
                  ? 'Acepta'
                  : 'No acepta'
              }
            />
            <Detalle
              label="Niños"
              valor={
                propiedad.acepta_ninos == null
                  ? 'A consultar'
                  : propiedad.acepta_ninos
                  ? 'Acepta'
                  : 'No acepta'
              }
            />
          </div>

          {/* CTA */}
          <Link
            href="/login"
            className="mt-8 flex w-full items-center justify-center rounded-xl bg-zinc-50 py-4 text-base font-semibold text-zinc-950 transition-opacity hover:opacity-80"
          >
            Quiero esta propiedad
          </Link>

        </div>
      </main>
    </div>
  )
}
