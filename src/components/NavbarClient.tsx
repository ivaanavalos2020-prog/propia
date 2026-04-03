'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import BadgeMensajes from './BadgeMensajes'

interface Props {
  isLoggedIn: boolean
  userEmail: string | null
  userName: string | null
  avatarUrl?: string | null
  isDueno: boolean
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
  { label: 'Inicio',         href: '/',                matchPath: '/',            exact: true,  noActive: false },
  { label: 'Alquilar',       href: '/propiedades',     matchPath: '/propiedades', exact: false, noActive: false },
  { label: 'Publicar',       href: '/publicar',        matchPath: '/publicar',    exact: false, noActive: false },
  { label: 'Cómo funciona',  href: '/#como-funciona',  matchPath: '',             exact: false, noActive: true  },
]

const DROPDOWN_LINKS_DUENO = [
  { label: 'Mi dashboard', href: '/dashboard'          },
  { label: 'Mis mensajes', href: '/dashboard/mensajes' },
  { label: 'Favoritos',    href: '/favoritos'          },
  { label: 'Mi perfil',    href: '/perfil'             },
]

const DROPDOWN_LINKS_INQUILINO = [
  { label: 'Mis mensajes', href: '/mensajes'  },
  { label: 'Favoritos',    href: '/favoritos' },
  { label: 'Mi perfil',    href: '/perfil'    },
]

// ── Component ───────────────────────────────────────────────────────────────

