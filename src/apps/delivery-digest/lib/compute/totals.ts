import type { Project, PurchaseOrder, Digest } from '../schema'

export function totalRevenue(projects: Project[]): number {
  return projects.filter(p => p.active).reduce((sum, p) => sum + p.revenue, 0)
}

export function coverage(po: PurchaseOrder): number | null {
  if (po.delivered === 0) return null
  return po.poReceived / po.delivered
}

export function globalCoverage(pos: PurchaseOrder[]): number | null {
  const totalDelivered = pos.reduce((sum, po) => sum + po.delivered, 0)
  if (totalDelivered === 0) return null
  const totalReceived = pos.reduce((sum, po) => sum + po.poReceived, 0)
  return totalReceived / totalDelivered
}

export function uncoveredExposure(pos: PurchaseOrder[]): number {
  const totalDelivered = pos.reduce((sum, po) => sum + po.delivered, 0)
  const totalReceived = pos.reduce((sum, po) => sum + po.poReceived, 0)
  return Math.max(0, totalDelivered - totalReceived)
}

export function coverageStatus(
  value: number | null,
  thresholds: { warning: number; healthy: number }
): 'healthy' | 'warning' | 'critical' | 'none' {
  if (value === null) return 'none'
  const pct = value * 100
  if (pct >= thresholds.healthy) return 'healthy'
  if (pct >= thresholds.warning) return 'warning'
  return 'critical'
}

export function activeProjectCount(projects: Project[]): number {
  return projects.filter(p => p.active).length
}

export function revenueShare(project: Project, total: number): number {
  if (total === 0) return 0
  return project.revenue / total
}

export function computeKpis(digest: Digest) {
  const revenue = totalRevenue(digest.projects)
  const cov = globalCoverage(digest.purchaseOrders)
  const activeCount = activeProjectCount(digest.projects)
  const uncovered = uncoveredExposure(digest.purchaseOrders)

  return { revenue, coverage: cov, activeCount, uncovered }
}
