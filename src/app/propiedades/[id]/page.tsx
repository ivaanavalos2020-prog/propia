import type { Metadata } from 'next'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import BotonFavorito from './BotonFavorito'
import BotonCompartir from './BotonCompartir'
import GaleriaFotos from './GaleriaFotos'
import BotonesContacto from './BotonesContacto'
import ContadorVistas from './ContadorVistas'
import VentajasUbicacion from './VentajasUbicacion'
import StarRating from '@/components/StarRating'
import BadgeVerificado from '@/components/BadgeVerificado'
import TrustScoreCircle from '@/components/TrustScoreCircle'
import { calcularTrustScore } from '@/lib/trustScore'

const BASE_URL = 'https://propia-kappa.vercel.app'

const TIPO_LABEL: Record<string, string> = {
  departamento: 'Departamento',
  casa: 'Casa',
  habitacion: 'Habitación',
  local: 'Local comercial',
}

const CONTRATO_LABEL: Record<string, string> = {
  tradicional: 'Alquiler tradicional',
  temporario: 'Alquiler temporario',
  temporada: 'Por temporada',
  a_convenir: 'A convenir',
}

const DEPOSITO_LABEL: Record<string, string> = {
  sin_deposito: 'Sin depósito',
  '1_mes': '1 mes',
  '2_meses': '2 meses',
  '3_meses': '3 meses',
  a_negociar: 'A negociar',
}

const GARANTIA_LABEL: Record<string, string> = {
  propietario: 'Garantía propietario',
  recibo_sueldo: 'Recibo de sueldo',
  aval_bancario: 'Aval bancario',
  fiador: 'Fiador',
  seguro_de_caucion: 'Seguro de caución',
  garantia_digital: 'Garantía digital',
}

const SERVICIO_LABEL: Record<string, string> = {
  agua: 'Agua',
  gas: 'Gas',
  luz: 'Luz',
  internet: 'Internet',
  cable: 'Cable',
  telefono: 'Teléfono',
}

const CONDITION_LABEL: Record<string, string> = {
  excelente: 'Excelente',
  muy_bueno: 'Muy bueno',
  bueno: 'Bueno',
  a_reciclar: 'A reciclar',
}

