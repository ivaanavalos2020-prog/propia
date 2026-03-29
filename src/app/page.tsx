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
    titulo: 'Publicá tu propiedad',
    desc: 'Cargá fotos, precio y datos en menos de 5 minutos. Sin formularios interminables.',
    icono: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><path d="M9 21V12h6v9"/>
      </svg>
    ),
  },
  {
    num: '02',
    titulo: 'Recibí consultas directas',
    desc: 'Los interesados te escriben directo desde la plataforma. Sin filtros ni intermediarios.',
    icono: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
      </svg>
    ),
  },
  {
    num: '03',
    titulo: 'Cerrá el trato vos',
    desc: 'Coordiná la visita, acordá las condiciones y firmá el contrato. Tus tiempos, tus reglas.',
    icono: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
  },
]

const COMPARATIVA = [
  { feature: 'Comisión del dueño',     propia: '0%',     inmo: '3–5% anual',          ok: true  },
  { feature: 'Comisión del inquilino', propia: '0%',     inmo: '1 mes de alquiler',    ok: true  },
  { feature: 'Publicación',            propia: 'Gratis', inmo: 'Con cargo',            ok: true  },
  { feature: 'Contacto directo',       propia: 'Sí',     inmo: 'No',                   ok: true  },
  { feature: 'Velocidad de publicar',  propia: '5 min',  inmo: 'Días o semanas',       ok: true  },
  { feature: 'Transparencia total',    propia: 'Sí',     inmo: 'Limitada',             ok: true  },
]

const TESTIMONIOS = [
  {
    texto: 'Publiqué mi departamento y en una semana tuve tres consultas. Sin pagar ni un peso de comisión.',
    nombre: 'Martín G.',
    rol: 'Dueño · CABA',
  },
  {
    texto: 'Por fin encontré un lugar sin tener que pagar dos meses de honorarios. Rápido y sin vueltas.',
    nombre: 'Lucía R.',
    rol: 'Inquilina · Córdoba',
  },
  {
    texto: 'Hablé directamente con el dueño y acordamos todo en una llamada. No lo puedo creer.',
    nombre: 'Diego M.',
    rol: 'Inquilino · Rosario',
  },
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
      <section className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden px-6 pt-28 pb-16 text-center bg-gradient-to-b from-white to-blue-50/60">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-5%,rgba(37,99,235,0.06),transparent)]" />

        <AnimarAlEntrar>
          <span className="inline-block rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-blue-600">
            Sin comisiones · Sin intermediarios
          </span>
        </AnimarAlEntrar>

        <AnimarAlEntrar delay={80}>
          <h1 className="mt-6 max-w-3xl text-5xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-7xl" style={{ letterSpacing: '-0.02em' }}>
            Alquilá directo,<br />
            <span className="text-blue-600">sin pagar comisión</span>
          </h1>
        </AnimarAlEntrar>

        <AnimarAlEntrar delay={160}>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-500">
            En Argentina los intermediarios se llevan miles de pesos. PROPIA conecta dueños e
            inquilinos directamente, sin costos ocultos ni burocracia innecesaria.
          </p>
        </AnimarAlEntrar>

        <AnimarAlEntrar delay={240}>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/publicar"
              className="rounded-xl bg-blue-600 px-7 py-3.5 text-base font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Publicar propiedad gratis
            </Link>
            <Link
              href="/propiedades"
              className="rounded-xl border border-slate-200 px-7 py-3.5 text-base font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
            >
              Buscar alquiler
            </Link>
          </div>
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
          <div className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-3 text-center">
            {[
              { num: '0%',    label: 'Comisión para dueños e inquilinos' },
              { num: '5 min', label: 'Para publicar tu propiedad' },
              { num: '100%',  label: 'Contacto directo sin filtros' },
            ].map(({ num, label }) => (
              <div key={num} className="flex flex-col gap-1">
                <span className="text-4xl font-extrabold text-blue-600 md:text-5xl">{num}</span>
                <span className="text-sm font-medium text-slate-500">{label}</span>
              </div>
            ))}
          </div>
        </AnimarAlEntrar>
      </section>

      {/* ── Cómo funciona ────────────────────────────────────── */}
      <section id="como-funciona" className="bg-white px-6 py-20 md:px-10">
        <div className="mx-auto max-w-5xl">
          <AnimarAlEntrar>
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-extrabold text-slate-900 md:text-4xl" style={{ letterSpacing: '-0.02em' }}>
                Cómo funciona
              </h2>
              <p className="mt-3 text-slate-500">Tres pasos para cerrar tu alquiler sin intermediarios</p>
            </div>
          </AnimarAlEntrar>

          <div className="grid gap-6 md:grid-cols-3">
            {PASOS.map((paso, i) => (
              <AnimarAlEntrar key={paso.num} delay={i * 100}>
                <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition-shadow hover:shadow-md">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    {paso.icono}
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-blue-600">{paso.num}</span>
                    <h3 className="text-base font-semibold text-slate-900">{paso.titulo}</h3>
                    <p className="text-sm leading-relaxed text-slate-500">{paso.desc}</p>
                  </div>
                </div>
              </AnimarAlEntrar>
            ))}
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
                    Disponibles ahora
                  </h2>
                  <p className="mt-1 text-slate-500">Propiedades publicadas recientemente</p>
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
                        className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
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
            <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
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

      {/* ── Testimonios ──────────────────────────────────────── */}
      <section className="border-t border-slate-100 bg-slate-50 px-6 py-20 md:px-10">
        <div className="mx-auto max-w-5xl">
          <AnimarAlEntrar>
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-extrabold text-slate-900 md:text-4xl" style={{ letterSpacing: '-0.02em' }}>
                Lo que dicen nuestros usuarios
              </h2>
            </div>
          </AnimarAlEntrar>

          <div className="grid gap-6 sm:grid-cols-3">
            {TESTIMONIOS.map((t, i) => (
              <AnimarAlEntrar key={t.nombre} delay={i * 100}>
                <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex gap-1 text-amber-400">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <svg key={j} xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed text-slate-600">"{t.texto}"</p>
                  <div className="mt-auto">
                    <p className="text-sm font-semibold text-slate-900">{t.nombre}</p>
                    <p className="text-xs text-slate-400">{t.rol}</p>
                  </div>
                </div>
              </AnimarAlEntrar>
            ))}
          </div>
        </div>
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
              Plataforma de alquiler directo entre dueños e inquilinos en Argentina.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-16 gap-y-2 text-sm text-slate-400">
            <div className="flex flex-col gap-2">
              <span className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Plataforma</span>
              <Link href="/propiedades" className="transition-colors hover:text-white">Alquilar</Link>
              <Link href="/publicar" className="transition-colors hover:text-white">Publicar</Link>
              <Link href="/#como-funciona" className="transition-colors hover:text-white">Cómo funciona</Link>
            </div>
            <div className="flex flex-col gap-2">
              <span className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Cuenta</span>
              <Link href="/login" className="transition-colors hover:text-white">Ingresar</Link>
              <Link href="/login" className="transition-colors hover:text-white">Registrarse</Link>
              <Link href="/dashboard" className="transition-colors hover:text-white">Mi dashboard</Link>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-8 flex max-w-5xl items-center justify-between border-t border-slate-800 pt-6 text-xs text-slate-600">
          <span>© {new Date().getFullYear()} PROPIA. Todos los derechos reservados.</span>
          <span>Hecho en Argentina 🇦🇷</span>
        </div>
      </footer>
    </div>
  )
}
