'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import BadgeMensajes from './BadgeMensajes'
import BotonCerrarSesion from './BotonCerrarSesion'

interface Props {
  isLoggedIn: boolean
  userEmail: string | null
}

function IconCorazon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

function IconSobre() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

function IconMenu() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function IconX() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export default function NavbarClient({ isLoggedIn, userEmail }: Props) {
  const [scrolled, setScrolled] = useState(false)
  const [menuAbierto, setMenuAbierto] = useState(false)

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 24) }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function cerrarMenu() { setMenuAbierto(false) }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-zinc-800/60 bg-black/85 backdrop-blur-md'
          : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-10">

        {/* ── Logo ───────────────────────────────── */}
        <Link href="/" className="flex flex-col leading-none">
          <span className="text-lg font-bold tracking-widest text-white">PROPIA</span>
          <span className="text-[9px] font-medium uppercase tracking-widest text-zinc-500">
            Sin intermediarios
          </span>
        </Link>

        {/* ── Links centrales (desktop) ───────────── */}
        <div className="hidden items-center gap-8 md:flex">
          <Link href="/propiedades" className="text-sm text-zinc-300 transition-colors hover:text-white">
            Alquilar
          </Link>
          <Link href="/publicar" className="text-sm text-zinc-300 transition-colors hover:text-white">
            Publicar tu propiedad
          </Link>
          <Link href="/#como-funciona" className="text-sm text-zinc-300 transition-colors hover:text-white">
            Cómo funciona
          </Link>
        </div>

        {/* ── Derecha (desktop) ──────────────────── */}
        <div className="hidden items-center gap-4 md:flex">
          <Link
            href="/favoritos"
            aria-label="Favoritos"
            className="text-zinc-400 transition-colors hover:text-white"
          >
            <IconCorazon />
          </Link>

          {isLoggedIn ? (
            <>
              <Link
                href="/dashboard/mensajes"
                aria-label="Mensajes"
                className="flex items-center gap-1.5 text-zinc-400 transition-colors hover:text-white"
              >
                <IconSobre />
                <BadgeMensajes />
              </Link>
              <Link
                href="/dashboard"
                className="max-w-[140px] truncate text-sm text-zinc-300 transition-colors hover:text-white"
              >
                {userEmail}
              </Link>
              <BotonCerrarSesion />
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:border-white hover:text-white"
            >
              Ingresar
            </Link>
          )}
        </div>

        {/* ── Derecha (mobile) ───────────────────── */}
        <div className="flex items-center gap-3 md:hidden">
          {isLoggedIn && (
            <Link
              href="/dashboard/mensajes"
              aria-label="Mensajes"
              className="flex items-center gap-1 text-zinc-400 transition-colors hover:text-white"
            >
              <IconSobre />
              <BadgeMensajes />
            </Link>
          )}
          <button
            type="button"
            onClick={() => setMenuAbierto((v) => !v)}
            className="text-zinc-400 transition-colors hover:text-white"
            aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
          >
            {menuAbierto ? <IconX /> : <IconMenu />}
          </button>
        </div>
      </nav>

      {/* ── Menú mobile ────────────────────────────── */}
      {menuAbierto && (
        <div className="border-t border-zinc-800 bg-black/95 backdrop-blur-md md:hidden">
          <div className="flex flex-col px-6 py-5 gap-1">
            <Link href="/propiedades" onClick={cerrarMenu} className="rounded-lg px-3 py-3 text-sm text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-white">
              Alquilar
            </Link>
            <Link href="/publicar" onClick={cerrarMenu} className="rounded-lg px-3 py-3 text-sm text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-white">
              Publicar tu propiedad
            </Link>
            <Link href="/#como-funciona" onClick={cerrarMenu} className="rounded-lg px-3 py-3 text-sm text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-white">
              Cómo funciona
            </Link>
            <Link href="/favoritos" onClick={cerrarMenu} className="rounded-lg px-3 py-3 text-sm text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-white">
              Favoritos
            </Link>

            <div className="my-2 border-t border-zinc-800" />

            {isLoggedIn ? (
              <>
                <Link href="/dashboard/mensajes" onClick={cerrarMenu} className="rounded-lg px-3 py-3 text-sm text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-white">
                  Mensajes
                </Link>
                <Link href="/perfil" onClick={cerrarMenu} className="rounded-lg px-3 py-3 text-sm text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-white">
                  Mi perfil
                </Link>
                <div className="px-3 py-3">
                  <BotonCerrarSesion />
                </div>
              </>
            ) : (
              <Link
                href="/login"
                onClick={cerrarMenu}
                className="mt-1 rounded-xl bg-green-600 px-4 py-3 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Ingresar
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
