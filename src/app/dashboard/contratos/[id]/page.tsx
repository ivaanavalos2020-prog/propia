import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import ContratoDetalle from './ContratoDetalle'
import type { Contract, PaymentConcept, PaymentPeriod } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Detalle de contrato — PROPIA',
}

type Params = Promise<{ id: string }>

export default async function ContratoPage({ params }: { params: Params }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: contract, error } = await supabase
    .from('contracts')
    .select(`
      *,
      property:properties(id, address, neighborhood, city, type),
      payment_concepts(
        *,
        payment_periods(*)
      )
    `)
    .eq('id', id)
    .single()

  if (error || !contract) notFound()

  // El RLS garantiza acceso solo al owner o tenant
  const isOwner = session.user.id === contract.owner_id
  const isTenant =
    session.user.id === contract.tenant_id ||
    session.user.email === contract.tenant_email

  if (!isOwner && !isTenant) notFound()

  const concepts = (contract.payment_concepts ?? []) as (PaymentConcept & {
    payment_periods: PaymentPeriod[]
  })[]

  // Aplanar todos los períodos para vista general
  const todosLosPeriodos = concepts.flatMap((c) =>
    (c.payment_periods ?? []).map((p) => ({ ...p, concept: c }))
  )

  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-50">
      <Navbar />
      <main className="flex flex-1 flex-col px-4 pt-24 pb-16 sm:px-6">
        <div className="mx-auto w-full max-w-4xl">
          <div className="mb-4 flex items-center gap-2">
            <Link
              href={isOwner ? '/dashboard/contratos' : '/mis-pagos'}
              className="text-sm font-medium text-slate-500 hover:text-slate-700"
            >
              ← {isOwner ? 'Contratos' : 'Mis pagos'}
            </Link>
          </div>
          <ContratoDetalle
            contract={contract as Contract & { property: { address: string; neighborhood: string | null; city: string; type: string } | null }}
            concepts={concepts}
            todosLosPeriodos={todosLosPeriodos}
            isOwner={isOwner}
            userId={session.user.id}
          />
        </div>
      </main>
    </div>
  )
}
