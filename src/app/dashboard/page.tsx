import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'

const TIPO_LABEL: Record<string, string> = {
  departamento: 'Departamento',
  casa: 'Casa',
  habitacion: 'Habitación',
  local: 'Local comercial',
}

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const { data: propiedades } = await supabase
    .from('properties')
    .select('id, tipo, direccion, precio, incluye_expensas')
    .eq('owner_id', session.user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-950 text-zinc-50">
      {/* Nav */}
      <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-5 md:px-12">
        <span className="text-lg font-bold tracking-widest text-zinc-50">PROPIA</span>
        <span className="text-sm text-zinc-400">{session.user.email}</span>
      </header>

      {/* Contenido */}
      <main className="flex flex-1 flex-col px-6 py-10 md:px-12">
        <div className="mx-auto w-full max-w-4xl">

          {/* Encabezado de sección */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-zinc-50">Mis propiedades</h2>
            <Link
              href="/publicar"
              className="rounded-lg bg-zinc-50 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-80"
            >
              Publicar propiedad
            </Link>
          </div>

          {/* Lista o estado vacío */}
          {propiedades && propiedades.length > 0 ? (
            <ul className="mt-8 flex flex-col gap-3">
              {propiedades.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-4"
                >
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-zinc-50">
                        {TIPO_LABEL[p.tipo] ?? p.tipo}
                      </span>
                      <span className="rounded-full bg-emerald-950 px-2 py-0.5 text-xs font-medium text-emerald-400">
                        Activa
                      </span>
                    </div>
                    <span className="truncate text-sm text-zinc-400">{p.direccion}</span>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-sm font-semibold text-zinc-50">
                      USD {Number(p.precio).toLocaleString('es-AR')}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {p.incluye_expensas ? 'Expensas incluidas' : 'Sin expensas'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 py-20 text-center">
              <p className="text-base text-zinc-400">
                Todavía no publicaste ninguna propiedad.
              </p>
              <Link
                href="/publicar"
                className="mt-4 text-sm font-medium text-zinc-50 underline underline-offset-4 transition-opacity hover:opacity-70"
              >
                Publicá tu primera propiedad
              </Link>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
