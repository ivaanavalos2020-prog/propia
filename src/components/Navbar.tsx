import { createServerSupabaseClient } from '@/lib/supabase'
import NavbarClient from './NavbarClient'

export default async function Navbar() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  let userName: string | null = null
  let isDueno = false

  let avatarUrl: string | null = null

  if (session) {
    const [perfilResult, propResult] = await Promise.all([
      supabase.from('profiles').select('full_name, avatar_url').eq('id', session.user.id).maybeSingle(),
      supabase.from('properties').select('id', { count: 'exact', head: true }).eq('owner_id', session.user.id).limit(1),
    ])
    userName  = (perfilResult.data?.full_name as string) ?? null
    avatarUrl = (perfilResult.data?.avatar_url as string) ?? null
    isDueno   = (propResult.count ?? 0) > 0
  }

  return (
    <NavbarClient
      isLoggedIn={!!session}
      userEmail={session?.user.email ?? null}
      userName={userName}
      avatarUrl={avatarUrl}
      isDueno={isDueno}
    />
  )
}
