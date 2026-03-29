import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'

export default async function MensajesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // Obtener IDs de las propiedades del dueño
  const { data: propiedades } = await supabase
    .from('properties')
    .select('id')
    .eq('owner_id', session.user.id)

  const propertyIds = propiedades?.map((p) => p.id) ?? []

  // Obtener mensajes de esas propiedades
  const { data: mensajes } = propertyIds.length > 0
    ? await supabase
        .from('mensajes')
        .select('id, sender_name, sender_email, message, created_at, property_id, properties(address)')
        .in('property_id', propertyIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-950 text-zinc-50">
      {/* Nav */}
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
                const fecha = new Date(m.created_at).toLocaleDateString('es-AR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })

                return (
                  <li
                    key={m.id}
                    className="flex flex-col gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-6"
                  >
                    {/* Propiedad */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                          Propiedad
                        </span>
                        <span className="text-sm font-semibold text-zinc-200">
                          {propiedad?.address ?? '—'}
                        </span>
                      </div>
                      <time
                        dateTime={m.created_at}
                        className="shrink-0 text-xs text-zinc-500"
                      >
                        {fecha}
                      </time>
                    </div>

                    {/* Separador */}
                    <div className="border-t border-zinc-800" />

                    {/* Remitente */}
                    <div className="flex flex-wrap gap-6">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                          Nombre
                        </span>
                        <span className="text-sm text-zinc-300">{m.sender_name}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
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
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                        Mensaje
                      </span>
                      <p className="text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap">
                        {m.message}
                      </p>
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
