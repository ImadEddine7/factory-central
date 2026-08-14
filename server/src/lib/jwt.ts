import jwt from 'jsonwebtoken'
import { config } from '../config.js'

interface TokenPayload {
  userId: string
}

export function signToken(userId: string): string {
  return jwt.sign({ userId }, config.JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, config.JWT_SECRET) as TokenPayload
}
