import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase'
import BotonCerrarSesion from './BotonCerrarSesion'

export default async function Navbar() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  return (
    <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-5 md:px-12">
      <Link href="/" className="text-lg font-bold tracking-widest text-zinc-50">
        PROPIA
      </Link>

      <nav className="flex items-center gap-5">
        {session ? (
          <>
            <span className="hidden text-sm text-zinc-500 sm:block">
              {session.user.email}
            </span>
            <Link
              href="/perfil"
              className="text-sm text-zinc-400 transition-colors hover:text-zinc-50"
            >
              Mi perfil
            </Link>
            <Link
              href="/dashboard/mensajes"
              className="text-sm text-zinc-400 transition-colors hover:text-zinc-50"
            >
              Mensajes
            </Link>
            <Link
              href="/favoritos"
              className="text-sm text-zinc-400 transition-colors hover:text-zinc-50"
            >
              Favoritos
            </Link>
            <BotonCerrarSesion />
          </>
        ) : (
          <Link
            href="/login"
            className="text-sm text-zinc-400 transition-colors hover:text-zinc-50"
          >
            Ingresar
          </Link>
        )}
      </nav>
    </header>
  )
}
