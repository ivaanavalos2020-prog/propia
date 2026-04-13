import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

type Params = Promise<{ id: string }>

// ── GET /api/contracts/[id] ────────────────────────────────────────────────
// Devuelve el contrato con sus conceptos y períodos de pago

export async function GET(_req: NextRequest, { params }: { params: Params }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

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

  if (error || !contract) {
    return NextResponse.json({ error: 'Contrato no encontrado.' }, { status: 404 })
  }

  // RLS ya filtra — sólo owner o tenant pueden ver
  return NextResponse.json({ contract })
}

// ── PATCH /api/contracts/[id] ──────────────────────────────────────────────
// Actualiza estado del contrato (active | paused | ended) — solo dueño

export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  let body: { status?: string; notes?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido.' }, { status: 400 })
  }

  const allowed = ['active', 'paused', 'ended']
  if (body.status && !allowed.includes(body.status)) {
    return NextResponse.json({ error: 'Estado inválido.' }, { status: 400 })
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.status) updates.status = body.status
  if (body.notes !== undefined) updates.notes = body.notes

  const { data, error } = await supabase
    .from('contracts')
    .update(updates)
    .eq('id', id)
    .eq('owner_id', session.user.id) // sólo el dueño puede modificar
    .select('id, status')
    .single()

  if (error || !data) {
    console.error('[PATCH /api/contracts/[id]]', error)
    return NextResponse.json({ error: 'No se pudo actualizar el contrato.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, contract: data })
}

// ── DELETE /api/contracts/[id] ─────────────────────────────────────────────
// Elimina el contrato (solo dueño, solo si no hay períodos pagados)

export async function DELETE(_req: NextRequest, { params }: { params: Params }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  // Verificar que no hay períodos pagados
  const { count } = await supabase
    .from('payment_periods')
    .select('id', { count: 'exact', head: true })
    .eq('contract_id', id)
    .eq('status', 'paid')

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: 'No podés eliminar un contrato con pagos registrados.' },
      { status: 409 }
    )
  }

  const { error } = await supabase
    .from('contracts')
    .delete()
    .eq('id', id)
    .eq('owner_id', session.user.id)

  if (error) {
    console.error('[DELETE /api/contracts/[id]]', error)
    return NextResponse.json({ error: 'No se pudo eliminar el contrato.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
