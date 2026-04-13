// ── Payment system types ───────────────────────────────────────────────────

export type ContractStatus = 'active' | 'paused' | 'ended'
export type PaymentStatus = 'upcoming' | 'pending' | 'paid' | 'overdue'
export type PaymentFrequency = 'mensual' | 'bimestral' | 'trimestral' | 'anual' | 'unico'
export type ConceptType =
  | 'alquiler'
  | 'expensas_ordinarias'
  | 'expensas_extraordinarias'
  | 'abl'
  | 'arba'
  | 'municipal'
  | 'seguro_edificio'
  | 'seguro_caucion'
  | 'otro'
export type PaidBy = 'dueno' | 'inquilino'
export type Currency = 'ARS' | 'USD'

export interface Contract {
  id: string
  property_id: string
  owner_id: string
  tenant_id?: string | null
  tenant_email: string
  tenant_name: string
  tenant_phone?: string | null
  start_date: string
  end_date: string
  rent_amount: number
  currency: Currency
  status: ContractStatus
  notes?: string | null
  created_at: string
  updated_at: string
  // Joins opcionales
  property?: { address: string; neighborhood: string | null; city: string }
  owner?: { full_name: string | null; avatar_url?: string | null }
}

export interface PaymentConcept {
  id: string
  contract_id: string
  concept_type: ConceptType
  label: string
  amount: number
  currency: Currency
  frequency: PaymentFrequency
  paid_by: PaidBy
  due_day_of_month: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PaymentPeriod {
  id: string
  contract_id: string
  concept_id: string
  period_label: string
  due_date: string
  amount: number
  currency: Currency
  status: PaymentStatus
  paid_at?: string | null
  paid_by_user_id?: string | null
  payment_proof_url?: string | null
  marked_paid_by?: 'owner' | 'tenant' | 'system' | null
  notes?: string | null
  created_at: string
  updated_at: string
  // Join opcional
  concept?: PaymentConcept
}

export interface PaymentReminder {
  id: string
  period_id: string
  contract_id: string
  sent_by: string
  sent_at: string
  channel: 'email' | 'whatsapp'
  message_custom?: string | null
  recipient_email: string
  status: 'sent' | 'failed'
}

// Para la vista de resumen del dashboard
export interface ContractSummary {
  contract: Contract
  periods_this_month: PaymentPeriod[]
  periods_overdue: PaymentPeriod[]
  periods_upcoming: PaymentPeriod[]
  total_pending_amount: number
  total_overdue_amount: number
}

// Formulario de creación de concepto (sin campos de DB autogenerados)
export interface PaymentConceptDraft {
  concept_type: ConceptType
  label: string
  amount: string // string para el input, se convierte a number al guardar
  currency: Currency
  frequency: PaymentFrequency
  paid_by: PaidBy
  due_day_of_month: string // string para el input
}
