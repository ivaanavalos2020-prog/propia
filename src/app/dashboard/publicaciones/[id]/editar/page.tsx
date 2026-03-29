import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import FormularioEditar from './FormularioEditar'

const TIPO_LABEL: Record<string, string> = {
  departamento: 'Departamento',
  casa: 'Casa',
  habitacion: 'Habitación',
  local: 'Local comercial',
}

export default async function EditarPropiedadPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const { data: propiedad } = await supabase
    .from('properties')
    .select('id, tipo, direccion, precio, descripcion, incluye_expensas, acepta_mascotas, acepta_ninos, owner_id')
    .eq('id', id)
    .single()

  if (!propiedad) {
    notFound()
  }

  if (propiedad.owner_id !== session.user.id) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-950 text-zinc-50">
      {/* Nav */}
      <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-5 md:px-12">
        <Link href="/dashboard" className="text-lg font-bold tracking-widest text-zinc-50">
          PROPIA
        </Link>
        <span className="text-sm text-zinc-400">{session.user.email}</span>
      </header>

      <main className="flex flex-1 flex-col items-center px-6 py-10 md:px-12">
        <div className="w-full max-w-lg">
          <div className="mb-8 flex flex-col gap-1">
            <h1 className="text-xl font-semibold text-zinc-50">Editar propiedad</h1>
            <p className="text-sm text-zinc-500">
              {TIPO_LABEL[propiedad.tipo] ?? propiedad.tipo} · {propiedad.direccion}
            </p>
          </div>

          <FormularioEditar
            id={propiedad.id}
            precioInicial={propiedad.precio}
            descripcionInicial={propiedad.descripcion}
            incluyeExpensasInicial={propiedad.incluye_expensas}
            aceptaMascotasInicial={propiedad.acepta_mascotas}
            aceptaNinosInicial={propiedad.acepta_ninos}
          />
        </div>
      </main>
    </div>
  )
}
