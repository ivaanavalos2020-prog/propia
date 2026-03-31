import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-50">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#2563EB"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </div>

      <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Error 404</p>
      <h1
        className="mt-3 text-4xl font-extrabold text-slate-900"
        style={{ letterSpacing: '-0.03em' }}
      >
        Página no encontrada
      </h1>
      <p className="mt-4 max-w-sm text-base text-slate-500">
        La página que buscás no existe o fue movida. Chequeá la URL o volvé al inicio.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          Volver al inicio
        </Link>
        <Link
          href="/propiedades"
          className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          Ver propiedades
        </Link>
      </div>
    </div>
  )
}
