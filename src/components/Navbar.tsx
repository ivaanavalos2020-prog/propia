import { createServerSupabaseClient } from '@/lib/supabase'
import NavbarClient from './NavbarClient'

export default async function Navbar() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  let userName: string | null = null
  let isDueno = false

  if (session) {
    const [perfilResult, propResult] = await Promise.all([
      supabase.from('profiles').select('nombre').eq('id', session.user.id).single(),
      supabase.from('properties').select('id', { count: 'exact', head: true }).eq('owner_id', session.user.id).limit(1),
    ])
    userName = (perfilResult.data?.nombre as string) ?? null
    isDueno  = (propResult.count ?? 0) > 0
  }

  return (
    <NavbarClient
      isLoggedIn={!!session}
      userEmail={session?.user.email ?? null}
      userName={userName}
      isDueno={isDueno}
    />
  )
}
