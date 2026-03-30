import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic()

export async function POST(req: NextRequest) {
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

    const message = await client.messages.create({
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
    })

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
