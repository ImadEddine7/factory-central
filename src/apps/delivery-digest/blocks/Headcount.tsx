import { monthLabel } from '@digest/lib/utils'
import type { Digest } from '@digest/lib/schema'

export function Headcount({ digest }: { digest: Digest }) {
  const data = [...digest.headcount].sort((a, b) => a.month.localeCompare(b.month))

  if (data.length === 0) return null

  const totals = data.map(d => d.offshore + d.onshore)
  const max = Math.max(...totals)
  const lastEntry = data[data.length - 1]
  const lastTotal = lastEntry.offshore + lastEntry.onshore
  const lastRatio = lastTotal > 0 ? ((lastEntry.offshore / lastTotal) * 100).toFixed(1) : '—'

  const chartHeight = 180
  const chartWidth = 600
  const padding = { top: 20, right: 20, bottom: 30, left: 40 }
  const innerW = chartWidth - padding.left - padding.right
  const innerH = chartHeight - padding.top - padding.bottom

  const barWidth = data.length > 0 ? Math.min(40, (innerW / data.length) * 0.7) : 40
  const barGap = data.length > 0 ? innerW / data.length : 0

  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate">Effectifs</h2>
      <div className="mb-4 flex flex-wrap items-baseline gap-4">
        <div>
          <span className="text-2xl font-bold text-ink">{lastTotal}</span>
          <span className="ml-1 text-xs text-slate">FTEs</span>
        </div>
        <div className="text-xs">
          <span className="font-semibold text-gold">{lastEntry.offshore} offshore</span>
          <span className="mx-1.5 text-slate/30">·</span>
          <span className="font-medium text-slate">{lastEntry.onshore} onshore</span>
        </div>
      </div>

      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full max-w-[600px]" preserveAspectRatio="xMidYMid meet">
        {/* Y-axis grid */}
        {[0, 0.25, 0.5, 0.75, 1].map(pct => {
          const y = padding.top + innerH - pct * innerH
          const val = Math.round(pct * max)
          return (
            <g key={pct}>
              <line x1={padding.left} x2={padding.left + innerW} y1={y} y2={y} stroke="#e5e7eb" strokeWidth="0.5" />
              <text x={padding.left - 5} y={y + 3} textAnchor="end" className="text-[9px] fill-slate/60">{val}</text>
            </g>
          )
        })}

        {/* Stacked bars */}
        {data.map((d, i) => {
          const total = d.offshore + d.onshore
          const offshoreH = max > 0 ? (d.offshore / max) * innerH : 0
          const onshoreH = max > 0 ? (d.onshore / max) * innerH : 0
          const x = padding.left + i * barGap + (barGap - barWidth) / 2

          return (
            <g key={d.month}>
              {/* Onshore (bottom) */}
              <rect
                x={x}
                y={padding.top + innerH - onshoreH - offshoreH}
                width={barWidth}
                height={onshoreH}
                fill="#e5e7eb"
                rx="3"
              />
              {/* Offshore (top) */}
              <rect
                x={x}
                y={padding.top + innerH - offshoreH}
                width={barWidth}
                height={offshoreH}
                fill="#c9a55c"
                rx="3"
              />
              {/* Total on top */}
              {total > 0 && (
                <text
                  x={x + barWidth / 2}
                  y={padding.top + innerH - onshoreH - offshoreH - 4}
                  textAnchor="middle"
                  className="text-[9px] fill-ink font-medium"
                >
                  {total}
                </text>
              )}
              {/* Month label */}
              <text x={x + barWidth / 2} y={padding.top + innerH + 14} textAnchor="middle" className="text-[9px] fill-slate/60">
                {d.month.slice(5)}
              </text>
            </g>
          )
        })}
      </svg>

      <div className="mt-2 flex items-center gap-4 text-[10px] text-slate">
        <div className="flex items-center gap-1">
          <div className="h-2.5 w-2.5 rounded-sm bg-gold" />
          <span>Offshore</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2.5 w-2.5 rounded-sm bg-gray-200" />
          <span>Onshore</span>
        </div>
      </div>
    </div>
  )
}
