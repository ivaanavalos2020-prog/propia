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
      'id, type, address, neighborhood, city, property_references, ' +
      'price_usd, has_expenses, expenses_amount, expenses_included, deposit_months, ' +
      'contract_type, contract_duration_months, update_index, ' +
      'price_per_night, min_nights, max_nights, ' +
      'guarantees_accepted, services_included, ' +
      'description, bedrooms, bathrooms, rooms, toilettes, ' +
      'area_m2, total_area_m2, floor_number, property_age, property_condition, ' +
      'has_garage, has_storage, has_garden, has_terrace, has_pool, has_bbq, ' +
      'has_gym, has_laundry, has_security, has_elevator, has_heating, has_ac, ' +
      'has_balcony, is_furnished, has_appliances, ' +
      'allows_pets, pets_policy, allows_kids, ' +
      'allows_smoking, allows_smoking_policy, allows_wfh, ' +
      'photo_urls, video_urls, status, owner_id'
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
              className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:border-blue-300 hover:text-blue-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              Ver publicación
            </Link>
          </div>

          <FormularioEditar
            id={propiedad.id}
            propiedadId={propiedad.id}
            tipoInicial={propiedad.type}
            calleInicial={propiedad.address ?? ''}
            barrioInicial={propiedad.neighborhood ?? ''}
            provinciaInicial={propiedad.city ?? ''}
            referenciasInicial={propiedad.property_references ?? ''}
            precioInicial={propiedad.price_usd ?? 0}
            hasExpensesInicial={propiedad.has_expenses ?? false}
            expensesAmountInicial={propiedad.expenses_amount ?? null}
            expensesIncludedInicial={propiedad.expenses_included ?? false}
            depositMonthsInicial={propiedad.deposit_months ?? 'a_negociar'}
            contractTypeInicial={propiedad.contract_type ?? 'tradicional'}
            contractDurationMonthsInicial={propiedad.contract_duration_months ?? null}
            updateIndexInicial={propiedad.update_index ?? 'ipc_trimestral'}
            pricePerNightInicial={propiedad.price_per_night ?? null}
            minNightsInicial={propiedad.min_nights ?? null}
            maxNightsInicial={propiedad.max_nights ?? null}
            guaranteesInicial={(propiedad.guarantees_accepted as string[]) ?? []}
            servicesInicial={(propiedad.services_included as string[]) ?? []}
            ambientesInicial={propiedad.rooms ?? null}
            dormitoriosInicial={propiedad.bedrooms ?? null}
            banosInicial={propiedad.bathrooms ?? null}
            toilettesInicial={propiedad.toilettes ?? null}
            superficieInicial={propiedad.area_m2 ?? null}
            totalAreaInicial={propiedad.total_area_m2 ?? null}
            pisoInicial={propiedad.floor_number ?? null}
            antiguedadInicial={propiedad.property_age ?? null}
            propertyConditionInicial={propiedad.property_condition ?? 'bueno'}
            hasCocheraInicial={propiedad.has_garage ?? false}
            hasBauleraInicial={propiedad.has_storage ?? false}
            hasJardinInicial={propiedad.has_garden ?? false}
            hasTerrazaInicial={propiedad.has_terrace ?? propiedad.has_balcony ?? false}
            hasPoolInicial={propiedad.has_pool ?? false}
            hasBBQInicial={propiedad.has_bbq ?? false}
            hasGymInicial={propiedad.has_gym ?? false}
            hasLaundryInicial={propiedad.has_laundry ?? false}
            hasSecurityInicial={propiedad.has_security ?? false}
            hasElevatorInicial={propiedad.has_elevator ?? false}
            hasHeatingInicial={propiedad.has_heating ?? false}
            hasACInicial={propiedad.has_ac ?? false}
            isFurnishedInicial={propiedad.is_furnished ?? false}
            hasAppliancesInicial={propiedad.has_appliances ?? false}
            petsPolicyInicial={propiedad.pets_policy ?? (propiedad.allows_pets ? 'si' : 'no')}
            allowsKidsInicial={propiedad.allows_kids ?? null}
            smokingPolicyInicial={propiedad.allows_smoking_policy ?? (propiedad.allows_smoking ? 'si' : 'no')}
            allowsWFHInicial={propiedad.allows_wfh ?? true}
            descripcionInicial={propiedad.description ?? ''}
            fotosInicial={(propiedad.photo_urls as string[]) ?? []}
            videosInicial={(propiedad.video_urls as string[]) ?? []}
            estadoInicial={propiedad.status ?? 'active'}
          />

        </div>
      </main>
    </div>
  )
}
