import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-10 text-center text-3xl font-bold tracking-widest text-foreground">
          PROPIA
        </h1>

        <div className="rounded-xl border border-foreground/10 bg-foreground/5 p-6">
          <p className="text-base text-foreground">
            Bienvenida,{' '}
            <span className="font-medium">{session.user.email}</span>
          </p>
          <p className="mt-1 text-sm text-foreground/60">
            Estás dentro de tu espacio.
          </p>
        </div>
      </div>
    </div>
  )
}
