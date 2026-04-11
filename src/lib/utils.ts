// ── Types ─────────────────────────────────────────────────────────────────────

export type PropertyCostsPaidBy = 'dueno' | 'inquilino' | 'compartido'
export type CaucionProvider = 'fianzas_online' | 'mercadopago' | 'cualquiera'

export interface PropertyCosts {
  id?: string
  property_id: string
  expenses_ordinary_amount?: number | null
  expenses_extraordinary_amount?: number | null
  expenses_paid_by?: PropertyCostsPaidBy | null
  expenses_includes_services?: boolean
  abl_amount?: number | null
  abl_paid_by?: 'dueno' | 'inquilino' | null
  municipal_tax_amount?: number | null
  municipal_tax_paid_by?: 'dueno' | 'inquilino' | null
  arba_amount?: number | null
  arba_paid_by?: 'dueno' | 'inquilino' | null
  building_insurance_amount?: number | null
  building_insurance_paid_by?: 'dueno' | 'inquilino' | null
  tenant_insurance_required?: boolean
  caucion_accepted?: boolean
  caucion_provider_suggestion?: CaucionProvider | null
  created_at?: string
  updated_at?: string
}

export interface CostoMensualCalculado {
  alquiler: number
  expensas_inquilino: number
  abl_inquilino: number
  municipal_inquilino: number
  arba_inquilino: number
  seguro_inquilino: number
  total_inquilino: number
  items_dueno: string[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Formatea un número al estilo argentino: punto como separador de miles.
 * Ej: 651000 → "651.000"
 */
export function formatARS(amount: number): string {
  return Math.round(amount).toLocaleString('es-AR')
}

/**
 * Calcula el costo mensual total desglosado entre inquilino y dueño.
 *
 * Notas de prorrateo:
 *  - ABL (CABA): bimestral → se divide por 2 para obtener mensual
 *  - ARBA: anual → se divide por 12 para obtener mensual
 *  - Tasa municipal: anual → se divide por 12 para obtener mensual
 */
export function calcularCostoMensual(
  alquilerUSD: number | null,
  alquilerPesos: number | null,
  costs: PropertyCosts | null
): CostoMensualCalculado {
  const alquiler = alquilerPesos ?? 0

  if (!costs) {
    return {
      alquiler,
      expensas_inquilino: 0,
      abl_inquilino: 0,
      municipal_inquilino: 0,
      arba_inquilino: 0,
      seguro_inquilino: 0,
      total_inquilino: alquiler,
      items_dueno: [],
    }
  }

  const expensas_inquilino =
    costs.expenses_paid_by === 'inquilino' || costs.expenses_paid_by === 'compartido'
      ? (costs.expenses_ordinary_amount ?? 0) + (costs.expenses_extraordinary_amount ?? 0)
      : 0

  // ABL es bimestral en CABA → prorratear a mensual dividiendo por 2
  const abl_inquilino =
    costs.abl_paid_by === 'inquilino' ? (costs.abl_amount ?? 0) / 2 : 0

  // Tasa municipal es anual → prorratear a mensual dividiendo por 12
  const municipal_inquilino =
    costs.municipal_tax_paid_by === 'inquilino' ? (costs.municipal_tax_amount ?? 0) / 12 : 0

  // ARBA es anual → prorratear a mensual dividiendo por 12
  const arba_inquilino =
    costs.arba_paid_by === 'inquilino' ? (costs.arba_amount ?? 0) / 12 : 0

  const seguro_inquilino =
    costs.building_insurance_paid_by === 'inquilino' ? (costs.building_insurance_amount ?? 0) : 0

  const items_dueno: string[] = []
  if (costs.expenses_paid_by === 'dueno') items_dueno.push('Expensas')
  if (costs.abl_paid_by === 'dueno') items_dueno.push('ABL')
  if (costs.municipal_tax_paid_by === 'dueno') items_dueno.push('Tasa municipal')
  if (costs.arba_paid_by === 'dueno') items_dueno.push('ARBA')
  if (costs.building_insurance_paid_by === 'dueno') items_dueno.push('Seguro del edificio')

  return {
    alquiler,
    expensas_inquilino: Math.round(expensas_inquilino),
    abl_inquilino: Math.round(abl_inquilino),
    municipal_inquilino: Math.round(municipal_inquilino),
    arba_inquilino: Math.round(arba_inquilino),
    seguro_inquilino: Math.round(seguro_inquilino),
    total_inquilino: Math.round(
      alquiler + expensas_inquilino + abl_inquilino + municipal_inquilino + arba_inquilino + seguro_inquilino
    ),
    items_dueno,
  }
}

// ─────────────────────────────────────────────────────────────────────────────

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
