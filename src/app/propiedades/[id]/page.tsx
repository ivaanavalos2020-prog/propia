import type { Metadata } from 'next'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase'
import ModalContacto from './ModalContacto'

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
      'id, tipo, direccion, precio, incluye_expensas, descripcion, ambientes, banos, superficie, acepta_mascotas, acepta_ninos'
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

  const tipo = TIPO_LABEL[propiedad.tipo] ?? propiedad.tipo
  const precio = Number(propiedad.precio).toLocaleString('es-AR')
  const title = `${tipo} en ${propiedad.direccion}`
  const description = `Alquilá este ${tipo.toLowerCase()} en ${propiedad.direccion} por USD ${precio}/mes. Sin intermediarios ni comisiones abusivas.`

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

  const tipo = TIPO_LABEL[propiedad.tipo] ?? propiedad.tipo

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RentAction',
    name: `${tipo} en alquiler — ${propiedad.direccion}`,
    description: propiedad.descripcion ?? `${tipo} en alquiler en ${propiedad.direccion}`,
    url: `${BASE_URL}/propiedades/${propiedad.id}`,
    object: {
      '@type': 'Accommodation',
      name: `${tipo} en ${propiedad.direccion}`,
      accommodationCategory: tipo,
      address: {
        '@type': 'PostalAddress',
        streetAddress: propiedad.direccion,
        addressCountry: 'AR',
      },
      ...(propiedad.superficie != null && { floorSize: { '@type': 'QuantitativeValue', value: propiedad.superficie, unitCode: 'MTK' } }),
      ...(propiedad.ambientes != null && { numberOfRooms: propiedad.ambientes }),
      ...(propiedad.banos != null && { numberOfBathroomsTotal: propiedad.banos }),
      petsAllowed: propiedad.acepta_mascotas ?? false,
    },
    priceSpecification: {
      '@type': 'UnitPriceSpecification',
      price: propiedad.precio,
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
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-zinc-500">{tipo}</span>
            <h1 className="text-2xl font-bold text-zinc-50">{propiedad.direccion}</h1>
          </div>

          {/* Precio */}
          <div className="mt-6 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-zinc-50">
              USD {Number(propiedad.precio).toLocaleString('es-AR')}
            </span>
            <span className="text-sm text-zinc-500">/ mes</span>
            {propiedad.incluye_expensas && (
              <span className="ml-1 rounded-full border border-zinc-700 px-2.5 py-0.5 text-xs text-zinc-400">
                Expensas incluidas
              </span>
            )}
          </div>

          {/* Descripción */}
          {propiedad.descripcion && (
            <p className="mt-6 text-base leading-relaxed text-zinc-400">
              {propiedad.descripcion}
            </p>
          )}

          {/* Grilla de detalles */}
          <div className="mt-8 grid grid-cols-2 gap-6 rounded-xl border border-zinc-800 bg-zinc-900 p-6 sm:grid-cols-3">
            {propiedad.ambientes != null && (
              <Detalle label="Ambientes" valor={propiedad.ambientes} />
            )}
            {propiedad.banos != null && (
              <Detalle label="Baños" valor={propiedad.banos} />
            )}
            {propiedad.superficie != null && (
              <Detalle label="Superficie" valor={`${propiedad.superficie} m²`} />
            )}
            <Detalle
              label="Mascotas"
              valor={
                propiedad.acepta_mascotas == null
                  ? 'A consultar'
                  : propiedad.acepta_mascotas
                  ? 'Acepta'
                  : 'No acepta'
              }
            />
            <Detalle
              label="Niños"
              valor={
                propiedad.acepta_ninos == null
                  ? 'A consultar'
                  : propiedad.acepta_ninos
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
