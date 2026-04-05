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

  const { propiedadId, accion } = await req.json() as {
    propiedadId: string
    accion: 'activar' | 'pausar' | 'eliminar'
  }

  if (!propiedadId || !['activar', 'pausar', 'eliminar'].includes(accion)) {
    return NextResponse.json({ error: 'Parámetros inválidos.' }, { status: 400 })
  }

  // ── Usar service role para bypassar RLS al modificar cualquier propiedad ──
  const admin = createAdminSupabaseClient()

  if (accion === 'eliminar') {
    const { error } = await admin
      .from('properties')
      .delete()
      .eq('id', propiedadId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  const nuevoStatus = accion === 'activar' ? 'active' : 'paused'
  const { error } = await admin
    .from('properties')
    .update({ status: nuevoStatus })
    .eq('id', propiedadId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
