import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { Digest } from './schema'
import { api } from '@shared/api/client'
import { createEmptyDigest, currentPeriod } from './utils'
import { sampleDigest } from './sample-data'
import { useAuth } from '@shared/auth/AuthContext'

interface DigestContextType {
  digest: Digest
  setDigest: (d: Digest) => void
  updateDigest: (fn: (d: Digest) => Digest) => void
  period: string
  setPeriod: (p: string) => void
  dirty: boolean
  saving: boolean
  lastSaved: Date | null
  save: () => Promise<void>
  loadPeriod: (p: string) => Promise<void>
  error: string | null
  clearError: () => void
}

const DigestContext = createContext<DigestContextType | null>(null)

export function DigestProvider({ children }: { children: ReactNode }) {
  const [digest, setDigestRaw] = useState<Digest>(() => sampleDigest)
  const [period, setPeriodRaw] = useState(currentPeriod())
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { isAdmin } = useAuth()

  const setDigest = useCallback((d: Digest) => {
    setDigestRaw(d)
    setDirty(true)
  }, [])

  const updateDigest = useCallback((fn: (d: Digest) => Digest) => {
    setDigestRaw(prev => {
      const next = fn(prev)
      setDirty(true)
      return next
    })
  }, [])

  const loadPeriod = useCallback(async (p: string, fallback = true) => {
    try {
      const loaded = await api<Digest>(`/digests/${p}`).catch(() => null)
      if (loaded) {
        setDigestRaw(loaded)
        setPeriodRaw(p)
        setDirty(false)
        return
      }

      if (fallback) {
        const [y, m] = p.split('-').map(Number)
        const pm = m === 1 ? 12 : m - 1
        const py = m === 1 ? y - 1 : y
        const prev = `${py}-${String(pm).padStart(2, '0')}`
        return loadPeriod(prev, false)
      }

      if (p === sampleDigest.meta.period) {
        setDigestRaw(sampleDigest)
      } else {
        setDigestRaw(createEmptyDigest(p))
      }
      setPeriodRaw(p)
      setDirty(false)
    } catch (e: any) {
      setError(e.message)
    }
  }, [])

  const save = useCallback(async () => {
    setSaving(true)
    setError(null)
    try {
      const { meta, ...data } = digest
      const body = JSON.stringify({ meta, ...data })
      try {
        await api(`/digests/${digest.meta.period}`, { method: 'PUT', body })
      } catch (e: any) {
        if (e.status === 404) {
          await api('/digests', { method: 'POST', body })
        } else {
          throw e
        }
      }
      setDirty(false)
      setLastSaved(new Date())
    } catch (e: any) {
      setError(e.message)
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
      dirty, saving, lastSaved, save, loadPeriod,
      error, clearError,
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
