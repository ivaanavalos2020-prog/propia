import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase'
import InboxMensajes from './InboxMensajes'

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

  const { data: rawMensajes } = propertyIds.length > 0
    ? await supabase
        .from('mensajes')
        .select('id, sender_name, sender_email, message, created_at, respuesta, respondido_en, property_id, properties(address)')
        .in('property_id', propertyIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  const mensajes = (rawMensajes ?? []).map((m) => ({
    ...m,
    address: (m.properties as { address: string } | null)?.address ?? '',
  }))

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-zinc-950 text-zinc-50">
      <header className="shrink-0 flex items-center justify-between border-b border-zinc-800 px-6 py-5 md:px-12">
        <Link href="/dashboard" className="text-lg font-bold tracking-widest text-zinc-50">
          PROPIA
        </Link>
        <span className="text-sm text-zinc-400">{session.user.email}</span>
      </header>

      <InboxMensajes mensajes={mensajes} ownerEmail={session.user.email ?? ''} />
    </div>
  )
}
