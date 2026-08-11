import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { t } from '@digest/i18n'
import { getStorage } from '@digest/lib/storage'
import type { DigestIndex } from '@digest/lib/schema'

export function ArchivePage() {
  const [index, setIndex] = useState<DigestIndex>({ periods: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getStorage().listPeriods().then(idx => {
      setIndex(idx)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

  const published = index.periods.filter(p => p.status === 'published')

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t.nav.archive}</h1>
      {published.length === 0 ? (
        <p className="text-slate">Aucun digest publié.</p>
      ) : (
        <ul className="space-y-2">
          {published.map(p => (
            <li key={p.period}>
              <Link
                to={`${p.period}`}
                className="flex items-center justify-between rounded-lg border border-slate/10 px-4 py-3 transition-colors hover:border-accent/30 hover:bg-accent/5"
              >
                <span className="font-medium">{p.title}</span>
                <span className="text-sm text-slate">
                  {p.publishedAt && new Date(p.publishedAt).toLocaleDateString('fr-FR')}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
