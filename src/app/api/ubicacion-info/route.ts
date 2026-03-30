import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

const client = new Anthropic()

const TREINTA_DIAS_MS = 30 * 24 * 60 * 60 * 1000

export async function POST(req: NextRequest) {
  try {
    const { property_id, address, neighborhood, city } = await req.json()

    if (!property_id) {
      return NextResponse.json({ error: 'property_id requerido' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    // ── Check cache ────────────────────────────────────────────────
    const { data: cached } = await supabase
      .from('property_location_info')
      .select('info_json, created_at')
      .eq('property_id', property_id)
      .single()

    if (cached) {
      const edad = Date.now() - new Date(cached.created_at).getTime()
      if (edad < TREINTA_DIAS_MS) {
        return NextResponse.json(cached.info_json)
      }
    }

    // ── Build location string ──────────────────────────────────────
    const partes = [address, neighborhood, city].filter(Boolean)
    if (partes.length === 0) {
      return NextResponse.json({
        advertencia: 'No se proporcionó información de ubicación suficiente.',
      })
    }
    const ubicacion = partes.join(', ')

    // ── Call Claude ────────────────────────────────────────────────
    const message = await client.messages.create({
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
    })

    const texto = message.content[0].type === 'text' ? message.content[0].text.trim() : ''

    let info: Record<string, unknown>
    try {
      // Strip markdown code fences in case they appear despite instructions
      const limpio = texto.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
      info = JSON.parse(limpio)
    } catch {
      return NextResponse.json(
        {
          advertencia:
            'No pudimos generar información estructurada para esta zona. Por favor verificá la dirección.',
        },
        { status: 200 }
      )
    }

    // ── Persist to cache ───────────────────────────────────────────
    await supabase.from('property_location_info').upsert(
      {
        property_id,
        neighborhood: neighborhood ?? null,
        city: city ?? null,
        info_json: info,
      },
      { onConflict: 'property_id' }
    )

    return NextResponse.json(info)
  } catch (err) {
    console.error('Error ubicacion-info:', err)
    return NextResponse.json(
      { advertencia: 'No se pudo obtener información de la zona en este momento.' },
      { status: 200 }
    )
  }
}
