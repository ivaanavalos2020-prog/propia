'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'

const CATEGORIAS = ['Frente', 'Living', 'Cocina', 'Dormitorio', 'Baño', 'Extras']

export default function GaleriaFotos({ fotos }: { fotos: string[] }) {
  const [activa, setActiva] = useState(0)
  const [fadeKey, setFadeKey] = useState(0)

  const ir = useCallback((i: number) => {
    setActiva(i)
    setFadeKey((k) => k + 1)
  }, [])

  const anterior = useCallback(() => ir((activa - 1 + fotos.length) % fotos.length), [activa, fotos.length, ir])
  const siguiente = useCallback(() => ir((activa + 1) % fotos.length), [activa, fotos.length, ir])

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
      <div className="relative w-full overflow-hidden rounded-2xl bg-zinc-900" style={{ height: '500px' }}>
        {/* Imagen con fade */}
        <Image
          key={fadeKey}
          src={fotos[activa]}
          alt={`Foto ${activa + 1}`}
          fill
          className="object-cover animate-fadein"
          priority
          sizes="(max-width: 768px) 100vw, 1200px"
        />

        {/* Flechas de navegación */}
        {fotos.length > 1 && (
          <>
            <button
              type="button"
              onClick={anterior}
              aria-label="Foto anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/75"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={siguiente}
              aria-label="Foto siguiente"
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/75"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </>
        )}

        {/* Contador superior derecho */}
        <span className="absolute right-4 top-4 rounded-full bg-black/60 px-3 py-1 text-sm font-medium text-white backdrop-blur-sm">
          {activa + 1} / {fotos.length}
        </span>

        {/* Badge categoría inferior izquierdo */}
        {CATEGORIAS[activa] && (
          <span className="absolute bottom-4 left-4 rounded-lg bg-black/60 px-4 py-2 text-base font-bold text-white backdrop-blur-sm">
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
              onClick={() => ir(i)}
              className={`relative h-20 w-32 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-300 md:h-24 md:w-40 ${
                i === activa
                  ? 'border-white brightness-100'
                  : 'border-transparent brightness-[0.85] hover:brightness-100'
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
                <span className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-2 py-0.5 text-[10px] font-medium leading-none text-white backdrop-blur-sm">
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
