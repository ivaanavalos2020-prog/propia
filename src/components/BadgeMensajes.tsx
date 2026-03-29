'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'

export default function BadgeMensajes() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    // propertyIds se resuelve async y queda en closure para los handlers
    let propertyIds: string[] = []

    async function refetch() {
      if (propertyIds.length === 0) return
      const { count: fresh } = await supabase
        .from('mensajes')
        .select('*', { count: 'exact', head: true })
        .in('property_id', propertyIds)
        .eq('leido', false)
      setCount(fresh ?? 0)
    }

    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data: props } = await supabase
        .from('properties')
        .select('id')
        .eq('owner_id', session.user.id)

      propertyIds = props?.map((p) => p.id) ?? []
      await refetch()
    }

    init()

    const channel = supabase
      .channel('badge-mensajes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensajes' }, refetch)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'mensajes' }, refetch)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

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
