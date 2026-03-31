import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'Política de Privacidad',
  description: 'Política de privacidad de PROPIA. Conocé cómo tratamos tus datos personales.',
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-bold text-slate-900">{titulo}</h2>
      <div className="flex flex-col gap-2 text-base leading-relaxed text-slate-600">{children}</div>
    </section>
  )
}

export default function PrivacidadPage() {
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
            <span className="text-slate-600">Política de Privacidad</span>
          </nav>

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm md:p-12">
            <div className="mb-8 flex flex-col gap-2 border-b border-slate-100 pb-8">
              <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Legal</p>
              <h1 className="text-3xl font-extrabold text-slate-900" style={{ letterSpacing: '-0.02em' }}>
                Política de Privacidad
              </h1>
              <p className="text-sm text-slate-400">Última actualización: {fechaActualizacion}</p>
            </div>

            <div className="flex flex-col gap-8">
              <Seccion titulo="1. Responsable del tratamiento">
                <p>
                  PROPIA es la plataforma responsable del tratamiento de los datos personales recopilados a través de este sitio web. Esta política describe qué datos recopilamos, cómo los usamos y cuáles son tus derechos.
                </p>
              </Seccion>

              <Seccion titulo="2. Datos que recopilamos">
                <p>Recopilamos los siguientes datos cuando usás nuestra plataforma:</p>
                <ul className="ml-4 flex flex-col gap-1.5">
                  {[
                    'Datos de registro: nombre, dirección de email, contraseña (encriptada)',
                    'Datos de perfil: teléfono, WhatsApp, CUIT/CUIL, razón social (opcionales)',
                    'Datos de publicaciones: dirección, fotos, precio y características de propiedades',
                    'Datos de comunicación: mensajes enviados a través de la plataforma',
                    'Datos técnicos: dirección IP, tipo de dispositivo, páginas visitadas (para análisis de uso)',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                      {item}
                    </li>
                  ))}
                </ul>
              </Seccion>

              <Seccion titulo="3. Uso de los datos">
                <p>Usamos tus datos para:</p>
                <ul className="ml-4 flex flex-col gap-1.5">
                  {[
                    'Operar y mejorar la plataforma',
                    'Facilitar la comunicación entre propietarios e inquilinos',
                    'Enviarte notificaciones relevantes sobre tu cuenta o publicaciones',
                    'Cumplir con obligaciones legales',
                    'Detectar y prevenir fraudes o usos indebidos',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                      {item}
                    </li>
                  ))}
                </ul>
              </Seccion>

              <Seccion titulo="4. Compartir datos con terceros">
                <p>
                  No vendemos ni cedemos tus datos personales a terceros para fines comerciales. Solo compartimos datos cuando:
                </p>
                <ul className="ml-4 flex flex-col gap-1.5">
                  {[
                    'Contamos con tu consentimiento explícito',
                    'Es necesario para operar el servicio (por ejemplo, con Supabase como proveedor de infraestructura)',
                    'Lo exige la ley o una orden judicial',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                      {item}
                    </li>
                  ))}
                </ul>
              </Seccion>

              <Seccion titulo="5. Seguridad">
                <p>
                  Implementamos medidas técnicas y organizativas para proteger tus datos contra acceso no autorizado, pérdida o destrucción. Las contraseñas se almacenan encriptadas y nunca en texto plano.
                </p>
              </Seccion>

              <Seccion titulo="6. Cookies">
                <p>
                  Usamos cookies de sesión necesarias para el funcionamiento del sitio (autenticación). No usamos cookies de rastreo de terceros para publicidad.
                </p>
              </Seccion>

              <Seccion titulo="7. Tus derechos">
                <p>De acuerdo con la Ley 25.326 de Protección de Datos Personales de Argentina, tenés derecho a:</p>
                <ul className="ml-4 flex flex-col gap-1.5">
                  {[
                    'Acceder a los datos personales que tenemos sobre vos',
                    'Corregir datos inexactos o incompletos',
                    'Solicitar la eliminación de tus datos (derecho al olvido)',
                    'Oponerte al tratamiento en ciertos casos',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p>
                  Para ejercer estos derechos, podés eliminar tu cuenta desde la sección Mi perfil o contactarnos directamente.
                </p>
              </Seccion>

              <Seccion titulo="8. Retención de datos">
                <p>
                  Conservamos tus datos mientras tu cuenta esté activa. Al eliminar tu cuenta, borraremos tus datos personales en un plazo de 30 días, excepto los que debamos conservar por obligaciones legales.
                </p>
              </Seccion>

              <Seccion titulo="9. Cambios en esta política">
                <p>
                  Podemos actualizar esta política ocasionalmente. Te notificaremos sobre cambios significativos por email o mediante un aviso en la plataforma.
                </p>
              </Seccion>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-4 text-sm text-slate-400">
            <Link href="/terminos" className="transition-colors hover:text-slate-700">Términos y Condiciones</Link>
            <span>·</span>
            <Link href="/" className="transition-colors hover:text-slate-700">Volver al inicio</Link>
          </div>
        </div>
      </main>
    </div>
  )
}
