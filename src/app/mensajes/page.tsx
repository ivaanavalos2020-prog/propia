import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import InboxInquilino, { type RespuestaType } from './InboxInquilino'

export default async function MensajesInquilinoPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const userEmail = session.user.email ?? ''

  const { data: rawMensajes } = await supabase
    .from('mensajes')
    .select('id, sender_name, sender_email, message, created_at, property_id, properties(address, type, price_usd, photo_urls)')
    .eq('sender_email', userEmail)
    .order('created_at', { ascending: false })

  type PropRow = { address: string; type: string; price_usd: number; photo_urls: string[] | null } | null

  const mensajes = (rawMensajes ?? []).map((m) => {
    const prop = m.properties as unknown as PropRow
    return {
      id:            m.id,
      sender_name:   m.sender_name,
      sender_email:  m.sender_email,
      message:       m.message,
      created_at:    m.created_at,
      property_id:   m.property_id,
      address:       prop?.address ?? '',
      property_type: prop?.type ?? '',
      price_usd:     prop?.price_usd ?? 0,
      photo_url:     prop?.photo_urls?.[0] ?? null,
    }
  })

  const mensajeIds = mensajes.map((m) => m.id)

  const { data: rawRespuestas } = mensajeIds.length > 0
    ? await supabase
        .from('respuestas_mensajes')
        .select('id, mensaje_id, contenido, autor, created_at')
        .in('mensaje_id', mensajeIds)
        .order('created_at', { ascending: true })
    : { data: [] }

  const respuestasPorMensaje: Record<string, RespuestaType[]> = {}
  for (const r of rawRespuestas ?? []) {
    if (!respuestasPorMensaje[r.mensaje_id]) respuestasPorMensaje[r.mensaje_id] = []
    respuestasPorMensaje[r.mensaje_id].push(r as RespuestaType)
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50">
      <Navbar />
      <div className="flex flex-1 overflow-hidden pt-16">
        <InboxInquilino
          mensajes={mensajes}
          respuestasPorMensaje={respuestasPorMensaje}
          userEmail={userEmail}
          mensajeIds={mensajeIds}
        />
      </div>
    </div>
  )
}
