'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'

interface Props {
  isDueno: boolean
}

export default function BadgeMensajes({ isDueno }: Props) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    let propertyIds: string[] = []

    async function refetchDueno() {
      if (propertyIds.length === 0) return
      const { count: fresh } = await supabase
        .from('mensajes')
        .select('*', { count: 'exact', head: true })
        .in('property_id', propertyIds)
        .eq('leido', false)
      setCount(fresh ?? 0)
    }

    async function refetchInquilino() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      // Cuenta respuestas de dueños para los mensajes del inquilino
      // RLS garantiza que solo ve las de sus propios mensajes
      const { count: fresh } = await supabase
        .from('respuestas_mensajes')
        .select('id', { count: 'exact', head: true })
        .eq('autor', 'dueno')
      setCount(fresh ?? 0)
    }

    async function init() {
      if (isDueno) {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return
        const { data: props } = await supabase
          .from('properties')
          .select('id')
          .eq('owner_id', session.user.id)
        propertyIds = props?.map((p) => p.id) ?? []
        await refetchDueno()
      } else {
        await refetchInquilino()
      }
    }

    init()

    const channel = isDueno
      ? supabase
          .channel('badge-mensajes-dueno')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensajes' }, refetchDueno)
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'mensajes' }, refetchDueno)
          .subscribe()
      : supabase
          .channel('badge-mensajes-inquilino')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'respuestas_mensajes' }, refetchInquilino)
          .subscribe()

    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDueno])

  if (count === 0) return null

  return (
    <span className="relative flex items-center justify-center">
      <span className="absolute h-full w-full animate-ping rounded-full bg-red-500/50" />
      <span className="relative flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold leading-none text-white">
        {count > 9 ? '9+' : count}
      </span>
    </span>
  )
}
