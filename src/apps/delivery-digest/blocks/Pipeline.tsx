import { formatAmount } from '@digest/lib/utils'
import type { Digest } from '@digest/lib/schema'

export function Pipeline({ digest }: { digest: Digest }) {
  const pos = digest.purchaseOrders
  const unit = digest.meta.unit

  const openPipeline = pos.reduce((sum, po) => sum + po.poRequested, 0)
  const weightedPipeline = pos.reduce((sum, po) => sum + po.poReceived, 0)

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="kpi-chip">
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate">Open Pipeline</span>
        <span className="text-2xl font-bold text-ink">{formatAmount(openPipeline, unit)}</span>
      </div>
      <div className="kpi-chip">
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate">Weighted Pipeline</span>
        <span className="text-2xl font-bold text-ink">{formatAmount(weightedPipeline, unit)}</span>
      </div>
    </div>
  )
}