async function getPropiedad(id: string) {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('properties')
    .select(
      'id, type, address, neighborhood, city, property_references, price_usd, includes_expenses, has_expenses, expenses_amount, expenses_included, deposit_months, contract_type, contract_duration_months, update_index, guarantees_accepted, services_included, description, bedrooms, bathrooms, rooms, toilettes, area_m2, total_area_m2, floor_number, property_age, property_condition, allows_pets, pets_policy, allows_kids, allows_smoking, allows_wfh, status, photo_urls, created_at, owner_id, views_count, has_garage, has_storage, has_garden, has_terrace, has_pool, has_bbq, has_gym, has_laundry, has_security, has_elevator, has_heating, has_ac, is_furnished, has_appliances'
    )
    .eq('id', id)
    .single()
  return data
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const propiedad = await getPropiedad(id)

  if (!propiedad) {
    return { title: 'Propiedad no encontrada' }
  }

  const tipo = TIPO_LABEL[propiedad.type] ?? propiedad.type
  const precio = Number(propiedad.price_usd).toLocaleString('es-AR')
  const title = `${tipo} en ${propiedad.address}`
  const description = `Alquilá este ${tipo.toLowerCase()} en ${propiedad.address} por USD ${precio}/mes. Sin intermediarios ni comisiones abusivas.`
  const ogImage = propiedad.photo_urls?.[0] ?? `${BASE_URL}/og-placeholder.png`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/propiedades/${propiedad.id}`,
      type: 'website',
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}

function Caracteristica({
  icono,
  label,
  valor,
}: {
  icono: React.ReactNode
  label: string
  valor: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3">
      <span className="shrink-0 text-slate-400">{icono}</span>
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
        <span className="text-sm font-semibold text-slate-900">{valor}</span>
      </div>
    </div>
  )
}

const IconoCama = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 9V4a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v5"/><path d="M2 9h20v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9z"/><path d="M6 9v4"/><path d="M18 9v4"/><path d="M2 15h20"/>
  </svg>
)
const IconoBano = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 6a3 3 0 0 1 6 0v8H9V6z"/><path d="M3 14h18v2a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5v-2z"/><path d="M5 14V8"/>
  </svg>
)
const IconoSuperficie = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>
  </svg>
)
const IconoMascota = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>
  </svg>
)
const IconoNino = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="5" r="3"/><path d="M6.5 10.5c1.5-1 3.5-1.5 5.5-1.5s4 .5 5.5 1.5L19 20H5l1.5-9.5z"/>
  </svg>
)
const IconoExpensas = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>
  </svg>
)

export default async function PropiedadPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const propiedad = await getPropiedad(id)

  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  const userId = session?.user.id ?? null
  const userEmail = session?.user.email ?? null

  let esFavorito = false
  if (userId && propiedad) {
    const { data } = await supabase
      .from('favoritos')
      .select('id')
      .eq('user_id', userId)
      .eq('property_id', propiedad.id)
      .maybeSingle()
    esFavorito = !!data
  }

  let yaConsulto = false
  if (userEmail && propiedad) {
    const { data } = await supabase
      .from('mensajes')
      .select('id')
      .eq('property_id', propiedad.id)
      .eq('sender_email', userEmail)
      .maybeSingle()
    yaConsulto = !!data
  }

  // ── Owner profile + reviews + trust score ───────────────────────
  type OwnerData = {
    nombre: string | null
    identity_verified: boolean
    verification_status: string
    telefono: string | null
    avatar_url: string | null
    created_at: string | null
    avgRating: number
    reviewCount: number
    trustScore: ReturnType<typeof calcularTrustScore>
    totalMensajes: number
    totalRespondidos: number
  }

  let ownerData: OwnerData | null = null

  if (propiedad?.owner_id) {
    const ownerId = propiedad.owner_id as string

    // Mensajes para calcular tasa de respuesta
    const [ownerPerfilResult, ownerReviewsResult, propMensajesResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('nombre, identity_verified, verification_status, telefono, avatar_url, created_at')
        .eq('id', ownerId)
        .single(),
      supabase
        .from('reviews')
        .select('rating')
        .eq('reviewed_id', ownerId),
      supabase
        .from('mensajes')
        .select('id')
        .in('property_id', [propiedad.id]),
    ])

    const ownerPerfil = ownerPerfilResult.data
    const rawReviews  = ownerReviewsResult.data ?? []
    const rawMensajes = propMensajesResult.data ?? []

    // Contar cuántos mensajes tienen al menos una respuesta
    let respondidos = 0
    if (rawMensajes.length > 0) {
      const { data: respuestas } = await supabase
        .from('respuestas_mensajes')
        .select('mensaje_id')
        .in('mensaje_id', rawMensajes.map((m) => m.id))
        .eq('autor', 'dueno')
      const respondidosSet = new Set((respuestas ?? []).map((r) => r.mensaje_id))
      respondidos = respondidosSet.size
    }

    const avgRating = rawReviews.length > 0
      ? rawReviews.reduce((s, r) => s + (r.rating as number), 0) / rawReviews.length
      : 0
    const responseRate = rawMensajes.length > 0 ? respondidos / rawMensajes.length : 0

    const trustScore = calcularTrustScore({
      identityVerified: (ownerPerfil?.identity_verified as boolean) ?? false,
      phone:            (ownerPerfil?.telefono as string) ?? null,
      avatarUrl:        (ownerPerfil?.avatar_url as string) ?? null,
      createdAt:        (ownerPerfil?.created_at as string) ?? null,
      avgRating,
      responseRate,
    })

    ownerData = {
      nombre:               (ownerPerfil?.nombre as string) ?? null,
      identity_verified:    (ownerPerfil?.identity_verified as boolean) ?? false,
      verification_status:  (ownerPerfil?.verification_status as string) ?? 'unverified',
      telefono:             (ownerPerfil?.telefono as string) ?? null,
      avatar_url:           (ownerPerfil?.avatar_url as string) ?? null,
      created_at:           (ownerPerfil?.created_at as string) ?? null,
      avgRating,
      reviewCount:          rawReviews.length,
      trustScore,
      totalMensajes:        rawMensajes.length,
      totalRespondidos:     respondidos,
    }
  }

  if (!propiedad) {
    return (
      <div className="flex min-h-full flex-1 flex-col bg-slate-50">
        <Navbar />
        <main className="flex flex-1 items-center justify-center pt-16">
          <p className="text-base text-slate-500">Propiedad no encontrada.</p>
        </main>
      </div>
    )
  }

  // Propiedades similares
  const { data: similares } = await (await createServerSupabaseClient())
    .from('properties')
    .select('id, type, address, neighborhood, city, price_usd, bedrooms, area_m2')
    .eq('type', propiedad.type)
    .eq('status', 'active')
    .neq('id', propiedad.id)
    .order('created_at', { ascending: false })
    .limit(3)

  const tipo = TIPO_LABEL[propiedad.type] ?? propiedad.type
  const fotos: string[] = propiedad.photo_urls ?? []

  // Badge "Nueva" si fue publicada hace menos de 7 días
  const esNueva =
    propiedad.created_at &&
    Date.now() - new Date(propiedad.created_at).getTime() < 7 * 24 * 60 * 60 * 1000

  const urlPropiedad = `${BASE_URL}/propiedades/${propiedad.id}`
  const textoWhatsApp = encodeURIComponent(
    `Mirá esta propiedad en PROPIA: ${propiedad.address} por USD ${Number(propiedad.price_usd).toLocaleString('es-AR')}/mes → ${urlPropiedad}`
  )

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RentAction',
    name: `${tipo} en alquiler — ${propiedad.address}`,
    description: propiedad.description ?? `${tipo} en alquiler en ${propiedad.address}`,
    url: `${BASE_URL}/propiedades/${propiedad.id}`,
    object: {
      '@type': 'Accommodation',
      name: `${tipo} en ${propiedad.address}`,
      accommodationCategory: tipo,
      address: { '@type': 'PostalAddress', streetAddress: propiedad.address, addressCountry: 'AR' },
      ...(propiedad.area_m2 != null && { floorSize: { '@type': 'QuantitativeValue', value: propiedad.area_m2, unitCode: 'MTK' } }),
      ...(propiedad.bedrooms != null && { numberOfRooms: propiedad.bedrooms }),
      ...(propiedad.bathrooms != null && { numberOfBathroomsTotal: propiedad.bathrooms }),
      petsAllowed: propiedad.allows_pets ?? false,
    },
    priceSpecification: {
      '@type': 'UnitPriceSpecification',
      price: propiedad.price_usd,
      priceCurrency: 'USD',
      unitCode: 'MON',
      billingIncrement: 1,
    },
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />

      <main className="flex flex-1 flex-col px-6 pt-24 pb-12 md:px-10">
        <div className="mx-auto w-full max-w-6xl">

          <ContadorVistas propertyId={propiedad.id} />

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-1.5 text-sm text-slate-400">
            <Link href="/" className="transition-colors hover:text-slate-700">Inicio</Link>
            <span aria-hidden="true">/</span>
            <Link href="/propiedades" className="transition-colors hover:text-slate-700">Propiedades</Link>
            <span aria-hidden="true">/</span>
            <span className="truncate max-w-[200px] text-slate-600" aria-current="page">
              {propiedad.address}
            </span>
          </nav>

          {/* Banner: ya enviaste una consulta */}
          {yaConsulto && (
            <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-blue-200 bg-blue-50 px-5 py-4">
              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-blue-600">
                  <circle cx="12" cy="12" r="10" /><path d="M12 16v-4"/><path d="M12 8h.01"/>
                </svg>
                <p className="text-sm font-medium text-blue-800">Ya enviaste una consulta por esta propiedad.</p>
              </div>
              <Link
                href="/dashboard/mensajes"
                className="shrink-0 text-sm font-semibold text-blue-600 transition-colors hover:text-blue-800"
              >
                Ver mensajes →
              </Link>
            </div>
          )}

          {/* Galería */}
          <GaleriaFotos fotos={fotos} />

          {/* Contenido */}
          <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">

            {/* Columna izquierda */}
            <div className="flex flex-1 flex-col gap-8">

              {/* Encabezado */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex w-fit rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-blue-600">
                      {tipo}
                    </span>
                    {esNueva && (
                      <span className="inline-flex w-fit rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                        Nueva
                      </span>
                    )}
                  </div>
                  <h1 className="text-3xl font-extrabold leading-tight text-slate-900 md:text-4xl" style={{ letterSpacing: '-0.02em' }}>
                    {propiedad.address}
                  </h1>
                  {(propiedad.neighborhood || propiedad.city) && (
                    <p className="text-slate-500">
                      {[propiedad.neighborhood, propiedad.city].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {/* WhatsApp */}
                  <a
                    href={`https://wa.me/?text=${textoWhatsApp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Compartir por WhatsApp"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-400 transition-colors hover:border-green-300 hover:bg-green-50 hover:text-green-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                    </svg>
                  </a>
                  <BotonCompartir url={`${BASE_URL}/propiedades/${propiedad.id}`} />
                  <BotonFavorito propertyId={propiedad.id} userId={userId} esFavorito={esFavorito} />
                </div>
              </div>

              {/* Precio mobile */}
              <div className="flex items-baseline gap-2 rounded-xl border border-slate-300 bg-white p-4 shadow-sm lg:hidden">
                <span className="text-4xl font-extrabold text-slate-900" style={{ letterSpacing: '-0.02em' }}>
                  USD {Number(propiedad.price_usd).toLocaleString('es-AR')}
                </span>
                <span className="text-base text-slate-400">/ mes</span>
              </div>

              {/* Descripción */}
              {propiedad.description && (
                <div className="flex flex-col gap-2">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Descripción</h2>
                  <p className="text-base leading-relaxed text-slate-600">{propiedad.description}</p>
                </div>
              )}

              {/* Características */}
              <div className="flex flex-col gap-3">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Características</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {(propiedad.rooms ?? propiedad.bedrooms) != null && (
                    <Caracteristica icono={<IconoCama />} label="Ambientes" valor={propiedad.rooms ?? propiedad.bedrooms} />
                  )}
                  {propiedad.bedrooms != null && propiedad.rooms != null && propiedad.bedrooms !== propiedad.rooms && (
                    <Caracteristica icono={<IconoCama />} label="Dormitorios" valor={propiedad.bedrooms} />
                  )}
                  {propiedad.bathrooms != null && (
                    <Caracteristica icono={<IconoBano />} label="Baños" valor={propiedad.bathrooms} />
                  )}
                  {(propiedad.toilettes as number | null) != null && (
                    <Caracteristica icono={<IconoBano />} label="Toilettes" valor={propiedad.toilettes as number} />
                  )}
                  {propiedad.area_m2 != null && (
                    <Caracteristica icono={<IconoSuperficie />} label="Sup. cubierta" valor={`${propiedad.area_m2} m²`} />
                  )}
                  {(propiedad.total_area_m2 as number | null) != null && (
                    <Caracteristica icono={<IconoSuperficie />} label="Sup. total" valor={`${propiedad.total_area_m2 as number} m²`} />
                  )}
                  {(propiedad.floor_number as number | null) != null && (
                    <Caracteristica icono={<IconoSuperficie />} label="Piso" valor={`${propiedad.floor_number as number}°`} />
                  )}
                  {(propiedad.property_age as number | null) != null && (
                    <Caracteristica icono={<IconoSuperficie />} label="Antigüedad" valor={`${propiedad.property_age as number} años`} />
                  )}
                  {(propiedad.property_condition as string | null) && (
                    <Caracteristica icono={<IconoSuperficie />} label="Estado" valor={CONDITION_LABEL[propiedad.property_condition as string] ?? propiedad.property_condition as string} />
                  )}
                  <Caracteristica
                    icono={<IconoExpensas />}
                    label="Expensas"
                    valor={
                      (propiedad.has_expenses as boolean | null) == null && propiedad.includes_expenses == null
                        ? 'A consultar'
                        : (propiedad.expenses_included as boolean | null) || propiedad.includes_expenses
                        ? (propiedad.expenses_amount as number | null)
                          ? `Incluidas (USD ${propiedad.expenses_amount as number}/mes)`
                          : 'Incluidas'
                        : 'No incluidas'
                    }
                  />
                </div>
              </div>

              {/* Políticas de convivencia */}
              {(propiedad.pets_policy != null || propiedad.allows_kids != null || propiedad.allows_smoking != null || propiedad.allows_wfh != null) && (
                <div className="flex flex-col gap-3">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Políticas</h2>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {propiedad.pets_policy != null && (
                      <Caracteristica
                        icono={<IconoMascota />}
                        label="Mascotas"
                        valor={
                          propiedad.pets_policy === 'si' ? 'Acepta' :
                          propiedad.pets_policy === 'no' ? 'No acepta' :
                          propiedad.pets_policy === 'consultar' ? 'A consultar' :
                          (propiedad.allows_pets == null ? 'A consultar' : propiedad.allows_pets ? 'Acepta' : 'No acepta')
                        }
                      />
                    )}
                    {propiedad.allows_kids != null && (
                      <Caracteristica
                        icono={<IconoNino />}
                        label="Niños"
                        valor={propiedad.allows_kids ? 'Acepta' : 'No acepta'}
                      />
                    )}
                    {(propiedad.allows_smoking as boolean | null) != null && (
                      <Caracteristica
                        icono={<IconoNino />}
                        label="Fumar"
                        valor={(propiedad.allows_smoking as boolean) ? 'Permitido' : 'No permitido'}
                      />
                    )}
                    {(propiedad.allows_wfh as boolean | null) != null && (
                      <Caracteristica
                        icono={<IconoNino />}
                        label="Home office"
                        valor={(propiedad.allows_wfh as boolean) ? 'Permitido' : 'No permitido'}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Comodidades */}
              {(() => {
                const comodidades = [
                  { campo: 'has_garage',    label: 'Cochera',         emoji: '🚗' },
                  { campo: 'has_storage',   label: 'Baulera',         emoji: '📦' },
                  { campo: 'has_garden',    label: 'Jardín',          emoji: '🌿' },
                  { campo: 'has_terrace',   label: 'Terraza/Balcón',  emoji: '🏗️' },
                  { campo: 'has_pool',      label: 'Pileta',          emoji: '🏊' },
                  { campo: 'has_bbq',       label: 'Quincho/BBQ',     emoji: '🔥' },
                  { campo: 'has_gym',       label: 'Gimnasio',        emoji: '💪' },
                  { campo: 'has_laundry',   label: 'Laundry',         emoji: '👕' },
                  { campo: 'has_security',  label: 'Seguridad 24h',   emoji: '🔒' },
                  { campo: 'has_elevator',  label: 'Ascensor',        emoji: '🛗' },
                  { campo: 'has_heating',   label: 'Calefacción',     emoji: '🌡️' },
                  { campo: 'has_ac',        label: 'Aire acondicionado', emoji: '❄️' },
                  { campo: 'is_furnished',  label: 'Amoblado',        emoji: '🛋️' },
                  { campo: 'has_appliances', label: 'Electrodomésticos', emoji: '🍳' },
                ] as const

                const activas = comodidades.filter(
                  (c) => (propiedad as Record<string, unknown>)[c.campo] === true
                )

                if (activas.length === 0) return null

                return (
                  <div className="flex flex-col gap-3">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Comodidades</h2>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {activas.map((c) => (
                        <div
                          key={c.campo}
                          className="flex items-center gap-2.5 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5"
                        >
                          <span className="text-base leading-none">{c.emoji}</span>
                          <span className="text-sm font-medium text-slate-700">{c.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}

              {/* Contrato */}
              {((propiedad.contract_type as string | null) || (propiedad.guarantees_accepted as string[] | null)?.length || (propiedad.services_included as string[] | null)?.length) && (
                <div className="flex flex-col gap-3">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Contrato</h2>
                  <div className="rounded-xl border border-slate-300 bg-white p-5 flex flex-col gap-4">
                    {(propiedad.contract_type as string | null) && (
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Tipo de contrato</p>
                          <p className="text-sm font-semibold text-slate-800">
                            {CONTRATO_LABEL[propiedad.contract_type as string] ?? propiedad.contract_type as string}
                          </p>
                          {(propiedad.contract_duration_months as number | null) && (
                            <p className="text-xs text-slate-500">{propiedad.contract_duration_months as number} meses</p>
                          )}
                        </div>
                      </div>
                    )}

                    {(propiedad.deposit_months as string | null) && (propiedad.deposit_months as string) !== 'sin_deposito' && (
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Depósito</p>
                          <p className="text-sm font-semibold text-slate-800">
                            {DEPOSITO_LABEL[propiedad.deposit_months as string] ?? propiedad.deposit_months as string}
                          </p>
                        </div>
                      </div>
                    )}

                    {((propiedad.guarantees_accepted as string[] | null) ?? []).length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Garantías aceptadas</p>
                        <div className="flex flex-wrap gap-2">
                          {(propiedad.guarantees_accepted as string[]).map((g) => (
                            <span key={g} className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                              {GARANTIA_LABEL[g] ?? g}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {((propiedad.services_included as string[] | null) ?? []).length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Servicios incluidos</p>
                        <div className="flex flex-wrap gap-2">
                          {(propiedad.services_included as string[]).map((s) => (
                            <span key={s} className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                              {SERVICIO_LABEL[s] ?? s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Ubicación */}
              {(() => {
                const partes = [propiedad.address, propiedad.neighborhood, propiedad.city].filter(Boolean)
                const tieneUbicacion = partes.length > 0
                const direccionMapa = [...partes, 'Argentina'].join(', ')
                const mapsQuery = encodeURIComponent(direccionMapa)

                return (
                  <div className="flex flex-col gap-3">
                    <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/>
                      </svg>
                      Ubicación
                    </h2>

                    <div className="flex flex-col gap-5 rounded-xl border border-slate-300 bg-white p-5 shadow-sm">

                      {!tieneUbicacion ? (
                        /* ── Fallback: sin dirección ── */
                        <div className="flex flex-col items-center gap-3 py-10 text-slate-300">
                          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/>
                          </svg>
                          <p className="text-sm font-medium text-slate-400">Ubicación no especificada</p>
                        </div>
                      ) : (
                        <>
                          {/* Dirección en tres líneas */}
                          <div className="flex flex-col gap-0.5">
                            {propiedad.address && (
                              <p className="text-base font-bold text-slate-900">{propiedad.address}</p>
                            )}
                            {propiedad.neighborhood && (
                              <p className="text-sm text-slate-600">{propiedad.neighborhood}</p>
                            )}
                            {propiedad.city && (
                              <p className="text-sm text-slate-500">{propiedad.city}</p>
                            )}
                            {propiedad.property_references && (
                              <div className="mt-2 flex items-start gap-1.5">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true">
                                  <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
                                </svg>
                                <p className="text-sm text-slate-500">
                                  <span className="font-medium text-slate-600">Referencias:</span>{' '}
                                  {propiedad.property_references}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Badge de zona */}
                          {propiedad.neighborhood && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-400">Zona:</span>
                              <Link
                                href={`/propiedades?barrio=${encodeURIComponent(propiedad.neighborhood)}`}
                                className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100"
                              >
                                {propiedad.neighborhood}
                              </Link>
                            </div>
                          )}

                          {/* Mapa */}
                          <div className="overflow-hidden rounded-xl" style={{ borderRadius: '12px' }}>
                            <iframe
                              title="Mapa de ubicación"
                              src={`https://maps.google.com/maps?q=${mapsQuery}&output=embed&z=15&hl=es`}
                              width="100%"
                              height="380"
                              style={{ border: 'none', borderRadius: '12px', display: 'block' }}
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                            />
                          </div>

                          {/* Botones */}
                          <div className="flex flex-wrap gap-3">
                            <a
                              href={`https://www.google.com/maps/search/${mapsQuery}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 transition-colors hover:border-blue-400 hover:bg-blue-50"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                              </svg>
                              Abrir en Google Maps
                            </a>
                            <a
                              href={`https://www.google.com/maps/dir//${mapsQuery}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 transition-colors hover:border-blue-400 hover:bg-blue-50"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                              Cómo llegar
                            </a>
                          </div>

                          {/* Privacidad */}
                          <p className="text-xs text-slate-400">
                            🔒 La dirección exacta se comparte solo cuando el dueño lo confirma
                          </p>
                        </>
                      )}

                    </div>
                  </div>
                )
              })()}

              {/* Ventajas de la ubicación */}
              <VentajasUbicacion
                propertyId={propiedad.id}
                address={propiedad.address ?? null}
                neighborhood={propiedad.neighborhood ?? null}
                city={propiedad.city ?? null}
              />

              {/* CTAs mobile */}
              <div className="flex flex-col gap-3 lg:hidden">
                <BotonesContacto propertyId={propiedad.id} userEmail={userEmail} yaConsulto={yaConsulto} />
              </div>

              {/* ── Por qué confiar en esta publicación ──────────── */}
              {ownerData && (
                <div className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500">
                    Por qué confiar en esta publicación
                  </h2>

                  <div className="flex flex-col gap-3">
                    {/* Antigüedad */}
                    {propiedad.created_at && (
                      <div className="flex items-center gap-3">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </span>
                        <p className="text-sm text-slate-600">
                          Publicado hace{' '}
                          {Math.max(1, Math.round((Date.now() - new Date(propiedad.created_at as string).getTime()) / 86_400_000))}{' '}
                          días
                        </p>
                      </div>
                    )}

                    {/* Verificación */}
                    {ownerData.identity_verified ? (
                      <div className="flex items-center gap-3">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </span>
                        <p className="text-sm text-slate-600">Dueño verificado por PROPIA</p>
                      </div>
                    ) : ownerData.verification_status === 'pending' ? (
                      <div className="flex items-center gap-3">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        </span>
                        <p className="text-sm text-slate-600">Verificación del dueño pendiente</p>
                      </div>
                    ) : null}

                    {/* Consultas respondidas */}
                    {ownerData.totalMensajes > 0 && (
                      <div className="flex items-center gap-3">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </span>
                        <p className="text-sm text-slate-600">
                          {ownerData.totalRespondidos} de {ownerData.totalMensajes} consultas respondidas
                          {' '}({Math.round((ownerData.totalRespondidos / ownerData.totalMensajes) * 100)}%)
                        </p>
                      </div>
                    )}

                    {/* Reviews positivas */}
                    {ownerData.reviewCount > 0 && (
                      <div className="flex items-center gap-3">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </span>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-slate-600">{ownerData.reviewCount} reviews del dueño</p>
                          <StarRating value={ownerData.avgRating} size={12} />
                          <Link
                            href={`/reviews/${propiedad.owner_id}`}
                            className="text-xs font-medium text-blue-600 hover:underline"
                          >
                            Ver →
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Trust score del dueño */}
                  {ownerData && (
                    <div className="mt-5 flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                      <TrustScoreCircle result={ownerData.trustScore} size="sm" />
                      <div>
                        <p className="text-xs font-semibold text-slate-700">Score de confianza del dueño</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Calculado en base a verificación, reviews y actividad
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Columna derecha — card sticky (desktop) */}
            <div className="hidden lg:block lg:w-80 xl:w-96">
              <div className="sticky top-24 flex flex-col gap-6 rounded-2xl border border-slate-300 bg-white p-6 shadow-md">
                <div className="flex flex-col gap-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold text-slate-900" style={{ letterSpacing: '-0.02em' }}>
                      USD {Number(propiedad.price_usd).toLocaleString('es-AR')}
                    </span>
                  </div>
                  <span className="text-sm text-slate-400">por mes</span>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {((propiedad.expenses_included as boolean | null) || propiedad.includes_expenses) && (
                      <span className="inline-flex w-fit rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                        Expensas incluidas
                      </span>
                    )}
                    {(propiedad.contract_type as string | null) && (
                      <span className="inline-flex w-fit rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                        {CONTRATO_LABEL[propiedad.contract_type as string] ?? propiedad.contract_type as string}
                      </span>
                    )}
                  </div>
                </div>

                <div className="h-px bg-slate-100" />

                <BotonesContacto propertyId={propiedad.id} userEmail={userEmail} yaConsulto={yaConsulto} />

                <div className="flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-green-600">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <p className="text-xs font-medium text-green-700">
                    Sin comisiones ni intermediarios
                  </p>
                </div>

                {/* Owner badge + rating */}
                {ownerData && (ownerData.identity_verified || ownerData.reviewCount > 0) && (
                  <div className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3">
                    {ownerData.identity_verified && (
                      <div className="flex justify-center">
                        <BadgeVerificado label="Dueño verificado" />
                      </div>
                    )}
                    {ownerData.reviewCount > 0 && (
                      <div className="flex flex-col items-center gap-1">
                        <StarRating value={ownerData.avgRating} size={14} />
                        <Link
                          href={`/reviews/${propiedad.owner_id}`}
                          className="text-xs text-slate-500 hover:text-blue-600"
                        >
                          Ver {ownerData.reviewCount} review{ownerData.reviewCount !== 1 ? 's' : ''} del dueño
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {(propiedad.views_count ?? 0) > 0 && (
                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                    {propiedad.views_count} vista{propiedad.views_count !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Propiedades similares */}
          {similares && similares.length > 0 && (
            <section className="mt-16 border-t border-slate-300 pt-12">
              <h2 className="mb-6 text-xl font-bold text-slate-900" style={{ letterSpacing: '-0.01em' }}>
                Propiedades similares
              </h2>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {similares.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/propiedades/${p.id}`}
                      className="flex h-full flex-col gap-3 rounded-xl border border-slate-300 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex w-fit rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                          {TIPO_LABEL[p.type] ?? p.type}
                        </span>
                        <span className="line-clamp-2 text-sm font-semibold text-slate-900">
                          {p.address}
                        </span>
                        {(p.neighborhood || p.city) && (
                          <span className="text-xs text-slate-400">
                            {[p.neighborhood, p.city].filter(Boolean).join(', ')}
                          </span>
                        )}
                      </div>
                      <div className="mt-auto flex items-end justify-between">
                        <span className="text-lg font-bold text-blue-600">
                          USD {Number(p.price_usd).toLocaleString('es-AR')}
                          <span className="ml-1 text-xs font-normal text-slate-400">/mes</span>
                        </span>
                        <div className="flex gap-3 text-xs text-slate-400">
                          {p.bedrooms != null && <span>{p.bedrooms} amb.</span>}
                          {p.area_m2 != null && <span>{p.area_m2} m²</span>}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

        </div>
      </main>
    </div>
  )
}
