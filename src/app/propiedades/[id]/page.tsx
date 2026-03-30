import type { Metadata } from 'next'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import BotonFavorito from './BotonFavorito'
import BotonCompartir from './BotonCompartir'
import GaleriaFotos from './GaleriaFotos'
import BotonesContacto from './BotonesContacto'
import ContadorVistas from './ContadorVistas'

const BASE_URL = 'https://propia-kappa.vercel.app'

const TIPO_LABEL: Record<string, string> = {
  departamento: 'Departamento',
  casa: 'Casa',
  habitacion: 'Habitación',
  local: 'Local comercial',
}

async function getPropiedad(id: string) {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('properties')
    .select(
      'id, type, address, neighborhood, city, property_references, price_usd, includes_expenses, description, bedrooms, bathrooms, area_m2, allows_pets, allows_kids, status, photo_urls, created_at, owner_id, views_count'
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
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
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
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-colors hover:border-green-300 hover:bg-green-50 hover:text-green-600"
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
              <div className="flex items-baseline gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:hidden">
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
                  {propiedad.bedrooms != null && (
                    <Caracteristica icono={<IconoCama />} label="Ambientes" valor={propiedad.bedrooms} />
                  )}
                  {propiedad.bathrooms != null && (
                    <Caracteristica icono={<IconoBano />} label="Baños" valor={propiedad.bathrooms} />
                  )}
                  {propiedad.area_m2 != null && (
                    <Caracteristica icono={<IconoSuperficie />} label="Superficie" valor={`${propiedad.area_m2} m²`} />
                  )}
                  <Caracteristica
                    icono={<IconoMascota />}
                    label="Mascotas"
                    valor={propiedad.allows_pets == null ? 'A consultar' : propiedad.allows_pets ? 'Acepta' : 'No acepta'}
                  />
                  <Caracteristica
                    icono={<IconoNino />}
                    label="Niños"
                    valor={propiedad.allows_kids == null ? 'A consultar' : propiedad.allows_kids ? 'Acepta' : 'No acepta'}
                  />
                  <Caracteristica
                    icono={<IconoExpensas />}
                    label="Expensas"
                    valor={propiedad.includes_expenses == null ? 'A consultar' : propiedad.includes_expenses ? 'Incluidas' : 'No incluidas'}
                  />
                </div>
              </div>

              {/* Ubicación */}
              {(() => {
                const partes = [propiedad.address, propiedad.neighborhood, propiedad.city].filter(Boolean)
                const direccionCompleta = partes.join(', ')
                const mapsQuery = encodeURIComponent(direccionCompleta)
                return (
                  <div className="flex flex-col gap-3">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Ubicación</h2>
                    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex flex-col gap-0.5">
                        <p className="text-sm font-semibold text-slate-900">{direccionCompleta || propiedad.address}</p>
                        {propiedad.property_references && (
                          <p className="text-sm text-slate-500">{propiedad.property_references}</p>
                        )}
                      </div>

                      <div className="overflow-hidden rounded-xl border border-slate-200">
                        <iframe
                          title="Mapa de ubicación"
                          src={`https://maps.google.com/maps?q=${mapsQuery}&output=embed`}
                          width="100%"
                          height="280"
                          style={{ border: 0 }}
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                        />
                      </div>

                      <a
                        href={`https://maps.google.com/maps?q=${mapsQuery}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 self-start text-sm font-semibold text-blue-600 transition-colors hover:text-blue-800"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                        Ver en Google Maps
                      </a>
                    </div>
                  </div>
                )
              })()}

              {/* CTAs mobile */}
              <div className="flex flex-col gap-3 lg:hidden">
                <BotonesContacto propertyId={propiedad.id} userEmail={userEmail} />
              </div>

            </div>

            {/* Columna derecha — card sticky (desktop) */}
            <div className="hidden lg:block lg:w-80 xl:w-96">
              <div className="sticky top-24 flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
                <div className="flex flex-col gap-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold text-slate-900" style={{ letterSpacing: '-0.02em' }}>
                      USD {Number(propiedad.price_usd).toLocaleString('es-AR')}
                    </span>
                  </div>
                  <span className="text-sm text-slate-400">por mes</span>
                  {propiedad.includes_expenses && (
                    <span className="mt-1 inline-flex w-fit rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                      Expensas incluidas
                    </span>
                  )}
                </div>

                <div className="h-px bg-slate-100" />

                <BotonesContacto propertyId={propiedad.id} userEmail={userEmail} />

                <div className="flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-green-600">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <p className="text-xs font-medium text-green-700">
                    Sin comisiones ni intermediarios
                  </p>
                </div>

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
            <section className="mt-16 border-t border-slate-200 pt-12">
              <h2 className="mb-6 text-xl font-bold text-slate-900" style={{ letterSpacing: '-0.01em' }}>
                Propiedades similares
              </h2>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {similares.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/propiedades/${p.id}`}
                      className="flex h-full flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
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
