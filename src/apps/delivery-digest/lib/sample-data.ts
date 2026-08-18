import type { Digest } from './schema'

export const sampleDigest: Digest = {
  meta: {
    period: '2026-07',
    title: 'Data Factory — Delivery Digest',
    subtitle: 'Juillet 2026',
    publishedAt: '2026-08-02T10:00:00Z',
    author: 'Imad',
    currency: 'EUR',
    unit: 'k',
    status: 'published',
  },
  projects: [
    { id: 'p1', name: 'Data Platform', program: 'Core', active: true, revenue: 450 },
    { id: 'p2', name: 'Analytics Hub', program: 'Core', active: true, revenue: 320 },
    { id: 'p3', name: 'ML Pipeline', program: 'Innovation', active: true, revenue: 280 },
    { id: 'p4', name: 'Data Governance', program: 'Compliance', active: true, revenue: 150 },
  ],
  purchaseOrders: [
    { projectId: 'p1', label: 'PO-2026-001', poRequested: 450, delivered: 320, poReceived: 450 },
    { projectId: 'p2', label: 'PO-2026-002', poRequested: 320, delivered: 180, poReceived: 320 },
    { projectId: 'p3', label: 'PO-2026-003', poRequested: 280, delivered: 140, poReceived: 200 },
    { projectId: 'p4', label: 'PO-2026-004', poRequested: 150, delivered: 90, poReceived: 150 },
  ],
  keyMessages: [
    { id: 'm1', order: 0, title: 'Data Platform migration complete', body: 'Successfully migrated all workloads to the new cloud infrastructure. Performance improved by 40%.', tag: 'milestone', date: '2026-07-15' },
    { id: 'm2', order: 1, title: 'New ML models deployed', body: 'Three new prediction models are now in production, covering demand forecasting, anomaly detection, and customer segmentation.', tag: 'delivery', date: '2026-07-20' },
    { id: 'm3', order: 2, title: 'Staffing update', body: 'Two new data engineers onboarded. Team capacity increased to support Q3 objectives.', tag: 'team', date: '2026-07-08' },
  ],
  headcount: [
    { month: '2026-01', offshore: 12, onshore: 8 },
    { month: '2026-02', offshore: 12, onshore: 8 },
    { month: '2026-03', offshore: 14, onshore: 8 },
    { month: '2026-04', offshore: 14, onshore: 9 },
    { month: '2026-05', offshore: 15, onshore: 9 },
    { month: '2026-06', offshore: 15, onshore: 10 },
    { month: '2026-07', offshore: 16, onshore: 10 },
  ],
  planning: {
    startMonth: '2026-01',
    endMonth: '2026-12',
    rows: [
      {
        id: 'r1', label: 'Data Platform', type: 'row', hidden: false, indent: 0,
        bars: [
          { id: 'b1', label: 'Migration', start: '2026-01', end: '2026-06', color: '#2F6F6B', style: 'solid' },
          { id: 'b2', label: 'Optimization', start: '2026-07', end: '2026-09', color: '#2F6F6B', style: 'hatched' },
        ],
        milestones: [{ id: 'ms1', month: '2026-06', label: 'Go-live', color: '#B4472F' }],
      },
      {
        id: 'r2', label: 'Analytics Hub', type: 'row', hidden: false, indent: 0,
        bars: [
          { id: 'b3', label: 'Development', start: '2026-03', end: '2026-08', color: '#4A5A8A', style: 'solid' },
          { id: 'b4', label: 'UAT', start: '2026-09', end: '2026-10', color: '#4A5A8A', style: 'hatched' },
        ],
        milestones: [],
      },
      {
        id: 'r3', label: 'ML Pipeline', type: 'row', hidden: false, indent: 0,
        bars: [
          { id: 'b5', label: 'Phase 1', start: '2026-02', end: '2026-05', color: '#C08A2E', style: 'solid' },
          { id: 'b6', label: 'Phase 2', start: '2026-06', end: '2026-10', color: '#C08A2E', style: 'solid' },
        ],
        milestones: [{ id: 'ms2', month: '2026-11', label: 'Release', color: '#B4472F' }],
      },
    ],
  },
  settings: {
    coverageThresholds: { warning: 80, healthy: 95 },
    palette: ['#2F6F6B', '#B4472F', '#4A5A8A', '#C08A2E', '#6B7A5A'],
  },
}
