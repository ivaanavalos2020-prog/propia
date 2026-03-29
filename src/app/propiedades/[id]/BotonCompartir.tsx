'use client'

import { useState } from 'react'

export default function BotonCompartir({ url }: { url: string }) {
  const [copiado, setCopiado] = useState(false)

  async function compartir() {
    await navigator.clipboard.writeText(url)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={compartir}
      aria-label="Compartir propiedad"
      className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-700 text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-50"
    >
      {copiado ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
      )}
    </button>
  )
}
