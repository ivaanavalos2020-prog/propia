'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import BadgeMensajes from './BadgeMensajes'

interface Props {
  isLoggedIn: boolean
  userEmail: string | null
}

// ── Icons ──────────────────────────────────────────────────────────────────

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
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function IconX() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

// ── Nav links config ────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: 'Alquilar',       href: '/propiedades',     matchPath: '/propiedades' },
  { label: 'Publicar',       href: '/publicar',        matchPath: '/publicar'    },
  { label: 'Cómo funciona',  href: '/#como-funciona',  matchPath: '/'            },
]

const DROPDOWN_LINKS = [
  { label: 'Mi dashboard', href: '/dashboard'          },
  { label: 'Mis mensajes', href: '/dashboard/mensajes' },
  { label: 'Favoritos',    href: '/favoritos'          },
  { label: 'Mi perfil',    href: '/perfil'             },
]

// ── Component ───────────────────────────────────────────────────────────────

export default function NavbarClient({ isLoggedIn, userEmail }: Props) {
  const [scrolled,     setScrolled]     = useState(false)
  const [drawerOpen,   setDrawerOpen]   = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const pathname     = usePathname()
  const router       = useRouter()
  const dropdownRef  = useRef<HTMLDivElement>(null)
  const avatarBtnRef = useRef<HTMLButtonElement>(null)

  // Scroll detection
  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 50) }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      const target = e.target as Node
      if (
        dropdownRef.current  && !dropdownRef.current.contains(target) &&
        avatarBtnRef.current && !avatarBtnRef.current.contains(target)
      ) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [])

  // Close everything on route change
  useEffect(() => {
    setDrawerOpen(false)
    setDropdownOpen(false)
  }, [pathname])

  // Lock body scroll while drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  async function cerrarSesion() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setDropdownOpen(false)
    setDrawerOpen(false)
    router.push('/')
    router.refresh()
  }

  function isActive(matchPath: string) {
    if (matchPath === '/') return pathname === '/'
    return pathname === matchPath || pathname.startsWith(matchPath + '/')
  }

  const initial = userEmail?.charAt(0).toUpperCase() ?? '?'

  return (
    <>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'border-b border-zinc-800/60 bg-black/85 backdrop-blur-md'
            : 'bg-transparent'
        }`}
      >
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-10">

          {/* Logo */}
          <Link href="/" className="flex flex-col leading-none">
            <span className="text-base font-bold tracking-widest text-white">PROPIA</span>
            <span className="text-[9px] font-medium uppercase tracking-widest text-zinc-500">
              Sin intermediarios
            </span>
          </Link>

          {/* ── Centro: nav links (desktop) ──────────────────────────── */}
          <div className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map(({ label, href, matchPath }) => {
              const active = isActive(matchPath)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative pb-1 text-sm transition-colors duration-200 ${
                    active ? 'text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {label}
                  {/* active dot */}
                  <span
                    className={`absolute bottom-0 left-1/2 h-[3px] w-[3px] -translate-x-1/2 rounded-full bg-green-500 transition-opacity duration-200 ${
                      active ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                </Link>
              )
            })}
          </div>

          {/* ── Derecha (desktop) ────────────────────────────────────── */}
          <div className="hidden items-center gap-3 md:flex">
            {isLoggedIn ? (
              <>
                {/* Favoritos */}
                <Link
                  href="/favoritos"
                  aria-label="Favoritos"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-colors duration-200 hover:bg-zinc-800/60 hover:text-white"
                >
                  <IconCorazon />
                </Link>

                {/* Mensajes */}
                <Link
                  href="/dashboard/mensajes"
                  aria-label="Mensajes"
                  className="relative flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-colors duration-200 hover:bg-zinc-800/60 hover:text-white"
                >
                  <IconSobre />
                  <span className="absolute -top-0.5 -right-0.5">
                    <BadgeMensajes />
                  </span>
                </Link>

                {/* Separador */}
                <div className="mx-1 h-5 w-px bg-zinc-700/80" />

                {/* Avatar + dropdown */}
                <div className="relative">
                  <button
                    ref={avatarBtnRef}
                    type="button"
                    onClick={() => setDropdownOpen((v) => !v)}
                    aria-label="Menú de usuario"
                    aria-expanded={dropdownOpen}
                    aria-haspopup="menu"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-sm font-bold text-white transition-opacity duration-200 hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-500"
                  >
                    {initial}
                  </button>

                  {/* Dropdown */}
                  {dropdownOpen && (
                    <div
                      ref={dropdownRef}
                      role="menu"
                      className="animate-dropdown absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-xl shadow-black/50"
                    >
                      {/* Email */}
                      <div className="border-b border-zinc-800 px-4 py-3">
                        <p className="truncate text-[11px] text-zinc-500">{userEmail}</p>
                      </div>

                      {/* Links */}
                      <div className="py-1" role="none">
                        {DROPDOWN_LINKS.map(({ label, href }) => (
                          <Link
                            key={href}
                            href={href}
                            role="menuitem"
                            onClick={() => setDropdownOpen(false)}
                            className="block px-4 py-2.5 text-sm text-zinc-300 transition-colors duration-150 hover:bg-zinc-800 hover:text-white"
                          >
                            {label}
                          </Link>
                        ))}
                      </div>

                      {/* Cerrar sesión */}
                      <div className="border-t border-zinc-800 py-1" role="none">
                        <button
                          type="button"
                          role="menuitem"
                          onClick={cerrarSesion}
                          className="w-full px-4 py-2.5 text-left text-sm text-red-400 transition-colors duration-150 hover:bg-zinc-800 hover:text-red-300"
                        >
                          Cerrar sesión
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-lg border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors duration-200 hover:border-white hover:text-white"
              >
                Ingresar
              </Link>
            )}
          </div>

          {/* ── Derecha (mobile) ─────────────────────────────────────── */}
          <div className="flex items-center gap-2 md:hidden">
            {isLoggedIn && (
              <Link
                href="/dashboard/mensajes"
                aria-label="Mensajes"
                className="relative flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:text-white"
              >
                <IconSobre />
                <span className="absolute -top-0.5 -right-0.5">
                  <BadgeMensajes />
                </span>
              </Link>
            )}
            <button
              type="button"
              onClick={() => setDrawerOpen((v) => !v)}
              aria-label={drawerOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={drawerOpen}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:text-white"
            >
              <IconMenu />
            </button>
          </div>

        </nav>
      </header>

      {/* ── Mobile overlay ──────────────────────────────────────────────── */}
      <div
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* ── Mobile drawer ───────────────────────────────────────────────── */}
      <aside
        aria-label="Menú de navegación"
        aria-hidden={!drawerOpen}
        className={`fixed top-0 right-0 z-50 flex h-full w-72 flex-col bg-zinc-950 shadow-2xl transition-transform duration-300 ease-out md:hidden ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-800 px-5">
          <span className="text-sm font-bold tracking-widest text-white">PROPIA</span>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            aria-label="Cerrar menú"
            className="text-zinc-400 transition-colors hover:text-white"
          >
            <IconX />
          </button>
        </div>

        {/* User info */}
        {isLoggedIn && (
          <div className="flex shrink-0 items-center gap-3 border-b border-zinc-800 px-5 py-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-600 text-sm font-bold text-white">
              {initial}
            </div>
            <span className="truncate text-sm text-zinc-300">{userEmail}</span>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <div className="flex flex-col gap-0.5">
            {/* Sección principal */}
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
              Navegación
            </p>
            {NAV_LINKS.map(({ label, href, matchPath }) => {
              const active = isActive(matchPath)
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setDrawerOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors duration-150 ${
                    active
                      ? 'bg-zinc-900 font-medium text-white'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full transition-colors ${
                      active ? 'bg-green-500' : 'bg-zinc-700'
                    }`}
                  />
                  {label}
                </Link>
              )
            })}

            {/* Sección cuenta */}
            {isLoggedIn && (
              <>
                <p className="mb-1 mt-4 px-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                  Mi cuenta
                </p>
                {DROPDOWN_LINKS.map(({ label, href }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-zinc-400 transition-colors duration-150 hover:bg-zinc-900 hover:text-white"
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-700" />
                    {label}
                  </Link>
                ))}
              </>
            )}
          </div>
        </nav>

        {/* Footer */}
        <div className="shrink-0 border-t border-zinc-800 p-4">
          {isLoggedIn ? (
            <button
              type="button"
              onClick={cerrarSesion}
              className="w-full rounded-lg border border-red-900/50 bg-red-950/30 py-3 text-sm font-medium text-red-400 transition-colors duration-150 hover:bg-red-950/60 hover:text-red-300"
            >
              Cerrar sesión
            </button>
          ) : (
            <Link
              href="/login"
              onClick={() => setDrawerOpen(false)}
              className="block rounded-xl bg-green-600 py-3 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Ingresar
            </Link>
          )}
        </div>
      </aside>
    </>
  )
}
