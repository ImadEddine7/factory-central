import { Router } from 'express'
import { prisma } from '../lib/prisma.js'

const router = Router()

router.get('/', async (req, res) => {
  const where = req.query.period
    ? { digest: { period: req.query.period as string } }
    : {}

  const entries = await prisma.headcountEntry.findMany({
    where,
    include: { digest: { select: { period: true } } },
    orderBy: { month: 'asc' },
  })

  res.json(entries)
})

export default router
