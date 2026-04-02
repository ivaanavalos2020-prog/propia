import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

const ADMIN_EMAIL = 'ivaan.avalos2020@gmail.com'
const TTL = 60 * 60 // 1 hora

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
  }

  const { paths } = await req.json() as { paths: string[] }

  if (!Array.isArray(paths) || paths.length === 0) {
    return NextResponse.json({ error: 'Paths requeridos.' }, { status: 400 })
  }

  const results = await Promise.all(
    paths.map(async (path: string) => {
      const { data, error } = await supabase.storage
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
