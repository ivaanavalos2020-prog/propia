import { createServerSupabaseClient } from '@/lib/supabase'
import NavbarClient from './NavbarClient'

export default async function Navbar() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  let userName: string | null = null
  if (session) {
    const { data: perfil } = await supabase
      .from('profiles')
      .select('nombre')
      .eq('id', session.user.id)
      .single()
    userName = (perfil?.nombre as string) ?? null
  }

  return (
    <NavbarClient
      isLoggedIn={!!session}
      userEmail={session?.user.email ?? null}
      userName={userName}
    />
  )
}
