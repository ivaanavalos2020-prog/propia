'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'

interface Props {
  userId: string
  currentStatus: string
  isVerified: boolean
}

type Paso = 1 | 2 | 3 | 4

interface Archivos {
  dniFront: File | null
  dniBack:  File | null
  selfie:   File | null
}

const BENEFICIOS = [
  'Badge verificado visible en tu perfil',
  'Acceso a propiedades exclusivas para verificados',
  'Mayor confianza de dueños e inquilinos',
  '2× más respuestas a tus consultas',
]

function IconEscudo({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function FileZone({
  label,
  hint,
  file,
  onSelect,
  ejemplo,
}: {
  label: string
  hint: string
  file: File | null
  onSelect: (f: File) => void
  ejemplo?: React.ReactNode
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-semibold text-slate-800">{label}</label>
      <p className="text-xs text-slate-500">{hint}</p>

      {ejemplo}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={[
          'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-8 px-4 text-center transition-colors',
          file
            ? 'border-green-400 bg-green-50'
            : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/40',
        ].join(' ')}
      >
        {file ? (
          <>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-green-700">{file.name}</p>
            <p className="text-xs text-green-600">Toca para cambiar</p>
          </>
        ) : (
          <>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-700">Subir foto</p>
            <p className="text-xs text-slate-400">JPG o PNG · máx 5 MB</p>
          </>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onSelect(f)
        }}
      />
    </div>
  )
}

function DniEjemplo({ side }: { side: 'front' | 'back' }) {
  return (
    <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-3">
      <div className="flex w-48 flex-col gap-1 rounded-lg border border-slate-300 bg-white p-3 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-slate-200" />
          <div className="h-2 w-20 rounded bg-slate-200" />
        </div>
        {side === 'front' ? (
          <>
            <div className="h-1.5 w-28 rounded bg-slate-200 mt-1" />
            <div className="h-1.5 w-20 rounded bg-slate-100" />
            <div className="mt-1 text-[8px] font-bold text-slate-400 text-center tracking-wider">FRENTE · FOTO Y DATOS</div>
          </>
        ) : (
          <>
            <div className="h-1.5 w-32 rounded bg-slate-200 mt-1" />
            <div className="h-1.5 w-24 rounded bg-slate-100" />
            <div className="mt-1 text-[8px] font-bold text-slate-400 text-center tracking-wider">DORSO · CÓDIGO DE BARRAS</div>
          </>
        )}
      </div>
    </div>
  )
}

function SelfieEjemplo() {
  return (
    <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-3">
      <div className="flex flex-col items-center gap-1">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-slate-300 bg-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
            <circle cx="12" cy="7" r="4"/><path d="M5.5 21a8.5 8.5 0 0 1 13 0"/>
          </svg>
          <div className="absolute -right-4 -bottom-1 flex h-9 w-7 items-center justify-center rounded border border-slate-300 bg-white">
            <div className="h-4 w-5 rounded-sm bg-slate-200" />
          </div>
        </div>
        <p className="mt-2 text-[8px] font-bold uppercase tracking-wider text-slate-400">Cara + DNI abierto</p>
      </div>
    </div>
  )
}

export default function VerificarIdentidadClient({ userId, currentStatus, isVerified }: Props) {
  const [paso, setPaso] = useState<Paso>(1)
  const [archivos, setArchivos] = useState<Archivos>({ dniFront: null, dniBack: null, selfie: null })
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [enviado, setEnviado] = useState(currentStatus === 'pending')

  // ── Si ya está verificado ─────────────────────────────────────
  if (isVerified) {
    return (
      <div className="flex flex-col items-center gap-5 rounded-2xl border border-green-200 bg-green-50 px-6 py-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div>
          <p className="text-lg font-bold text-green-800">Identidad verificada</p>
          <p className="mt-1 text-sm text-green-700">Tu cuenta tiene el badge de identidad verificada activo.</p>
        </div>
        <Link href="/perfil" className="rounded-lg bg-green-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700">
          Ir a mi perfil
        </Link>
      </div>
    )
  }

  // ── Si está pendiente de revisión ─────────────────────────────
  if (enviado) {
    return (
      <div className="flex flex-col items-center gap-5 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
          <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <div>
          <p className="text-lg font-bold text-amber-800">Verificación en proceso</p>
          <p className="mt-1 text-sm text-amber-700">
            Tu verificación está siendo revisada. Te notificaremos en 24–48 horas.
          </p>
        </div>
        <Link href="/perfil" className="rounded-lg border border-amber-300 bg-white px-6 py-2.5 text-sm font-semibold text-amber-700 transition-colors hover:bg-amber-50">
          Volver al perfil
        </Link>
      </div>
    )
  }

  async function enviar() {
    if (!archivos.dniFront || !archivos.dniBack || !archivos.selfie) {
      setError('Necesitás subir las tres fotos antes de enviar.')
      return
    }
    setEnviando(true)
    setError(null)

    try {
      const supabase = createClient()

      async function upload(file: File, name: string): Promise<string> {
        const ext  = file.name.split('.').pop() ?? 'jpg'
        const path = `${userId}/${name}.${ext}`
        const { error: upErr } = await supabase.storage
          .from('verificaciones')
          .upload(path, file, { upsert: true })
        if (upErr) throw upErr
        const { data: { publicUrl } } = supabase.storage
          .from('verificaciones')
          .getPublicUrl(path)
        return publicUrl
      }

      const [frontUrl, backUrl, selfieUrl] = await Promise.all([
        upload(archivos.dniFront!, 'dni_front'),
        upload(archivos.dniBack!,  'dni_back'),
        upload(archivos.selfie!,   'selfie'),
      ])

      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          verification_status:       'pending',
          verification_dni_front_url: frontUrl,
          verification_dni_back_url:  backUrl,
          verification_selfie_url:    selfieUrl,
        })
        .eq('id', userId)

      if (updateErr) throw updateErr

      setEnviado(true)
    } catch (err) {
      console.error(err)
      setError('Ocurrió un error al enviar. Revisá tu conexión e intentá de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
          <IconEscudo className="h-7 w-7 text-blue-600" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900" style={{ letterSpacing: '-0.02em' }}>
          Verificá tu identidad
        </h1>
        <p className="mt-2 text-sm text-slate-500">Proceso simple y seguro · Solo lo revisa el equipo de PROPIA</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-0">
        {([1, 2, 3, 4] as Paso[]).map((n, i) => (
          <div key={n} className="flex flex-1 items-center">
            <div className={[
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors',
              paso === n  ? 'bg-blue-600 text-white' :
              paso > n    ? 'bg-green-500 text-white' :
                            'bg-slate-200 text-slate-500',
            ].join(' ')}>
              {paso > n ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : n}
            </div>
            {i < 3 && <div className={['flex-1 h-0.5 transition-colors', paso > n ? 'bg-green-400' : 'bg-slate-200'].join(' ')} />}
          </div>
        ))}
      </div>

      {/* Paso 1: Por qué verificar */}
      {paso === 1 && (
        <div className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">¿Por qué verificar tu identidad?</h2>
          <p className="mt-2 text-sm text-slate-500">
            Los usuarios verificados generan más confianza y reciben{' '}
            <strong className="text-slate-700">2× más respuestas</strong> que los no verificados.
          </p>
          <ul className="mt-4 flex flex-col gap-2.5">
            {BENEFICIOS.map((b) => (
              <li key={b} className="flex items-center gap-3 text-sm text-slate-700">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                {b}
              </li>
            ))}
          </ul>
          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs text-slate-500">
              <strong className="text-slate-700">Tu privacidad es nuestra prioridad.</strong> Las fotos se almacenan de forma privada y segura, solo accesibles por el equipo de PROPIA para la verificación.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPaso(2)}
            className="mt-6 w-full rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Comenzar verificación →
          </button>
        </div>
      )}

      {/* Paso 2: DNI frente */}
      {paso === 2 && (
        <div className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Foto del DNI — frente</h2>
          <p className="mt-1 text-sm text-slate-500 mb-4">
            Sacá una foto clara del frente de tu DNI. Asegurate que se vea tu foto, nombre y número.
          </p>
          <FileZone
            label="DNI frente"
            hint="Foto o escáner del frente del DNI. Sin reflejos ni partes tapadas."
            file={archivos.dniFront}
            onSelect={(f) => setArchivos((prev) => ({ ...prev, dniFront: f }))}
            ejemplo={<DniEjemplo side="front" />}
          />
          <div className="mt-6 flex gap-3">
            <button type="button" onClick={() => setPaso(1)} className="flex-1 rounded-xl border border-slate-300 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50">
              Atrás
            </button>
            <button
              type="button"
              onClick={() => setPaso(3)}
              disabled={!archivos.dniFront}
              className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-40"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {/* Paso 3: DNI dorso */}
      {paso === 3 && (
        <div className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Foto del DNI — dorso</h2>
          <p className="mt-1 text-sm text-slate-500 mb-4">
            Ahora sacá una foto del dorso de tu DNI con el código de barras visible.
          </p>
          <FileZone
            label="DNI dorso"
            hint="Foto o escáner del dorso del DNI. El código de barras debe verse con claridad."
            file={archivos.dniBack}
            onSelect={(f) => setArchivos((prev) => ({ ...prev, dniBack: f }))}
            ejemplo={<DniEjemplo side="back" />}
          />
          <div className="mt-6 flex gap-3">
            <button type="button" onClick={() => setPaso(2)} className="flex-1 rounded-xl border border-slate-300 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50">
              Atrás
            </button>
            <button
              type="button"
              onClick={() => setPaso(4)}
              disabled={!archivos.dniBack}
              className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-40"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {/* Paso 4: Selfie */}
      {paso === 4 && (
        <div className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Selfie con tu DNI</h2>
          <p className="mt-1 text-sm text-slate-500 mb-4">
            Sacate una foto sosteniendo tu DNI abierto junto a tu cara. Asegurate que se lean los datos del DNI y que se vea tu cara con claridad.
          </p>
          <FileZone
            label="Selfie sosteniendo el DNI"
            hint="DNI abierto a la par de tu cara. Buena iluminación, sin lentes oscuros."
            file={archivos.selfie}
            onSelect={(f) => setArchivos((prev) => ({ ...prev, selfie: f }))}
            ejemplo={<SelfieEjemplo />}
          />

          {error && (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="mt-6 flex gap-3">
            <button type="button" onClick={() => setPaso(3)} className="flex-1 rounded-xl border border-slate-300 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50" disabled={enviando}>
              Atrás
            </button>
            <button
              type="button"
              onClick={enviar}
              disabled={!archivos.selfie || enviando}
              className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-40"
            >
              {enviando ? 'Enviando...' : 'Enviar verificación'}
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
