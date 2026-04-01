import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import PerfilClient from './PerfilClient'
import BadgeVerificado from '@/components/BadgeVerificado'
import StarRating from '@/components/StarRating'
import TrustScoreCircle from '@/components/TrustScoreCircle'
import VerificationBanner from '@/components/VerificationBanner'
import { calcularTrustScore } from '@/lib/trustScore'

export default async function PerfilPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) redirect('/login')

  const userId = session.user.id
  const userEmail = session.user.email ?? ''
  const emailVerificado = !!session.user.email_confirmed_at

  // ── Parallel: profile + properties + reviews ──────────────────
  const [{ data: perfil }, { data: propiedades }, { data: rawReviews }] = await Promise.all([
    supabase
      .from('profiles')
      .select(
        'nombre, telefono, whatsapp, show_phone, show_whatsapp, notify_messages, cuit, razon_social, condicion_afip, created_at, identity_verified, verification_status, avatar_url'
      )
      .eq('id', userId)
      .single(),
    supabase
      .from('properties')
      .select('id, address, neighborhood, city, views_count, status, photo_urls')
      .eq('owner_id', userId)
      .order('views_count', { ascending: false }),
    supabase
      .from('reviews')
      .select('id, rating, comment, reviewer_role, created_at, profiles!reviewer_id(nombre)')
      .eq('reviewed_id', userId)
      .order('created_at', { ascending: false })
      .limit(3),
  ])

  const propIds = (propiedades ?? []).map((p) => p.id)

  // ── Messages for owned properties ─────────────────────────────
  const { data: mensajesRaw } = propIds.length > 0
    ? await supabase
        .from('mensajes')
        .select('id, property_id, created_at')
        .in('property_id', propIds)
        .order('created_at', { ascending: true })
    : { data: [] }

  const mensajeIds = (mensajesRaw ?? []).map((m) => m.id)

  // ── Which messages have at least one reply ─────────────────────
  const { data: respuestasRaw } = mensajeIds.length > 0
    ? await supabase
        .from('respuestas_mensajes')
        .select('mensaje_id')
        .in('mensaje_id', mensajeIds)
    : { data: [] }

  const respondidosSet = new Set((respuestasRaw ?? []).map((r) => r.mensaje_id))

  // ── Build mensajes with respondido flag ────────────────────────
  const mensajes = (mensajesRaw ?? []).map((m) => ({
    id: m.id as string,
    property_id: m.property_id as string,
    created_at: m.created_at as string,
    respondido: respondidosSet.has(m.id),
  }))

  // ── mensajes_count per property ────────────────────────────────
  const mensajesPorPropiedad = new Map<string, number>()
  mensajes.forEach((m) => {
    mensajesPorPropiedad.set(m.property_id, (mensajesPorPropiedad.get(m.property_id) ?? 0) + 1)
  })

  const props = (propiedades ?? []).map((p) => ({
    id: p.id as string,
    address: (p.address as string) ?? null,
    neighborhood: (p.neighborhood as string) ?? null,
    city: (p.city as string) ?? null,
    views_count: (p.views_count as number) ?? 0,
    status: (p.status as string) ?? null,
    photo_urls: (p.photo_urls as string[]) ?? [],
    mensajes_count: mensajesPorPropiedad.get(p.id) ?? 0,
  }))

  // ── Trust score ────────────────────────────────────────────────
  const avgRating = rawReviews && rawReviews.length > 0
    ? rawReviews.reduce((s, r) => s + (r.rating as number), 0) / rawReviews.length
    : 0
  const trustResult = calcularTrustScore({
    identityVerified: (perfil?.identity_verified as boolean) ?? false,
    phone:            (perfil?.telefono as string) ?? null,
    avatarUrl:        (perfil?.avatar_url as string) ?? null,
    createdAt:        (perfil?.created_at as string) ?? null,
    avgRating,
    responseRate:     mensajes.length > 0
      ? mensajes.filter((m) => m.respondido).length / mensajes.length
      : 0,
  })

  const isVerified        = (perfil?.identity_verified as boolean) ?? false
  const verificationStatus = (perfil?.verification_status as string) ?? 'unverified'

  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-50">
      <Navbar />
      {!isVerified && <VerificationBanner />}
      <main className="flex flex-1 flex-col px-4 pt-24 pb-12 md:px-8">
        <div className="mx-auto w-full max-w-6xl">

          {/* ── Sidebar de confianza ──────────────────────────── */}
          <div className="mb-6 flex flex-wrap items-start gap-4">
            <TrustScoreCircle result={trustResult} size="md" />
            <div className="flex flex-col gap-2">
              {isVerified
                ? <BadgeVerificado />
                : verificationStatus === 'pending'
                  ? <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-700">Verificación en proceso</span>
                  : (
                    <Link
                      href="/verificar-identidad"
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-600"
                    >
                      Verificar identidad →
                    </Link>
                  )
              }
              {rawReviews && rawReviews.length > 0 && (
                <div className="flex items-center gap-2">
                  <StarRating value={avgRating} size={14} />
                  <Link href={`/reviews/${userId}`} className="text-xs text-slate-500 hover:text-blue-600 hover:underline">
                    Ver {rawReviews.length}+ reviews
                  </Link>
                </div>
              )}
            </div>
          </div>

          <PerfilClient
            userId={userId}
            userEmail={userEmail}
            emailVerificado={emailVerificado}
            perfil={{
              nombre:          (perfil?.nombre as string)          ?? null,
              telefono:        (perfil?.telefono as string)        ?? null,
              whatsapp:        (perfil?.whatsapp as string)        ?? null,
              show_phone:      (perfil?.show_phone as boolean)     ?? false,
              show_whatsapp:   (perfil?.show_whatsapp as boolean)  ?? false,
              notify_messages: (perfil?.notify_messages as boolean) ?? true,
              cuit:            (perfil?.cuit as string)            ?? null,
              razon_social:    (perfil?.razon_social as string)    ?? null,
              condicion_afip:  (perfil?.condicion_afip as string)  ?? null,
              created_at:      (perfil?.created_at as string)      ?? null,
            }}
            propiedades={props}
            mensajes={mensajes}
          />
        </div>
      </main>
    </div>
  )
}
