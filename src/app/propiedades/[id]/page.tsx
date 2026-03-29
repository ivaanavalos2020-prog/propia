import type { Metadata } from 'next'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase'
import ModalContacto from './ModalContacto'
import BotonFavorito from './BotonFavorito'

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
      'id, type, address, price_usd, includes_expenses, description, bedrooms, bathrooms, area_m2, allows_pets, allows_kids, status'
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

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/propiedades/${propiedad.id}`,
      type: 'website',
      images: [
        {
          url: `${BASE_URL}/og-placeholder.png`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${BASE_URL}/og-placeholder.png`],
    },
  }
}

function Detalle({ label, valor }: { label: string; valor: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">{label}</span>
      <span className="text-base text-zinc-50">{valor}</span>
    </div>
  )
}

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

  if (!propiedad) {
    return (
      <div className="flex min-h-full flex-1 flex-col bg-zinc-950 text-zinc-50">
        <header className="flex items-center border-b border-zinc-800 px-6 py-5 md:px-12">
          <Link href="/" className="text-lg font-bold tracking-widest text-zinc-50">
            PROPIA
          </Link>
        </header>
        <main className="flex flex-1 items-center justify-center">
          <p className="text-base text-zinc-400">Propiedad no encontrada.</p>
        </main>
      </div>
    )
  }

  const tipo = TIPO_LABEL[propiedad.type] ?? propiedad.type

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
      address: {
        '@type': 'PostalAddress',
        streetAddress: propiedad.address,
        addressCountry: 'AR',
      },
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
    <div className="flex min-h-full flex-1 flex-col bg-zinc-950 text-zinc-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Nav */}
      <header className="flex items-center border-b border-zinc-800 px-6 py-5 md:px-12">
        <Link href="/" className="text-lg font-bold tracking-widest text-zinc-50">
          PROPIA
        </Link>
      </header>

      <main className="flex flex-1 flex-col items-center px-6 py-10 md:px-12">
        <div className="w-full max-w-2xl">

          {/* Encabezado */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-zinc-500">{tipo}</span>
              <h1 className="text-2xl font-bold text-zinc-50">{propiedad.address}</h1>
            </div>
            <BotonFavorito
              propertyId={propiedad.id}
              userId={userId}
              esFavorito={esFavorito}
            />
          </div>

          {/* Precio */}
          <div className="mt-6 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-zinc-50">
              USD {Number(propiedad.price_usd).toLocaleString('es-AR')}
            </span>
            <span className="text-sm text-zinc-500">/ mes</span>
            {propiedad.includes_expenses && (
              <span className="ml-1 rounded-full border border-zinc-700 px-2.5 py-0.5 text-xs text-zinc-400">
                Expensas incluidas
              </span>
            )}
          </div>

          {/* Descripción */}
          {propiedad.description && (
            <p className="mt-6 text-base leading-relaxed text-zinc-400">
              {propiedad.description}
            </p>
          )}

          {/* Grilla de detalles */}
          <div className="mt-8 grid grid-cols-2 gap-6 rounded-xl border border-zinc-800 bg-zinc-900 p-6 sm:grid-cols-3">
            {propiedad.bedrooms != null && (
              <Detalle label="Ambientes" valor={propiedad.bedrooms} />
            )}
            {propiedad.bathrooms != null && (
              <Detalle label="Baños" valor={propiedad.bathrooms} />
            )}
            {propiedad.area_m2 != null && (
              <Detalle label="Superficie" valor={`${propiedad.area_m2} m²`} />
            )}
            <Detalle
              label="Mascotas"
              valor={
                propiedad.allows_pets == null
                  ? 'A consultar'
                  : propiedad.allows_pets
                  ? 'Acepta'
                  : 'No acepta'
              }
            />
            <Detalle
              label="Niños"
              valor={
                propiedad.allows_kids == null
                  ? 'A consultar'
                  : propiedad.allows_kids
                  ? 'Acepta'
                  : 'No acepta'
              }
            />
          </div>

          {/* CTAs */}
          <div className="mt-8 flex flex-col gap-3">
            <Link
              href="/login"
              className="flex w-full items-center justify-center rounded-xl bg-zinc-50 py-4 text-base font-semibold text-zinc-950 transition-opacity hover:opacity-80"
            >
              Quiero esta propiedad
            </Link>
            <ModalContacto />
          </div>

        </div>
      </main>
    </div>
  )
}
