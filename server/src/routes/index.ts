import { Router } from 'express'
import authRoutes from './auth.js'
import digestRoutes from './digests.js'
import articleRoutes from './articles.js'
import announcementRoutes from './announcement.js'
import assetRoutes from './assets.js'
import chatRoutes from './chat.js'
import contextRoutes from './context.js'
import conversationRoutes from './conversations.js'
import projectRoutes from './projects.js'
import headcountRoutes from './headcount.js'
import businessContextRoutes from './business-context.js'
import microsoftRoutes from './microsoft.js'

export const routes = Router()

routes.use('/auth', authRoutes)
routes.use('/digests', digestRoutes)
routes.use('/articles', articleRoutes)
routes.use('/announcement', announcementRoutes)
routes.use('/assets', assetRoutes)
routes.use('/chat', chatRoutes)
routes.use('/context', contextRoutes)
routes.use('/conversations', conversationRoutes)
routes.use('/projects', projectRoutes)
routes.use('/headcount', headcountRoutes)
routes.use('/business-context', businessContextRoutes)
routes.use('/microsoft', microsoftRoutes)
