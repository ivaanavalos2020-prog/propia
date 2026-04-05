'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'

export default function ContadorVistas({ propertyId }: { propertyId: string }) {
  useEffect(() => {
    const supabase = createClient()
    supabase
      .rpc('increment_property_views', { p_id: propertyId })
      .then(({ error }) => {
        if (error) console.error('Error contando vista:', error.message)
      })
  }, [propertyId])

  return null
}
