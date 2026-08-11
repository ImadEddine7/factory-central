export function formatAmount(value: number, unit: string): string {
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: unit === 'unit' ? 0 : 1,
    maximumFractionDigits: unit === 'unit' ? 0 : 1,
  }).format(value)

  switch (unit) {
    case 'k': return `${formatted} k€`
    case 'M': return `${formatted} M€`
    default: return `${formatted} €`
  }
}

export function formatPct(value: number | null): string {
  if (value === null) return '—'
  return `${(value * 100).toFixed(1)}%`
}

export function formatPctRaw(value: number): string {
  return `${value.toFixed(1)}%`
}

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function getMonthsBetween(start: string, end: string): string[] {
  const months: string[] = []
  const [sy, sm] = start.split('-').map(Number)
  const [ey, em] = end.split('-').map(Number)
  let y = sy, m = sm
  while (y < ey || (y === ey && m <= em)) {
    months.push(`${y}-${String(m).padStart(2, '0')}`)
    m++
    if (m > 12) { m = 1; y++ }
  }
  return months
}

export function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number)
  const labels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
  return `${labels[m - 1]} ${y}`
}

export function shortMonth(month: string): string {
  const [, m] = month.split('-').map(Number)
  const labels = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
  return labels[m - 1]
}

export function currentPeriod(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function createEmptyDigest(period: string): import('./schema').Digest {
  const [y, m] = period.split('-').map(Number)
  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
  return {
    meta: {
      period,
      title: 'Data Factory — Delivery Digest',
      subtitle: `${monthNames[m - 1]} ${y}`,
      author: '',
      currency: 'EUR',
      unit: 'k',
      status: 'draft',
    },
    projects: [],
    purchaseOrders: [],
    keyMessages: [],
    headcount: [],
    planning: { startMonth: `${y}-01`, endMonth: `${y}-12`, rows: [] },
    settings: { coverageThresholds: { warning: 80, healthy: 95 }, palette: ['#2F6F6B', '#B4472F', '#4A5A8A', '#C08A2E', '#6B7A5A'] },
  }
}
