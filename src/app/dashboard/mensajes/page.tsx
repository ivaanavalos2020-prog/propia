import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase'
import InboxMensajes, { type RespuestaType } from './InboxMensajes'

export default async function MensajesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // Propiedades del dueño
  const { data: propiedades } = await supabase
    .from('properties')
    .select('id')
    .eq('owner_id', session.user.id)

  const propertyIds = propiedades?.map((p) => p.id) ?? []

  // Mensajes de esas propiedades
  const { data: rawMensajes } = propertyIds.length > 0
    ? await supabase
        .from('mensajes')
        .select('id, sender_name, sender_email, message, created_at, property_id, leido, properties(address, type, price_usd, photo_urls)')
        .in('property_id', propertyIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  type PropRow = { address: string; type: string; price_usd: number; photo_urls: string[] | null } | null

  const mensajes = (rawMensajes ?? []).map((m) => {
    const prop = m.properties as PropRow
    return {
      id:             m.id,
      sender_name:    m.sender_name,
      sender_email:   m.sender_email,
      message:        m.message,
      created_at:     m.created_at,
      property_id:    m.property_id,
      leido:          m.leido ?? false,
      address:        prop?.address ?? '',
      property_type:  prop?.type ?? '',
      price_usd:      prop?.price_usd ?? 0,
      photo_url:      prop?.photo_urls?.[0] ?? null,
    }
  })

  // Respuestas de todos los hilos del dueño
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
    <div className="flex h-screen flex-col overflow-hidden bg-zinc-950 text-zinc-50">
      <header className="shrink-0 flex items-center justify-between border-b border-zinc-800 px-6 py-5 md:px-12">
        <Link href="/dashboard" className="text-lg font-bold tracking-widest text-zinc-50">
          PROPIA
        </Link>
        <span className="text-sm text-zinc-400">{session.user.email}</span>
      </header>

      <InboxMensajes
        mensajes={mensajes}
        respuestasPorMensaje={respuestasPorMensaje}
        ownerEmail={session.user.email ?? ''}
        propertyIds={propertyIds}
      />
    </div>
  )
}
