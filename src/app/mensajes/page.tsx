import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import InboxInquilino, { type RespuestaType, type OwnerProfile } from './InboxInquilino'

export const metadata: Metadata = {
  title: 'Mis mensajes — PROPIA',
  description: 'Tus conversaciones con dueños de propiedades.',
}

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

  // ── Perfiles de los dueños (keyed by property_id) ────────────
  const propertyIds = [...new Set(mensajes.map((m) => m.property_id).filter(Boolean))]
  const ownerProfilesByProperty: Record<string, OwnerProfile> = {}

  if (propertyIds.length > 0) {
    const { data: propRows } = await supabase
      .from('properties')
      .select('id, owner_id')
      .in('id', propertyIds)

    const ownerIds = [...new Set((propRows ?? []).map((p) => p.owner_id as string).filter(Boolean))]

    if (ownerIds.length > 0) {
      const [profilesResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, email, full_name, avatar_url, verification_status, created_at')
          .in('id', ownerIds),
      ])

      const profiles = profilesResult.data ?? []
      const profileIds = profiles.map((p) => p.id as string)

      const { data: allReviews } = profileIds.length > 0
        ? await supabase.from('reviews').select('reviewed_id, rating').in('reviewed_id', profileIds)
        : { data: [] }

      const profileMap: Record<string, OwnerProfile> = {}
      for (const p of profiles) {
        const reviews = (allReviews ?? []).filter((r) => r.reviewed_id === p.id)
        const avgRating = reviews.length > 0
          ? reviews.reduce((s, r) => s + (r.rating as number), 0) / reviews.length
          : 0
        profileMap[p.id as string] = {
          id:                  p.id as string,
          full_name:           (p.full_name as string) ?? null,
          avatar_url:          (p.avatar_url as string) ?? null,
          verification_status: (p.verification_status as string) ?? 'unverified',
          created_at:          (p.created_at as string) ?? null,
          avgRating,
          reviewCount: reviews.length,
        }
      }

      for (const prop of (propRows ?? [])) {
        const profile = profileMap[prop.owner_id as string]
        if (profile) ownerProfilesByProperty[prop.id as string] = profile
      }
    }
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
          ownerProfiles={ownerProfilesByProperty}
        />
      </div>
    </div>
  )
}
