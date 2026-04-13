import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

type Params = Promise<{ id: string }>

// ── POST /api/contracts/[id]/proof ─────────────────────────────────────────
// Genera una URL firmada para que el cliente suba un comprobante directamente
// a Supabase Storage (bucket 'comprobantes').
//
// Body: { period_id: string, file_name: string, content_type: string }
// Responde: { upload_url, token, path, storage_url }

export async function POST(req: NextRequest, { params }: { params: Params }) {
  const { id: contractId } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  let body: { period_id: string; file_name: string; content_type: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido.' }, { status: 400 })
  }

  if (!body.period_id || !body.file_name || !body.content_type) {
    return NextResponse.json({ error: 'Faltan campos requeridos.' }, { status: 400 })
  }

  // Verificar acceso al contrato (owner o tenant)
  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .select('owner_id, tenant_id, tenant_email')
    .eq('id', contractId)
    .single()

  if (contractError || !contract) {
    return NextResponse.json({ error: 'Contrato no encontrado.' }, { status: 404 })
  }

  const isOwner = session.user.id === contract.owner_id
  const isTenant =
    session.user.id === contract.tenant_id ||
    session.user.email === contract.tenant_email

  if (!isOwner && !isTenant) {
    return NextResponse.json({ error: 'Sin permiso.' }, { status: 403 })
  }

  // Verificar que el período pertenece al contrato
  const { data: period, error: periodError } = await supabase
    .from('payment_periods')
    .select('id')
    .eq('id', body.period_id)
    .eq('contract_id', contractId)
    .single()

  if (periodError || !period) {
    return NextResponse.json({ error: 'Período no encontrado.' }, { status: 404 })
  }

  // Construir path: comprobantes/<contractId>/<periodId>/<timestamp>_<fileName>
  const ext = body.file_name.split('.').pop() ?? 'bin'
  const safeName = body.file_name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${contractId}/${body.period_id}/${Date.now()}_${safeName}`

  const { data: signed, error: signedError } = await supabase.storage
    .from('comprobantes')
    .createSignedUploadUrl(path)

  if (signedError || !signed) {
    console.error('[POST /proof] createSignedUploadUrl:', signedError)
    return NextResponse.json({ error: 'No se pudo generar la URL de subida.' }, { status: 500 })
  }

  // URL pública del archivo (disponible después de la subida)
  const { data: publicData } = supabase.storage
    .from('comprobantes')
    .getPublicUrl(path)

  return NextResponse.json({
    upload_url: signed.signedUrl,
    token: signed.token,
    path,
    storage_url: publicData.publicUrl,
  })
}
