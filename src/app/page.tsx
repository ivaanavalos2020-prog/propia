import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import HeroBusqueda from './HeroBusqueda'
import AnimarAlEntrar from '@/components/AnimarAlEntrar'

const TIPO_LABEL: Record<string, string> = {
  departamento: 'Departamento',
  casa: 'Casa',
  habitacion: 'Habitación',
  local: 'Local comercial',
}

const PASOS = [
  {
    num: '01',
    titulo: 'Publicá en 5 minutos',
    desc: 'Subí fotos, precio y datos básicos de tu propiedad. Sin trámites ni papelería. Tu publicación queda activa al instante y la ven miles de personas.',
    icono: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><path d="M9 21V12h6v9"/>
      </svg>
    ),
  },
  {
    num: '02',
    titulo: 'Recibí consultas directas',
    desc: 'Los interesados te escriben directamente a vos, sin pasar por ningún intermediario. Ves su nombre, email y mensaje completo desde tu dashboard.',
    icono: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
      </svg>
    ),
  },
  {
    num: '03',
    titulo: 'Coordiná la visita y cerrá el trato',
    desc: 'Hablás directamente con el dueño, acordás las condiciones y firmás el contrato. Sin intermediarios que apuren ni presionen. Tus tiempos, tus reglas.',
    icono: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 7H4"/><path d="M20 12H4"/><path d="M20 17H4"/><path d="M16 3l4 4-4 4"/>
      </svg>
    ),
  },
]

const COMPARATIVA = [
  { feature: 'Publicar propiedad',          propia: 'Gratis siempre',          inmo: 'Con cargo o exclusividad'       },
  { feature: 'Contacto dueño-inquilino',    propia: 'Directo e inmediato',     inmo: 'A través de un intermediario'  },
  { feature: 'Comisión al inquilino',       propia: 'Sin comisión',            inmo: '1 mes de alquiler + IVA'        },
  { feature: 'Comisión al dueño',           propia: 'Sin comisión',            inmo: '4–5% del total del contrato'    },
  { feature: 'Tiempo para publicar',        propia: '5 minutos',               inmo: 'Días o semanas'                 },
  { feature: 'Transparencia',               propia: 'Total · Ves todo',        inmo: 'Información filtrada'           },
]


