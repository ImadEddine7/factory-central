import type { Digest, DigestIndex } from '../schema'
import type { StorageProvider } from './types'
import { DigestSchema, IndexSchema } from '../schema'

const STORAGE_PREFIX = 'delivery-digest:'
const INDEX_KEY = `${STORAGE_PREFIX}index`

function digestKey(period: string) {
  return `${STORAGE_PREFIX}digest:${period}`
}

export class LocalStorage implements StorageProvider {
  async load(period: string): Promise<Digest | null> {
    const raw = localStorage.getItem(digestKey(period))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return DigestSchema.parse(parsed)
  }

  async save(digest: Digest): Promise<void> {
    localStorage.setItem(digestKey(digest.meta.period), JSON.stringify(digest))
    const index = await this.listPeriods()
    const existing = index.periods.findIndex(p => p.period === digest.meta.period)
    const entry = {
      period: digest.meta.period,
      title: digest.meta.subtitle || digest.meta.period,
      publishedAt: digest.meta.publishedAt,
      status: digest.meta.status,
    }
    if (existing >= 0) {
      index.periods[existing] = entry
    } else {
      index.periods.unshift(entry)
    }
    localStorage.setItem(INDEX_KEY, JSON.stringify(index))
  }

  async listPeriods(): Promise<DigestIndex> {
    const raw = localStorage.getItem(INDEX_KEY)
    if (!raw) return { periods: [] }
    return IndexSchema.parse(JSON.parse(raw))
  }

  async uploadAsset(_period: string, filename: string, data: Blob): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => {
        const key = `${STORAGE_PREFIX}asset:${filename}`
        localStorage.setItem(key, reader.result as string)
        resolve(key)
      }
      reader.readAsDataURL(data)
    })
  }
}

export function downloadJson(digest: Digest) {
  const blob = new Blob([JSON.stringify(digest, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${digest.meta.period}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function loadJsonFile(file: File): Promise<Digest> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string)
        resolve(DigestSchema.parse(data))
      } catch (e) {
        reject(e)
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}
