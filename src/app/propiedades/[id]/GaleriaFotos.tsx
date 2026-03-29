'use client'

import { useState } from 'react'
import Image from 'next/image'

const CATEGORIAS = ['Frente', 'Living', 'Cocina', 'Dormitorio', 'Baño', 'Extras']

export default function GaleriaFotos({ fotos }: { fotos: string[] }) {
  const [activa, setActiva] = useState(0)

  if (fotos.length === 0) {
    return (
      <div className="flex h-72 w-full items-center justify-center rounded-2xl bg-zinc-900 md:h-[480px]">
        <div className="flex flex-col items-center gap-3 text-zinc-600">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span className="text-sm">Sin fotos</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Foto principal */}
      <div className="relative w-full overflow-hidden rounded-2xl bg-zinc-900" style={{ aspectRatio: '16/9' }}>
        <Image
          key={activa}
          src={fotos[activa]}
          alt={`Foto ${activa + 1}`}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, 1200px"
        />
        {CATEGORIAS[activa] && (
          <span className="absolute bottom-3 left-3 rounded-md bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
            {CATEGORIAS[activa]}
          </span>
        )}
      </div>

      {/* Miniaturas */}
      {fotos.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {fotos.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiva(i)}
              className={`relative h-20 w-32 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-150 md:h-24 md:w-40 ${
                i === activa
                  ? 'border-white opacity-100 shadow-[0_0_0_2px_rgba(255,255,255,0.15)]'
                  : 'border-transparent opacity-40 hover:opacity-70 hover:border-zinc-600'
              }`}
            >
              <Image
                src={src}
                alt={`Miniatura ${i + 1}`}
                fill
                className="object-cover"
                sizes="160px"
              />
              {CATEGORIAS[i] && (
                <span className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium leading-none text-white backdrop-blur-sm">
                  {CATEGORIAS[i]}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
