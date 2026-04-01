export interface TrustInput {
  identityVerified: boolean
  phone: string | null
  avatarUrl: string | null
  createdAt: string | null
  avgRating: number        // 0–5
  responseRate: number     // 0–1
}

export interface TrustResult {
  score: number            // 0–100
  label: 'Muy confiable' | 'Confiable' | 'En construcción' | 'Nuevo usuario'
  color: 'green' | 'blue' | 'yellow' | 'slate'
}

export function calcularTrustScore(input: TrustInput): TrustResult {
  let score = 0

  if (input.identityVerified)                           score += 30
  if (input.phone)                                      score += 10
  if (input.avatarUrl)                                  score += 5
  if (input.createdAt) {
    const days = (Date.now() - new Date(input.createdAt).getTime()) / 86_400_000
    if (days > 30) score += 10
  }
  score += Math.round(Math.min(input.avgRating, 5) * 5) // 0–25
  if (input.responseRate > 0.8)                         score += 10
  score += 10 // sin reportes negativos (default)

  score = Math.min(score, 100)

  let label: TrustResult['label']
  let color: TrustResult['color']

  if (score >= 80)      { label = 'Muy confiable';    color = 'green'  }
  else if (score >= 60) { label = 'Confiable';         color = 'blue'   }
  else if (score >= 40) { label = 'En construcción';   color = 'yellow' }
  else                  { label = 'Nuevo usuario';     color = 'slate'  }

  return { score, label, color }
}
