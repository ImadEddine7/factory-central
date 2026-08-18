import express from 'express'
import cors from 'cors'
import path from 'path'
import { config } from './config.js'
import { routes } from './routes/index.js'
import { errorHandler } from './middleware/errorHandler.js'

const app = express()

app.use(cors({
  origin: config.CORS_ORIGIN.split(',').map(s => s.trim()),
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use('/uploads', express.static(path.resolve(config.UPLOAD_DIR)))

app.use('/api', routes)
app.use(errorHandler)

export { app }
