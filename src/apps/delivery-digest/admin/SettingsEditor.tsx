import { useState } from 'react'
import { t } from '@digest/i18n'
import { useDigest } from '@digest/lib/context'
import { saveGitHubConfig, clearGitHubConfig, loadGitHubConfig } from '@digest/lib/storage'

export function SettingsEditor() {
  const { digest, updateDigest } = useDigest()
  const existingConfig = loadGitHubConfig()

  const [token, setToken] = useState(existingConfig?.token || '')
  const [owner, setOwner] = useState(existingConfig?.owner || 'ImadEddine7')
  const [repo, setRepo] = useState(existingConfig?.repo || 'delivery-digest')
  const [branch, setBranch] = useState(existingConfig?.branch || 'main')
  const [persist, setPersist] = useState(false)

  const saveConfig = () => {
    if (token && owner && repo) {
      saveGitHubConfig({ token, owner, repo, branch }, persist)
      window.location.reload()
    }
  }

  const disconnect = () => {
    clearGitHubConfig()
    window.location.reload()
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-4 text-lg font-bold">{t.settings.github}</h2>
        <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm text-slate mb-4">
          {t.settings.tokenWarning}
        </div>
        <div className="space-y-3 max-w-md">
          <div>
            <label className="block text-sm font-medium text-slate">{t.settings.token}</label>
            <input
              type="password"
              className="input-field mt-1 w-full"
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="github_pat_..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate">{t.settings.owner}</label>
            <input
              className="input-field mt-1 w-full"
              value={owner}
              onChange={e => setOwner(e.target.value)}
              placeholder="MonOrg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate">{t.settings.repo}</label>
            <input
              className="input-field mt-1 w-full"
              value={repo}
              onChange={e => setRepo(e.target.value)}
              placeholder="delivery-digest"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate">{t.settings.branch}</label>
            <input
              className="input-field mt-1 w-full"
              value={branch}
              onChange={e => setBranch(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={persist}
              onChange={e => setPersist(e.target.checked)}
              className="h-4 w-4 rounded border-slate/20"
            />
            {t.settings.keepSignedIn}
          </label>
          <div className="flex gap-2">
            <button onClick={saveConfig} className="btn-primary">Connecter</button>
            {existingConfig && (
              <button onClick={disconnect} className="btn-secondary">Déconnecter</button>
            )}
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-bold">{t.settings.thresholds}</h2>
        <div className="flex gap-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-slate">{t.settings.warning}</label>
            <input
              type="number"
              className="input-field mt-1 w-24"
              value={digest.settings.coverageThresholds.warning}
              onChange={e => updateDigest(d => ({
                ...d,
                settings: {
                  ...d.settings,
                  coverageThresholds: { ...d.settings.coverageThresholds, warning: parseInt(e.target.value) || 80 },
                },
              }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate">{t.settings.healthy}</label>
            <input
              type="number"
              className="input-field mt-1 w-24"
              value={digest.settings.coverageThresholds.healthy}
              onChange={e => updateDigest(d => ({
                ...d,
                settings: {
                  ...d.settings,
                  coverageThresholds: { ...d.settings.coverageThresholds, healthy: parseInt(e.target.value) || 95 },
                },
              }))}
            />
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-bold">{t.settings.unit}</h2>
        <select
          className="input-field"
          value={digest.meta.unit}
          onChange={e => updateDigest(d => ({
            ...d,
            meta: { ...d.meta, unit: e.target.value as 'k' | 'M' | 'unit' },
          }))}
        >
          <option value="k">k€</option>
          <option value="M">M€</option>
          <option value="unit">€</option>
        </select>
      </div>
    </div>
  )
}
