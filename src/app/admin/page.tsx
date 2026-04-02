import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'
import AdminClient from './AdminClient'

const ADMIN_EMAIL = 'ivaan.avalos2020@gmail.com'

export const metadata = { title: 'Admin — PROPIA' }

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  // ── Auth: solo el admin puede acceder ─────────────────────────
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== ADMIN_EMAIL) {
    redirect('/')
  }

  // ── Admin client (service role, bypasa RLS) ───────────────────
  let admin: ReturnType<typeof createAdminSupabaseClient>
  try {
    admin = createAdminSupabaseClient()
  } catch {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY no está configurada en .env.local. ' +
      'Copiá la "service_role" key desde Supabase Dashboard → Settings → API.'
    )
  }

  // ── 1. Usuarios (via service role) ────────────────────────────
  let usuarios: Awaited<ReturnType<typeof admin.auth.admin.listUsers>>['data']['users'] = []
  try {
    const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 })
    if (error) console.error('[admin] listUsers error:', error.message)
    else usuarios = data?.users ?? []
  } catch (e) {
    console.error('[admin] listUsers exception:', e)
  }

  // ── 2. Profiles ───────────────────────────────────────────────
  let profiles: Array<{
    id: string
    nombre: string | null
    identity_verified: boolean | null
    verification_status: string | null
    verification_dni_front_url: string | null
    verification_dni_back_url: string | null
    verification_selfie_url: string | null
    created_at: string | null
    telefono: string | null
  }> = []
  try {
    const { data, error } = await admin
      .from('profiles')
      .select('id, nombre, identity_verified, verification_status, verification_dni_front_url, verification_dni_back_url, verification_selfie_url, created_at, telefono')
    if (error) console.error('[admin] profiles error:', error.message)
    else profiles = (data ?? []) as typeof profiles
  } catch (e) {
    console.error('[admin] profiles exception:', e)
  }

  const profileMap = new Map(profiles.map((p) => [p.id, p]))

  // ── 3. Propiedades ────────────────────────────────────────────
  let propiedades: Array<{
    id: string
    address: string | null
    owner_id: string | null
    status: string | null
    created_at: string | null
    price_usd: number | null
    type: string | null
  }> = []
  try {
    const { data, error } = await admin
      .from('properties')
      .select('id, address, owner_id, status, created_at, price_usd, type')
      .order('created_at', { ascending: false })
    if (error) console.error('[admin] properties error:', error.message)
    else propiedades = (data ?? []) as typeof propiedades
  } catch (e) {
    console.error('[admin] properties exception:', e)
  }

  // ── 4. Propiedades por usuario ────────────────────────────────
  const propsPorUsuario = new Map<string, number>()
  for (const p of propiedades) {
    if (!p.owner_id) continue
    propsPorUsuario.set(p.owner_id, (propsPorUsuario.get(p.owner_id) ?? 0) + 1)
  }

  // ── 5. Mensajes hoy ───────────────────────────────────────────
  let mensajesHoy = 0
  try {
    const hoyISO = new Date().toISOString().slice(0, 10)
    const { count, error } = await admin
      .from('mensajes')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${hoyISO}T00:00:00.000Z`)
    if (error) console.error('[admin] mensajes error:', error.message)
    else mensajesHoy = count ?? 0
  } catch (e) {
    console.error('[admin] mensajes exception:', e)
  }

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
      nombre:              p?.nombre ?? null,
      isVerified:          p?.identity_verified ?? false,
      verificationStatus:  p?.verification_status ?? 'unverified',
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
    .filter((u) => profileMap.get(u.id)?.verification_status === 'pending')
    .map((u) => {
      const p = profileMap.get(u.id)
      return {
        userId:       u.id,
        email:        u.email ?? '',
        nombre:       p?.nombre ?? null,
        dniFrontPath: p?.verification_dni_front_url ?? null,
        dniBackPath:  p?.verification_dni_back_url ?? null,
        selfiePath:   p?.verification_selfie_url ?? null,
        submittedAt:  p?.created_at ?? null,
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

  const propiedadesRows: PropiedadRow[] = propiedades.map((p) => {
    const owner = usuarios.find((u) => u.id === p.owner_id)
    const ownerProfile = p.owner_id ? profileMap.get(p.owner_id) : undefined
    return {
      id:          p.id,
      address:     p.address ?? '—',
      type:        p.type ?? '',
      ownerEmail:  owner?.email ?? '—',
      ownerNombre: ownerProfile?.nombre ?? null,
      status:      p.status ?? '',
      createdAt:   p.created_at ?? '',
      priceUsd:    p.price_usd ?? 0,
    }
  })

  const resumen = {
    totalUsuarios:            usuarios.length,
    propiedadesActivas:       propiedades.filter((p) => p.status === 'active').length,
    mensajesHoy,
    verificacionesPendientes: verificacionesPendientes.length,
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
