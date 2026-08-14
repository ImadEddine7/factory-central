import { Router } from 'express'
import { prisma } from '../lib/prisma.js'

const router = Router()

router.get('/', async (req, res) => {
  const where = req.query.period
    ? { digest: { period: req.query.period as string } }
    : {}

  const projects = await prisma.project.findMany({
    where,
    include: {
      digest: { select: { period: true, title: true, currency: true, unit: true } },
      purchaseOrders: { orderBy: { order: 'asc' } },
    },
    orderBy: [{ digest: { period: 'desc' } }, { order: 'asc' }],
  })

  res.json(projects)
})

router.get('/:id', async (req, res) => {
  const project = await prisma.project.findUnique({
    where: { id: req.params.id as string },
    include: {
      digest: { select: { period: true, currency: true, unit: true } },
      purchaseOrders: { orderBy: { order: 'asc' } },
    },
  })
  if (!project) {
    res.status(404).json({ error: 'Project not found' })
    return
  }
  res.json(project)
})

router.get('/:id/purchase-orders', async (req, res) => {
  const pos = await prisma.purchaseOrder.findMany({
    where: { projectId: req.params.id as string },
    orderBy: { order: 'asc' },
  })
  res.json(pos)
})

export default router
