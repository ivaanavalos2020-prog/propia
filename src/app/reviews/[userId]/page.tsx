import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import StarRating from '@/components/StarRating'
import BadgeVerificado from '@/components/BadgeVerificado'
import ReviewFormClient from './ReviewFormClient'

export async function generateMetadata({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const supabase = await createServerSupabaseClient()
  const { data: perfil } = await supabase
    .from('profiles')
    .select('nombre')
    .eq('id', userId)
    .single()
  const nombre = (perfil?.nombre as string) ?? 'Usuario'
  return { title: `Reviews de ${nombre} — PROPIA` }
}

function fechaCorta(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function ReviewsPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const supabase = await createServerSupabaseClient()

  // Perfil del usuario reseñado
  const { data: perfil } = await supabase
    .from('profiles')
    .select('nombre, identity_verified, created_at')
    .eq('id', userId)
    .single()

  if (!perfil) notFound()

  // Reviews recibidas
  const { data: rawReviews } = await supabase
    .from('reviews')
    .select('id, rating, comment, reviewer_role, created_at, reviewer_id, profiles!reviewer_id(nombre, identity_verified)')
    .eq('reviewed_id', userId)
    .order('created_at', { ascending: false })

  type ReviewRow = {
    id: string
    rating: number
    comment: string | null
    reviewer_role: string
    created_at: string
    reviewer_id: string
    profiles: { nombre: string | null; identity_verified: boolean | null } | null
  }

  const reviews = (rawReviews ?? []) as unknown as ReviewRow[]

  const totalReviews = reviews.length
  const avgRating = totalReviews > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
    : 0

  // Distribución por estrellas
  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    pct: totalReviews > 0
      ? Math.round((reviews.filter((r) => r.rating === star).length / totalReviews) * 100)
      : 0,
  }))

  // Sesión del usuario logueado para saber si puede dejar review
  const { data: { session } } = await supabase.auth.getSession()
  const currentUserId = session?.user.id ?? null

  // Puede dejar review si es distinto al reseñado y aún no dejó una
  // (necesitamos property_id para la restricción UNIQUE, pero para simplificar
  //  permitimos una review general sin propiedad usando un check en el cliente)
  const puedeResenar = !!currentUserId && currentUserId !== userId

  const nombre = (perfil.nombre as string) ?? 'Usuario'
  const isVerified = (perfil.identity_verified as boolean) ?? false
  const memberSince = perfil.created_at as string | null

  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-50">
      <Navbar />
      <main className="flex flex-1 flex-col px-4 pt-24 pb-16 md:px-8">
        <div className="mx-auto w-full max-w-2xl">

          {/* Back link */}
          <Link href="/propiedades" className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-800">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Volver
          </Link>

          {/* Perfil card */}
          <div className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-700">
                {nombre[0]?.toUpperCase() ?? '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-lg font-extrabold text-slate-900">{nombre}</h1>
                  {isVerified && <BadgeVerificado size="sm" />}
                </div>
                {memberSince && (
                  <p className="mt-0.5 text-xs text-slate-400">
                    Miembro desde {new Date(memberSince).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
                  </p>
                )}

                {/* Rating resumen */}
                {totalReviews > 0 && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-3xl font-extrabold text-slate-900" style={{ letterSpacing: '-0.02em' }}>
                      {avgRating.toFixed(1)}
                    </span>
                    <div className="flex flex-col gap-0.5">
                      <StarRating value={avgRating} size={16} />
                      <p className="text-xs text-slate-400">{totalReviews} review{totalReviews !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Distribución de estrellas */}
            {totalReviews > 0 && (
              <div className="mt-5 flex flex-col gap-1.5">
                {dist.map(({ star, count, pct }) => (
                  <div key={star} className="flex items-center gap-2">
                    <span className="w-3 text-right text-xs font-semibold text-slate-500">{star}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="#F59E0B" className="shrink-0">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                    <div className="flex-1 rounded-full bg-slate-100 h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-400 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-xs text-slate-400">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lista de reviews */}
          {reviews.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-slate-300 bg-white p-8 text-center">
              <p className="text-sm text-slate-500">Este usuario todavía no recibió reviews.</p>
            </div>
          ) : (
            <div className="mt-6 flex flex-col gap-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                Reviews ({totalReviews})
              </h2>
              {reviews.map((r) => {
                const reviewerNombre = r.profiles?.nombre ?? 'Usuario'
                const reviewerVerif  = r.profiles?.identity_verified ?? false
                return (
                  <div key={r.id} className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                          {reviewerNombre[0]?.toUpperCase() ?? '?'}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-sm font-semibold text-slate-900">{reviewerNombre}</span>
                            {reviewerVerif && <BadgeVerificado size="sm" label="Verificado" />}
                            <span className={[
                              'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                              r.reviewer_role === 'dueno'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-purple-100 text-purple-700',
                            ].join(' ')}>
                              {r.reviewer_role === 'dueno' ? 'Dueño' : 'Inquilino'}
                            </span>
                          </div>
                          <StarRating value={r.rating} size={13} className="mt-0.5" />
                        </div>
                      </div>
                      <span className="shrink-0 text-xs text-slate-400">{fechaCorta(r.created_at)}</span>
                    </div>
                    {r.comment && (
                      <p className="mt-3 text-sm leading-relaxed text-slate-600">{r.comment}</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Formulario para dejar review */}
          {puedeResenar && (
            <ReviewFormClient
              reviewedId={userId}
              reviewedNombre={nombre}
              currentUserId={currentUserId!}
            />
          )}

        </div>
      </main>
    </div>
  )
}
