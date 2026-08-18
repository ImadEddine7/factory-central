const BASE_URL = import.meta.env.VITE_API_URL || '/api'

let offlineMode = false

function getToken(): string | null {
  return sessionStorage.getItem('factory-central:token')
}

export function setToken(token: string) {
  sessionStorage.setItem('factory-central:token', token)
}

export function clearToken() {
  sessionStorage.removeItem('factory-central:token')
}

export function isOffline(): boolean {
  return offlineMode
}

function localGet<T>(path: string): T | null {
  try {
    const store = JSON.parse(localStorage.getItem('factory-central:api-cache') || '{}')
    return store[path] ?? null
  } catch { return null }
}

function localSet(path: string, data: any) {
  try {
    const store = JSON.parse(localStorage.getItem('factory-central:api-cache') || '{}')
    store[path] = data
    localStorage.setItem('factory-central:api-cache', JSON.stringify(store))
  } catch { /* quota exceeded */ }
}

export async function api<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase()

  if (offlineMode) {
    if (method === 'GET') {
      const cached = localGet<T>(path)
      if (cached) return cached
      throw new ApiError(0, 'offline')
    }
    if (options.body) {
      const data = JSON.parse(options.body as string)
      localSet(path, data)
      return data as T
    }
    return undefined as T
  }

  const token = getToken()
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  }

  if (token && token !== 'static-admin-token') {
    headers['Authorization'] = `Bearer ${token}`
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new ApiError(res.status, body.error || res.statusText)
    }

    if (res.status === 204) return undefined as T
    const data = await res.json()
    if (method === 'GET') localSet(path, data)
    return data
  } catch (e) {
    if (e instanceof ApiError) throw e
    offlineMode = true
    if (method === 'GET') {
      const cached = localGet<T>(path)
      if (cached) return cached
    }
    if (method !== 'GET' && options.body) {
      const data = JSON.parse(options.body as string)
      localSet(path, data)
      return data as T
    }
    throw new ApiError(0, 'offline')
  }
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}
