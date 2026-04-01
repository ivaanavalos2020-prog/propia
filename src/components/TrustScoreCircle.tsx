import type { TrustResult } from '@/lib/trustScore'

const COLOR_MAP: Record<TrustResult['color'], { ring: string; text: string; bg: string; label: string }> = {
  green:  { ring: '#22C55E', text: 'text-green-600',  bg: 'bg-green-50',  label: 'bg-green-100 text-green-700'  },
  blue:   { ring: '#3B82F6', text: 'text-blue-600',   bg: 'bg-blue-50',   label: 'bg-blue-100 text-blue-700'   },
  yellow: { ring: '#F59E0B', text: 'text-amber-600',  bg: 'bg-amber-50',  label: 'bg-amber-100 text-amber-700' },
  slate:  { ring: '#94A3B8', text: 'text-slate-500',  bg: 'bg-slate-50',  label: 'bg-slate-100 text-slate-600' },
}

interface Props {
  result: TrustResult
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_MAP = {
  sm: { r: 22, cx: 30, cy: 30, viewBox: 60, strokeW: 5, fontSize: 'text-sm', labelSize: 'text-[10px]', wh: 'w-[60px] h-[60px]' },
  md: { r: 30, cx: 40, cy: 40, viewBox: 80, strokeW: 6, fontSize: 'text-lg', labelSize: 'text-xs',     wh: 'w-[80px] h-[80px]' },
  lg: { r: 42, cx: 54, cy: 54, viewBox: 108,strokeW: 7, fontSize: 'text-2xl',labelSize: 'text-xs',     wh: 'w-[108px] h-[108px]' },
}

export default function TrustScoreCircle({ result, size = 'md' }: Props) {
  const { ring, text, label: labelCls } = COLOR_MAP[result.color]
  const s = SIZE_MAP[size]
  const circumference = 2 * Math.PI * s.r
  const dashOffset     = circumference * (1 - result.score / 100)

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`relative ${s.wh}`}>
        <svg viewBox={`0 0 ${s.viewBox} ${s.viewBox}`} className="w-full h-full -rotate-90">
          {/* Track */}
          <circle
            cx={s.cx} cy={s.cy} r={s.r}
            fill="none" stroke="#E2E8F0" strokeWidth={s.strokeW}
          />
          {/* Progress */}
          <circle
            cx={s.cx} cy={s.cy} r={s.r}
            fill="none"
            stroke={ring}
            strokeWidth={s.strokeW}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-extrabold leading-none ${text} ${s.fontSize}`}>{result.score}</span>
        </div>
      </div>
      <span className={`inline-block rounded-full px-2.5 py-0.5 text-center font-semibold ${labelCls} ${s.labelSize}`}>
        {result.label}
      </span>
    </div>
  )
}
