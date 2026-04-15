import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Guardar email en profiles para que el admin pueda verlo
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.id && user?.email) {
          const { data: existing } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', user.id)
            .maybeSingle()

          const upsertData: {
            id: string
            email: string
            full_name?: string
            avatar_url?: string
          } = { id: user.id, email: user.email }

          const meta = user.user_metadata as Record<string, string> | undefined
          if (!existing?.full_name && meta?.full_name) {
            upsertData.full_name = meta.full_name
          }
          if (!existing?.avatar_url && meta?.avatar_url) {
            upsertData.avatar_url = meta.avatar_url
          }

          await supabase.from('profiles').upsert(upsertData, { onConflict: 'id' })
        }
      } catch { /* no bloquear el login si falla */ }

      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
