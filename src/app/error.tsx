'use client'

import Link from 'next/link'

export default function Error({
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-red-50">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#dc2626"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      <p className="text-xs font-bold uppercase tracking-widest text-red-600">Error inesperado</p>
      <h1
        className="mt-3 text-4xl font-extrabold text-slate-900"
        style={{ letterSpacing: '-0.03em' }}
      >
        Algo salió mal
      </h1>
      <p className="mt-4 max-w-sm text-base text-slate-500">
        Ocurrió un error inesperado. Podés intentar de nuevo o volver al inicio.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={reset}
          className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          Intentar de nuevo
        </button>
        <Link
          href="/"
          className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
