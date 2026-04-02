import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

const ADMIN_EMAIL = 'ivaan.avalos2020@gmail.com'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
  }

  const { userId, accion } = await req.json() as {
    userId: string
    accion: 'aprobar' | 'rechazar'
  }

  if (!userId || !['aprobar', 'rechazar'].includes(accion)) {
    return NextResponse.json({ error: 'Parámetros inválidos.' }, { status: 400 })
  }

  const updates =
    accion === 'aprobar'
      ? {
          identity_verified:      true,
          verification_status:    'verified',
          identity_verified_at:   new Date().toISOString(),
        }
      : {
          identity_verified:   false,
          verification_status: 'rejected',
        }

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
