import type { Digest, DigestIndex } from '../schema'

export interface StorageProvider {
  load(period: string): Promise<Digest | null>
  save(digest: Digest): Promise<void>
  listPeriods(): Promise<DigestIndex>
  uploadAsset(period: string, filename: string, data: Blob): Promise<string>
}

export interface GitHubConfig {
  token: string
  owner: string
  repo: string
  branch: string
}
