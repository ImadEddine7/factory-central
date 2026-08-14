import type { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../lib/jwt.js'
import { prisma } from '../lib/prisma.js'

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; username: string; role: string }
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const token = header.slice(7)
  try {
    const payload = verifyToken(token)
    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
    req.user = { id: user.id, username: user.username, role: user.role }
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}
