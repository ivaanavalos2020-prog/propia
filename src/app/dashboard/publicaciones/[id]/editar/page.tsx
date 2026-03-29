import { redirect, notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
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
    .select('id, type, address, price_usd, description, includes_expenses, allows_pets, allows_kids, owner_id')
    .eq('id', id)
    .single()

  if (!propiedad) {
    notFound()
  }

  if (propiedad.owner_id !== session.user.id) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-50">
      <Navbar />

      <main className="flex flex-1 flex-col items-center px-6 pt-24 pb-12 md:px-10">
        <div className="w-full max-w-lg">
          <div className="mb-8 flex flex-col gap-1">
            <h1 className="text-2xl font-extrabold text-slate-900" style={{ letterSpacing: '-0.02em' }}>
              Editar propiedad
            </h1>
            <p className="text-sm text-slate-500">
              {TIPO_LABEL[propiedad.type] ?? propiedad.type} · {propiedad.address}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <FormularioEditar
              id={propiedad.id}
              precioInicial={propiedad.price_usd}
              descripcionInicial={propiedad.description}
              incluyeExpensasInicial={propiedad.includes_expenses}
              aceptaMascotasInicial={propiedad.allows_pets}
              aceptaNinosInicial={propiedad.allows_kids}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
