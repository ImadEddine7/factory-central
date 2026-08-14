import { Router, type Request, type Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { refreshContext } from '../services/delivery-context.js'
import * as graph from '../services/microsoft-graph.js'

const router = Router()

router.get('/status', async (_req: Request, res: Response) => {
  const configured = graph.isConfigured()
  const token = await prisma.microsoftToken.findUnique({ where: { id: 'singleton' } })
  res.json({
    configured,
    connected: !!token,
    account: token?.account || null,
    expiresAt: token?.expiresAt || null,
  })
})

router.get('/connect', async (_req: Request, res: Response) => {
  if (!graph.isConfigured()) {
    res.status(400).json({ error: 'Microsoft credentials not configured. Set MS_TENANT_ID, MS_CLIENT_ID, MS_CLIENT_SECRET in server .env' })
    return
  }
  const url = await graph.getAuthUrl()
  res.json({ url })
})

router.get('/callback', async (req: Request, res: Response) => {
  const code = req.query.code as string
  if (!code) {
    res.status(400).send('Missing authorization code')
    return
  }
  try {
    await graph.handleCallback(code)
    res.send('<html><body><h2>Connected!</h2><p>You can close this window and return to Factory Central.</p><script>window.close()</script></body></html>')
  } catch (err: any) {
    res.status(500).send(`Auth error: ${err.message}`)
  }
})

router.delete('/disconnect', async (_req: Request, res: Response) => {
  await prisma.microsoftToken.deleteMany()
  res.json({ ok: true })
})

// --- Source browsing ---

router.get('/mail/folders', async (_req: Request, res: Response) => {
  try {
    const folders = await graph.listMailFolders()
    res.json(folders)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/teams/chats', async (_req: Request, res: Response) => {
  try {
    const chats = await graph.listTeamsChats()
    res.json(chats)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/teams/joined', async (_req: Request, res: Response) => {
  try {
    const teams = await graph.listJoinedTeams()
    res.json(teams)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/teams/:teamId/channels', async (req: Request<{ teamId: string }>, res: Response) => {
  try {
    const channels = await graph.listTeamChannels(req.params.teamId)
    res.json(channels)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/sharepoint/sites', async (_req: Request, res: Response) => {
  try {
    const sites = await graph.listSharePointSites()
    res.json(sites)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// --- Sync configs ---

router.get('/sync-configs', async (_req: Request, res: Response) => {
  const configs = await prisma.syncConfig.findMany({ orderBy: { createdAt: 'desc' } })
  res.json(configs)
})

router.post('/sync-configs', async (req: Request, res: Response) => {
  const { source, name, resourceId } = req.body
  if (!source || !name || !resourceId) {
    res.status(400).json({ error: 'source, name, and resourceId are required' })
    return
  }
  const config = await prisma.syncConfig.create({
    data: { source, name, resourceId },
  })
  res.status(201).json(config)
})

router.delete('/sync-configs/:id', async (req: Request<{ id: string }>, res: Response) => {
  await prisma.syncConfig.delete({ where: { id: req.params.id } })
  res.json({ ok: true })
})

router.post('/sync-configs/:id/sync', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const count = await graph.syncSource(req.params.id)
    await refreshContext()
    res.json({ ok: true, imported: count })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/sync-all', async (_req: Request, res: Response) => {
  try {
    const configs = await prisma.syncConfig.findMany({ where: { enabled: true } })
    let total = 0
    for (const config of configs) {
      total += await graph.syncSource(config.id)
    }
    await refreshContext()
    res.json({ ok: true, imported: total, sources: configs.length })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
