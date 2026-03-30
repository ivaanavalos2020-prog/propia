'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'

export default function ContadorVistas({ propertyId }: { propertyId: string }) {
  useEffect(() => {
    const supabase = createClient()
    supabase.rpc('increment_property_views', { p_id: propertyId }).then(() => {})
  }, [propertyId])

  return null
}
