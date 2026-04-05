/**
 * Safely extracts the first photo URL from a photo_urls field that may be
 * null, undefined, or a non-array value (defensive against DB inconsistencies).
 */
export function getFirstPhoto(photoUrls: unknown): string | null {
  return Array.isArray(photoUrls) && photoUrls.length > 0 ? (photoUrls[0] as string) : null
}

/**
 * Maps Supabase/Postgres error codes to user-friendly Spanish messages.
 */
export function parsearErrorSupabase(error: { code?: string; message?: string } | null): string {
  if (!error) return 'Ocurrió un error inesperado.'
  switch (error.code) {
    case '23505': return 'Ya existe un registro con esos datos.'
    case '23503': return 'El registro referenciado no existe.'
    case '42501': return 'No tenés permisos para realizar esta acción.'
    case 'PGRST116': return 'No se encontró el registro.'
    case 'PGRST301': return 'Sesión expirada. Por favor, volvé a iniciar sesión.'
    default: return error.message ?? 'Ocurrió un error inesperado.'
  }
}
