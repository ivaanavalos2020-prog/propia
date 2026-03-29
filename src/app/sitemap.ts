import type { MetadataRoute } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase'

const BASE_URL = 'https://propia-kappa.vercel.app'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createServerSupabaseClient()
  const { data: propiedades } = await supabase
    .from('properties')
    .select('id, created_at')
    .order('created_at', { ascending: false })

  const rutas_estaticas: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${BASE_URL}/propiedades`,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/login`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  const rutas_propiedades: MetadataRoute.Sitemap = (propiedades ?? []).map((p) => ({
    url: `${BASE_URL}/propiedades/${p.id}`,
    lastModified: new Date(p.created_at),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [...rutas_estaticas, ...rutas_propiedades]
}
