import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'Términos y Condiciones',
  description: 'Términos y condiciones de uso de PROPIA, plataforma de alquiler directo en Argentina.',
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-bold text-slate-900">{titulo}</h2>
      <div className="flex flex-col gap-2 text-base leading-relaxed text-slate-600">{children}</div>
    </section>
  )
}

export default function TerminosPage() {
  const fechaActualizacion = '30 de marzo de 2025'

  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-50">
      <Navbar />

      <main className="flex flex-1 flex-col px-6 pt-24 pb-16 md:px-10">
        <div className="mx-auto w-full max-w-3xl">

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-sm text-slate-400">
            <Link href="/" className="transition-colors hover:text-slate-700">Inicio</Link>
            <span>/</span>
            <span className="text-slate-600">Términos y Condiciones</span>
          </nav>

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm md:p-12">
            <div className="mb-8 flex flex-col gap-2 border-b border-slate-100 pb-8">
              <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Legal</p>
              <h1 className="text-3xl font-extrabold text-slate-900" style={{ letterSpacing: '-0.02em' }}>
                Términos y Condiciones
              </h1>
              <p className="text-sm text-slate-400">Última actualización: {fechaActualizacion}</p>
            </div>

            <div className="flex flex-col gap-8">
              <Seccion titulo="1. Acerca de PROPIA">
                <p>
                  PROPIA es una plataforma digital que conecta directamente a propietarios de inmuebles con personas que buscan alquilar, sin intermediarios ni comisiones abusivas. Al usar nuestra plataforma, aceptás estos términos y condiciones en su totalidad.
                </p>
              </Seccion>

              <Seccion titulo="2. Uso del servicio">
                <p>
                  Para publicar propiedades o contactar propietarios, necesitás registrarte con una cuenta válida. Sos responsable de mantener la confidencialidad de tu contraseña y de toda actividad que ocurra bajo tu cuenta.
                </p>
                <p>
                  Queda prohibido usar PROPIA para publicar información falsa, engañosa o fraudulenta. Las publicaciones deben corresponder a propiedades reales sobre las que el publicante tiene derecho de disposición.
                </p>
              </Seccion>

              <Seccion titulo="3. Publicación de propiedades">
                <p>
                  Al publicar una propiedad, el usuario declara que tiene autorización para hacerlo y que la información proporcionada es veraz y actualizada. PROPIA se reserva el derecho de eliminar publicaciones que incumplan estos términos o las leyes vigentes en Argentina.
                </p>
                <p>
                  Las fotos y descripciones deben representar fielmente la propiedad publicada. No se permite usar imágenes de terceros sin autorización.
                </p>
              </Seccion>

              <Seccion titulo="4. Responsabilidad">
                <p>
                  PROPIA actúa como intermediario tecnológico y no es parte en los contratos de alquiler que se celebren entre usuarios. La plataforma no se responsabiliza por el incumplimiento de acuerdos entre propietarios e inquilinos.
                </p>
                <p>
                  PROPIA no verifica la identidad de los usuarios ni garantiza la exactitud de la información publicada. Recomendamos verificar toda información de manera independiente antes de tomar decisiones.
                </p>
              </Seccion>

              <Seccion titulo="5. Privacidad de datos">
                <p>
                  El tratamiento de tus datos personales está regulado por nuestra{' '}
                  <Link href="/privacidad" className="font-medium text-blue-600 underline underline-offset-2 hover:text-blue-700">
                    Política de Privacidad
                  </Link>
                  , que forma parte de estos términos.
                </p>
              </Seccion>

              <Seccion titulo="6. Contenido de usuarios">
                <p>
                  Al subir fotos, textos u otro contenido a PROPIA, otorgás a la plataforma una licencia no exclusiva para usar ese contenido en el marco del servicio. Seguís siendo el propietario de tu contenido.
                </p>
              </Seccion>

              <Seccion titulo="7. Modificaciones">
                <p>
                  PROPIA puede modificar estos términos en cualquier momento. Los cambios se notificarán mediante la plataforma. Continuar usando el servicio después de los cambios implica aceptarlos.
                </p>
              </Seccion>

              <Seccion titulo="8. Ley aplicable">
                <p>
                  Estos términos se rigen por las leyes de la República Argentina. Cualquier conflicto se someterá a los tribunales ordinarios competentes de la Ciudad Autónoma de Buenos Aires.
                </p>
              </Seccion>

              <Seccion titulo="9. Contacto">
                <p>
                  Para consultas sobre estos términos, podés escribirnos a través del formulario de contacto o directamente por el chat de la plataforma.
                </p>
              </Seccion>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-4 text-sm text-slate-400">
            <Link href="/privacidad" className="transition-colors hover:text-slate-700">Política de Privacidad</Link>
            <span>·</span>
            <Link href="/" className="transition-colors hover:text-slate-700">Volver al inicio</Link>
          </div>
        </div>
      </main>
    </div>
  )
}
