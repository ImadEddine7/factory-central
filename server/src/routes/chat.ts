import { Router, type Request, type Response } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import multer from 'multer'
import { getContext } from '../services/delivery-context.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } })

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are Digital EM, an AI engineering manager assistant for the Data Factory team. You have access to the full delivery suite data: project revenues, purchase orders, headcount, planning timelines, key messages, and news articles.

Answer questions about delivery status, project health, resource allocation, and planning. Be concise, factual, and reference specific numbers from the data. If something isn't in the data, say so.

Here is the current delivery knowledge base:

`

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

function getMimeType(originalname: string, mimetype: string): string {
  if (mimetype.startsWith('image/')) return mimetype
  if (mimetype === 'application/pdf') return 'application/pdf'
  return 'text/plain'
}

function buildUserContent(text: string, files: Express.Multer.File[]) {
  const content: Anthropic.ContentBlockParam[] = []

  for (const file of files) {
    const mime = getMimeType(file.originalname, file.mimetype)
    const base64 = file.buffer.toString('base64')

    if (mime.startsWith('image/')) {
      content.push({
        type: 'image',
        source: { type: 'base64', media_type: mime as Anthropic.Base64ImageSource['media_type'], data: base64 },
      })
    } else if (mime === 'application/pdf') {
      content.push({
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: base64 },
      })
    } else {
      const textContent = file.buffer.toString('utf-8')
      content.push({ type: 'text', text: `[File: ${file.originalname}]\n${textContent}` })
    }
  }

  content.push({ type: 'text', text })
  return content
}

router.post('/', upload.array('files', 10), async (req: Request, res: Response) => {
  try {
    const messages: ChatMessage[] = JSON.parse(req.body.messages)
    const files = (req.files as Express.Multer.File[]) || []

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'messages array is required' })
      return
    }

    const apiMessages: Anthropic.MessageParam[] = messages.map((msg, i) => {
      if (msg.role === 'user' && i === messages.length - 1 && files.length > 0) {
        return { role: 'user', content: buildUserContent(msg.content, files) }
      }
      return { role: msg.role, content: msg.content }
    })

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    const context = await getContext()
    res.write(`data: ${JSON.stringify({ type: 'event', event: 'context_loaded', data: { length: context.length } })}\n\n`)

    const stream = client.messages.stream({
      model: 'claude-sonnet-5',
      max_tokens: 8192,
      thinking: { type: 'adaptive' },
      system: SYSTEM_PROMPT + context,
      messages: apiMessages,
    })

    for await (const event of stream) {
      if (event.type === 'message_start') {
        res.write(`data: ${JSON.stringify({ type: 'event', event: 'message_start', data: { id: event.message.id, model: event.message.model, usage: event.message.usage } })}\n\n`)
      } else if (event.type === 'content_block_start') {
        res.write(`data: ${JSON.stringify({ type: 'event', event: 'content_block_start', data: { index: event.index, block_type: event.content_block.type } })}\n\n`)
        if (event.content_block.type === 'text') {
          res.write(`data: ${JSON.stringify({ type: 'text', text: '' })}\n\n`)
        }
      } else if (event.type === 'content_block_delta') {
        if (event.delta.type === 'text_delta') {
          res.write(`data: ${JSON.stringify({ type: 'text', text: event.delta.text })}\n\n`)
        } else if (event.delta.type === 'thinking_delta') {
          res.write(`data: ${JSON.stringify({ type: 'thinking', text: event.delta.thinking })}\n\n`)
        }
      } else if (event.type === 'content_block_stop') {
        res.write(`data: ${JSON.stringify({ type: 'event', event: 'content_block_stop', data: { index: event.index } })}\n\n`)
      } else if (event.type === 'message_delta') {
        res.write(`data: ${JSON.stringify({ type: 'event', event: 'message_delta', data: { stop_reason: event.delta.stop_reason, usage: event.usage } })}\n\n`)
      }
    }

    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
    res.end()
  } catch (err: any) {
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || 'Internal server error' })
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`)
      res.end()
    }
  }
})

export default router
