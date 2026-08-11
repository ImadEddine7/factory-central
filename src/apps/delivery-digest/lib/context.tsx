import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { Digest } from './schema'
import { DigestSchema } from './schema'
import { getStorage, isGitHubMode } from './storage'
import { createEmptyDigest, currentPeriod } from './utils'

const BASE = import.meta.env.BASE_URL

interface DigestContextType {
  digest: Digest
  setDigest: (d: Digest) => void
  updateDigest: (fn: (d: Digest) => Digest) => void
  period: string
  setPeriod: (p: string) => void
  dirty: boolean
  saving: boolean
  lastSaved: Date | null
  saveToGitHub: () => Promise<void>
  loadPeriod: (p: string) => Promise<void>
  error: string | null
  clearError: () => void
  githubMode: boolean
}

const DigestContext = createContext<DigestContextType | null>(null)

const API_BASE = 'https://api.github.com/repos/ImadEddine7/delivery-digest/contents'

async function fetchFromRepo(period: string): Promise<Digest | null> {
  try {
    const res = await fetch(`${API_BASE}/data/digests/${period}.json?ref=main`, {
      headers: { Accept: 'application/vnd.github.raw' },
    })
    if (!res.ok) return null
    const json = await res.json()
    return DigestSchema.parse(json)
  } catch {
    return null
  }
}

export function DigestProvider({ children }: { children: ReactNode }) {
  const [digest, setDigestRaw] = useState<Digest>(() => createEmptyDigest(currentPeriod()))
  const [period, setPeriodRaw] = useState(currentPeriod())
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const githubMode = isGitHubMode()

  const setDigest = useCallback((d: Digest) => {
    setDigestRaw(d)
    setDirty(true)
    localStorage.setItem(`delivery-digest:draft:${d.meta.period}`, JSON.stringify(d))
  }, [])

  const updateDigest = useCallback((fn: (d: Digest) => Digest) => {
    setDigestRaw(prev => {
      const next = fn(prev)
      setDirty(true)
      localStorage.setItem(`delivery-digest:draft:${next.meta.period}`, JSON.stringify(next))
      return next
    })
  }, [])

  const loadPeriod = useCallback(async (p: string, fallback = true) => {
    try {
      // 1. Check local draft first
      const draft = localStorage.getItem(`delivery-digest:draft:${p}`)
      if (draft) {
        setDigestRaw(JSON.parse(draft))
        setPeriodRaw(p)
        setDirty(true)
        return
      }

      // 2. If GitHub mode, use API
      if (isGitHubMode()) {
        const storage = getStorage()
        const loaded = await storage.load(p)
        if (loaded) {
          setDigestRaw(loaded)
          setPeriodRaw(p)
          setDirty(false)
          return
        }
      }

      // 3. Fetch from GitHub raw (always up-to-date with main branch)
      const fromRepo = await fetchFromRepo(p)
      if (fromRepo) {
        setDigestRaw(fromRepo)
        setPeriodRaw(p)
        setDirty(false)
        return
      }

      // 4. Fallback: try previous month (only on initial load)
      if (fallback) {
        const [y, m] = p.split('-').map(Number)
        const pm = m === 1 ? 12 : m - 1
        const py = m === 1 ? y - 1 : y
        const prev = `${py}-${String(pm).padStart(2, '0')}`
        return loadPeriod(prev, false)
      }

      // 5. Nothing found, create empty
      setDigestRaw(createEmptyDigest(p))
      setPeriodRaw(p)
      setDirty(false)
    } catch (e: any) {
      if (e.message === 'TOKEN_INVALID') {
        setError('TOKEN_INVALID')
      } else {
        setError(e.message)
      }
    }
  }, [])

  const saveToGitHub = useCallback(async () => {
    setSaving(true)
    setError(null)
    try {
      const storage = getStorage()
      await storage.save(digest)
      setDirty(false)
      setLastSaved(new Date())
      localStorage.removeItem(`delivery-digest:draft:${digest.meta.period}`)
    } catch (e: any) {
      if (e.message === 'TOKEN_INVALID') {
        setError('TOKEN_INVALID')
      } else if (e.message === 'CONFLICT') {
        setError('CONFLICT')
      } else {
        setError(e.message)
      }
    } finally {
      setSaving(false)
    }
  }, [digest])

  const setPeriod = useCallback((p: string) => {
    setPeriodRaw(p)
    loadPeriod(p)
  }, [loadPeriod])

  const clearError = useCallback(() => setError(null), [])

  useEffect(() => {
    loadPeriod(period)
  }, [])

  return (
    <DigestContext.Provider value={{
      digest, setDigest, updateDigest, period, setPeriod,
      dirty, saving, lastSaved, saveToGitHub, loadPeriod,
      error, clearError, githubMode,
    }}>
      {children}
    </DigestContext.Provider>
  )
}

export function useDigest() {
  const ctx = useContext(DigestContext)
  if (!ctx) throw new Error('useDigest must be used within DigestProvider')
  return ctx
}
