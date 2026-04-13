import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { notificarPagoMarcado } from '@/lib/email-templates'
import { formatMonto, formatFechaAR } from '@/lib/utils'

type Params = Promise<{ id: string; periodId: string }>

// ── PATCH /api/contracts/[id]/periods/[periodId] ───────────────────────────
// Marca un período como pagado o lo revierte a pendiente.
// Cuerpo: { action: 'mark_paid' | 'mark_unpaid', payment_proof_url?: string, notes?: string }

export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const { id: contractId, periodId } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  let body: {
    action: 'mark_paid' | 'mark_unpaid'
    payment_proof_url?: string | null
    notes?: string | null
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido.' }, { status: 400 })
  }

  if (body.action !== 'mark_paid' && body.action !== 'mark_unpaid') {
    return NextResponse.json({ error: 'Acción inválida.' }, { status: 400 })
  }

  // Cargar el período + contrato para verificar acceso
  const { data: period, error: periodError } = await supabase
    .from('payment_periods')
    .select(`
      id, contract_id, concept_id, status, amount, currency, period_label,
      concept:payment_concepts(label),
      contract:contracts(owner_id, tenant_id, tenant_email, tenant_name)
    `)
    .eq('id', periodId)
    .eq('contract_id', contractId)
    .single()

  if (periodError || !period) {
    return NextResponse.json({ error: 'Período no encontrado.' }, { status: 404 })
  }

  const contract = (Array.isArray(period.contract) ? period.contract[0] : period.contract) as {
    owner_id: string
    tenant_id: string | null
    tenant_email: string
    tenant_name: string
  } | null

  if (!contract) {
    return NextResponse.json({ error: 'Contrato no encontrado.' }, { status: 404 })
  }

  const isOwner = session.user.id === contract.owner_id
  const isTenant =
    session.user.id === contract.tenant_id ||
    session.user.email === contract.tenant_email

  if (!isOwner && !isTenant) {
    return NextResponse.json({ error: 'Sin permiso.' }, { status: 403 })
  }

  if (body.action === 'mark_paid') {
    const { data: updated, error } = await supabase
      .from('payment_periods')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        paid_by_user_id: session.user.id,
        marked_paid_by: isOwner ? 'owner' : 'tenant',
        payment_proof_url: body.payment_proof_url ?? null,
        notes: body.notes ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', periodId)
      .select('id, status, paid_at')
      .single()

    if (error || !updated) {
      console.error('[PATCH periods mark_paid]', error)
      return NextResponse.json({ error: 'No se pudo registrar el pago.' }, { status: 500 })
    }

    // Notificar al dueño si quien marcó fue el inquilino (best-effort)
    if (isTenant && !isOwner) {
      try {
        const { data: ownerProfile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', contract.owner_id)
          .single()

        if (ownerProfile?.email) {
          const concept = (Array.isArray(period.concept) ? period.concept[0] : period.concept) as { label: string } | null
          await notificarPagoMarcado({
            ownerEmail: ownerProfile.email,
            tenantName: contract.tenant_name,
            conceptLabel: concept?.label ?? 'Pago',
            periodLabel: period.period_label,
            amount: formatMonto(period.amount, period.currency as 'ARS' | 'USD'),
            contractId,
            hasProof: !!body.payment_proof_url,
          })
        }
      } catch (emailErr) {
        console.error('[PATCH periods] email dueño:', emailErr)
      }
    }

    return NextResponse.json({ ok: true, period: updated })
  }

  // mark_unpaid — solo el dueño puede revertir
  if (!isOwner) {
    return NextResponse.json({ error: 'Solo el dueño puede revertir un pago.' }, { status: 403 })
  }

  const { data: reverted, error: revertError } = await supabase
    .from('payment_periods')
    .update({
      status: 'pending',
      paid_at: null,
      paid_by_user_id: null,
      marked_paid_by: null,
      payment_proof_url: null,
      notes: body.notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', periodId)
    .select('id, status')
    .single()

  if (revertError || !reverted) {
    console.error('[PATCH periods mark_unpaid]', revertError)
    return NextResponse.json({ error: 'No se pudo revertir el pago.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, period: reverted })
}
