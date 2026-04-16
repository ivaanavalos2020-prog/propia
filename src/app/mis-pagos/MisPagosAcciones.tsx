'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ConceptType } from '@/lib/types'
import PaymentPortalButton from '@/components/PaymentPortalButton'

interface Props {
  contractId: string
  periodId: string
  conceptType: ConceptType | string
}

export default function MisPagosAcciones({ contractId, periodId, conceptType }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function marcarPagado() {
    setLoading(true)
    try {
      const res = await fetch(`/api/contracts/${contractId}/periods/${periodId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_paid' }),
      })
      if (res.ok) {
        setDone(true)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <span className="rounded-lg bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
        Registrado
      </span>
    )
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      <PaymentPortalButton concept_type={conceptType} size="sm" />
      <button
        onClick={marcarPagado}
        disabled={loading}
        className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? '...' : 'Marcar pagado'}
      </button>
    </div>
  )
}
