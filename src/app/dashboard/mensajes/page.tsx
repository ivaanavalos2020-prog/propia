import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import InboxMensajes, { type RespuestaType, type SenderProfile } from './InboxMensajes'

export default async function MensajesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const { data: propiedades } = await supabase
    .from('properties')
    .select('id')
    .eq('owner_id', session.user.id)

  const propertyIds = propiedades?.map((p) => p.id) ?? []

  const { data: rawMensajes } = propertyIds.length > 0
    ? await supabase
        .from('mensajes')
        .select('id, sender_name, sender_email, message, created_at, property_id, leido, properties(address, type, price_usd, photo_urls)')
        .in('property_id', propertyIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  type PropRow = { address: string; type: string; price_usd: number; photo_urls: string[] | null } | null

  const mensajes = (rawMensajes ?? []).map((m) => {
    const prop = m.properties as unknown as PropRow
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

  // ── Perfiles de los senders ──────────────────────────────────
  const senderEmails = [...new Set(mensajes.map((m) => m.sender_email).filter(Boolean))]
  const senderProfiles: Record<string, SenderProfile> = {}

  if (senderEmails.length > 0) {
    const [profilesResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url, verification_status, created_at')
        .in('email', senderEmails),
    ])

    const profiles = profilesResult.data ?? []
    const profileIds = profiles.map((p) => p.id as string)

    // Reviews de los senders
    const { data: allReviews } = profileIds.length > 0
      ? await supabase
          .from('reviews')
          .select('reviewed_id, rating')
          .in('reviewed_id', profileIds)
      : { data: [] }

    for (const p of profiles) {
      const reviews = (allReviews ?? []).filter((r) => r.reviewed_id === p.id)
      const avgRating = reviews.length > 0
        ? reviews.reduce((s, r) => s + (r.rating as number), 0) / reviews.length
        : 0
      senderProfiles[p.email as string] = {
        id:                  p.id as string,
        full_name:           (p.full_name as string) ?? null,
        avatar_url:          (p.avatar_url as string) ?? null,
        verification_status: (p.verification_status as string) ?? 'unverified',
        created_at:          (p.created_at as string) ?? null,
        avgRating,
        reviewCount:         reviews.length,
      }
    }
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50">
      <Navbar />

      <div className="flex flex-1 overflow-hidden pt-16">
        <InboxMensajes
          mensajes={mensajes}
          respuestasPorMensaje={respuestasPorMensaje}
          ownerEmail={session.user.email ?? ''}
          propertyIds={propertyIds}
          senderProfiles={senderProfiles}
        />
      </div>
    </div>
  )
}
