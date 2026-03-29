import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'

export default async function FavoritosPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

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
          <h1 className="text-xl font-semibold text-zinc-50">Mis favoritos</h1>

          <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 py-20 text-center">
            <p className="text-base text-zinc-400">
              Todavía no tenés propiedades guardadas.
            </p>
            <Link
              href="/propiedades"
              className="mt-4 rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-50 transition-colors hover:border-zinc-500 hover:bg-zinc-900"
            >
              Ver propiedades
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
