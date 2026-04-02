import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

const ADMIN_EMAIL = 'ivaan.avalos2020@gmail.com'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
  }

  const { propiedadId, accion } = await req.json() as {
    propiedadId: string
    accion: 'activar' | 'pausar' | 'eliminar'
  }

  if (!propiedadId || !['activar', 'pausar', 'eliminar'].includes(accion)) {
    return NextResponse.json({ error: 'Parámetros inválidos.' }, { status: 400 })
  }

  if (accion === 'eliminar') {
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', propiedadId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  const nuevoStatus = accion === 'activar' ? 'active' : 'paused'
  const { error } = await supabase
    .from('properties')
    .update({ status: nuevoStatus })
    .eq('id', propiedadId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
