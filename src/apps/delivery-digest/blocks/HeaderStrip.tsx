import { t } from '@digest/i18n'
import { computeKpis } from '@digest/lib/compute/totals'
import { formatAmount, formatPctRaw } from '@digest/lib/utils'
import type { Digest } from '@digest/lib/schema'

export function HeaderStrip({ digest }: { digest: Digest }) {
  const kpis = computeKpis(digest)

  const lastEntry = digest.headcount.length > 0
    ? [...digest.headcount].sort((a, b) => b.month.localeCompare(a.month))[0]
    : null
  const lastTotal = lastEntry ? lastEntry.offshore + lastEntry.onshore : 0
  const offshoreRatio = lastTotal > 0 ? ((lastEntry!.offshore / lastTotal) * 100).toFixed(0) : '—'

  return (
    <div className="grid grid-cols-2 gap-4 content-start">
      <div className="kpi-chip">
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate">{t.header.revenue}</span>
        <span className="text-2xl font-bold text-ink">{formatAmount(kpis.revenue, digest.meta.unit)}</span>
      </div>
      <div className="kpi-chip">
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate">{t.header.coverage}</span>
        <span className={`text-2xl font-bold ${kpis.coverage !== null && kpis.coverage >= 0.95 ? 'text-success' : kpis.coverage !== null && kpis.coverage >= 0.8 ? 'text-warning' : 'text-danger'}`}>
          {kpis.coverage !== null ? formatPctRaw(kpis.coverage * 100) : '—'}
        </span>
      </div>
      <div className="kpi-chip">
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate">Effectifs</span>
        <span className="text-2xl font-bold text-ink">{lastTotal || '—'}</span>
      </div>
      <div className="kpi-chip">
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate">Ratio offshore</span>
        <span className="text-2xl font-bold text-gold">{offshoreRatio}{offshoreRatio !== '—' && '%'}</span>
      </div>
    </div>
  )
}
