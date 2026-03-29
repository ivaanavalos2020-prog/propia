import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import FormularioPerfil from './FormularioPerfil'

export default async function PerfilPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const { data: perfil } = await supabase
    .from('profiles')
    .select('nombre, telefono')
    .eq('id', session.user.id)
    .single()

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-950 text-zinc-50">
      {/* Nav */}
      <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-5 md:px-12">
        <Link href="/dashboard" className="text-lg font-bold tracking-widest text-zinc-50">
          PROPIA
        </Link>
        <span className="text-sm text-zinc-400">{session.user.email}</span>
      </header>

      <main className="flex flex-1 flex-col items-center px-6 py-10 md:px-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col gap-1">
            <h1 className="text-xl font-semibold text-zinc-50">Mi perfil</h1>
            <p className="text-sm text-zinc-500">
              Esta información es visible para los interesados en tus propiedades.
            </p>
          </div>

          <FormularioPerfil
            userId={session.user.id}
            nombreInicial={perfil?.nombre ?? ''}
            telefonoInicial={perfil?.telefono ?? ''}
          />
        </div>
      </main>
    </div>
  )
}
