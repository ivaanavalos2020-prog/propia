import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

// ── GET /api/cron/update-overdue ───────────────────────────────────────────
// Llama a la función DB update_overdue_periods() que marca como 'overdue'
// todos los payment_periods con due_date < hoy y status = 'pending'.
//
// Invocado por el cron de Vercel (vercel.json). Protegido con CRON_SECRET.

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }

  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.rpc('update_overdue_periods')

  if (error) {
    console.error('[CRON update-overdue]', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, ran_at: new Date().toISOString() })
}
