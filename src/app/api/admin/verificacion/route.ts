import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'
import { ADMIN_EMAIL } from '@/config'

export async function POST(req: NextRequest) {
  // ── Auth: verificar que el caller es el admin ─────────────────
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
  }

  const { userId, accion } = await req.json() as {
    userId: string
    accion: 'aprobar' | 'rechazar'
  }

  if (!userId || !['aprobar', 'rechazar'].includes(accion)) {
    return NextResponse.json({ error: 'Parámetros inválidos.' }, { status: 400 })
  }

  // ── Usar service role para bypassar RLS al actualizar otro usuario ──
  const admin = createAdminSupabaseClient()

  const updates =
    accion === 'aprobar'
      ? {
          identity_verified:    true,
          verification_status:  'verified',
          identity_verified_at: new Date().toISOString(),
        }
      : {
          identity_verified:   false,
          verification_status: 'rejected',
        }

  const { error } = await admin
    .from('profiles')
    .update(updates)
    .eq('id', userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
