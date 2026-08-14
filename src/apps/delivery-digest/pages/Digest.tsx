import { useParams } from 'react-router-dom'
import { useDigest } from '@digest/lib/context'
import { HeaderStrip } from '@digest/blocks/HeaderStrip'
import { Pipeline } from '@digest/blocks/Pipeline'
import { Revenue } from '@digest/blocks/Revenue'
import { PoCoverage } from '@digest/blocks/PoCoverage'
import { KeyMessages } from '@digest/blocks/KeyMessages'
import { Planning } from '@digest/blocks/Planning'
import { Headcount } from '@digest/blocks/Headcount'
import { useEffect } from 'react'

export function DigestPage() {
  const { period } = useParams<{ period: string }>()
  const { digest, loadPeriod } = useDigest()

  useEffect(() => {
    if (period) loadPeriod(period)
  }, [period, loadPeriod])

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-ink">{digest.meta.title}</h1>
        <p className="mt-1 text-lg text-slate">{digest.meta.subtitle}</p>
        {digest.meta.publishedAt && (
          <p className="mt-1 text-sm text-slate/50">
            Publié le {new Date(digest.meta.publishedAt).toLocaleDateString('fr-FR')}
          </p>
        )}
      </div>
      <div className="mb-10 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-4">
          <HeaderStrip digest={digest} />
          <Pipeline digest={digest} />
        </div>
        <div className="section-card">
          <Headcount digest={digest} />
        </div>
      </div>
      <KeyMessages digest={digest} />
      <Planning digest={digest} />
      <Revenue digest={digest} />
      <PoCoverage digest={digest} />
    </div>
  )
}
