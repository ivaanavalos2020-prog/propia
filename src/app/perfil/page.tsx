import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
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
    <div className="flex min-h-full flex-1 flex-col bg-slate-50">
      <Navbar />

      <main className="flex flex-1 flex-col items-center px-6 pt-24 pb-12 md:px-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col gap-1">
            <h1 className="text-2xl font-extrabold text-slate-900" style={{ letterSpacing: '-0.02em' }}>
              Mi perfil
            </h1>
            <p className="text-sm text-slate-500">
              Esta información es visible para los interesados en tus propiedades.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <FormularioPerfil
              userId={session.user.id}
              nombreInicial={perfil?.nombre ?? ''}
              telefonoInicial={perfil?.telefono ?? ''}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
