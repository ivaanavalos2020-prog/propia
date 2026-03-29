import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'

const AHORA = Date.now()
const MS_24H = 24 * 60 * 60 * 1000

function buildMailto(email: string, address: string, senderName: string, message: string, fecha: string) {
  const subject = `Re: tu consulta sobre ${address}`
  const cita = message
    .split('\n')
    .map((l) => `> ${l}`)
    .join('\n')
  const body = `Hola ${senderName},\n\n\n\n---\nEl ${fecha}, ${senderName} escribió:\n${cita}`
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export default async function MensajesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const { data: propiedades } = await supabase
    .from('properties')
    .select('id')
    .eq('owner_id', session.user.id)

  const propertyIds = propiedades?.map((p) => p.id) ?? []

  const { data: mensajes } = propertyIds.length > 0
    ? await supabase
        .from('mensajes')
        .select('id, sender_name, sender_email, message, created_at, property_id, properties(address)')
        .in('property_id', propertyIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-950 text-zinc-50">
      <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-5 md:px-12">
        <Link href="/dashboard" className="text-lg font-bold tracking-widest text-zinc-50">
          PROPIA
        </Link>
        <span className="text-sm text-zinc-400">{session.user.email}</span>
      </header>

      <main className="flex flex-1 flex-col px-6 py-10 md:px-12">
        <div className="mx-auto w-full max-w-4xl">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-zinc-50">Mensajes recibidos</h1>
            <Link
              href="/dashboard"
              className="text-sm text-zinc-400 transition-colors hover:text-zinc-50"
            >
              ← Mis propiedades
            </Link>
          </div>

          {mensajes && mensajes.length > 0 ? (
            <ul className="mt-8 flex flex-col gap-4">
              {mensajes.map((m) => {
                const propiedad = m.properties as { address: string } | null
                const address = propiedad?.address ?? ''
                const esNuevo = AHORA - new Date(m.created_at).getTime() < MS_24H
                const fecha = new Date(m.created_at).toLocaleDateString('es-AR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
                const mailto = buildMailto(m.sender_email, address || '—', m.sender_name, m.message, fecha)

                return (
                  <li
                    key={m.id}
                    className="flex flex-col gap-5 rounded-xl border border-zinc-800 bg-zinc-900 p-6 transition-colors hover:border-zinc-700 hover:bg-zinc-900/80"
                  >
                    {/* Fila superior: propiedad + badge + fecha */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                          Propiedad
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-zinc-100">
                            {address || '—'}
                          </span>
                          {esNuevo && (
                            <span className="rounded-full bg-emerald-950 px-2 py-0.5 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-800">
                              Nuevo
                            </span>
                          )}
                        </div>
                      </div>
                      <time
                        dateTime={m.created_at}
                        className="shrink-0 text-xs text-zinc-500"
                      >
                        {fecha}
                      </time>
                    </div>

                    <div className="border-t border-zinc-800" />

                    {/* Remitente */}
                    <div className="flex flex-wrap gap-x-8 gap-y-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                          Nombre
                        </span>
                        <span className="text-sm text-zinc-300">{m.sender_name}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                          Email
                        </span>
                        <a
                          href={`mailto:${m.sender_email}`}
                          className="text-sm text-zinc-300 transition-colors hover:text-zinc-50"
                        >
                          {m.sender_email}
                        </a>
                      </div>
                    </div>

                    {/* Mensaje */}
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                        Mensaje
                      </span>
                      <p className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap">
                        {m.message}
                      </p>
                    </div>

                    {/* Acción */}
                    <div className="flex justify-end">
                      <a
                        href={mailto}
                        className="flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-50"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="9 17 4 12 9 7" />
                          <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
                        </svg>
                        Responder por email
                      </a>
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 py-20 text-center">
              <p className="text-base text-zinc-400">
                Todavía no recibiste ningún mensaje.
              </p>
              <p className="mt-2 text-sm text-zinc-600">
                Los mensajes aparecerán aquí cuando alguien te contacte desde una propiedad.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
