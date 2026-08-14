import { t } from '@digest/i18n'
import { useDigest } from '@digest/lib/context'
import { totalRevenue } from '@digest/lib/compute/totals'
import { formatAmount, generateId } from '@digest/lib/utils'
import type { Project, PurchaseOrder } from '@digest/lib/schema'

export function RevenueEditor() {
  const { digest, updateDigest } = useDigest()
  const projects = digest.projects
  const total = totalRevenue(projects)

  const addProject = () => {
    const projectId = generateId('prj')
    const newProject: Project = {
      id: projectId,
      name: '',
      active: true,
      revenue: 0,
    }
    const newPo: PurchaseOrder = {
      projectId,
      label: '',
      poRequested: 0,
      delivered: 0,
      poReceived: 0,
    }
    updateDigest(d => ({
      ...d,
      projects: [...d.projects, newProject],
      purchaseOrders: [...d.purchaseOrders, newPo],
    }))
  }

  const updateProject = (id: string, field: keyof Project, value: any) => {
    updateDigest(d => ({
      ...d,
      projects: d.projects.map(p => p.id === id ? { ...p, [field]: value } : p),
    }))
  }

  const deleteProject = (id: string) => {
    if (!confirm(t.admin.confirmDelete)) return
    updateDigest(d => ({
      ...d,
      projects: d.projects.filter(p => p.id !== id),
      purchaseOrders: d.purchaseOrders.filter(po => po.projectId !== id),
    }))
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">{t.admin.nav.revenue}</h2>
          <p className="text-sm text-slate">Total : <strong>{formatAmount(total, digest.meta.unit)}</strong></p>
        </div>
        <button onClick={addProject} className="btn-primary text-sm">
          + {t.admin.addRow}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate/10">
              <th className="pb-2 text-left text-xs font-medium text-slate">Projet</th>
              <th className="pb-2 text-left text-xs font-medium text-slate">Programme</th>
              <th className="pb-2 text-right text-xs font-medium text-slate">Montant ({digest.meta.unit}€)</th>
              <th className="pb-2 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {projects.map(p => (
              <tr key={p.id} className="border-b border-slate/5">
                <td className="py-1.5 pr-2">
                  <input
                    className="input-field w-full"
                    value={p.name}
                    onChange={e => updateProject(p.id, 'name', e.target.value)}
                    placeholder="Nom du projet"
                  />
                </td>
                <td className="py-1.5 pr-2">
                  <input
                    className="input-field w-full"
                    value={p.program || ''}
                    onChange={e => updateProject(p.id, 'program', e.target.value)}
                    placeholder="Programme"
                  />
                </td>
                <td className="py-1.5 pr-2 text-right">
                  <input
                    type="number"
                    className="input-field w-28 text-right font-mono"
                    value={p.revenue}
                    onChange={e => updateProject(p.id, 'revenue', parseFloat(e.target.value) || 0)}
                    step="0.1"
                  />
                </td>
                <td className="py-1.5 text-center">
                  <button
                    onClick={() => deleteProject(p.id)}
                    className="text-xs text-danger hover:underline"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
