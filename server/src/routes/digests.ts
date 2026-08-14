import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { refreshContext } from '../services/delivery-context.js'

const router = Router()

// ─── Assembler: DB → Document shape ──────────────────────────────────────────

async function assembleDigest(digestId: string) {
  const digest = await prisma.digest.findUnique({
    where: { id: digestId },
    include: {
      projects: {
        orderBy: { order: 'asc' },
        include: { purchaseOrders: { orderBy: { order: 'asc' } } },
      },
      headcount: { orderBy: { month: 'asc' } },
      keyMessages: { orderBy: { order: 'asc' } },
      planningRows: {
        orderBy: { order: 'asc' },
        include: {
          bars: { orderBy: { order: 'asc' } },
          milestones: true,
        },
      },
    },
  })

  if (!digest) return null

  return {
    meta: {
      period: digest.period,
      title: digest.title,
      subtitle: digest.subtitle,
      publishedAt: digest.publishedAt?.toISOString(),
      author: digest.author,
      currency: digest.currency,
      unit: digest.unit,
      status: digest.status.toLowerCase(),
    },
    projects: digest.projects.map(p => ({
      id: p.id,
      name: p.name,
      program: p.program ?? undefined,
      active: p.active,
      revenue: p.revenue,
    })),
    purchaseOrders: digest.projects.flatMap(p =>
      p.purchaseOrders.map(po => ({
        projectId: p.id,
        label: po.label,
        poRequested: po.poRequested,
        delivered: po.delivered,
        poReceived: po.poReceived,
      }))
    ),
    keyMessages: digest.keyMessages.map(m => ({
      id: m.id,
      order: m.order,
      title: m.title,
      body: m.body,
      icon: m.icon ?? undefined,
      tag: m.tag ?? undefined,
      date: m.date ?? undefined,
      image: (m.image as any) ?? undefined,
    })),
    headcount: digest.headcount.map(h => ({
      month: h.month,
      offshore: h.offshore,
      onshore: h.onshore,
    })),
    planning: {
      startMonth: digest.planningStartMonth,
      endMonth: digest.planningEndMonth,
      rows: digest.planningRows.map(r => ({
        id: r.id,
        label: r.label,
        type: r.type,
        indent: r.indent,
        hidden: r.hidden,
        bars: r.bars.map(b => ({
          id: b.id,
          label: b.label,
          start: b.start,
          end: b.end,
          color: b.color,
          progress: b.progress ?? undefined,
          style: b.style,
        })),
        milestones: r.milestones.map(ms => ({
          id: ms.id,
          month: ms.month,
          label: ms.label,
          color: ms.color,
        })),
      })),
    },
    settings: {
      coverageThresholds: {
        warning: digest.coverageWarning,
        healthy: digest.coverageHealthy,
      },
      palette: digest.palette,
    },
  }
}

// ─── Disassembler: Document → DB writes (transaction) ────────────────────────

