import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  // 1. Auth
  const supabase = await createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }

  // 2. Parse body
  let mensajeId: string | undefined
  let contenido: string | undefined
  try {
    const body = await req.json()
    mensajeId = body.mensajeId
    contenido = body.contenido
  } catch {
    return NextResponse.json({ error: 'Body inválido.' }, { status: 400 })
  }

  if (!mensajeId || !contenido || typeof mensajeId !== 'string' || typeof contenido !== 'string' || !contenido.trim()) {
    return NextResponse.json({ error: 'Faltan campos requeridos: mensajeId, contenido.' }, { status: 400 })
  }

  // 3. Authorization — verify the current user owns the property
  const { data: mensaje, error: mensajeError } = await supabase
    .from('mensajes')
    .select('id, sender_email, sender_name, property_id, properties(owner_id, address)')
    .eq('id', mensajeId)
    .single()

  if (mensajeError || !mensaje) {
    return NextResponse.json({ error: 'Mensaje no encontrado.' }, { status: 404 })
  }

  type PropRow = { owner_id: string; address: string } | null
  const prop = mensaje.properties as unknown as PropRow

  if (!prop || prop.owner_id !== session.user.id) {
    return NextResponse.json({ error: 'No tenés permiso para responder este mensaje.' }, { status: 403 })
  }

  // 4. Insert reply
  const { data: respuesta, error: insertError } = await supabase
    .from('respuestas_mensajes')
    .insert({ mensaje_id: mensajeId, contenido: contenido.trim(), autor: 'dueno' })
    .select('id, mensaje_id, contenido, autor, created_at')
    .single()

  if (insertError || !respuesta) {
    console.error('Error al insertar respuesta:', insertError)
    return NextResponse.json({ error: 'No se pudo guardar la respuesta.' }, { status: 500 })
  }

  // 5. Email notification (best-effort, silent on failure)
  if (process.env.RESEND_API_KEY) {
    try {
      const senderEmail = mensaje.sender_email as string | null
      if (!senderEmail) {
        return NextResponse.json({ ok: true, respuesta, skipped: 'no sender email' }, { status: 201 })
      }
      const senderName = (mensaje.sender_name as string | null) ?? 'Inquilino'
      const address = prop.address ?? ''

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'noreply@propia.com.ar',
          to: [senderEmail],
          subject: `El dueño respondió tu consulta sobre ${address}`,
          html: `<p>Hola ${senderName},</p><p>El dueño respondió tu consulta sobre <strong>${address}</strong>.</p><p>Ingresá a <a href="https://propia.com.ar/mensajes">PROPIA</a> para ver la respuesta.</p>`,
        }),
      })
    } catch (emailError) {
      console.error('Error al enviar email de notificación:', emailError)
    }
  }

  // 6. Return
  return NextResponse.json({ ok: true, respuesta }, { status: 201 })
}
