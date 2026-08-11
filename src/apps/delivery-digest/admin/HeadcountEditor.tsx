import { useState } from 'react'
import { useDigest } from '@digest/lib/context'
import { monthLabel } from '@digest/lib/utils'
import type { HeadcountEntry } from '@digest/lib/schema'

export function HeadcountEditor() {
  const { digest, updateDigest } = useDigest()
  const data = [...digest.headcount].sort((a, b) => a.month.localeCompare(b.month))
  const [monthToAdd, setMonthToAdd] = useState('')

  const addMonth = () => {
    if (!monthToAdd) return
    const exists = digest.headcount.some(h => h.month === monthToAdd)
    if (exists) return
    const entry: HeadcountEntry = { month: monthToAdd, offshore: 0, onshore: 0 }
    updateDigest(d => ({ ...d, headcount: [...d.headcount, entry] }))
    setMonthToAdd('')
  }

  const updateEntry = (month: string, field: 'offshore' | 'onshore', value: number) => {
    updateDigest(d => ({
      ...d,
      headcount: d.headcount.map(h => h.month === month ? { ...h, [field]: value } : h),
    }))
  }

  const deleteEntry = (month: string) => {
    updateDigest(d => ({
      ...d,
      headcount: d.headcount.filter(h => h.month !== month),
    }))
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Effectifs (headcount)</h2>
        <div className="flex items-center gap-2">
          <input
            type="month"
            className="input-field text-sm"
            value={monthToAdd}
            onChange={e => setMonthToAdd(e.target.value)}
          />
          <button onClick={addMonth} className="btn-primary text-sm" disabled={!monthToAdd}>
            + Ajouter
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate/10">
              <th className="pb-2 text-left text-xs font-medium text-slate">Mois</th>
              <th className="pb-2 text-left text-xs font-medium text-slate">Offshore</th>
              <th className="pb-2 text-left text-xs font-medium text-slate">Onshore</th>
              <th className="pb-2 text-left text-xs font-medium text-slate">Total</th>
              <th className="pb-2 text-left text-xs font-medium text-slate">% Offshore</th>
              <th className="w-10 pb-2"></th>
            </tr>
          </thead>
          <tbody>
            {data.map(entry => {
              const total = entry.offshore + entry.onshore
              const ratio = total > 0 ? ((entry.offshore / total) * 100).toFixed(1) : '—'
              return (
                <tr key={entry.month} className="border-b border-slate/5">
                  <td className="py-1.5 pr-4 text-sm text-slate">{monthLabel(entry.month)}</td>
                  <td className="py-1.5 pr-4">
                    <input
                      type="number"
                      className="input-field w-20 font-mono"
                      value={entry.offshore}
                      onChange={e => updateEntry(entry.month, 'offshore', parseInt(e.target.value) || 0)}
                      min="0"
                    />
                  </td>
                  <td className="py-1.5 pr-4">
                    <input
                      type="number"
                      className="input-field w-20 font-mono"
                      value={entry.onshore}
                      onChange={e => updateEntry(entry.month, 'onshore', parseInt(e.target.value) || 0)}
                      min="0"
                    />
                  </td>
                  <td className="py-1.5 pr-4 font-mono font-bold">{total}</td>
                  <td className="py-1.5 pr-4 font-mono text-sm">{ratio}{ratio !== '—' && '%'}</td>
                  <td className="py-1.5 text-center">
                    <button
                      onClick={() => deleteEntry(entry.month)}
                      className="text-xs text-danger hover:underline"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {data.length === 0 && (
        <p className="mt-4 text-sm text-slate/60">Aucune donnée. Ajoutez des mois pour commencer.</p>
      )}
    </div>
  )
}
