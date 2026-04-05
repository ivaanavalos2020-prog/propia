import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

const TREINTA_DIAS_MS = 30 * 24 * 60 * 60 * 1000

// ── Rate limiting: max 10 requests per IP per hour ──────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 10
const RATE_WINDOW_MS = 60 * 60 * 1000 // 1 hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

function limpiarJSON(texto: string): string {
  // Remove all possible code fence variants
  let s = texto.trim()
  s = s.replace(/^```(?:json)?\s*/i, '')
  s = s.replace(/\s*```$/, '')
  s = s.trim()
  // If there's still leading/trailing non-JSON chars, extract the first {...} block
  const match = s.match(/\{[\s\S]*\}/)
  return match ? match[0] : s
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { advertencia: 'Demasiadas solicitudes. Intentá de nuevo más tarde.' },
      { status: 429 }
    )
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  console.log('[ubicacion-info] API key configured:', !!apiKey)

  try {
    const body = await req.json()
    const { property_id, address, neighborhood, city } = body
    console.log('[ubicacion-info] request:', { property_id, address, neighborhood, city })

    if (!property_id) {
      return NextResponse.json({ error: 'property_id requerido' }, { status: 400 })
    }

    // ── Check cache (wrapped so a missing table doesn't abort the whole request) ──
    let cacheHit = false
    try {
      const supabase = await createServerSupabaseClient()
      const { data: cached, error: cacheError } = await supabase
        .from('property_location_info')
        .select('info_json, created_at')
        .eq('property_id', property_id)
        .single()

      if (cacheError) {
        console.warn('[ubicacion-info] cache read error (continuing):', cacheError.message)
      } else if (cached) {
        const edad = Date.now() - new Date(cached.created_at).getTime()
        if (edad < TREINTA_DIAS_MS) {
          console.log('[ubicacion-info] cache hit')
          cacheHit = true
          return NextResponse.json(cached.info_json)
        }
      }
    } catch (cacheErr) {
      console.warn('[ubicacion-info] cache check threw (continuing):', cacheErr)
    }

    // ── Build location string ──────────────────────────────────────
    const partes = [address, neighborhood, city].filter(Boolean)
    if (partes.length === 0) {
      return NextResponse.json({
        advertencia: 'No se proporcionó información de ubicación suficiente.',
      })
    }
    const ubicacion = partes.join(', ')
    console.log('[ubicacion-info] querying Claude for:', ubicacion)

    // ── Call Claude with 15s timeout ───────────────────────────────
    const client = new Anthropic({ apiKey })
    const TIMEOUT_MS = parseInt(process.env.CLAUDE_TIMEOUT_MS ?? '15000')
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

    let texto = ''
    try {
      const message = await client.messages.create(
        {
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          system:
            'Sos un experto en geografía urbana argentina, especialmente del Gran Buenos Aires y CABA. ' +
            'Tu tarea es describir los beneficios de vivir en una ubicación específica para alguien que busca alquilar. ' +
            'Sé específico, real y útil. Nunca inventes información. ' +
            'Si no conocés bien la zona, sé honesto y describí lo que sabés con certeza. ' +
            'Respondé SOLO en formato JSON válido, sin texto adicional, sin markdown, sin backticks.',
          messages: [
            {
              role: 'user',
              content:
                `Describí los beneficios de vivir en: ${ubicacion}, Argentina.\n` +
                'Devolvé un JSON con esta estructura exacta:\n' +
                '{\n' +
                '  "zona": "nombre del barrio o zona conocida",\n' +
                '  "descripcion_general": "párrafo de 2-3 oraciones describiendo el ambiente y estilo de vida de la zona",\n' +
                '  "transporte": ["lista de medios de transporte cercanos conocidos: subtes con línea y estación, trenes con ramal y estación, colectivos principales"],\n' +
                '  "gastronomia": ["2-4 tipos de lugares para comer o cafeterías típicas de la zona"],\n' +
                '  "areas_verdes": ["plazas, parques o espacios verdes cercanos conocidos"],\n' +
                '  "servicios": ["supermercados, farmacias, bancos, hospitales u otros servicios relevantes cercanos"],\n' +
                '  "educacion": ["colegios, universidades o institutos conocidos en la zona si los hay"],\n' +
                '  "vida_nocturna": "descripción breve del ambiente nocturno si aplica, sino null",\n' +
                '  "perfil_vecinos": "descripción del tipo de vecindario: familiar, estudiantil, comercial, tranquilo, etc.",\n' +
                '  "puntaje_conectividad": 8,\n' +
                '  "puntaje_servicios": 7,\n' +
                '  "puntaje_verde": 5,\n' +
                '  "advertencia": "si no conocés bien la zona ponés aquí una advertencia honesta, sino null"\n' +
                '}\n' +
                'Solo incluí información que conozcas con certeza. Si no sabés algo específico, omití ese item de la lista.',
            },
          ],
        },
        { signal: controller.signal }
      )
      texto = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
      console.log('[ubicacion-info] Claude raw response (first 200 chars):', texto.slice(0, 200))
    } finally {
      clearTimeout(timeoutId)
    }

    // ── Parse JSON ─────────────────────────────────────────────────
    let info: Record<string, unknown>
    try {
      const limpio = limpiarJSON(texto)
      console.log('[ubicacion-info] cleaned JSON (first 200 chars):', limpio.slice(0, 200))
      info = JSON.parse(limpio)
    } catch (parseErr) {
      console.error('[ubicacion-info] JSON parse failed:', parseErr, '\nraw text:', texto)
      return NextResponse.json(
        {
          advertencia:
            'No pudimos generar información estructurada para esta zona. Por favor verificá la dirección.',
        },
        { status: 200 }
      )
    }

    // ── Persist to cache (best-effort) ─────────────────────────────
    if (!cacheHit) {
      try {
        const supabase = await createServerSupabaseClient()
        const { error: upsertError } = await supabase
          .from('property_location_info')
          .upsert(
            {
              property_id,
              neighborhood: neighborhood ?? null,
              city: city ?? null,
              info_json: info,
            },
            { onConflict: 'property_id' }
          )
        if (upsertError) {
          console.warn('[ubicacion-info] cache write error (non-fatal):', upsertError.message)
        }
      } catch (saveErr) {
        console.warn('[ubicacion-info] cache write threw (non-fatal):', saveErr)
      }
    }

    return NextResponse.json(info)
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err)
    const errStack = err instanceof Error ? err.stack : undefined
    console.error('[ubicacion-info] unhandled error:', errMsg, errStack)
    return NextResponse.json(
      { advertencia: `No se pudo obtener información de la zona. Error: ${errMsg}` },
      { status: 200 }
    )
  }
}
