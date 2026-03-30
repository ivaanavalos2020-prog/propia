import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import PerfilClient from './PerfilClient'

export default async function PerfilPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) redirect('/login')

  const userId = session.user.id
  const userEmail = session.user.email ?? ''
  const emailVerificado = !!session.user.email_confirmed_at

  // ── Parallel: profile + properties ────────────────────────────
  const [{ data: perfil }, { data: propiedades }] = await Promise.all([
    supabase
      .from('profiles')
      .select(
        'nombre, telefono, whatsapp, show_phone, show_whatsapp, notify_messages, cuit, razon_social, condicion_afip, created_at'
      )
      .eq('id', userId)
      .single(),
    supabase
      .from('properties')
      .select('id, address, neighborhood, city, views_count, status, photo_urls')
      .eq('owner_id', userId)
      .order('views_count', { ascending: false }),
  ])

  const propIds = (propiedades ?? []).map((p) => p.id)

  // ── Messages for owned properties ─────────────────────────────
  const { data: mensajesRaw } = propIds.length > 0
    ? await supabase
        .from('mensajes')
        .select('id, property_id, created_at')
        .in('property_id', propIds)
        .order('created_at', { ascending: true })
    : { data: [] }

  const mensajeIds = (mensajesRaw ?? []).map((m) => m.id)

  // ── Which messages have at least one reply ─────────────────────
  const { data: respuestasRaw } = mensajeIds.length > 0
    ? await supabase
        .from('respuestas_mensajes')
        .select('mensaje_id')
        .in('mensaje_id', mensajeIds)
    : { data: [] }

  const respondidosSet = new Set((respuestasRaw ?? []).map((r) => r.mensaje_id))

  // ── Build mensajes with respondido flag ────────────────────────
  const mensajes = (mensajesRaw ?? []).map((m) => ({
    id: m.id as string,
    property_id: m.property_id as string,
    created_at: m.created_at as string,
    respondido: respondidosSet.has(m.id),
  }))

  // ── mensajes_count per property ────────────────────────────────
  const mensajesPorPropiedad = new Map<string, number>()
  mensajes.forEach((m) => {
    mensajesPorPropiedad.set(m.property_id, (mensajesPorPropiedad.get(m.property_id) ?? 0) + 1)
  })

  const props = (propiedades ?? []).map((p) => ({
    id: p.id as string,
    address: (p.address as string) ?? null,
    neighborhood: (p.neighborhood as string) ?? null,
    city: (p.city as string) ?? null,
    views_count: (p.views_count as number) ?? 0,
    status: (p.status as string) ?? null,
    photo_urls: (p.photo_urls as string[]) ?? [],
    mensajes_count: mensajesPorPropiedad.get(p.id) ?? 0,
  }))

  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-50">
      <Navbar />
      <main className="flex flex-1 flex-col px-4 pt-24 pb-12 md:px-8">
        <div className="mx-auto w-full max-w-6xl">
          <PerfilClient
            userId={userId}
            userEmail={userEmail}
            emailVerificado={emailVerificado}
            perfil={{
              nombre: (perfil?.nombre as string) ?? null,
              telefono: (perfil?.telefono as string) ?? null,
              whatsapp: (perfil?.whatsapp as string) ?? null,
              show_phone: (perfil?.show_phone as boolean) ?? false,
              show_whatsapp: (perfil?.show_whatsapp as boolean) ?? false,
              notify_messages: (perfil?.notify_messages as boolean) ?? true,
              cuit: (perfil?.cuit as string) ?? null,
              razon_social: (perfil?.razon_social as string) ?? null,
              condicion_afip: (perfil?.condicion_afip as string) ?? null,
              created_at: (perfil?.created_at as string) ?? null,
            }}
            propiedades={props}
            mensajes={mensajes}
          />
        </div>
      </main>
    </div>
  )
}
