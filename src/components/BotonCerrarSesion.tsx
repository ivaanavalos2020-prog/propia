'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'

export default function BotonCerrarSesion() {
  const router = useRouter()

  async function cerrarSesion() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={cerrarSesion}
      className="text-sm text-zinc-400 transition-colors hover:text-zinc-50"
    >
      Cerrar sesión
    </button>
  )
}
