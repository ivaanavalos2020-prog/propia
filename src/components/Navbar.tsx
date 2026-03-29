import { createServerSupabaseClient } from '@/lib/supabase'
import NavbarClient from './NavbarClient'

export default async function Navbar() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  return (
    <NavbarClient
      isLoggedIn={!!session}
      userEmail={session?.user.email ?? null}
    />
  )
}
