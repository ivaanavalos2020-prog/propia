import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import FormularioEditar from './FormularioEditar'

const TIPO_LABEL: Record<string, string> = {
  departamento: 'Departamento',
  casa: 'Casa',
  habitacion: 'Habitación',
  local: 'Local comercial',
}

export default async function EditarPropiedadPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) redirect('/login')

  const { data: propiedad } = await supabase
    .from('properties')
    .select(
      'id, type, address, neighborhood, city, property_references, price_usd, includes_expenses, description, bedrooms, bathrooms, area_m2, allows_pets, allows_kids, status, photo_urls, video_urls, floor_number, property_age, has_garage, has_balcony, allows_smoking, owner_id'
    )
    .eq('id', id)
    .single()

  if (!propiedad) notFound()
  if (propiedad.owner_id !== session.user.id) redirect('/dashboard')

  const tipo = TIPO_LABEL[propiedad.type] ?? propiedad.type
  const direccionCompleta = [propiedad.address, propiedad.neighborhood, propiedad.city]
    .filter(Boolean)
    .join(', ')

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      <main className="flex flex-1 flex-col px-6 pt-24 pb-12 md:px-10">
        <div className="mx-auto w-full max-w-5xl">

          {/* Header */}
          <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
                Editando publicación
              </p>
              <h1
                className="mt-1 text-2xl font-extrabold text-slate-900"
                style={{ letterSpacing: '-0.02em' }}
              >
                {tipo}
              </h1>
              <p className="mt-1 text-sm text-slate-500">{direccionCompleta}</p>
            </div>
            <Link
              href={`/propiedades/${propiedad.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:border-blue-300 hover:text-blue-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              Ver publicación
            </Link>
          </div>

          <FormularioEditar
            id={propiedad.id}
            tipoInicial={propiedad.type}
            calleInicial={propiedad.address ?? ''}
            barrioInicial={propiedad.neighborhood ?? ''}
            provinciaInicial={propiedad.city ?? ''}
            referenciasInicial={propiedad.property_references ?? ''}
            precioInicial={propiedad.price_usd ?? 0}
            incluyeExpensasInicial={propiedad.includes_expenses ?? null}
            descripcionInicial={propiedad.description ?? ''}
            ambientesInicial={propiedad.bedrooms ?? null}
            banosInicial={propiedad.bathrooms ?? null}
            superficieInicial={propiedad.area_m2 ?? null}
            pisoInicial={propiedad.floor_number ?? null}
            antiguedadInicial={propiedad.property_age ?? null}
            aceptaMascotasInicial={propiedad.allows_pets ?? null}
            aceptaNinosInicial={propiedad.allows_kids ?? null}
            tieneCocheraInicial={propiedad.has_garage ?? false}
            tieneBalconInicial={propiedad.has_balcony ?? false}
            permiteFumarInicial={propiedad.allows_smoking ?? false}
            fotosInicial={(propiedad.photo_urls as string[]) ?? []}
            videosInicial={(propiedad.video_urls as string[]) ?? []}
            estadoInicial={propiedad.status ?? 'active'}
            propiedadId={propiedad.id}
          />

        </div>
      </main>
    </div>
  )
}
