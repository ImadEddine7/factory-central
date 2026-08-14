import { Router, type Request, type Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { refreshContext } from '../services/delivery-context.js'

const router = Router()

router.get('/', async (_req: Request, res: Response) => {
  const entries = await prisma.businessContext.findMany({
    orderBy: { createdAt: 'desc' },
  })
  res.json(entries)
})

router.post('/', async (req: Request, res: Response) => {
  const { source, subject, content, date } = req.body
  if (!source || !subject || !content) {
    res.status(400).json({ error: 'source, subject, and content are required' })
    return
  }
  const entry = await prisma.businessContext.create({
    data: { source, subject, content, date: date || null, createdBy: (req as any).userId },
  })
  await refreshContext()
  res.status(201).json(entry)
})

router.put('/:id', async (req: Request<{ id: string }>, res: Response) => {
  const { source, subject, content, date } = req.body
  const entry = await prisma.businessContext.update({
    where: { id: req.params.id },
    data: { source, subject, content, date: date || null },
  })
  await refreshContext()
  res.json(entry)
})

router.delete('/:id', async (req: Request<{ id: string }>, res: Response) => {
  await prisma.businessContext.delete({ where: { id: req.params.id } })
  await refreshContext()
  res.json({ ok: true })
})

export default router
