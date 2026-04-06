import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import ListadoPropiedades from './ListadoPropiedades'
import VerificationBanner from '@/components/VerificationBanner'

export const metadata: Metadata = {
  title: 'Mi dashboard — PROPIA',
  description: 'Gestioná tus publicaciones de alquiler.',
}

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const [{ data: propiedades }, { data: perfil }] = await Promise.all([
    supabase
      .from('properties')
      .select('id, type, address, price_usd, includes_expenses, status, photo_urls')
      .eq('owner_id', session.user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('phone, identity_verified, verification_status')
      .eq('id', session.user.id)
      .single(),
  ])

  const propertyIds = propiedades?.map((p) => p.id) ?? []

  const [{ count: mensajesSinLeer }, { count: totalMensajes }, { count: totalFavoritos }] =
    await Promise.all([
      propertyIds.length > 0
        ? supabase
            .from('mensajes')
            .select('*', { count: 'exact', head: true })
            .in('property_id', propertyIds)
            .eq('leido', false)
        : Promise.resolve({ count: 0 }),
      propertyIds.length > 0
        ? supabase
            .from('mensajes')
            .select('*', { count: 'exact', head: true })
            .in('property_id', propertyIds)
        : Promise.resolve({ count: 0 }),
      propertyIds.length > 0
        ? supabase
            .from('favoritos')
            .select('*', { count: 'exact', head: true })
            .in('property_id', propertyIds)
        : Promise.resolve({ count: 0 }),
    ])

  const activas = propiedades?.filter((p) => p.status === 'active').length ?? 0
  const total = propiedades?.length ?? 0

  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-50">
      <Navbar />
      {!(perfil?.identity_verified as boolean | null) && <VerificationBanner />}

      <main className="flex flex-1 flex-col px-6 pt-24 pb-12 md:px-10">
        <div className="mx-auto w-full max-w-4xl">

          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1
                className="text-2xl font-extrabold text-slate-900"
                style={{ letterSpacing: '-0.02em' }}
              >
                Mi dashboard
              </h1>
              <p className="mt-1 text-sm text-slate-500">{session.user.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/mensajes"
                className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                Mensajes
              </Link>
              <Link
                href="/publicar"
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                + Publicar
              </Link>
            </div>
          </div>

          {/* Stats cards */}
          {total > 0 && (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                {
                  label: 'Propiedades activas',
                  value: activas,
                  total: total,
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  ),
                  color: 'text-blue-600',
                  bg: 'bg-blue-50',
                },
                {
                  label: 'Mensajes sin leer',
                  value: mensajesSinLeer ?? 0,
                  total: null,
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  ),
                  color: (mensajesSinLeer ?? 0) > 0 ? 'text-red-600' : 'text-slate-600',
                  bg: (mensajesSinLeer ?? 0) > 0 ? 'bg-red-50' : 'bg-slate-50',
                },
                {
                  label: 'Total mensajes',
                  value: totalMensajes ?? 0,
                  total: null,
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  ),
                  color: 'text-slate-600',
                  bg: 'bg-slate-50',
                },
                {
                  label: 'Guardado como favorito',
                  value: totalFavoritos ?? 0,
                  total: null,
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  ),
                  color: 'text-rose-500',
                  bg: 'bg-rose-50',
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col gap-3 rounded-xl border border-slate-300 bg-white p-4 shadow-sm"
                >
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.bg} ${stat.color}`}>
                    {stat.icon}
                  </div>
                  <div>
                    <p className={`text-2xl font-extrabold ${stat.color}`} style={{ letterSpacing: '-0.02em' }}>
                      {stat.value}
                      {stat.total !== null && (
                        <span className="text-base font-medium text-slate-400">/{stat.total}</span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Alerta mensajes sin leer */}
          {(mensajesSinLeer ?? 0) > 0 && (
            <Link
              href="/dashboard/mensajes"
              className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-5 py-4 transition-colors hover:border-red-300 hover:bg-red-100"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-red-600"
                    aria-hidden="true"
                  >
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-red-700">
                  Tenés {mensajesSinLeer}{' '}
                  {mensajesSinLeer === 1 ? 'mensaje nuevo' : 'mensajes nuevos'}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-red-600">Ver mensajes →</span>
            </Link>
          )}

          {/* Completá tu perfil — checklist */}
          {(() => {
            const tieneTelefono     = !!(perfil?.phone as string | null)
            const estaVerificado    = !!(perfil?.identity_verified as boolean | null)
            const tienePropiedad    = total > 0
            const { data: { session: _s } } = { data: { session } }
            const items = [
              { label: 'Cuenta creada',           done: true,           href: null              },
              { label: 'Teléfono de contacto',    done: tieneTelefono,  href: '/perfil'         },
              { label: 'Identidad verificada',    done: estaVerificado, href: '/verificar-identidad' },
              { label: 'Primera propiedad publicada', done: tienePropiedad, href: '/publicar'   },
            ]
            const completados = items.filter((i) => i.done).length
            const todoCompleto = completados === items.length
            if (todoCompleto) return null
            return (
              <div className="mt-6 rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-900">Completá tu perfil</h2>
                  <span className="text-xs text-slate-400">{completados}/{items.length}</span>
                </div>
                <div className="mb-3 h-1.5 w-full rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all"
                    style={{ width: `${(completados / items.length) * 100}%` }}
                  />
                </div>
                <ul className="flex flex-col gap-2">
                  {items.map((item) => (
                    <li key={item.label} className="flex items-center gap-3">
                      <span className={[
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                        item.done ? 'bg-green-100 text-green-600' : 'border border-slate-300 text-slate-300',
                      ].join(' ')}>
                        {item.done ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        ) : (
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-200" />
                        )}
                      </span>
                      {item.href && !item.done ? (
                        <Link href={item.href} className="text-sm text-blue-600 hover:underline">
                          {item.label}
                        </Link>
                      ) : (
                        <span className={`text-sm ${item.done ? 'text-slate-700' : 'text-slate-400'}`}>
                          {item.label}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })()}

          {/* Sección título */}
          {total > 0 && (
            <h2 className="mt-8 text-lg font-bold text-slate-900">
              Mis propiedades
              <span className="ml-2 text-sm font-normal text-slate-400">{total}</span>
            </h2>
          )}

          {/* Lista de propiedades con búsqueda */}
          {propiedades && propiedades.length > 0 ? (
            <div className="mt-3">
              <ListadoPropiedades propiedades={propiedades} />
            </div>
          ) : (
            /* Onboarding empty state */
            <div className="mt-8 overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
              <div className="px-8 py-10 text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-slate-900" style={{ letterSpacing: '-0.01em' }}>
                  Publicá tu primera propiedad
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                  Conectá con inquilinos directamente, sin intermediarios ni comisiones.
                  Tu primera publicación es gratis y tarda menos de 5 minutos.
                </p>
              </div>

              {/* 3 pasos */}
              <div className="border-t border-slate-100 grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                {[
                  { num: '01', titulo: 'Publicá', desc: 'Cargá fotos, precio y datos básicos.' },
                  { num: '02', titulo: 'Recibí consultas', desc: 'Los interesados te escriben directo.' },
                  { num: '03', titulo: 'Cerrá el trato', desc: 'Coordiná la visita y firmá el contrato.' },
                ].map((paso) => (
                  <div key={paso.num} className="flex flex-col gap-2 px-6 py-5">
                    <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
                      {paso.num}
                    </span>
                    <p className="text-sm font-semibold text-slate-900">{paso.titulo}</p>
                    <p className="text-xs text-slate-500">{paso.desc}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100 px-8 py-6 text-center">
                <Link
                  href="/publicar"
                  className="inline-block rounded-xl bg-blue-600 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  Publicar propiedad gratis
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
