import { t } from '@digest/i18n'
import { coverage, globalCoverage, uncoveredExposure, coverageStatus } from '@digest/lib/compute/totals'
import { formatAmount, formatPct } from '@digest/lib/utils'
import type { Digest } from '@digest/lib/schema'

export function PoCoverage({ digest }: { digest: Digest }) {
  const pos = digest.purchaseOrders
  const global = globalCoverage(pos)
  const uncovered = uncoveredExposure(pos)
  const thresholds = digest.settings.coverageThresholds

  const statusClass = (value: number | null) => {
    const s = coverageStatus(value, thresholds)
    switch (s) {
      case 'healthy': return 'coverage-healthy'
      case 'warning': return 'coverage-warning'
      case 'critical': return 'coverage-critical'
      default: return 'text-slate'
    }
  }

  return (
    <section className="section-card mb-8">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate">{t.po.title}</h2>
      {uncovered > 0 && (
        <div className="mb-4 rounded-lg border border-danger/20 bg-danger/5 px-4 py-2">
          <span className="text-sm font-medium text-danger">
            {t.po.uncovered}: {formatAmount(uncovered, digest.meta.unit)}
          </span>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate/10">
              <th className="pb-2 text-left text-xs font-medium text-slate">{t.po.project}</th>
              <th className="pb-2 text-right text-xs font-medium text-slate">{t.po.poRequested}</th>
              <th className="pb-2 text-right text-xs font-medium text-slate">{t.po.delivered}</th>
              <th className="pb-2 text-right text-xs font-medium text-slate">{t.po.poReceived}</th>
              <th className="pb-2 text-right text-xs font-medium text-slate">{t.po.coverage}</th>
            </tr>
          </thead>
          <tbody>
            {pos.map((po, i) => {
              const cov = coverage(po)
              const project = digest.projects.find(p => p.id === po.projectId)
              return (
                <tr key={i} className="border-b border-slate/5">
                  <td className="py-2.5 font-medium">{project?.name || po.label || po.projectId}</td>
                  <td className="py-2.5 text-right font-mono">{formatAmount(po.poRequested, digest.meta.unit)}</td>
                  <td className="py-2.5 text-right font-mono">{formatAmount(po.delivered, digest.meta.unit)}</td>
                  <td className="py-2.5 text-right font-mono">{formatAmount(po.poReceived, digest.meta.unit)}</td>
                  <td className={`py-2.5 text-right font-mono font-bold ${statusClass(cov)}`}>
                    {formatPct(cov)}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-ink/10 font-bold">
              <td className="py-2.5">{t.po.total}</td>
              <td className="py-2.5 text-right font-mono">
                {formatAmount(pos.reduce((s, po) => s + po.poRequested, 0), digest.meta.unit)}
              </td>
              <td className="py-2.5 text-right font-mono">
                {formatAmount(pos.reduce((s, po) => s + po.delivered, 0), digest.meta.unit)}
              </td>
              <td className="py-2.5 text-right font-mono">
                {formatAmount(pos.reduce((s, po) => s + po.poReceived, 0), digest.meta.unit)}
              </td>
              <td className={`py-2.5 text-right font-mono font-bold ${statusClass(global)}`}>
                {formatPct(global)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  )
}
