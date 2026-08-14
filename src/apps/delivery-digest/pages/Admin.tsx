import { useState } from 'react'
import { t } from '@digest/i18n'
import { useDigest } from '@digest/lib/context'
import { createEmptyDigest, currentPeriod } from '@digest/lib/utils'
import { RevenueEditor } from '@digest/admin/RevenueEditor'
import { PoEditor } from '@digest/admin/PoEditor'
import { MessagesEditor } from '@digest/admin/MessagesEditor'
import { PlanningEditor } from '@digest/admin/PlanningEditor'
import { HeadcountEditor } from '@digest/admin/HeadcountEditor'
import { ExcelImport } from '@digest/admin/ExcelImport'
import { SettingsEditor } from '@digest/admin/SettingsEditor'
import { PublishPanel } from '@digest/admin/PublishPanel'
import { HeaderStrip } from '@digest/blocks/HeaderStrip'
import { Revenue } from '@digest/blocks/Revenue'
import { PoCoverage } from '@digest/blocks/PoCoverage'
import { KeyMessages } from '@digest/blocks/KeyMessages'
import { Planning } from '@digest/blocks/Planning'
import { Headcount } from '@digest/blocks/Headcount'

type Tab = 'revenue' | 'po' | 'headcount' | 'messages' | 'planning' | 'import' | 'settings' | 'publish'

export function AdminPage() {
  const { digest, period, setPeriod, dirty, saving, lastSaved, save, updateDigest, error, clearError } = useDigest()
  const [tab, setTab] = useState<Tab>('revenue')
  const [preview, setPreview] = useState(false)

  const tabs: { key: Tab; label: string }[] = [
    { key: 'revenue', label: t.admin.nav.revenue },
    { key: 'po', label: t.admin.nav.po },
    { key: 'headcount', label: 'Effectifs' },
    { key: 'messages', label: t.admin.nav.messages },
    { key: 'planning', label: t.admin.nav.planning },
    { key: 'import', label: t.admin.nav.import },
    { key: 'settings', label: t.admin.nav.settings },
    { key: 'publish', label: t.admin.nav.publish },
  ]

  const newPeriod = () => {
    const p = prompt('Période (YYYY-MM)', currentPeriod())
    if (p && /^\d{4}-\d{2}$/.test(p)) {
      const empty = createEmptyDigest(p)
      const prev = digest
      empty.projects = prev.projects.map(pr => ({ ...pr, revenue: 0 }))
      empty.planning = prev.planning
      empty.settings = prev.settings
      updateDigest(() => empty)
      setPeriod(p)
    }
  }

  if (preview) {
    return (
      <div>
        <div className="sticky top-0 z-50 flex items-center justify-between border-b bg-white px-4 py-2 no-print">
          <span className="text-sm font-medium">{t.admin.preview}</span>
          <button onClick={() => setPreview(false)} className="btn-secondary text-sm">
            Fermer
          </button>
        </div>
        <div className="mx-auto max-w-5xl px-4 py-8">
          <HeaderStrip digest={digest} />
          <Revenue digest={digest} />
          <PoCoverage digest={digest} />
          <Headcount digest={digest} />
          <KeyMessages digest={digest} />
          <Planning digest={digest} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <nav className="w-56 flex-shrink-0 border-r border-slate/10 bg-mist/30 p-4 no-print">
        <h1 className="mb-4 text-sm font-bold text-accent">{t.nav.admin}</h1>

        <div className="mb-4">
          <label className="text-xs text-slate">{t.admin.period}</label>
          <input
            type="month"
            className="input-field mt-1 w-full text-sm"
            value={period}
            onChange={e => setPeriod(e.target.value)}
          />
          <button onClick={newPeriod} className="mt-1 text-xs text-accent hover:underline">
            {t.admin.newPeriod}
          </button>
        </div>

        <ul className="space-y-1">
          {tabs.map(({ key, label }) => (
            <li key={key}>
              <button
                onClick={() => setTab(key)}
                className={`w-full rounded-md px-3 py-1.5 text-left text-sm transition-colors ${tab === key ? 'bg-accent text-white' : 'text-slate hover:bg-accent/5'}`}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-6 space-y-2">
          <button onClick={() => setPreview(true)} className="btn-secondary w-full text-sm">
            {t.admin.preview}
          </button>
          <button
            onClick={save}
            disabled={saving || !dirty}
            className="btn-primary w-full text-sm"
          >
            {saving ? t.admin.saving : t.admin.save}
          </button>
        </div>

        <div className="mt-3 text-xs text-slate">
          {dirty && <span className="text-warning">{t.admin.unsaved}</span>}
          {!dirty && lastSaved && (
            <span className="text-success">
              {t.admin.saved} · {lastSaved.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </nav>

      <main className="flex-1 p-6">
        {error && (
          <div className="mb-4 rounded-lg border border-danger/20 bg-danger/5 p-3 text-sm">
            <span className="font-medium text-danger">
              {error === 'TOKEN_INVALID' ? t.errors.tokenInvalid : error === 'CONFLICT' ? t.errors.conflict : error}
            </span>
            <button onClick={clearError} className="ml-2 text-xs underline">✕</button>
          </div>
        )}

        {dirty && (
          <div className="mb-4 flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3">
            <span className="text-sm text-warning font-medium">Modifications non enregistrées</span>
            <button
              onClick={save}
              disabled={saving}
              className="btn-primary ml-auto text-sm"
            >
              {saving ? 'Publication…' : 'Publier'}
            </button>
          </div>
        )}

        {!dirty && lastSaved && (
          <div className="mb-4 flex items-center gap-3 rounded-lg border border-success/20 bg-success/5 px-4 py-3">
            <span className="text-sm text-success font-medium">
              Enregistré · {lastSaved.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}


        {tab === 'revenue' && <RevenueEditor />}
        {tab === 'po' && <PoEditor />}
        {tab === 'headcount' && <HeadcountEditor />}
        {tab === 'messages' && <MessagesEditor />}
        {tab === 'planning' && <PlanningEditor />}
        {tab === 'import' && <ExcelImport />}
        {tab === 'settings' && <SettingsEditor />}
        {tab === 'publish' && <PublishPanel />}
      </main>
    </div>
  )
}
