import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import VerificarIdentidadClient from './VerificarIdentidadClient'

export const metadata = { title: 'Verificar identidad — PROPIA' }

export default async function VerificarIdentidadPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/login')

  const { data: perfil } = await supabase
    .from('profiles')
    .select('verification_status, identity_verified')
    .eq('id', session.user.id)
    .single()

  const status      = (perfil?.verification_status as string) ?? 'unverified'
  const isVerified  = (perfil?.identity_verified as boolean) ?? false

  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-50">
      <Navbar />
      <main className="flex flex-1 flex-col items-center px-4 pt-24 pb-16">
        <div className="w-full max-w-lg">
          <VerificarIdentidadClient
            userId={session.user.id}
            currentStatus={status}
            isVerified={isVerified}
          />
        </div>
      </main>
    </div>
  )
}
