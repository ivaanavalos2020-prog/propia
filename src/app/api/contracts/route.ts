import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import type { Contract, PaymentConceptDraft } from '@/lib/types'
import { notificarNuevoContrato } from '@/lib/email-templates'
import { formatFechaAR } from '@/lib/utils'

// ── GET /api/contracts ─────────────────────────────────────────────────────
// Lista contratos del usuario autenticado (dueño o inquilino)

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const role = searchParams.get('role') // 'owner' | 'tenant' | null (ambos)

  let query = supabase
    .from('contracts')
    .select(`
      *,
      property:properties(address, neighborhood, city)
    `)
    .order('created_at', { ascending: false })

  // El RLS ya filtra correctamente, pero si se especifica rol lo acotamos
  if (role === 'owner') {
    query = query.eq('owner_id', session.user.id)
  } else if (role === 'tenant') {
    query = query.eq('tenant_email', session.user.email ?? '')
  }

  const { data, error } = await query

  if (error) {
    console.error('[GET /api/contracts]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ contracts: data ?? [] })
}

// ── POST /api/contracts ────────────────────────────────────────────────────
// Crea un contrato nuevo + conceptos de pago + genera períodos (solo dueños)

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  let body: {
    property_id: string
    tenant_email: string
    tenant_name: string
    tenant_phone?: string
    start_date: string
    end_date: string
    rent_amount: number
    currency: string
    notes?: string
    concepts: PaymentConceptDraft[]
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido.' }, { status: 400 })
  }

  // Validación básica
  if (!body.property_id || !body.tenant_email || !body.tenant_name ||
      !body.start_date || !body.end_date || !body.rent_amount) {
    return NextResponse.json({ error: 'Faltan campos obligatorios.' }, { status: 400 })
  }

  // Verificar que la propiedad pertenece al dueño autenticado
  const { data: prop, error: propError } = await supabase
    .from('properties')
    .select('id, address, neighborhood, city, owner_id')
    .eq('id', body.property_id)
    .eq('owner_id', session.user.id)
    .single()

  if (propError || !prop) {
    return NextResponse.json({ error: 'Propiedad no encontrada o sin permiso.' }, { status: 403 })
  }

  // Buscar si el inquilino tiene perfil por email (puede no tenerlo — es OK)
  const { data: tenantProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', body.tenant_email.toLowerCase().trim())
    .maybeSingle()

  // Obtener datos del dueño para el email
  const { data: ownerProfile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', session.user.id)
    .single()

  // Crear el contrato
  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .insert({
      property_id: body.property_id,
      owner_id: session.user.id,
      tenant_id: tenantProfile?.id ?? null,
      tenant_email: body.tenant_email.toLowerCase().trim(),
      tenant_name: body.tenant_name.trim(),
      tenant_phone: body.tenant_phone?.trim() ?? null,
      start_date: body.start_date,
      end_date: body.end_date,
      rent_amount: body.rent_amount,
      currency: body.currency ?? 'ARS',
      notes: body.notes?.trim() ?? null,
      status: 'active',
    })
    .select('id')
    .single()

  if (contractError || !contract) {
    console.error('[POST /api/contracts] contract insert:', JSON.stringify(contractError, null, 2))
    return NextResponse.json(
      { error: 'No se pudo crear el contrato.', detail: contractError?.message, code: contractError?.code },
      { status: 500 }
    )
  }

  const contractId = (contract as { id: string }).id

  // Insertar conceptos de pago
  if (body.concepts && body.concepts.length > 0) {
    const conceptsToInsert = body.concepts.map((c) => ({
      contract_id: contractId,
      concept_type: c.concept_type,
      label: c.label,
      amount: Number(c.amount),
      currency: c.currency,
      frequency: c.frequency,
      paid_by: c.paid_by,
      due_day_of_month: Number(c.due_day_of_month) || 1,
      is_active: true,
    }))

    const { data: insertedConcepts, error: conceptsError } = await supabase
      .from('payment_concepts')
      .insert(conceptsToInsert)
      .select('id')

    if (conceptsError) {
      console.error('[POST /api/contracts] concepts insert:', conceptsError)
      // No bloqueamos — el contrato ya fue creado
    }

    // Generar períodos para cada concepto (best-effort)
    if (insertedConcepts) {
      for (const concept of insertedConcepts) {
        const { error: fnError } = await supabase.rpc('generate_payment_periods', {
          p_concept_id: (concept as { id: string }).id,
          p_months_ahead: 3,
        })
        if (fnError) {
          console.error('[POST /api/contracts] generate_payment_periods:', fnError)
        }
      }
    }
  }

  // Enviar email de bienvenida al inquilino (best-effort)
  try {
    const propAddress = [prop.address, prop.neighborhood, prop.city]
      .filter(Boolean)
      .join(', ')

    await notificarNuevoContrato({
      tenantEmail: body.tenant_email,
      tenantName: body.tenant_name,
      ownerName: ownerProfile?.full_name ?? 'Tu dueño',
      propertyAddress: propAddress,
      startDate: formatFechaAR(body.start_date),
      endDate: formatFechaAR(body.end_date),
    })
  } catch (emailErr) {
    console.error('[POST /api/contracts] email:', emailErr)
  }

  return NextResponse.json({ ok: true, contractId }, { status: 201 })
}
