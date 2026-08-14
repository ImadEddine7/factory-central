import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { config } from '../config.js'

const storage = multer.diskStorage({
  destination: config.UPLOAD_DIR,
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, `${unique}${path.extname(file.originalname)}`)
  },
})

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } })

const router = Router()

router.post('/upload', requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' })
    return
  }

  const asset = await prisma.asset.create({
    data: {
      filename: req.file.originalname,
      mimeType: req.file.mimetype,
      path: req.file.filename,
      period: req.body.period || null,
      size: req.file.size,
    },
  })

  res.status(201).json({
    id: asset.id,
    url: `/api/assets/${asset.id}`,
    filename: asset.filename,
    mimeType: asset.mimeType,
  })
})

router.get('/:id', async (req, res) => {
  const asset = await prisma.asset.findUnique({ where: { id: req.params.id } })
  if (!asset) {
    res.status(404).json({ error: 'Asset not found' })
    return
  }

  const filePath = path.resolve(config.UPLOAD_DIR, asset.path)
  res.setHeader('Content-Type', asset.mimeType)
  res.sendFile(filePath)
})

export default router
