import { t } from '@digest/i18n'
import { totalRevenue, revenueShare } from '@digest/lib/compute/totals'
import { formatAmount, formatPctRaw } from '@digest/lib/utils'
import type { Digest } from '@digest/lib/schema'

export function Revenue({ digest }: { digest: Digest }) {
  const total = totalRevenue(digest.projects)
  const activeProjects = digest.projects.filter(p => p.active)

  if (activeProjects.length === 0) return null

  return (
    <section className="section-card mb-8">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-slate">{t.revenue.title}</h2>
      <div className="mb-4">
        <span className="text-3xl font-bold text-ink">{formatAmount(total, digest.meta.unit)}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate/10">
              <th className="pb-2 text-left text-xs font-medium text-slate">{t.revenue.project}</th>
              <th className="pb-2 text-right text-xs font-medium text-slate">{t.revenue.amount}</th>
              <th className="pb-2 text-right text-xs font-medium text-slate">{t.revenue.share}</th>
            </tr>
          </thead>
          <tbody>
            {activeProjects.map(project => (
              <tr key={project.id} className="border-b border-slate/5">
                <td className="py-2.5 font-medium">{project.name}</td>
                <td className="py-2.5 text-right font-mono">{formatAmount(project.revenue, digest.meta.unit)}</td>
                <td className="py-2.5 text-right font-mono text-slate">{formatPctRaw(revenueShare(project, total) * 100)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-ink/10 font-bold">
              <td className="py-2.5">{t.revenue.total}</td>
              <td className="py-2.5 text-right font-mono">{formatAmount(total, digest.meta.unit)}</td>
              <td className="py-2.5 text-right font-mono">100%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  )
}
