import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'
import AdminClient from './AdminClient'

const ADMIN_EMAIL = 'ivaan.avalos2020@gmail.com'

export const metadata = { title: 'Admin — PROPIA' }

// Forzar render dinámico (no cachear datos del admin)
export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  // ── Auth: solo el admin puede acceder ─────────────────────────
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session || session.user.email !== ADMIN_EMAIL) {
    redirect('/')
  }

  const admin = createAdminSupabaseClient()

  // ── 1. Usuarios (via service role) ────────────────────────────
  const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const usuarios = authUsers?.users ?? []

  // ── 2. Profiles (verificación + datos) ────────────────────────
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, nombre, identity_verified, verification_status, verification_dni_front_url, verification_dni_back_url, verification_selfie_url, created_at, telefono')

  const profileMap = new Map((profiles ?? []).map((p) => [p.id as string, p]))

  // ── 3. Propiedades ────────────────────────────────────────────
  const { data: propiedades } = await admin
    .from('properties')
    .select('id, address, owner_id, status, created_at, price_usd, type')
    .order('created_at', { ascending: false })

  // ── 4. Propiedades por usuario ────────────────────────────────
  const propsPorUsuario = new Map<string, number>()
  for (const p of propiedades ?? []) {
    const ownerId = p.owner_id as string
    propsPorUsuario.set(ownerId, (propsPorUsuario.get(ownerId) ?? 0) + 1)
  }

  // ── 5. Mensajes hoy ───────────────────────────────────────────
  const hoyISO = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  const { count: mensajesHoy } = await admin
    .from('mensajes')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', `${hoyISO}T00:00:00.000Z`)

  // ── Armar datos para el cliente ───────────────────────────────

  type UsuarioRow = {
    id: string
    email: string
    createdAt: string
    propiedadesCount: number
    nombre: string | null
    isVerified: boolean
    verificationStatus: string
  }

  const usuariosRows: UsuarioRow[] = usuarios.map((u) => {
    const p = profileMap.get(u.id)
    return {
      id:                  u.id,
      email:               u.email ?? '',
      createdAt:           u.created_at ?? '',
      propiedadesCount:    propsPorUsuario.get(u.id) ?? 0,
      nombre:              (p?.nombre as string) ?? null,
      isVerified:          (p?.identity_verified as boolean) ?? false,
      verificationStatus:  (p?.verification_status as string) ?? 'unverified',
    }
  })

  type VerifRow = {
    userId: string
    email: string
    nombre: string | null
    dniFrontPath: string | null
    dniBackPath: string | null
    selfiePath: string | null
    submittedAt: string | null
  }

  const verificacionesPendientes: VerifRow[] = usuarios
    .filter((u) => {
      const p = profileMap.get(u.id)
      return (p?.verification_status as string) === 'pending'
    })
    .map((u) => {
      const p = profileMap.get(u.id)
      return {
        userId:       u.id,
        email:        u.email ?? '',
        nombre:       (p?.nombre as string) ?? null,
        dniFrontPath: (p?.verification_dni_front_url as string) ?? null,
        dniBackPath:  (p?.verification_dni_back_url as string) ?? null,
        selfiePath:   (p?.verification_selfie_url as string) ?? null,
        submittedAt:  (p?.created_at as string) ?? null,
      }
    })

  type PropiedadRow = {
    id: string
    address: string
    type: string
    ownerEmail: string
    ownerNombre: string | null
    status: string
    createdAt: string
    priceUsd: number
  }

  const propiedadesRows: PropiedadRow[] = (propiedades ?? []).map((p) => {
    const owner = usuarios.find((u) => u.id === (p.owner_id as string))
    const ownerProfile = profileMap.get(p.owner_id as string)
    return {
      id:          p.id as string,
      address:     (p.address as string) ?? '—',
      type:        (p.type as string) ?? '',
      ownerEmail:  owner?.email ?? '—',
      ownerNombre: (ownerProfile?.nombre as string) ?? null,
      status:      (p.status as string) ?? '',
      createdAt:   (p.created_at as string) ?? '',
      priceUsd:    (p.price_usd as number) ?? 0,
    }
  })

  const resumen = {
    totalUsuarios:             usuarios.length,
    propiedadesActivas:        (propiedades ?? []).filter((p) => p.status === 'active').length,
    mensajesHoy:               mensajesHoy ?? 0,
    verificacionesPendientes:  verificacionesPendientes.length,
  }

  return (
    <AdminClient
      resumen={resumen}
      verificaciones={verificacionesPendientes}
      propiedades={propiedadesRows}
      usuarios={usuariosRows}
    />
  )
}
