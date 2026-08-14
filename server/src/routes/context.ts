import { Router } from 'express'
import { getContext, refreshContext, analyzeChanges } from '../services/delivery-context.js'

const router = Router()

router.get('/', async (_req, res) => {
  const md = await getContext()
  res.type('text/markdown').send(md)
})

router.post('/refresh', async (_req, res) => {
  let previousMd = ''
  try {
    previousMd = await getContext()
  } catch {}

  const newMd = await refreshContext()

  let changelog = ''
  if (previousMd && previousMd !== newMd) {
    changelog = await analyzeChanges(previousMd, newMd)
  }

  res.json({ refreshed: true, changelog, length: newMd.length })
})

export default router
