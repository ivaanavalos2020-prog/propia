'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'

interface Props {
  propertyId: string
  userId: string | null
  esFavorito: boolean
}

export default function BotonFavorito({ propertyId, userId, esFavorito: inicial }: Props) {
  const [esFavorito, setEsFavorito] = useState(inicial)
  const [cargando, setCargando] = useState(false)
  const router = useRouter()

  async function toggleFavorito() {
    if (!userId) {
      router.push('/login')
      return
    }

    setCargando(true)
    const supabase = createClient()

    if (esFavorito) {
      await supabase
        .from('favoritos')
        .delete()
        .eq('user_id', userId)
        .eq('property_id', propertyId)
      setEsFavorito(false)
    } else {
      await supabase
        .from('favoritos')
        .insert({ user_id: userId, property_id: propertyId })
      setEsFavorito(true)
    }

    setCargando(false)
  }

  return (
    <button
      type="button"
      onClick={toggleFavorito}
      disabled={cargando}
      aria-label={esFavorito ? 'Quitar de favoritos' : 'Guardar en favoritos'}
      className={`flex h-12 w-12 items-center justify-center rounded-xl border transition-colors disabled:opacity-40 ${
        esFavorito
          ? 'border-red-500 bg-red-500 text-white hover:bg-red-600 hover:border-red-600'
          : 'border-zinc-700 bg-transparent text-white hover:border-zinc-500'
      }`}
    >
      {esFavorito ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 21.593c-.525-.445-4.145-3.61-6.204-5.616C3.248 13.486 2 11.503 2 9.5 2 6.42 4.42 4 7.5 4c1.71 0 3.286.857 4.5 2.25C13.214 4.857 14.79 4 16.5 4 19.58 4 22 6.42 22 9.5c0 2.003-1.248 3.986-3.796 6.477-2.059 2.006-5.679 5.171-6.204 5.616z"/>
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      )}
    </button>
  )
}