export default async function LandingPage() {
  const supabase = await createServerSupabaseClient()
  const { data: propiedades } = await supabase
    .from('properties')
    .select('id, type, address, neighborhood, city, price_usd, bedrooms, bathrooms, area_m2, photo_urls')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(6)

  return (
    <div className="flex min-h-full flex-col bg-white text-slate-900">
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden px-6 pt-28 pb-16 text-center bg-gradient-to-b from-white to-blue-50/40">
        {/* Fondo animado: líneas diagonales tenues */}
        <div className="hero-lines pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
        {/* Gradiente radial encima para difuminar el centro */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_55%_at_50%_40%,rgba(255,255,255,0.92),transparent)]" aria-hidden="true" />
        {/* Gradiente azul sutil arriba */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_-5%,rgba(37,99,235,0.05),transparent)]" aria-hidden="true" />

        <AnimarAlEntrar>
          <span className="inline-block rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-blue-600">
            Nuevo en GBA Sur · Gratis para todos
          </span>
        </AnimarAlEntrar>

        <AnimarAlEntrar delay={80}>
          <h1 className="mt-6 max-w-3xl text-5xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-7xl" style={{ letterSpacing: '-0.02em' }}>
            Encontrá tu próximo hogar<br />
            <span className="text-blue-600">sin pagar comisión</span>
          </h1>
        </AnimarAlEntrar>

        <AnimarAlEntrar delay={160}>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-500">
            Propiedades publicadas directamente por sus dueños en el Gran Buenos Aires.
            Sin inmobiliarias, sin costos ocultos, sin vueltas.
          </p>
        </AnimarAlEntrar>

        <AnimarAlEntrar delay={240}>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/propiedades"
              className="rounded-xl bg-blue-600 px-7 py-3.5 text-base font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Buscar alquiler
            </Link>
            <Link
              href="/publicar"
              className="rounded-xl border-2 border-slate-900 px-7 py-3.5 text-base font-semibold text-slate-900 transition-colors hover:bg-slate-900 hover:text-white"
            >
              Publicar mi propiedad gratis
            </Link>
          </div>
          <p className="mt-3 text-sm text-slate-400">
            <Link href="/publicar" className="hover:text-blue-600 hover:underline">
              ¿Sos dueño? Publicá gratis →
            </Link>
          </p>
        </AnimarAlEntrar>

        <AnimarAlEntrar delay={320} className="w-full max-w-2xl">
          <HeroBusqueda />
        </AnimarAlEntrar>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-slate-300">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" />
          </svg>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────── */}
      <section className="border-y border-slate-100 bg-slate-50 px-6 py-14">
        <AnimarAlEntrar>
          <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 text-center sm:grid-cols-4 sm:gap-8">
            {[
              { valor: 'Gratis',   label: 'Para publicar tu propiedad'              },
              { valor: '5 min',    label: 'Para publicar y quedar en línea'         },
              { valor: 'Directo',  label: 'Contacto dueño-inquilino sin filtros'    },
              { valor: '100%',     label: 'Legal · Con validez jurídica'            },
            ].map(({ valor, label }) => (
              <div key={label} className="flex flex-col gap-1.5">
                <span className="text-[40px] font-extrabold leading-none text-blue-600 md:text-[48px]" style={{ letterSpacing: '-0.02em' }}>
                  {valor}
                </span>
                <span className="text-[15px] font-medium leading-snug text-slate-500">{label}</span>
              </div>
            ))}
          </div>
        </AnimarAlEntrar>
      </section>

      {/* ── Cómo funciona ────────────────────────────────────── */}
      <section id="como-funciona" className="bg-white px-6 py-24 md:px-10">
        <div className="mx-auto max-w-5xl">
          <AnimarAlEntrar>
            <div className="mb-16 text-center">
              <span className="inline-block rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-600">
                Simple y directo
              </span>
              <h2 className="mt-4 text-4xl font-extrabold text-slate-900 md:text-5xl" style={{ letterSpacing: '-0.025em' }}>
                Cómo funciona
              </h2>
              <p className="mt-3 text-lg text-slate-500">Tres pasos para cerrar tu alquiler sin intermediarios</p>
            </div>
          </AnimarAlEntrar>

          {/* Grid con línea conectora en desktop */}
          <div className="relative">
            {/* Línea conectora horizontal — solo desktop */}
            <div
              className="absolute top-[52px] left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] hidden h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent md:block"
              aria-hidden="true"
            />

            <div className="grid gap-6 md:grid-cols-3">
              {PASOS.map((paso, i) => (
                <AnimarAlEntrar key={paso.num} delay={i * 120}>
                  <div className="flex h-full flex-col rounded-2xl border border-slate-300 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg overflow-hidden">
                    {/* Cabecera: número grande + ícono */}
                    <div className="flex items-start justify-between px-8 pt-8 pb-5">
                      <span
                        className="text-7xl font-extrabold leading-none text-blue-600 select-none"
                        style={{ letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums' }}
                      >
                        {paso.num}
                      </span>
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        {paso.icono}
                      </div>
                    </div>

                    {/* Separador */}
                    <div className="mx-8 h-px bg-slate-100" />

                    {/* Contenido */}
                    <div className="flex flex-1 flex-col gap-3 px-8 pt-6 pb-8">
                      <h3
                        className="text-xl font-bold text-slate-900"
                        style={{ letterSpacing: '-0.01em' }}
                      >
                        {paso.titulo}
                      </h3>
                      <p className="text-base leading-relaxed text-slate-500">
                        {paso.desc}
                      </p>
                    </div>
                  </div>
                </AnimarAlEntrar>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Propiedades destacadas ────────────────────────────── */}
      {propiedades && propiedades.length > 0 && (
        <section className="border-t border-slate-100 bg-slate-50 px-6 py-20 md:px-10">
          <div className="mx-auto max-w-5xl">
            <AnimarAlEntrar>
              <div className="mb-8 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-extrabold text-slate-900 md:text-4xl" style={{ letterSpacing: '-0.02em' }}>
                    Propiedades disponibles en tu zona
                  </h2>
                  <p className="mt-1 text-slate-500">Publicadas directamente por sus dueños · Sin comisiones</p>
                </div>
                <Link
                  href="/propiedades"
                  className="shrink-0 text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700"
                >
                  Ver todas →
                </Link>
              </div>
            </AnimarAlEntrar>

            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {propiedades.map((p, i) => {
                const fotos = Array.isArray(p.photo_urls) ? p.photo_urls : []
                const foto = fotos[0] as string | undefined
                return (
                  <AnimarAlEntrar key={p.id} delay={i * 60}>
                    <li>
                      <Link
                        href={`/propiedades/${p.id}`}
                        className="group flex h-full flex-col rounded-2xl border border-slate-300 bg-white shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                      >
                        <div className="h-44 w-full overflow-hidden bg-slate-100">
                          {foto ? (
                            <img
                              src={foto}
                              alt={p.address}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-slate-300">
                              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                              </svg>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-1 flex-col gap-3 p-5">
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex w-fit rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                              {TIPO_LABEL[p.type] ?? p.type}
                            </span>
                            <span className="line-clamp-2 text-base font-semibold text-slate-900">
                              {p.address}
                            </span>
                            {(p.neighborhood || p.city) && (
                              <span className="text-xs text-slate-400">
                                {[p.neighborhood, p.city].filter(Boolean).join(', ')}
                              </span>
                            )}
                          </div>

                          <div className="mt-auto flex items-end justify-between">
                            <span className="text-xl font-bold text-blue-600">
                              USD {Number(p.price_usd).toLocaleString('es-AR')}
                              <span className="ml-1 text-sm font-normal text-slate-400">/mes</span>
                            </span>
                            <div className="flex gap-3 text-xs text-slate-400">
                              {p.bedrooms != null && <span>{p.bedrooms} amb.</span>}
                              {p.area_m2 != null && <span>{p.area_m2} m²</span>}
                            </div>
                          </div>
                        </div>
                      </Link>
                    </li>
                  </AnimarAlEntrar>
                )
              })}
            </ul>
          </div>
        </section>
      )}

      {/* ── Comparativa ──────────────────────────────────────── */}
      <section className="bg-white px-6 py-20 md:px-10">
        <div className="mx-auto max-w-3xl">
          <AnimarAlEntrar>
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-extrabold text-slate-900 md:text-4xl" style={{ letterSpacing: '-0.02em' }}>
                PROPIA vs. Inmobiliaria
              </h2>
              <p className="mt-3 text-slate-500">La diferencia es clara</p>
            </div>
          </AnimarAlEntrar>

          <AnimarAlEntrar delay={100}>
            <div className="overflow-hidden rounded-2xl border border-slate-300 shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-300 bg-slate-50">
                    <th className="px-5 py-4 text-left font-semibold text-slate-500">Característica</th>
                    <th className="px-5 py-4 text-center font-bold text-blue-600">PROPIA</th>
                    <th className="px-5 py-4 text-center font-medium text-slate-400">Inmobiliaria</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARATIVA.map(({ feature, propia, inmo }, i) => (
                    <tr
                      key={feature}
                      className={`border-b border-slate-100 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                    >
                      <td className="px-5 py-3.5 text-slate-700">{feature}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-green-600">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                          {propia}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1.5 text-slate-400">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                          {inmo}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AnimarAlEntrar>
        </div>
      </section>

      {/* ── CTA dueños ───────────────────────────────────────── */}
      <section className="px-6 py-20 md:px-10" style={{ background: '#1A1A2E' }}>
        <AnimarAlEntrar>
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-block rounded-full border border-blue-700 bg-blue-900/50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-400">
              Para dueños
            </span>
            <h2 className="mt-5 text-3xl font-extrabold text-white md:text-4xl" style={{ letterSpacing: '-0.02em' }}>
              ¿Tenés una propiedad para alquilar?
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-400">
              Publicá gratis hoy. Sin contratos de exclusividad, sin comisiones, sin vueltas.
              Tu propiedad visible para miles de inquilinos en minutos.
            </p>
            <ul className="mt-6 flex flex-col items-center gap-2 text-sm text-white">
              <li className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Tu publicación queda activa al instante
              </li>
              <li className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Recibís consultas directamente en tu bandeja de entrada
              </li>
            </ul>
            <div className="mt-8">
              <Link
                href="/publicar"
                className="inline-block rounded-xl bg-blue-600 px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Publicar mi propiedad gratis
              </Link>
              <p className="mt-3 text-xs text-slate-500">Gratis · Sin tarjeta de crédito · Sin permanencia</p>
            </div>
          </div>
        </AnimarAlEntrar>
      </section>

      {/* ── Tu seguridad es lo primero ───────────────────────── */}
      <section className="bg-[#F0F4FF] px-6 py-20 md:px-10">
        <AnimarAlEntrar>
          <div className="mx-auto max-w-5xl">
            <div className="mb-10 text-center">
              <span className="inline-block rounded-full border border-blue-200 bg-blue-100 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-600">
                Confianza y seguridad
              </span>
              <h2 className="mt-4 text-3xl font-extrabold text-slate-900 md:text-4xl" style={{ letterSpacing: '-0.02em' }}>
                Tu seguridad es lo primero
              </h2>
              <p className="mt-3 text-slate-500">Herramientas para que dueños e inquilinos confíen entre sí</p>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              {[
                {
                  icono: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                  ),
                  titulo: 'Identidades verificadas',
                  desc:   'Pedimos DNI a dueños e inquilinos. Cada perfil verificado lleva un badge visible para que sepas con quién estás tratando.',
                },
                {
                  icono: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                  ),
                  titulo: 'Contacto directo, sin filtros',
                  desc:   'Escribís directo al dueño. Sin que nadie lea tus mensajes, filtre tu consulta o te haga esperar días para una respuesta.',
                },
                {
                  icono: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                  ),
                  titulo: 'Soporte cuando lo necesitás',
                  desc:   'Si algo no sale como esperás, estamos para ayudarte. Podés escribirnos en cualquier momento.',
                },
              ].map((card, i) => (
                <div
                  key={card.titulo}
                  className="flex flex-col gap-4 rounded-2xl border border-[#CBD5E1] bg-white p-6 shadow-sm"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    {card.icono}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{card.titulo}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{card.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </AnimarAlEntrar>
      </section>

      {/* ── CTA final ────────────────────────────────────────── */}
      <section className="bg-slate-900 px-6 py-20 md:px-10">
        <AnimarAlEntrar>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold text-white md:text-4xl" style={{ letterSpacing: '-0.02em' }}>
              ¿Tenés una propiedad para alquilar?
            </h2>
            <p className="mt-4 text-slate-400">
              Publicá gratis hoy y empezá a recibir consultas directas de inquilinos interesados.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/publicar"
                className="rounded-xl bg-blue-600 px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Publicar propiedad gratis
              </Link>
              <Link
                href="/#como-funciona"
                className="rounded-xl border border-slate-700 px-8 py-4 text-base font-medium text-slate-300 transition-colors hover:border-slate-500 hover:text-white"
              >
                Ver cómo funciona
              </Link>
            </div>
          </div>
        </AnimarAlEntrar>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="bg-slate-900 border-t border-slate-800 px-6 py-10 md:px-10">
        <div className="mx-auto flex max-w-5xl flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2">
            <span className="text-base font-bold tracking-widest text-white">PROPIA</span>
            <span className="text-xs font-semibold text-blue-500">Sin intermediarios</span>
            <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-500">
              Plataforma de alquiler directo entre dueños e inquilinos en Argentina. Gratis, sin intermediarios y con validez legal.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-x-12 gap-y-2 text-sm text-slate-400">
            <div className="flex flex-col gap-2">
              <span className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Plataforma</span>
              <Link href="/propiedades" className="transition-colors hover:text-white">Buscar alquiler</Link>
              <Link href="/publicar" className="transition-colors hover:text-white">Publicar gratis</Link>
              <Link href="/#como-funciona" className="transition-colors hover:text-white">Cómo funciona</Link>
            </div>
            <div className="flex flex-col gap-2">
              <span className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Cuenta</span>
              <Link href="/login" className="transition-colors hover:text-white">Ingresar</Link>
              <Link href="/login" className="transition-colors hover:text-white">Registrarse</Link>
              <Link href="/dashboard" className="transition-colors hover:text-white">Mi dashboard</Link>
            </div>
            <div className="flex flex-col gap-2">
              <span className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Legal</span>
              <Link href="/terminos" className="transition-colors hover:text-white">Términos y condiciones</Link>
              <Link href="/privacidad" className="transition-colors hover:text-white">Política de privacidad</Link>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-8 flex max-w-5xl items-center justify-between border-t border-slate-800 pt-6 text-xs text-slate-600">
          <span>© 2026 PROPIA · Todos los derechos reservados · Hecho en Argentina</span>
        </div>
      </footer>
    </div>
  )
}