async function disassembleAndSave(period: string, body: any, userId?: string) {
  const { meta, projects, purchaseOrders, keyMessages, headcount, planning, settings } = body

  const projectPOs = new Map<string, any[]>()
  for (const po of purchaseOrders || []) {
    if (!projectPOs.has(po.projectId)) projectPOs.set(po.projectId, [])
    projectPOs.get(po.projectId)!.push(po)
  }

  return prisma.$transaction(async (tx) => {
    const digest = await tx.digest.upsert({
      where: { period },
      update: {
        title: meta.title,
        subtitle: meta.subtitle || '',
        author: meta.author || '',
        currency: meta.currency || 'EUR',
        unit: meta.unit || 'k',
        status: meta.status === 'published' ? 'PUBLISHED' : 'DRAFT',
        publishedAt: meta.publishedAt ? new Date(meta.publishedAt) : null,
        planningStartMonth: planning?.startMonth || '',
        planningEndMonth: planning?.endMonth || '',
        coverageWarning: settings?.coverageThresholds?.warning ?? 80,
        coverageHealthy: settings?.coverageThresholds?.healthy ?? 95,
        palette: settings?.palette || [],
      },
      create: {
        period,
        title: meta.title || 'Data Factory — Delivery Digest',
        subtitle: meta.subtitle || '',
        author: meta.author || '',
        currency: meta.currency || 'EUR',
        unit: meta.unit || 'k',
        status: meta.status === 'published' ? 'PUBLISHED' : 'DRAFT',
        publishedAt: meta.publishedAt ? new Date(meta.publishedAt) : null,
        planningStartMonth: planning?.startMonth || '',
        planningEndMonth: planning?.endMonth || '',
        coverageWarning: settings?.coverageThresholds?.warning ?? 80,
        coverageHealthy: settings?.coverageThresholds?.healthy ?? 95,
        palette: settings?.palette || [],
        createdBy: userId,
      },
    })

    // Delete all children (cascade handles bars/milestones via PlanningRow, POs via Project)
    await tx.project.deleteMany({ where: { digestId: digest.id } })
    await tx.headcountEntry.deleteMany({ where: { digestId: digest.id } })
    await tx.keyMessage.deleteMany({ where: { digestId: digest.id } })
    await tx.planningRow.deleteMany({ where: { digestId: digest.id } })

    // Re-insert projects + their POs
    for (let i = 0; i < (projects || []).length; i++) {
      const p = projects[i]
      const createdProject = await tx.project.create({
        data: {
          name: p.name,
          program: p.program || null,
          active: p.active ?? true,
          revenue: p.revenue || 0,
          order: i,
          digestId: digest.id,
        },
      })

      const pos = projectPOs.get(p.id) || []
      for (let j = 0; j < pos.length; j++) {
        await tx.purchaseOrder.create({
          data: {
            label: pos[j].label || '',
            poRequested: pos[j].poRequested || 0,
            delivered: pos[j].delivered || 0,
            poReceived: pos[j].poReceived || 0,
            order: j,
            projectId: createdProject.id,
          },
        })
      }
    }

    // Re-insert headcount
    for (const h of headcount || []) {
      await tx.headcountEntry.create({
        data: {
          month: h.month,
          offshore: h.offshore || 0,
          onshore: h.onshore || 0,
          digestId: digest.id,
        },
      })
    }

    // Re-insert key messages
    for (const msg of keyMessages || []) {
      await tx.keyMessage.create({
        data: {
          order: msg.order || 0,
          title: msg.title,
          body: msg.body || '',
          icon: msg.icon || null,
          tag: msg.tag || null,
          date: msg.date || null,
          image: msg.image || null,
          digestId: digest.id,
        },
      })
    }

    // Re-insert planning rows + bars + milestones
    for (let i = 0; i < (planning?.rows || []).length; i++) {
      const row = planning.rows[i]
      const createdRow = await tx.planningRow.create({
        data: {
          label: row.label || '',
          type: row.type || 'row',
          indent: row.indent || 0,
          hidden: row.hidden || false,
          order: i,
          digestId: digest.id,
        },
      })

      for (let j = 0; j < (row.bars || []).length; j++) {
        const bar = row.bars[j]
        await tx.bar.create({
          data: {
            label: bar.label || '',
            start: bar.start,
            end: bar.end,
            color: bar.color || '#2F6F6B',
            progress: bar.progress ?? null,
            style: bar.style || 'solid',
            order: j,
            rowId: createdRow.id,
          },
        })
      }

      for (const ms of row.milestones || []) {
        await tx.milestone.create({
          data: {
            month: ms.month,
            label: ms.label || '',
            color: ms.color || '#B4472F',
            rowId: createdRow.id,
          },
        })
      }
    }

    return digest
  })
}

// ─── Routes ──────────────────────────────────────────────────────────────────

router.get('/', async (req, res) => {
  const where = req.query.status
    ? { status: (req.query.status as string).toUpperCase() as any }
    : {}

  const digests = await prisma.digest.findMany({
    where,
    select: { period: true, title: true, subtitle: true, status: true, publishedAt: true },
    orderBy: { period: 'desc' },
  })

  res.json({
    periods: digests.map(d => ({
      period: d.period,
      title: d.subtitle || d.period,
      status: d.status.toLowerCase(),
      publishedAt: d.publishedAt?.toISOString() ?? undefined,
    })),
  })
})

router.get('/:period', async (req, res) => {
  const period = req.params.period as string
  const digest = await prisma.digest.findUnique({ where: { period } })
  if (!digest) {
    res.status(404).json({ error: 'Digest not found' })
    return
  }

  const assembled = await assembleDigest(digest.id)
  res.json(assembled)
})

router.post('/', requireAuth, async (req, res) => {
  const { meta } = req.body
  const existing = await prisma.digest.findUnique({ where: { period: meta.period } })
  if (existing) {
    res.status(409).json({ error: `Digest for period ${meta.period} already exists` })
    return
  }

  await disassembleAndSave(meta.period, req.body, req.user!.id)
  refreshContext().catch(() => {})
  res.status(201).json(req.body)
})

router.put('/:period', requireAuth, async (req, res) => {
  const period = req.params.period as string
  const existing = await prisma.digest.findUnique({ where: { period } })
  if (!existing) {
    res.status(404).json({ error: 'Digest not found' })
    return
  }

  await disassembleAndSave(period, req.body, req.user!.id)
  refreshContext().catch(() => {})
  res.json(req.body)
})

router.patch('/:period/status', requireAuth, async (req, res) => {
  const period = req.params.period as string
  const { status } = req.body
  const publishedAt = status === 'published' ? new Date() : null
  const digest = await prisma.digest.update({
    where: { period },
    data: {
      status: status === 'published' ? 'PUBLISHED' : 'DRAFT',
      publishedAt,
    },
  })
  res.json({ period: digest.period, status, publishedAt: publishedAt?.toISOString() })
})

router.delete('/:period', requireAuth, async (req, res) => {
  const period = req.params.period as string
  const existing = await prisma.digest.findUnique({ where: { period } })
  if (!existing) {
    res.status(404).json({ error: 'Digest not found' })
    return
  }
  await prisma.digest.delete({ where: { period } })
  res.status(204).send()
})

export default router
