import { prisma } from '../lib/prisma.js'
import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CONTEXT_PATH = path.resolve(__dirname, '../../data/delivery-context.md')
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

let cachedContext: string | null = null
let cacheTime = 0
const CACHE_TTL = 30_000

export async function gatherDeliveryData() {
  const [digests, articles, announcement, businessContext] = await Promise.all([
    prisma.digest.findMany({
      orderBy: { period: 'desc' },
      include: {
        projects: {
          orderBy: { order: 'asc' },
          include: { purchaseOrders: { orderBy: { order: 'asc' } } },
        },
        headcount: { orderBy: { month: 'asc' } },
        keyMessages: { orderBy: { order: 'asc' } },
        planningRows: {
          orderBy: { order: 'asc' },
          include: {
            bars: { orderBy: { order: 'asc' } },
            milestones: true,
          },
        },
      },
    }),
    prisma.article.findMany({ orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }] }),
    prisma.announcement.findFirst(),
    prisma.businessContext.findMany({ orderBy: { createdAt: 'desc' } }),
  ])

  return { digests, articles, announcement, businessContext }
}

export function formatDigestToMarkdown(digest: any): string {
  const lines: string[] = []

  lines.push(`## Digest: ${digest.period}`)
  lines.push(`- **Title**: ${digest.title}`)
  if (digest.subtitle) lines.push(`- **Subtitle**: ${digest.subtitle}`)
  lines.push(`- **Status**: ${digest.status}`)
  lines.push(`- **Author**: ${digest.author || 'N/A'}`)
  if (digest.publishedAt) lines.push(`- **Published**: ${digest.publishedAt.toISOString().split('T')[0]}`)
  lines.push('')

  if (digest.projects?.length) {
    lines.push(`### Projects`)
    lines.push(`| Project | Program | Revenue (${digest.currency} ${digest.unit}) | Active |`)
    lines.push(`|---------|---------|---------|--------|`)
    for (const p of digest.projects) {
      lines.push(`| ${p.name} | ${p.program || '-'} | ${p.revenue} | ${p.active ? 'Yes' : 'No'} |`)
    }
    lines.push('')
  }

  const allPOs = digest.projects?.flatMap((p: any) => p.purchaseOrders.map((po: any) => ({ ...po, projectName: p.name }))) || []
  if (allPOs.length) {
    lines.push(`### Purchase Orders`)
    lines.push(`| Project | Label | PO Requested | Delivered | PO Received |`)
    lines.push(`|---------|-------|-------------|-----------|-------------|`)
    for (const po of allPOs) {
      lines.push(`| ${po.projectName} | ${po.label || '-'} | ${po.poRequested} | ${po.delivered} | ${po.poReceived} |`)
    }
    lines.push('')
  }

  if (digest.headcount?.length) {
    lines.push(`### Headcount`)
    lines.push(`| Month | Offshore | Onshore | Total |`)
    lines.push(`|-------|----------|---------|-------|`)
    for (const h of digest.headcount) {
      lines.push(`| ${h.month} | ${h.offshore} | ${h.onshore} | ${h.offshore + h.onshore} |`)
    }
    lines.push('')
  }

  if (digest.keyMessages?.length) {
    lines.push(`### Key Messages`)
    for (const msg of digest.keyMessages) {
      lines.push(`- **${msg.title}**${msg.tag ? ` [${msg.tag}]` : ''}: ${msg.body}`)
    }
    lines.push('')
  }

  if (digest.planningRows?.length) {
    lines.push(`### Planning (${digest.planningStartMonth} → ${digest.planningEndMonth})`)
    for (const row of digest.planningRows) {
      if (row.type === 'section') {
        lines.push(`#### ${row.label}`)
      } else if (!row.hidden) {
        const bars = row.bars?.map((b: any) => `${b.label}: ${b.start}→${b.end}${b.progress != null ? ` (${b.progress}%)` : ''}`).join(', ')
        const milestones = row.milestones?.map((m: any) => `⬥ ${m.label} (${m.month})`).join(', ')
        let detail = bars || ''
        if (milestones) detail += (detail ? ' | ' : '') + milestones
        lines.push(`- ${'  '.repeat(row.indent || 0)}${row.label}${detail ? ': ' + detail : ''}`)
      }
    }
    lines.push('')
  }

  return lines.join('\n')
}

export async function buildContextMarkdown(): Promise<string> {
  const { digests, articles, announcement, businessContext } = await gatherDeliveryData()

  const lines: string[] = []
  lines.push(`# Factory Central — Delivery Suite Knowledge Base`)
  lines.push(`> Last updated: ${new Date().toISOString()}`)
  lines.push('')

  if (announcement?.text) {
    lines.push(`## Announcement`)
    lines.push(announcement.text)
    lines.push('')
  }

  if (businessContext.length) {
    lines.push(`## Business Context (Emails, Teams, SharePoint)`)
    lines.push(`This section contains context from daily communications provided by the delivery manager.`)
    lines.push('')
    for (const entry of businessContext) {
      const sourceLabel = entry.source === 'EMAIL' ? 'Email' : entry.source === 'TEAMS' ? 'Teams' : entry.source === 'SHAREPOINT' ? 'SharePoint' : 'Other'
      lines.push(`### [${sourceLabel}] ${entry.subject}${entry.date ? ` (${entry.date})` : ''}`)
      lines.push(entry.content)
      lines.push('')
    }
  }

  if (articles.length) {
    lines.push(`## News & Articles`)
    for (const a of articles) {
      lines.push(`### ${a.title}${a.pinned ? ' 📌' : ''} (${a.date})`)
      lines.push(a.body)
      lines.push('')
    }
  }

  if (digests.length === 0) {
    lines.push(`## No delivery digests found`)
    lines.push('The database has no digest data yet.')
    lines.push('')
  }

  for (const digest of digests) {
    lines.push(formatDigestToMarkdown(digest))
  }

  return lines.join('\n')
}

export async function refreshContext(): Promise<string> {
  const md = await buildContextMarkdown()
  cachedContext = md
  cacheTime = Date.now()
  try {
    await fs.mkdir(path.dirname(CONTEXT_PATH), { recursive: true })
    await fs.writeFile(CONTEXT_PATH, md, 'utf-8')
  } catch {
    // File write is best-effort; cache still works
  }
  return md
}

export async function analyzeChanges(previousMd: string, newMd: string): Promise<string> {
  if (!previousMd) return ''

  const response = await client.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `Compare these two versions of a delivery knowledge base and summarize what changed concisely (new projects, revenue changes, headcount shifts, planning updates, new messages). Be factual and brief.

PREVIOUS:
${previousMd.slice(0, 8000)}

CURRENT:
${newMd.slice(0, 8000)}`,
    }],
  })

  const block = response.content.find(b => b.type === 'text')
  return block?.text || ''
}

export async function getContext(): Promise<string> {
  if (cachedContext && (Date.now() - cacheTime) < CACHE_TTL) {
    return cachedContext
  }

  try {
    const content = await fs.readFile(CONTEXT_PATH, 'utf-8')
    if (content.length > 0) {
      cachedContext = content
      cacheTime = Date.now()
      return content
    }
  } catch {
    // File doesn't exist yet
  }

  return await refreshContext()
}
