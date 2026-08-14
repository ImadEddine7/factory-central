import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.get('/', async (_req, res) => {
  const articles = await prisma.article.findMany({
    orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
  })
  res.json({ articles })
})

router.get('/:id', async (req, res) => {
  const id = req.params.id as string
  const article = await prisma.article.findUnique({ where: { id } })
  if (!article) {
    res.status(404).json({ error: 'Article not found' })
    return
  }
  res.json(article)
})

router.post('/', requireAuth, async (req, res) => {
  const { title, body, date, pinned } = req.body
  if (!title) {
    res.status(400).json({ error: 'Title is required' })
    return
  }

  const article = await prisma.article.create({
    data: {
      title,
      body: body || '',
      date: date || new Date().toISOString().split('T')[0],
      pinned: pinned || false,
      createdBy: req.user!.id,
    },
  })
  res.status(201).json(article)
})

router.put('/:id', requireAuth, async (req, res) => {
  const id = req.params.id as string
  const { title, body, date, pinned } = req.body
  const article = await prisma.article.update({
    where: { id },
    data: { title, body, date, pinned },
  })
  res.json(article)
})

router.patch('/:id/pin', requireAuth, async (req, res) => {
  const id = req.params.id as string
  const { pinned } = req.body
  const article = await prisma.article.update({
    where: { id },
    data: { pinned },
  })
  res.json(article)
})

router.delete('/:id', requireAuth, async (req, res) => {
  const id = req.params.id as string
  await prisma.article.delete({ where: { id } })
  res.status(204).send()
})

export default router
