import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

const client = new Anthropic()

// ── Rate limiting: max 10 requests per user per hour ─────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 10
const RATE_WINDOW_MS = 60 * 60 * 1000 // 1 hour

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(userId)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

export async function POST(req: NextRequest) {
  // ── Auth: verificar sesión ────────────────────────────────────────────────
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (!checkRateLimit(session.user.id)) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Intentá de nuevo en una hora.' },
      { status: 429 }
    )
  }

  try {
    const body = await req.json()
    const { descripcion, tipo, direccion, ambientes, banos, superficie, caracteristicas } = body

    if (!descripcion || descripcion.trim().length < 10) {
      return NextResponse.json(
        { error: 'La descripción es demasiado corta para mejorar.' },
        { status: 400 }
      )
    }

    const datosProp = [
      tipo && `Tipo: ${tipo}`,
      direccion && `Dirección: ${direccion}`,
      ambientes && `Ambientes: ${ambientes}`,
      banos && `Baños: ${banos}`,
      superficie && `Superficie: ${superficie} m²`,
      caracteristicas?.length && `Características: ${caracteristicas.join(', ')}`,
    ]
      .filter(Boolean)
      .join('\n')

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 20_000)

    let message: Awaited<ReturnType<typeof client.messages.create>>
    try {
      message = await client.messages.create(
        {
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 600,
          system:
            'Sos un experto en bienes raíces argentino. Tu tarea es mejorar descripciones de propiedades para alquiler. ' +
            'Escribí en español rioplatense, tono profesional pero cercano. ' +
            'Destacá los puntos positivos, mencioná la ubicación y características principales. ' +
            'Máximo 300 palabras. No inventés información que no te dieron. ' +
            'Devolvé solo la descripción mejorada, sin comentarios adicionales.',
          messages: [
            {
              role: 'user',
              content: `Mejorá esta descripción de propiedad:\n\n"${descripcion.trim()}"\n\nDatos de la propiedad:\n${datosProp}`,
            },
          ],
        },
        { signal: controller.signal }
      )
    } finally {
      clearTimeout(timeoutId)
    }

    const texto =
      message.content[0].type === 'text' ? message.content[0].text : ''

    return NextResponse.json({ descripcion: texto })
  } catch (err) {
    console.error('Error mejorar-descripcion:', err)
    return NextResponse.json(
      { error: 'No se pudo mejorar la descripción. Intentá de nuevo.' },
      { status: 500 }
    )
  }
}
