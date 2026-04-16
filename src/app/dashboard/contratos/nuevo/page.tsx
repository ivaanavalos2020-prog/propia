import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import NuevoContratoForm from './NuevoContratoForm'

export const metadata: Metadata = {
  title: 'Nuevo contrato — PROPIA',
}

export default async function NuevoContratoPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: propiedades } = await supabase
    .from('properties')
    .select('id, address, neighborhood, city, type')
    .eq('owner_id', session.user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-50">
      <Navbar />
      <main className="flex flex-1 flex-col px-4 pt-24 pb-16 sm:px-6">
        <div className="mx-auto w-full max-w-2xl">
          <div className="mb-6 flex items-center gap-2">
            <Link
              href="/dashboard/contratos"
              className="text-sm font-medium text-slate-500 hover:text-slate-700"
            >
              ← Contratos
            </Link>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-propia">
            Nuevo contrato
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Cargá los datos del alquiler para gestionar los pagos desde PROPIA.
          </p>
          <NuevoContratoForm propiedades={propiedades ?? []} />
        </div>
      </main>
    </div>
  )
}
