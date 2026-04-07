import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'Seguridad y tus derechos — PROPIA',
  description: 'Cómo Propia te protege, tus derechos como inquilino o dueño, consejos antes de firmar y preguntas frecuentes.',
}

// ── Accordion item (uses native <details>/<summary>) ─────────────────────────
function Accordion({ pregunta, respuesta }: { pregunta: string; respuesta: string }) {
  return (
    <details className="group border-b border-slate-100 last:border-0">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 py-4 text-sm font-semibold text-slate-800 marker:hidden [&::-webkit-details-marker]:hidden">
        <span>{pregunta}</span>
        <span className="mt-0.5 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-45">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </span>
      </summary>
      <p className="pb-4 text-sm leading-relaxed text-slate-500">{respuesta}</p>
    </details>
  )
}

// ── Protection card ───────────────────────────────────────────────────────────
function ProteccionCard({ icono, titulo, descripcion }: { icono: React.ReactNode; titulo: string; descripcion: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        {icono}
      </div>
      <p className="text-sm font-bold text-slate-900">{titulo}</p>
      <p className="text-sm leading-relaxed text-slate-500">{descripcion}</p>
    </div>
  )
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`px-4 py-14 md:px-10 md:py-20 ${className}`}>
      <div className="mx-auto max-w-3xl">
        {children}
      </div>
    </section>
  )
}

