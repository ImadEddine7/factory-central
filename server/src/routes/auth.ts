import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { signToken } from '../lib/jwt.js'
import { verifyPassword } from '../lib/password.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.post('/login', async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password required' })
    return
  }

  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }

  const valid = await verifyPassword(password, user.password)
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }

  const token = signToken(user.id)
  res.json({ token, user: { id: user.id, username: user.username, role: user.role } })
})

router.get('/me', requireAuth, (req, res) => {
  res.json(req.user)
})

export default router
