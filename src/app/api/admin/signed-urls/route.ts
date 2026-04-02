import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'

const ADMIN_EMAIL = 'ivaan.avalos2020@gmail.com'
const TTL = 60 * 60 // 1 hora

export async function POST(req: NextRequest) {
  // ── Auth: verificar que el caller es el admin ─────────────────
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
  }

  const { paths } = await req.json() as { paths: string[] }

  if (!Array.isArray(paths) || paths.length === 0) {
    return NextResponse.json({ error: 'Paths requeridos.' }, { status: 400 })
  }

  // ── Usar service role para generar signed URLs de bucket privado ──
  const admin = createAdminSupabaseClient()

  const results = await Promise.all(
    paths.map(async (path: string) => {
      const { data, error } = await admin.storage
        .from('verificaciones')
        .createSignedUrl(path, TTL)
      if (error || !data) {
        return { path, url: null, error: error?.message ?? 'Error' }
      }
      return { path, url: data.signedUrl, error: null }
    })
  )

  return NextResponse.json({ urls: results })
}