function SectionTitle({ tag, titulo, subtitulo }: { tag: string; titulo: string; subtitulo?: string }) {
  return (
    <div className="mb-8">
      <span className="inline-block rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-blue-600">
        {tag}
      </span>
      <h2 className="mt-3 text-2xl font-extrabold text-slate-900 md:text-3xl" style={{ letterSpacing: '-0.02em' }}>
        {titulo}
      </h2>
      {subtitulo && <p className="mt-2 text-sm leading-relaxed text-slate-500">{subtitulo}</p>}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SeguridadPage() {
  return (
    <div className="flex min-h-full flex-col bg-white text-slate-900">
      <Navbar />

      {/* ── Hero ── */}
      <section className="bg-gradient-to-b from-blue-50 to-white px-4 pb-14 pt-28 text-center md:px-10 md:pt-36">
        <div className="mx-auto max-w-2xl">
          <span className="inline-block rounded-full border border-blue-200 bg-blue-100 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-600">
            Confianza y seguridad
          </span>
          <h1 className="mt-5 text-3xl font-extrabold leading-tight text-slate-900 md:text-5xl" style={{ letterSpacing: '-0.02em' }}>
            Alquilá con confianza,<br className="hidden sm:block" /> sin sorpresas
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-500 md:text-lg">
            En Propia verificamos identidades, te explicamos tus derechos y eliminamos intermediarios. Todo lo que necesitás saber antes de alquilar.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/propiedades"
              className="rounded-xl bg-blue-600 px-7 py-3.5 text-base font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Buscar propiedades
            </Link>
            <Link
              href="/publicar"
              className="rounded-xl border-2 border-slate-900 px-7 py-3.5 text-base font-semibold text-slate-900 transition-colors hover:bg-slate-900 hover:text-white"
            >
              Publicar gratis
            </Link>
          </div>
        </div>
      </section>

      {/* ── Sección 1: ¿Cómo te protege Propia? ── */}
      <Section className="bg-white">
        <SectionTitle
          tag="Protección"
          titulo="¿Cómo te protege Propia?"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <ProteccionCard
            icono={
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            }
            titulo="Identidades verificadas"
            descripcion="Cada usuario puede verificar su identidad con DNI y selfie. Nuestro equipo revisa manualmente cada solicitud. Sabés con quién estás hablando."
          />
          <ProteccionCard
            icono={
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            }
            titulo="Score de confianza"
            descripcion="Cada perfil tiene un puntaje basado en verificación de identidad, reseñas de otros usuarios y actividad en la plataforma. Más transparencia, menos riesgo."
          />
          <ProteccionCard
            icono={
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            }
            titulo="Sin intermediarios"
            descripcion="Conectamos dueños e inquilinos directamente. Sin comisiones inmobiliarias, sin honorarios ocultos, sin gestorías que inflan los costos. Un alquiler de $600.000/mes a 2 años le ahorra al dueño más de $598.000 en comisiones."
          />
          <ProteccionCard
            icono={
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            }
            titulo="Comunicación directa"
            descripcion="Chat integrado en la plataforma para que toda la comunicación quede registrada. Si hay un problema, hay evidencia."
          />
        </div>
      </Section>

      {/* ── Sección 2: Derechos como inquilino ── */}
      <Section className="bg-slate-50">
        <SectionTitle
          tag="Inquilinos"
          titulo="Tus derechos como inquilino"
          subtitulo="En lenguaje simple, sin jerga legal."
        />
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="divide-y divide-slate-100 px-5">
            <Accordion
              pregunta="¿Cuánto dura un contrato?"
              respuesta="Desde el DNU 70/2023, el plazo se acuerda libremente entre las partes. Lo más común hoy son contratos de 24 meses. Si no se pacta un plazo, por ley se considera de 2 años para vivienda."
            />
            <Accordion
              pregunta="¿Cuánto me pueden pedir de depósito?"
              respuesta="El monto del depósito se negocia libremente. Ya no existe el límite de 1 mes que fijaba la ley anterior. Asegurate de que el contrato especifique cómo y cuándo te lo devuelven."
            />
            <Accordion
              pregunta="¿Cada cuánto me pueden aumentar?"
              respuesta="La frecuencia y el índice de ajuste se pactan en el contrato. Lo más habitual son aumentos trimestrales o cuatrimestrales usando el IPC (inflación) o el ICL. Leé bien esta cláusula antes de firmar."
            />
            <Accordion
              pregunta="¿Puedo irme antes de que termine el contrato?"
              respuesta="Sí. Podés rescindir en cualquier momento pagando el 10% de los alquileres que falten hasta el fin del contrato. Si avisás con 3 meses de anticipación y ya pasaron 6 meses de contrato, no pagás indemnización."
            />
            <Accordion
              pregunta="¿Me pueden cobrar comisión inmobiliaria?"
              respuesta="En CABA, la Ley 5.859 prohíbe cobrar comisión al inquilino en alquileres de vivienda. La comisión (máximo 4,15% del total del contrato) la paga el propietario. En Provincia de Buenos Aires rige la Ley 14.085 con escalas propias. En Propia, al no haber intermediarios, no hay comisiones."
            />
            <Accordion
              pregunta="¿En qué moneda se puede pactar el alquiler?"
              respuesta="Se puede pactar en pesos o en moneda extranjera (como dólares). Lo que se firme en el contrato es lo que vale: no se puede exigir pagar en una moneda distinta a la pactada."
            />
            <Accordion
              pregunta="¿Quién paga las expensas y servicios?"
              respuesta="Lo define el contrato. Lo habitual es que el inquilino pague expensas ordinarias y servicios, y el propietario las extraordinarias y los impuestos que gravan la propiedad (como ABL). Verificá esto antes de firmar."
            />
          </div>
        </div>
      </Section>

      {/* ── Sección 3: Derechos como dueño ── */}
      <Section className="bg-white">
        <SectionTitle
          tag="Propietarios"
          titulo="Tus derechos como dueño"
          subtitulo="Lo que necesitás saber para alquilar con seguridad."
        />
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="divide-y divide-slate-100 px-5">
            <Accordion
              pregunta="¿Qué garantías puedo pedir?"
              respuesta="Podés pedir las garantías que consideres necesarias: garantía propietaria, seguro de caución, recibo de sueldo, aval bancario, o una combinación. No hay restricción legal sobre tipo o cantidad."
            />
            <Accordion
              pregunta="¿Qué pasa si el inquilino no paga?"
              respuesta="Si hay 2 meses impagos (consecutivos o alternados), podés rescindir el contrato e iniciar acción de desalojo. Es fundamental que el contrato lo especifique y que guardes todos los comprobantes."
            />
            <Accordion
              pregunta="¿Puedo rescindir el contrato?"
              respuesta="El DNU no es explícito sobre la rescisión por parte del propietario, por lo que es importante incluir las causales de rescisión en el contrato. Un contrato bien redactado es tu mejor protección."
            />
            <Accordion
              pregunta="¿Tengo que declarar el contrato en AFIP?"
              respuesta="Es recomendable registrar el contrato en el sistema RELI de AFIP. Esto te permite deducir el 10% del monto anual en Ganancias y acceder a la exención de Bienes Personales para inmuebles destinados a vivienda."
            />
          </div>
        </div>
      </Section>

      {/* ── Sección 4: Consejos antes de firmar ── */}
      <Section className="bg-slate-50">
        <SectionTitle
          tag="Checklist"
          titulo="Consejos antes de firmar"
          subtitulo="Pasos que pueden ahorrarte muchos dolores de cabeza."
        />
        <ul className="flex flex-col gap-3">
          {[
            'Leé cada cláusula del contrato. Después de firmar, es tarde para discutir.',
            'Sacá fotos y videos del estado del inmueble al momento de la entrega. Firmá un acta de estado.',
            'Guardá todos los comprobantes de pago (transferencias, depósitos).',
            'Verificá que el contrato especifique: plazo, precio, índice de ajuste, frecuencia de aumento, depósito, quién paga qué.',
            'Si alquilás con muebles, pedí un inventario detallado con fotos.',
            'Al devolver el inmueble, firmá un acta de entrega de llaves.',
          ].map((consejo) => (
            <li key={consejo} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </span>
              <span className="text-sm leading-relaxed text-slate-700">{consejo}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* ── Sección 5: FAQ sobre Propia ── */}
      <Section className="bg-white">
        <SectionTitle
          tag="FAQ"
          titulo="Preguntas frecuentes sobre Propia"
        />
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="divide-y divide-slate-100 px-5">
            <Accordion
              pregunta="¿Propia es gratis?"
              respuesta="Sí. Publicar y buscar propiedades es completamente gratis. No cobramos comisiones ni honorarios."
            />
            <Accordion
              pregunta="¿Cómo verifican la identidad?"
              respuesta="El usuario sube foto del frente y dorso de su DNI, más una selfie sosteniéndolo. Nuestro equipo lo revisa manualmente y aprueba o rechaza la verificación."
            />
            <Accordion
              pregunta="¿Puedo confiar en las publicaciones?"
              respuesta="Cada publicación tiene el perfil del dueño con su score de confianza, estado de verificación y reseñas de otros usuarios. Además, las fotos son obligatorias por categoría (frente, living, cocina, dormitorio, baño)."
            />
            <Accordion
              pregunta="¿Qué hago si tengo un problema con un dueño/inquilino?"
              respuesta="Toda la comunicación queda registrada en nuestro chat. Si necesitás hacer un reclamo, tenés evidencia. Propia no es parte del contrato entre dueño e inquilino, pero facilitamos la transparencia."
            />
            <Accordion
              pregunta="¿Propia reemplaza a un abogado?"
              respuesta="No. La información en esta página es orientativa. Para firmar un contrato, siempre recomendamos consultar con un abogado. Propia facilita el contacto directo y la transparencia, pero no brinda asesoramiento legal."
            />
          </div>
        </div>
      </Section>

      {/* ── CTA footer banner ── */}
      <section className="px-4 py-14 md:px-10 md:py-20" style={{ background: '#16A34A' }}>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-extrabold text-white md:text-3xl" style={{ letterSpacing: '-0.02em' }}>
            ¿Listo para alquilar sin intermediarios?
          </h2>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/propiedades"
              className="rounded-xl bg-white px-7 py-3.5 text-base font-semibold text-green-700 transition-colors hover:bg-green-50"
            >
              Buscar propiedades
            </Link>
            <Link
              href="/publicar"
              className="rounded-xl border-2 border-white px-7 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/10"
            >
              Publicar gratis
            </Link>
          </div>
        </div>
      </section>

      {/* ── Disclaimer ── */}
      <div className="bg-slate-50 px-4 py-6 md:px-10">
        <p className="mx-auto max-w-3xl text-center text-xs leading-relaxed text-slate-400">
          La información en esta página es orientativa y no constituye asesoramiento legal. Para decisiones legales, consultá con un profesional. Las leyes y normas pueden cambiar — verificá siempre la versión vigente.
        </p>
      </div>
    </div>
  )
}
