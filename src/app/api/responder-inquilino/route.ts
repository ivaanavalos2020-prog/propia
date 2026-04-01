import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }

  let mensajeId: string | undefined
  let contenido: string | undefined
  try {
    const body = await req.json()
    mensajeId = body.mensajeId
    contenido = body.contenido
  } catch {
    return NextResponse.json({ error: 'Body inválido.' }, { status: 400 })
  }

  if (
    !mensajeId || !contenido ||
    typeof mensajeId !== 'string' ||
    typeof contenido !== 'string' ||
    !contenido.trim()
  ) {
    return NextResponse.json({ error: 'Faltan campos requeridos.' }, { status: 400 })
  }

  // Verificar que el mensaje pertenece al usuario autenticado
  const { data: mensaje, error: mensajeError } = await supabase
    .from('mensajes')
    .select('id, sender_email')
    .eq('id', mensajeId)
    .single()

  if (mensajeError || !mensaje) {
    return NextResponse.json({ error: 'Mensaje no encontrado.' }, { status: 404 })
  }

  if (mensaje.sender_email !== session.user.email) {
    return NextResponse.json({ error: 'No tenés permiso.' }, { status: 403 })
  }

  const { data: respuesta, error: insertError } = await supabase
    .from('respuestas_mensajes')
    .insert({ mensaje_id: mensajeId, contenido: contenido.trim(), autor: 'inquilino' })
    .select('id, mensaje_id, contenido, autor, created_at')
    .single()

  if (insertError || !respuesta) {
    console.error('Error al insertar respuesta:', insertError)
    return NextResponse.json({ error: 'No se pudo guardar la respuesta.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, respuesta }, { status: 201 })
}
