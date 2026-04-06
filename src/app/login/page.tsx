'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'

type Tab = 'login' | 'registro'
type EstadoEnvio = 'idle' | 'cargando' | 'ok' | 'error'

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

const inputCls = 'w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10 disabled:opacity-50 transition-colors'

export default function LoginPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('login')
  const [visible, setVisible] = useState(false)

  // Login state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPass, setLoginPass] = useState('')
  const [loginEstado, setLoginEstado] = useState<EstadoEnvio>('idle')
  const [loginError, setLoginError] = useState('')

  // Registro state
  const [regEmail, setRegEmail] = useState('')
  const [regPass, setRegPass] = useState('')
  const [regPassConfirm, setRegPassConfirm] = useState('')
  const [regEstado, setRegEstado] = useState<EstadoEnvio>('idle')
  const [regError, setRegError] = useState('')

  // Recuperar contraseña
  const [modoReset, setModoReset] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetEstado, setResetEstado] = useState<EstadoEnvio>('idle')
  const [resetError, setResetError] = useState('')

  // Magic link
  const [modoMagic, setModoMagic] = useState(false)
  const [magicEmail, setMagicEmail] = useState('')
  const [magicEstado, setMagicEstado] = useState<EstadoEnvio>('idle')
  const [magicError, setMagicError] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  function traducirError(msg: string): string {
    if (!msg) return 'Ocurrió un error. Intentá de nuevo.'
    const m = msg.toLowerCase()
    if (m.includes('invalid login credentials') || m.includes('invalid email or password')) return 'Email o contraseña incorrectos.'
    if (m.includes('email not confirmed')) return 'Necesitás confirmar tu email antes de ingresar. Revisá tu bandeja.'
    if (m.includes('user already registered')) return 'Ya existe una cuenta con ese email. Iniciá sesión.'
    if (m.includes('password should be at least')) return 'La contraseña debe tener al menos 6 caracteres.'
    if (m.includes('rate limit')) return 'Demasiados intentos. Esperá unos minutos.'
    if (m.includes('email')) return 'El email ingresado no es válido.'
    return msg
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginError('')
    if (!loginEmail || !loginPass) { setLoginError('Completá todos los campos.'); return }
    setLoginEstado('cargando')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPass })
    if (error) {
      setLoginError(traducirError(error.message))
      setLoginEstado('error')
    } else {
      router.push('/dashboard')
    }
  }

  async function handleRegistro(e: React.FormEvent) {
    e.preventDefault()
    setRegError('')
    if (!regEmail || !regPass || !regPassConfirm) { setRegError('Completá todos los campos.'); return }
    if (regPass.length < 6) { setRegError('La contraseña debe tener al menos 6 caracteres.'); return }
    if (regPass !== regPassConfirm) { setRegError('Las contraseñas no coinciden.'); return }
    setRegEstado('cargando')
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: regEmail,
      password: regPass,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setRegError(traducirError(error.message))
      setRegEstado('error')
    } else {
      setRegEstado('ok')
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setResetError('')
    if (!resetEmail) { setResetError('Ingresá tu email.'); return }
    setResetEstado('cargando')
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    })
    if (error) {
      setResetError(traducirError(error.message))
      setResetEstado('error')
    } else {
      setResetEstado('ok')
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setMagicError('')
    if (!magicEmail) { setMagicError('Ingresá tu email.'); return }
    setMagicEstado('cargando')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: magicEmail,
      options: { shouldCreateUser: true, emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setMagicError(traducirError(error.message))
      setMagicEstado('error')
    } else {
      setMagicEstado('ok')
    }
  }

  async function handleGoogle() {
    try {
      const supabase = createClient()
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      })
    } catch {
      // Si Google no está habilitado como provider, no hace nada
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-300 bg-white px-6 py-4">
        <Link href="/" className="flex flex-col leading-none">
          <span className="text-base font-bold tracking-widest text-slate-900">PROPIA</span>
          <span className="text-[9px] font-semibold uppercase tracking-widest text-blue-600">Sin intermediarios</span>
        </Link>
        <Link href="/" className="text-sm text-slate-500 transition-colors hover:text-slate-900">← Volver</Link>
      </header>

      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className={`w-full max-w-sm transition-all duration-500 ease-out ${visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}`}>

          {/* Logo */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900" style={{ letterSpacing: '-0.02em' }}>
              Ingresá a PROPIA
            </h1>
          </div>

          <div className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm">

            {/* Modo reset */}
            {modoReset ? (
              <>
                <button type="button" onClick={() => { setModoReset(false); setResetEstado('idle') }}
                  className="mb-4 flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                  Volver
                </button>
                <h2 className="mb-4 text-base font-bold text-slate-900">Recuperar contraseña</h2>
                {resetEstado === 'ok' ? (
                  <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-center">
                    <p className="text-sm font-semibold text-slate-900">Revisá tu email</p>
                    <p className="mt-1 text-sm text-slate-500">Te enviamos un link para restablecer tu contraseña a <span className="font-medium text-slate-700">{resetEmail}</span>.</p>
                  </div>
                ) : (
                  <form onSubmit={handleReset} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="reset-email" className="text-sm font-medium text-slate-700">Email</label>
                      <input id="reset-email" type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="tu@email.com" required disabled={resetEstado === 'cargando'} autoComplete="email" className={inputCls} />
                    </div>
                    {resetError && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{resetError}</p>}
                    <button type="submit" disabled={resetEstado === 'cargando'}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50">
                      {resetEstado === 'cargando' ? <><Spinner /> Enviando...</> : 'Enviar link de recuperación'}
                    </button>
                  </form>
                )}
              </>
            ) : modoMagic ? (
              /* Modo magic link */
              <>
                <button type="button" onClick={() => { setModoMagic(false); setMagicEstado('idle') }}
                  className="mb-4 flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                  Volver
                </button>
                <h2 className="mb-4 text-base font-bold text-slate-900">Link mágico</h2>
                {magicEstado === 'ok' ? (
                  <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">Revisá tu email</p>
                    <p className="mt-1 text-sm text-slate-500">Te enviamos un link a <span className="font-medium text-slate-700">{magicEmail}</span>.</p>
                  </div>
                ) : (
                  <form onSubmit={handleMagicLink} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="magic-email" className="text-sm font-medium text-slate-700">Email</label>
                      <input id="magic-email" type="email" value={magicEmail} onChange={(e) => setMagicEmail(e.target.value)}
                        placeholder="tu@email.com" required disabled={magicEstado === 'cargando'} autoComplete="email" className={inputCls} />
                    </div>
                    {magicError && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{magicError}</p>}
                    <button type="submit" disabled={magicEstado === 'cargando'}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50">
                      {magicEstado === 'cargando' ? <><Spinner /> Enviando...</> : 'Enviar link mágico'}
                    </button>
                  </form>
                )}
              </>
            ) : (
              /* Tabs normales */
              <>
                {/* Tabs */}
                <div className="mb-5 flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                  {(['login', 'registro'] as Tab[]).map((t) => (
                    <button key={t} type="button" onClick={() => setTab(t)}
                      className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                      {t === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
                    </button>
                  ))}
                </div>

                {tab === 'login' ? (
                  /* ── LOGIN ── */
                  loginEstado === 'ok' ? null : (
                    <form onSubmit={handleLogin} className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="login-email" className="text-sm font-medium text-slate-700">Email</label>
                        <input id="login-email" type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)}
                          placeholder="tu@email.com" required disabled={loginEstado === 'cargando'} autoComplete="email" className={inputCls} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <label htmlFor="login-pass" className="text-sm font-medium text-slate-700">Contraseña</label>
                          <button type="button" onClick={() => { setModoReset(true); setResetEmail(loginEmail) }}
                            className="text-xs font-medium text-blue-600 hover:text-blue-700">
                            ¿Olvidaste tu contraseña?
                          </button>
                        </div>
                        <input id="login-pass" type="password" value={loginPass} onChange={(e) => setLoginPass(e.target.value)}
                          placeholder="••••••••" required disabled={loginEstado === 'cargando'} autoComplete="current-password" className={inputCls} />
                      </div>
                      {loginError && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{loginError}</p>}
                      <button type="submit" disabled={loginEstado === 'cargando' || !loginEmail || !loginPass}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50">
                        {loginEstado === 'cargando' ? <><Spinner /> Ingresando...</> : 'Entrar'}
                      </button>
                    </form>
                  )
                ) : (
                  /* ── REGISTRO ── */
                  regEstado === 'ok' ? (
                    <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-center">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                      <p className="text-base font-semibold text-slate-900">¡Cuenta creada!</p>
                      <p className="mt-1.5 text-sm text-slate-500">Revisá tu email para confirmar la cuenta y empezar a usar PROPIA.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleRegistro} className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="reg-email" className="text-sm font-medium text-slate-700">Email</label>
                        <input id="reg-email" type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="tu@email.com" required disabled={regEstado === 'cargando'} autoComplete="email" className={inputCls} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="reg-pass" className="text-sm font-medium text-slate-700">Contraseña <span className="text-xs font-normal text-slate-400">(mín. 6 caracteres)</span></label>
                        <input id="reg-pass" type="password" value={regPass} onChange={(e) => setRegPass(e.target.value)}
                          placeholder="••••••••" required minLength={6} disabled={regEstado === 'cargando'} autoComplete="new-password" className={inputCls} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="reg-pass-confirm" className="text-sm font-medium text-slate-700">Confirmar contraseña</label>
                        <input id="reg-pass-confirm" type="password" value={regPassConfirm} onChange={(e) => setRegPassConfirm(e.target.value)}
                          placeholder="••••••••" required disabled={regEstado === 'cargando'} autoComplete="new-password" className={inputCls} />
                      </div>
                      {regError && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{regError}</p>}
                      <button type="submit" disabled={regEstado === 'cargando' || !regEmail || !regPass || !regPassConfirm}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50">
                        {regEstado === 'cargando' ? <><Spinner /> Creando cuenta...</> : 'Crear cuenta'}
                      </button>
                    </form>
                  )
                )}

                {/* Separador */}
                <div className="my-5 flex items-center gap-3">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-xs text-slate-400 font-medium">o</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                {/* Google */}
                <button type="button" onClick={handleGoogle}
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                  Continuar con Google
                </button>

                {/* Magic link */}
                <div className="mt-4 text-center">
                  <button type="button" onClick={() => setModoMagic(true)}
                    className="text-xs text-slate-400 underline underline-offset-2 hover:text-slate-600">
                    Prefiero recibir un link por email
                  </button>
                </div>
              </>
            )}
          </div>

          <p className="mt-5 text-center text-xs text-slate-400">
            Al ingresar aceptás los{' '}
            <Link href="/terminos" className="underline underline-offset-2 hover:text-slate-600">términos de uso</Link>{' '}
            de PROPIA.
          </p>
          <p className="mt-2 text-center text-sm text-slate-500">
            ¿Querés publicar?{' '}
            <Link href="/publicar" className="font-semibold text-blue-600 hover:text-blue-700">Publicá gratis →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
