import { LocalStorage } from './local'
import { GitHubStorage } from './github'
import type { StorageProvider, GitHubConfig } from './types'

export type { StorageProvider, GitHubConfig }
export { LocalStorage, downloadJson, loadJsonFile } from './local'
export { GitHubStorage } from './github'

const CONFIG_KEY = 'delivery-digest:github-config'
const TOKEN_KEY = 'delivery-digest:github-token'

export function saveGitHubConfig(config: GitHubConfig, persist: boolean) {
  const { token, ...rest } = config
  localStorage.setItem(CONFIG_KEY, JSON.stringify(rest))
  const storage = persist ? localStorage : sessionStorage
  storage.setItem(TOKEN_KEY, token)
}

export function loadGitHubConfig(): GitHubConfig | null {
  const raw = localStorage.getItem(CONFIG_KEY)
  if (!raw) return null
  const config = JSON.parse(raw)
  const token = sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY)
  if (!token) return null
  return { ...config, token }
}

export function clearGitHubConfig() {
  localStorage.removeItem(CONFIG_KEY)
  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
}

export function getStorage(): StorageProvider {
  const config = loadGitHubConfig()
  if (config) return new GitHubStorage(config)
  return new LocalStorage()
}

export function isGitHubMode(): boolean {
  return loadGitHubConfig() !== null
}
