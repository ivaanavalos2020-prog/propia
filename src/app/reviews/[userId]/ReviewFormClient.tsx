'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import StarRating from '@/components/StarRating'

interface Props {
  reviewedId: string
  reviewedNombre: string
  currentUserId: string
}

export default function ReviewFormClient({ reviewedId, reviewedNombre, currentUserId }: Props) {
  const [rating,   setRating]   = useState(0)
  const [comment,  setComment]  = useState('')
  const [role,     setRole]     = useState<'dueno' | 'inquilino'>('inquilino')
  const [enviando, setEnviando] = useState(false)
  const [enviado,  setEnviado]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) { setError('Seleccioná una calificación.'); return }
    setEnviando(true)
    setError(null)

    const supabase = createClient()
    const { error: insertErr } = await supabase.from('reviews').insert({
      reviewer_id:   currentUserId,
      reviewed_id:   reviewedId,
      rating,
      comment:       comment.trim() || null,
      reviewer_role: role,
    })

    if (insertErr) {
      setError(
        insertErr.code === '23505'
          ? 'Ya dejaste una review para este usuario.'
          : 'No se pudo enviar. Intentá de nuevo.'
      )
      setEnviando(false)
      return
    }

    setEnviado(true)
    setEnviando(false)
  }

  if (enviado) {
    return (
      <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-green-800">Tu review fue publicada. Gracias.</p>
      </div>
    )
  }

  return (
    <div className="mt-8 rounded-2xl border border-slate-300 bg-white p-6 shadow-sm">
      <h2 className="mb-1 text-base font-bold text-slate-900">Dejá tu review sobre {reviewedNombre}</h2>
      <p className="mb-5 text-xs text-slate-500">Solo podés dejar una review por usuario.</p>

      <form onSubmit={enviar} className="flex flex-col gap-4">
        {/* Rol */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">Tu rol en esta interacción</label>
          <div className="flex gap-3">
            {(['inquilino', 'dueno'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={[
                  'flex-1 rounded-lg border py-2.5 text-sm font-semibold transition-colors',
                  role === r
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-300 text-slate-600 hover:border-slate-400',
                ].join(' ')}
              >
                {r === 'inquilino' ? 'Inquilino/a' : 'Dueño/a'}
              </button>
            ))}
          </div>
        </div>

        {/* Rating */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">Calificación</label>
          <StarRating value={rating} size={28} interactive onChange={setRating} />
          {rating > 0 && (
            <p className="text-xs text-slate-500">
              {['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'][rating]}
            </p>
          )}
        </div>

        {/* Comentario */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="review-comment" className="text-sm font-medium text-slate-700">
            Comentario <span className="text-slate-400 font-normal">(opcional)</span>
          </label>
          <textarea
            id="review-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Contá tu experiencia con esta persona..."
            className="resize-none rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
          />
          <p className="text-right text-xs text-slate-400">{comment.length}/500</p>
        </div>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={enviando || rating === 0}
          className="rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-40"
        >
          {enviando ? 'Publicando...' : 'Publicar review'}
        </button>
      </form>
    </div>
  )
}