export default function NavbarClient({ isLoggedIn, userEmail, userName, avatarUrl, isDueno }: Props) {
  const [scrolled,     setScrolled]     = useState(false)
  const [drawerOpen,   setDrawerOpen]   = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const pathname     = usePathname()
  const router       = useRouter()
  const dropdownRef  = useRef<HTMLDivElement>(null)
  const avatarBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 50) }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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

  useEffect(() => {
    setDrawerOpen(false)
    setDropdownOpen(false)
  }, [pathname])

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

  function isActive(link: { matchPath: string; exact?: boolean; noActive?: boolean }) {
    if (link.noActive) return false
    if (link.exact) return pathname === link.matchPath
    if (!link.matchPath) return false
    return pathname === link.matchPath || pathname.startsWith(link.matchPath + '/')
  }

  const initial = (userName ?? userEmail)?.charAt(0).toUpperCase() ?? '?'
  const mensajesHref   = isDueno ? '/dashboard/mensajes' : '/mensajes'
  const dropdownLinks  = isDueno ? DROPDOWN_LINKS_DUENO : DROPDOWN_LINKS_INQUILINO

  return (
    <>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-300 transition-shadow duration-300 ${
          scrolled ? 'shadow-[0_2px_20px_rgba(0,0,0,0.08)]' : 'shadow-none'
        }`}
      >
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-10">

          {/* Logo */}
          <Link href="/" className="flex flex-col leading-none">
            <span className="text-base font-bold tracking-widest text-slate-900">PROPIA</span>
            <span className="text-[9px] font-semibold uppercase tracking-widest text-blue-600">
              Sin intermediarios
            </span>
          </Link>

          {/* ── Centro: nav links (desktop) ──────────────────────────── */}
          <div className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => {
              const { label, href } = link
              const active = isActive(link)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative pb-1 text-sm font-medium transition-colors duration-200 ${
                    active ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {label}
                  <span
                    className={`absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-blue-600 transition-opacity duration-200 ${
                      active ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                </Link>
              )
            })}
          </div>

          {/* ── Derecha (desktop) ────────────────────────────────────── */}
          <div className="hidden items-center gap-2 md:flex">
            {isLoggedIn ? (
              <>
                {/* Favoritos */}
                <Link
                  href="/favoritos"
                  aria-label="Favoritos"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-900"
                >
                  <IconCorazon />
                </Link>

                {/* Mensajes */}
                <Link
                  href={mensajesHref}
                  aria-label="Mensajes"
                  className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-900"
                >
                  <IconSobre />
                  <span className="absolute -top-0.5 -right-0.5">
                    <BadgeMensajes isDueno={isDueno} />
                  </span>
                </Link>

                {/* Separador */}
                <div className="mx-1 h-5 w-px bg-slate-200" />

                {/* Avatar + dropdown */}
                <div className="relative">
                  <button
                    ref={avatarBtnRef}
                    type="button"
                    onClick={() => setDropdownOpen((v) => !v)}
                    aria-label="Menú de usuario"
                    aria-expanded={dropdownOpen}
                    aria-haspopup="menu"
                    className="h-8 w-8 overflow-hidden rounded-full transition-opacity duration-200 hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-600">
                        {initial}
                      </span>
                    )}
                  </button>

                  {/* Dropdown */}
                  {dropdownOpen && (
                    <div
                      ref={dropdownRef}
                      role="menu"
                      className="animate-dropdown absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-xl border border-slate-300 bg-white shadow-lg shadow-slate-200/60"
                    >
                      <div className="border-b border-slate-100 px-4 py-3">
                        {userName && (
                          <p className="truncate text-sm font-semibold text-slate-800">{userName}</p>
                        )}
                        <p className="truncate text-[11px] text-slate-400">{userEmail}</p>
                      </div>

                      <div className="py-1" role="none">
                        {dropdownLinks.map(({ label, href }) => (
                          <Link
                            key={href}
                            href={href}
                            role="menuitem"
                            onClick={() => setDropdownOpen(false)}
                            className="block px-4 py-2.5 text-sm text-slate-700 transition-colors duration-150 hover:bg-slate-50 hover:text-slate-900"
                          >
                            {label}
                          </Link>
                        ))}
                      </div>

                      <div className="border-t border-slate-100 py-1" role="none">
                        <button
                          type="button"
                          role="menuitem"
                          onClick={cerrarSesion}
                          className="w-full px-4 py-2.5 text-left text-sm text-red-600 transition-colors duration-150 hover:bg-red-50"
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
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-blue-700"
              >
                Ingresar
              </Link>
            )}
          </div>

          {/* ── Derecha (mobile) ─────────────────────────────────────── */}
          <div className="flex items-center gap-2 md:hidden">
            {isLoggedIn && (
              <Link
                href={mensajesHref}
                aria-label="Mensajes"
                className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:text-slate-900"
              >
                <IconSobre />
                <span className="absolute -top-0.5 -right-0.5">
                  <BadgeMensajes isDueno={isDueno} />
                </span>
              </Link>
            )}
            <button
              type="button"
              onClick={() => setDrawerOpen((v) => !v)}
              aria-label={drawerOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={drawerOpen}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:text-slate-900"
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
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 md:hidden ${
          drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* ── Mobile drawer ───────────────────────────────────────────────── */}
      <aside
        aria-label="Menú de navegación"
        aria-hidden={!drawerOpen}
        className={`fixed top-0 right-0 z-50 flex h-full w-72 flex-col bg-white shadow-2xl transition-transform duration-300 ease-out md:hidden ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-300 px-5">
          <span className="text-sm font-bold tracking-widest text-slate-900">PROPIA</span>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            aria-label="Cerrar menú"
            className="text-slate-400 transition-colors hover:text-slate-900"
          >
            <IconX />
          </button>
        </div>

        {/* User info */}
        {isLoggedIn && (
          <div className="flex shrink-0 items-center gap-3 border-b border-slate-300 px-5 py-4">
            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-600">
                  {initial}
                </span>
              )}
            </div>
            <div className="min-w-0 flex flex-col">
              {userName && <span className="truncate text-sm font-semibold text-slate-800">{userName}</span>}
              <span className="truncate text-xs text-slate-500">{userEmail}</span>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <div className="flex flex-col gap-0.5">
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Navegación
            </p>
            {NAV_LINKS.map((link) => {
              const { label, href } = link
              const active = isActive(link)
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setDrawerOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors duration-150 ${
                    active
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full transition-colors ${
                      active ? 'bg-blue-600' : 'bg-slate-300'
                    }`}
                  />
                  {label}
                </Link>
              )
            })}

            {isLoggedIn && (
              <>
                <p className="mb-1 mt-4 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Mi cuenta
                </p>
                {dropdownLinks.map(({ label, href }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-slate-600 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-900"
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                    {label}
                  </Link>
                ))}
              </>
            )}
          </div>
        </nav>

        {/* Footer */}
        <div className="shrink-0 border-t border-slate-300 p-4">
          {isLoggedIn ? (
            <button
              type="button"
              onClick={cerrarSesion}
              className="w-full rounded-lg border border-red-200 bg-red-50 py-3 text-sm font-medium text-red-600 transition-colors duration-150 hover:bg-red-100"
            >
              Cerrar sesión
            </button>
          ) : (
            <Link
              href="/login"
              onClick={() => setDrawerOpen(false)}
              className="block rounded-xl bg-blue-600 py-3 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Ingresar
            </Link>
          )}
        </div>
      </aside>
    </>
  )
}
