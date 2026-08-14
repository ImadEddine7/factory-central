import { t } from '@digest/i18n'
import { useDigest } from '@digest/lib/context'

export function SettingsEditor() {
  const { digest, updateDigest } = useDigest()

  return (
    <div className="space-y-8">
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
