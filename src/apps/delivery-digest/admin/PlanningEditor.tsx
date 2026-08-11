import { t } from '@digest/i18n'
import { useDigest } from '@digest/lib/context'
import { generateId } from '@digest/lib/utils'
import type { PlanningRow, Bar, Milestone } from '@digest/lib/schema'

export function PlanningEditor() {
  const { digest, updateDigest } = useDigest()
  const { planning } = digest

  const updatePlanning = (field: string, value: string) => {
    updateDigest(d => ({ ...d, planning: { ...d.planning, [field]: value } }))
  }

  const addRow = () => {
    const row: PlanningRow = {
      id: generateId('row'),
      label: '',
      type: 'row',
      indent: 0,
      bars: [],
      milestones: [],
      hidden: false,
    }
    updateDigest(d => ({ ...d, planning: { ...d.planning, rows: [...d.planning.rows, row] } }))
  }

  const updateRow = (id: string, field: keyof PlanningRow, value: any) => {
    updateDigest(d => ({
      ...d,
      planning: {
        ...d.planning,
        rows: d.planning.rows.map(r => r.id === id ? { ...r, [field]: value } : r),
      },
    }))
  }

  const deleteRow = (id: string) => {
    if (!confirm(t.admin.confirmDelete)) return
    updateDigest(d => ({
      ...d,
      planning: { ...d.planning, rows: d.planning.rows.filter(r => r.id !== id) },
    }))
  }

  const addBar = (rowId: string) => {
    const bar: Bar = {
      id: generateId('bar'),
      label: '',
      start: planning.startMonth,
      end: planning.startMonth,
      color: digest.settings.palette[0] || '#2F6F6B',
      style: 'solid',
    }
    updateDigest(d => ({
      ...d,
      planning: {
        ...d.planning,
        rows: d.planning.rows.map(r =>
          r.id === rowId ? { ...r, bars: [...r.bars, bar] } : r
        ),
      },
    }))
  }

  const updateBar = (rowId: string, barId: string, field: keyof Bar, value: any) => {
    updateDigest(d => ({
      ...d,
      planning: {
        ...d.planning,
        rows: d.planning.rows.map(r =>
          r.id === rowId
            ? { ...r, bars: r.bars.map(b => b.id === barId ? { ...b, [field]: value } : b) }
            : r
        ),
      },
    }))
  }

  const deleteBar = (rowId: string, barId: string) => {
    updateDigest(d => ({
      ...d,
      planning: {
        ...d.planning,
        rows: d.planning.rows.map(r =>
          r.id === rowId ? { ...r, bars: r.bars.filter(b => b.id !== barId) } : r
        ),
      },
    }))
  }

  const addMilestone = (rowId: string) => {
    const ms: Milestone = {
      id: generateId('ms'),
      month: planning.startMonth,
      label: '',
      color: '#B4472F',
    }
    updateDigest(d => ({
      ...d,
      planning: {
        ...d.planning,
        rows: d.planning.rows.map(r =>
          r.id === rowId ? { ...r, milestones: [...r.milestones, ms] } : r
        ),
      },
    }))
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">{t.admin.nav.planning}</h2>
        <button onClick={addRow} className="btn-primary text-sm">
          + {t.admin.addRow}
        </button>
      </div>

      <div className="mb-4 flex gap-4">
        <label className="text-sm">
          <span className="text-slate">Début</span>
          <input
            type="month"
            className="input-field ml-2"
            value={planning.startMonth}
            onChange={e => updatePlanning('startMonth', e.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className="text-slate">Fin</span>
          <input
            type="month"
            className="input-field ml-2"
            value={planning.endMonth}
            onChange={e => updatePlanning('endMonth', e.target.value)}
          />
        </label>
      </div>

      <div className="space-y-3">
        {planning.rows.map(row => (
          <div key={row.id} className="rounded-lg border border-slate/10 p-3">
            <div className="mb-2 flex items-center gap-2">
              <input
                className="input-field flex-1"
                value={row.label}
                onChange={e => updateRow(row.id, 'label', e.target.value)}
                placeholder="Nom de la ligne"
              />
              <select
                className="input-field w-24"
                value={row.type}
                onChange={e => updateRow(row.id, 'type', e.target.value)}
              >
                <option value="row">Ligne</option>
                <option value="section">Section</option>
              </select>
              <input
                type="number"
                className="input-field w-16"
                value={row.indent}
                onChange={e => updateRow(row.id, 'indent', parseInt(e.target.value) || 0)}
                min="0"
                max="2"
                title="Indentation"
              />
              <button onClick={() => addBar(row.id)} className="btn-secondary text-xs">
                + Barre
              </button>
              <button onClick={() => addMilestone(row.id)} className="btn-secondary text-xs">
                + Jalon
              </button>
              <button onClick={() => deleteRow(row.id)} className="text-xs text-danger">✕</button>
            </div>

            {row.bars.length > 0 && (
              <div className="ml-4 space-y-1">
                {row.bars.map(bar => (
                  <div key={bar.id} className="flex items-center gap-2 text-xs">
                    <input
                      className="input-field w-28"
                      value={bar.label}
                      onChange={e => updateBar(row.id, bar.id, 'label', e.target.value)}
                      placeholder="Label"
                    />
                    <input
                      type="month"
                      className="input-field w-32"
                      value={bar.start}
                      onChange={e => updateBar(row.id, bar.id, 'start', e.target.value)}
                    />
                    <input
                      type="month"
                      className="input-field w-32"
                      value={bar.end}
                      onChange={e => updateBar(row.id, bar.id, 'end', e.target.value)}
                    />
                    <input
                      type="color"
                      className="h-6 w-8 cursor-pointer rounded border-0"
                      value={bar.color}
                      onChange={e => updateBar(row.id, bar.id, 'color', e.target.value)}
                    />
                    <select
                      className="input-field w-20"
                      value={bar.style}
                      onChange={e => updateBar(row.id, bar.id, 'style', e.target.value)}
                    >
                      <option value="solid">Plein</option>
                      <option value="hatched">Hachuré</option>
                    </select>
                    <button onClick={() => deleteBar(row.id, bar.id)} className="text-danger">✕</button>
                  </div>
                ))}
              </div>
            )}

            {row.milestones.length > 0 && (
              <div className="ml-4 mt-1 space-y-1">
                {row.milestones.map(ms => (
                  <div key={ms.id} className="flex items-center gap-2 text-xs">
                    <span className="text-slate">◆</span>
                    <input
                      className="input-field w-28"
                      value={ms.label}
                      onChange={e => {
                        updateDigest(d => ({
                          ...d,
                          planning: {
                            ...d.planning,
                            rows: d.planning.rows.map(r =>
                              r.id === row.id
                                ? { ...r, milestones: r.milestones.map(m => m.id === ms.id ? { ...m, label: e.target.value } : m) }
                                : r
                            ),
                          },
                        }))
                      }}
                      placeholder="Label"
                    />
                    <input
                      type="month"
                      className="input-field w-32"
                      value={ms.month}
                      onChange={e => {
                        updateDigest(d => ({
                          ...d,
                          planning: {
                            ...d.planning,
                            rows: d.planning.rows.map(r =>
                              r.id === row.id
                                ? { ...r, milestones: r.milestones.map(m => m.id === ms.id ? { ...m, month: e.target.value } : m) }
                                : r
                            ),
                          },
                        }))
                      }}
                    />
                    <input
                      type="color"
                      className="h-6 w-8 cursor-pointer rounded border-0"
                      value={ms.color}
                      onChange={e => {
                        updateDigest(d => ({
                          ...d,
                          planning: {
                            ...d.planning,
                            rows: d.planning.rows.map(r =>
                              r.id === row.id
                                ? { ...r, milestones: r.milestones.map(m => m.id === ms.id ? { ...m, color: e.target.value } : m) }
                                : r
                            ),
                          },
                        }))
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
