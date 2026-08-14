import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.get('/', async (_req, res) => {
  const ann = await prisma.announcement.findUnique({ where: { id: 'singleton' } })
  res.json({ text: ann?.text || '' })
})

router.put('/', requireAuth, async (req, res) => {
  const { text } = req.body
  const ann = await prisma.announcement.upsert({
    where: { id: 'singleton' },
    update: { text },
    create: { id: 'singleton', text },
  })
  res.json({ text: ann.text })
})

export default router
