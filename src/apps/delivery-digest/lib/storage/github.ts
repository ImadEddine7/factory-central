import type { Digest, DigestIndex } from '../schema'
import type { StorageProvider, GitHubConfig } from './types'
import { DigestSchema, IndexSchema } from '../schema'

const API = 'https://api.github.com'

export class GitHubStorage implements StorageProvider {
  private config: GitHubConfig

  constructor(config: GitHubConfig) {
    this.config = config
  }

  private headers() {
    return {
      Authorization: `Bearer ${this.config.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    }
  }

  private url(path: string) {
    return `${API}/repos/${this.config.owner}/${this.config.repo}/contents/${path}`
  }

  private async getFile(path: string): Promise<{ content: string; sha: string } | null> {
    const res = await fetch(`${this.url(path)}?ref=${this.config.branch}`, {
      headers: this.headers(),
    })
    if (res.status === 404) return null
    if (res.status === 401 || res.status === 403) {
      throw new Error('TOKEN_INVALID')
    }
    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`)
    const data = await res.json()
    return { content: atob(data.content), sha: data.sha }
  }

  private async putFile(path: string, content: string, message: string, sha?: string) {
    const body: Record<string, string> = {
      message,
      content: btoa(unescape(encodeURIComponent(content))),
      branch: this.config.branch,
    }
    if (sha) body.sha = sha

    const res = await fetch(this.url(path), {
      method: 'PUT',
      headers: this.headers(),
      body: JSON.stringify(body),
    })

    if (res.status === 401 || res.status === 403) {
      throw new Error('TOKEN_INVALID')
    }
    if (res.status === 409) {
      throw new Error('CONFLICT')
    }
    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`)
    return res.json()
  }

  async load(period: string): Promise<Digest | null> {
    const file = await this.getFile(`data/digests/${period}.json`)
    if (!file) return null
    return DigestSchema.parse(JSON.parse(file.content))
  }

  async save(digest: Digest): Promise<void> {
    const path = `data/digests/${digest.meta.period}.json`
    const existing = await this.getFile(path)
    const content = JSON.stringify(digest, null, 2)
    const message = `digest(${digest.meta.period}): update`

    await this.putFile(path, content, message, existing?.sha)

    const indexPath = 'data/index.json'
    const indexFile = await this.getFile(indexPath)
    let index: DigestIndex = { periods: [] }
    if (indexFile) {
      index = IndexSchema.parse(JSON.parse(indexFile.content))
    }

    const entry = {
      period: digest.meta.period,
      title: digest.meta.subtitle || digest.meta.period,
      publishedAt: digest.meta.publishedAt,
      status: digest.meta.status,
    }

    const idx = index.periods.findIndex(p => p.period === digest.meta.period)
    if (idx >= 0) {
      index.periods[idx] = entry
    } else {
      index.periods.unshift(entry)
    }

    await this.putFile(
      indexPath,
      JSON.stringify(index, null, 2),
      `index: update ${digest.meta.period}`,
      indexFile?.sha
    )
  }

  async listPeriods(): Promise<DigestIndex> {
    const file = await this.getFile('data/index.json')
    if (!file) return { periods: [] }
    return IndexSchema.parse(JSON.parse(file.content))
  }

  async uploadAsset(period: string, filename: string, data: Blob): Promise<string> {
    const path = `data/assets/${period}/${filename}`
    const buffer = await data.arrayBuffer()
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)))

    const existing = await this.getFile(path)
    const body: Record<string, string> = {
      message: `asset(${period}): upload ${filename}`,
      content: base64,
      branch: this.config.branch,
    }
    if (existing) body.sha = existing.sha

    const res = await fetch(this.url(path), {
      method: 'PUT',
      headers: this.headers(),
      body: JSON.stringify(body),
    })

    if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
    return `data/assets/${period}/${filename}`
  }
}
