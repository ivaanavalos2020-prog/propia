import Link from 'next/link'

const diferenciales = [
  {
    titulo: 'Comisión 0% para alquileres',
    descripcion: 'Nada de porcentajes sobre el contrato. Lo que acordás es lo que pagás.',
  },
  {
    titulo: 'Contratos digitales en minutos',
    descripcion: 'Generá y firmá tu contrato desde el teléfono, sin escribanías ni esperas.',
  },
  {
    titulo: 'Sin inmobiliarias',
    descripcion: 'Dueño e inquilino se conectan directo. Menos burocracia, más transparencia.',
  },
]

export default function LandingPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-950 text-zinc-50">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-5 md:px-12">
        <span className="text-lg font-bold tracking-widest text-zinc-50">PROPIA</span>
        <Link
          href="/login"
          className="text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-50"
        >
          Ingresar
        </Link>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center md:px-12">
        <h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight text-zinc-50 md:text-6xl">
          Alquilá sin intermediarios
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-400">
          Conectamos dueños e inquilinos directamente. Sin comisiones abusivas.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/login"
            className="rounded-lg bg-zinc-50 px-7 py-3 text-base font-semibold text-zinc-950 transition-opacity hover:opacity-80"
          >
            Soy dueño
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-zinc-700 px-7 py-3 text-base font-semibold text-zinc-50 transition-colors hover:border-zinc-500 hover:bg-zinc-900"
          >
            Busco alquiler
          </Link>
        </div>
      </main>

      {/* Diferenciales */}
      <section className="border-t border-zinc-800 px-6 py-16 md:px-12">
        <div className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-3">
          {diferenciales.map(({ titulo, descripcion }) => (
            <div key={titulo} className="flex flex-col gap-2">
              <h3 className="text-base font-semibold text-zinc-50">{titulo}</h3>
              <p className="text-sm leading-relaxed text-zinc-500">{descripcion}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
