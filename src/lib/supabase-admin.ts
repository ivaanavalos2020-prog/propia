import { createClient } from '@supabase/supabase-js'

/**
 * Cliente Supabase con service role key.
 * Requiere SUPABASE_SERVICE_ROLE_KEY en .env.local
 * NUNCA exponer esta clave al cliente.
 */
export function createAdminSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      'Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY'
    )
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
