import { Router } from 'express'
import { prisma } from '../lib/prisma.js'

const router = Router()

router.get('/', async (_req, res) => {
  const conversations = await prisma.conversation.findMany({
    select: { id: true, title: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
  })
  res.json(conversations)
})

router.get('/:id', async (req, res) => {
  const conversation = await prisma.conversation.findUnique({ where: { id: req.params.id } })
  if (!conversation) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  res.json(conversation)
})

router.post('/', async (req, res) => {
  const { title } = req.body
  const conversation = await prisma.conversation.create({
    data: { title: title || 'New conversation' },
  })
  res.status(201).json(conversation)
})

router.put('/:id', async (req, res) => {
  const { title, messages } = req.body
  const data: any = {}
  if (title !== undefined) data.title = title
  if (messages !== undefined) data.messages = messages

  const conversation = await prisma.conversation.update({
    where: { id: req.params.id },
    data,
  })
  res.json(conversation)
})

router.delete('/:id', async (req, res) => {
  await prisma.conversation.delete({ where: { id: req.params.id } })
  res.status(204).send()
})

export default router
