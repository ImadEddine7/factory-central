import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('FactoryCentral2026!', 12)

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  await prisma.announcement.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      text: 'Welcome to Factory Central — your one-stop-shop for IT Data Factory delivery tools.',
    },
  })

  await prisma.article.create({
    data: {
      title: 'Factory Central is live!',
      body: 'The new delivery portal is now available. All team widgets and apps are accessible from the sidebar.',
      date: new Date().toISOString().split('T')[0],
      pinned: true,
    },
  })

  // ─── Sample Digest: July 2026 ──────────────────────────────────────────────

  const digest = await prisma.digest.create({
    data: {
      period: '2026-07',
      title: 'Data Factory — Delivery Digest',
      subtitle: 'Juillet 2026',
      author: 'Imad',
      currency: 'EUR',
      unit: 'k',
      status: 'PUBLISHED',
      publishedAt: new Date('2026-08-02T10:00:00Z'),
      planningStartMonth: '2026-01',
      planningEndMonth: '2026-12',
      coverageWarning: 80,
      coverageHealthy: 95,
      palette: ['#2F6F6B', '#B4472F', '#4A5A8A', '#C08A2E', '#6B7A5A'],
    },
  })

  // Projects
  const projectData = [
    { name: 'Data Platform', program: 'Core', active: true, revenue: 450 },
    { name: 'Analytics Hub', program: 'Core', active: true, revenue: 320 },
    { name: 'ML Pipeline', program: 'Innovation', active: true, revenue: 280 },
    { name: 'Data Governance', program: 'Compliance', active: true, revenue: 150 },
  ]

  const createdProjects = []
  for (let i = 0; i < projectData.length; i++) {
    const p = await prisma.project.create({
      data: { ...projectData[i], order: i, digestId: digest.id },
    })
    createdProjects.push(p)
  }

  // Purchase Orders (linked to projects)
  const poData = [
    { projectIdx: 0, label: 'PO-2026-001', poRequested: 450, delivered: 320, poReceived: 450 },
    { projectIdx: 1, label: 'PO-2026-002', poRequested: 320, delivered: 180, poReceived: 320 },
    { projectIdx: 2, label: 'PO-2026-003', poRequested: 280, delivered: 140, poReceived: 200 },
    { projectIdx: 3, label: 'PO-2026-004', poRequested: 150, delivered: 90, poReceived: 150 },
  ]

  for (let i = 0; i < poData.length; i++) {
    const { projectIdx, ...data } = poData[i]
    await prisma.purchaseOrder.create({
      data: { ...data, order: i, projectId: createdProjects[projectIdx].id },
    })
  }

  // Headcount
  const headcountData = [
    { month: '2026-01', offshore: 12, onshore: 8 },
    { month: '2026-02', offshore: 12, onshore: 8 },
    { month: '2026-03', offshore: 14, onshore: 8 },
    { month: '2026-04', offshore: 14, onshore: 9 },
    { month: '2026-05', offshore: 15, onshore: 9 },
    { month: '2026-06', offshore: 15, onshore: 10 },
    { month: '2026-07', offshore: 16, onshore: 10 },
  ]

  for (const h of headcountData) {
    await prisma.headcountEntry.create({
      data: { ...h, digestId: digest.id },
    })
  }

  // Key Messages
  const messages = [
    { order: 0, title: 'Data Platform migration complete', body: 'Successfully migrated all workloads to the new cloud infrastructure. Performance improved by 40%.', tag: 'milestone', date: '2026-07-15' },
    { order: 1, title: 'New ML models deployed', body: 'Three new prediction models are now in production, covering demand forecasting, anomaly detection, and customer segmentation.', tag: 'delivery', date: '2026-07-20' },
    { order: 2, title: 'Staffing update', body: 'Two new data engineers onboarded. Team capacity increased to support Q3 objectives.', tag: 'team', date: '2026-07-08' },
  ]

  for (const msg of messages) {
    await prisma.keyMessage.create({
      data: { ...msg, digestId: digest.id },
    })
  }

  // Planning Rows with Bars and Milestones
  const row1 = await prisma.planningRow.create({
    data: { label: 'Data Platform', type: 'row', order: 0, digestId: digest.id },
  })
  await prisma.bar.create({
    data: { label: 'Migration', start: '2026-01', end: '2026-06', color: '#2F6F6B', style: 'solid', order: 0, rowId: row1.id },
  })
  await prisma.bar.create({
    data: { label: 'Optimization', start: '2026-07', end: '2026-09', color: '#2F6F6B', style: 'hatched', order: 1, rowId: row1.id },
  })
  await prisma.milestone.create({
    data: { month: '2026-06', label: 'Go-live', color: '#B4472F', rowId: row1.id },
  })

  const row2 = await prisma.planningRow.create({
    data: { label: 'Analytics Hub', type: 'row', order: 1, digestId: digest.id },
  })
  await prisma.bar.create({
    data: { label: 'Development', start: '2026-03', end: '2026-08', color: '#4A5A8A', style: 'solid', order: 0, rowId: row2.id },
  })
  await prisma.bar.create({
    data: { label: 'UAT', start: '2026-09', end: '2026-10', color: '#4A5A8A', style: 'hatched', order: 1, rowId: row2.id },
  })

  const row3 = await prisma.planningRow.create({
    data: { label: 'ML Pipeline', type: 'row', order: 2, digestId: digest.id },
  })
  await prisma.bar.create({
    data: { label: 'Phase 1', start: '2026-02', end: '2026-05', color: '#C08A2E', style: 'solid', order: 0, rowId: row3.id },
  })
  await prisma.bar.create({
    data: { label: 'Phase 2', start: '2026-06', end: '2026-10', color: '#C08A2E', style: 'solid', order: 1, rowId: row3.id },
  })
  await prisma.milestone.create({
    data: { month: '2026-11', label: 'Release', color: '#B4472F', rowId: row3.id },
  })

  console.log('Seed complete: admin user + announcement + article + sample digest (relational)')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
