import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { enviarRecordatorioPago } from '@/lib/email-templates'
import { formatMonto, formatFechaAR } from '@/lib/utils'

type Params = Promise<{ id: string }>

// ── POST /api/contracts/[id]/reminders ────────────────────────────────────
// El dueño envía un recordatorio de pago al inquilino para un período dado.
// Cuerpo: { period_id: string, message_custom?: string }

export async function POST(req: NextRequest, { params }: { params: Params }) {
  const { id: contractId } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  let body: { period_id: string; message_custom?: string | null }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido.' }, { status: 400 })
  }

  if (!body.period_id) {
    return NextResponse.json({ error: 'period_id es requerido.' }, { status: 400 })
  }

  // Verificar que el contrato pertenece al dueño autenticado
  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .select('id, owner_id, tenant_email, tenant_name')
    .eq('id', contractId)
    .eq('owner_id', session.user.id)
    .single()

  if (contractError || !contract) {
    return NextResponse.json({ error: 'Contrato no encontrado o sin permiso.' }, { status: 403 })
  }

  // Cargar el período con su concepto
  const { data: period, error: periodError } = await supabase
    .from('payment_periods')
    .select(`
      id, period_label, amount, currency, due_date, status,
      concept:payment_concepts(label)
    `)
    .eq('id', body.period_id)
    .eq('contract_id', contractId)
    .single()

  if (periodError || !period) {
    return NextResponse.json({ error: 'Período no encontrado.' }, { status: 404 })
  }

  if (period.status === 'paid') {
    return NextResponse.json({ error: 'El período ya está pagado.' }, { status: 409 })
  }

  const concept = (Array.isArray(period.concept) ? period.concept[0] : period.concept) as { label: string } | null

  // Enviar email
  const emailResult = await enviarRecordatorioPago({
    tenantEmail: contract.tenant_email,
    tenantName: contract.tenant_name,
    conceptLabel: concept?.label ?? 'Pago',
    periodLabel: period.period_label,
    amount: formatMonto(period.amount, period.currency as 'ARS' | 'USD'),
    dueDate: formatFechaAR(period.due_date),
    contractId,
    messageCustom: body.message_custom ?? null,
  })

  // Registrar el recordatorio en la DB
  const { error: reminderError } = await supabase
    .from('payment_reminders')
    .insert({
      period_id: body.period_id,
      contract_id: contractId,
      sent_by: session.user.id,
      channel: 'email',
      message_custom: body.message_custom ?? null,
      recipient_email: contract.tenant_email,
      status: emailResult.ok ? 'sent' : 'failed',
    })

  if (reminderError) {
    console.error('[POST reminders] insert reminder:', reminderError)
    // No bloqueamos si el email se envió OK
  }

  if (!emailResult.ok) {
    return NextResponse.json({ error: emailResult.error ?? 'No se pudo enviar el recordatorio.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
