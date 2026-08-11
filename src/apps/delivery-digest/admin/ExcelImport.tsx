import { useState, useCallback } from 'react'
import { t } from '@digest/i18n'
import { useDigest } from '@digest/lib/context'
import { generateId } from '@digest/lib/utils'
import type { Project, PurchaseOrder } from '@digest/lib/schema'
import * as XLSX from 'xlsx'

const COLUMN_ALIASES: Record<string, string[]> = {
  name: ['projet', 'project', 'programme', 'program', 'nom du projet', 'name'],
  program: ['programme', 'program', 'group'],
  revenue: ['ca', "chiffre d'affaires", 'revenue', 'montant', 'ca (k€)', 'ca (keur)'],
  offshore: ['offshore', '% offshore', 'ratio offshore', 'offshore %'],
  poRequested: ['po demandé', 'po demande', 'po requested', 'po demandée', 'po demandee'],
  delivered: ['délivré', 'delivre', 'montant délivré', 'delivered', 'réalisé', 'realise'],
  poReceived: ['po reçu', 'po recu', 'po received', 'po signé', 'po signe'],
}

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

function autoMap(headers: string[]): Record<string, number> {
  const mapping: Record<string, number> = {}
  headers.forEach((h, i) => {
    const norm = normalize(h)
    for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
      if (aliases.some(a => normalize(a) === norm)) {
        mapping[field] = i
        break
      }
    }
  })
  return mapping
}

function parseNumber(val: any): number | null {
  if (typeof val === 'number') return val
  if (typeof val !== 'string') return null
  const cleaned = val.replace(/[€%\s]/g, '').replace(/,/g, '.')
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

export function ExcelImport() {
  const { digest, updateDigest } = useDigest()
  const [sheets, setSheets] = useState<{ name: string; data: any[][] }[]>([])
  const [selectedSheet, setSelectedSheet] = useState(0)
  const [headers, setHeaders] = useState<string[]>([])
  const [mapping, setMapping] = useState<Record<string, number>>({})
  const [preview, setPreview] = useState<any[][]>([])
  const [step, setStep] = useState<'drop' | 'map' | 'preview'>('drop')
  const [target, setTarget] = useState<'revenue' | 'po'>('revenue')

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const data = new Uint8Array(e.target!.result as ArrayBuffer)
      const wb = XLSX.read(data, { type: 'array' })
      const parsed = wb.SheetNames.map(name => ({
        name,
        data: XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1 }) as any[][],
      }))
      setSheets(parsed)
      if (parsed.length > 0) {
        selectSheet(parsed, 0)
      }
    }
    reader.readAsArrayBuffer(file)
  }, [])

  const selectSheet = (allSheets: typeof sheets, idx: number) => {
    setSelectedSheet(idx)
    const sheetData = allSheets[idx].data
    if (sheetData.length > 0) {
      const h = sheetData[0].map(String)
      setHeaders(h)
      setMapping(autoMap(h))
      setPreview(sheetData.slice(1, 11))
      setStep('map')
    }
  }

  const applyImport = () => {
    const sheetData = sheets[selectedSheet].data.slice(1)
    if (target === 'revenue') {
      const projects: Project[] = sheetData
        .filter(row => row.length > 0 && row.some(c => c != null && c !== ''))
        .map(row => {
          const name = mapping.name !== undefined ? String(row[mapping.name] || '') : ''
          const revenue = mapping.revenue !== undefined ? parseNumber(row[mapping.revenue]) || 0 : 0
          const offshore = mapping.offshore !== undefined ? parseNumber(row[mapping.offshore]) || 50 : 50
          const program = mapping.program !== undefined ? String(row[mapping.program] || '') : ''
          return {
            id: generateId('prj'),
            name,
            program: program || undefined,
            active: true,
            revenue: offshore <= 1 ? revenue : revenue,
            offshorePct: offshore <= 1 ? offshore * 100 : offshore,
            comment: '',
          }
        })
        .filter(p => p.name)
      updateDigest(d => ({ ...d, projects }))
    } else {
      const pos: PurchaseOrder[] = sheetData
        .filter(row => row.length > 0 && row.some(c => c != null && c !== ''))
        .map(row => {
          const projectName = mapping.name !== undefined ? String(row[mapping.name] || '') : ''
          const project = digest.projects.find(p => p.name === projectName)
          return {
            projectId: project?.id || '',
            label: projectName,
            poRequested: mapping.poRequested !== undefined ? parseNumber(row[mapping.poRequested]) || 0 : 0,
            delivered: mapping.delivered !== undefined ? parseNumber(row[mapping.delivered]) || 0 : 0,
            poReceived: mapping.poReceived !== undefined ? parseNumber(row[mapping.poReceived]) || 0 : 0,
          }
        })
        .filter(po => po.label || po.projectId)
      updateDigest(d => ({ ...d, purchaseOrders: pos }))
    }
    setStep('drop')
    setSheets([])
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold">{t.import.title}</h2>

      {step === 'drop' && (
        <div
          className="flex h-48 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-slate/20 bg-mist/50 transition-colors hover:border-accent"
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => {
            const input = document.createElement('input')
            input.type = 'file'
            input.accept = '.xlsx,.xls'
            input.onchange = (e: any) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
            }
            input.click()
          }}
        >
          <p className="text-sm text-slate">{t.import.dropzone}</p>
        </div>
      )}

      {step === 'map' && (
        <div className="space-y-4">
          <div className="flex gap-4">
            <div>
              <label className="text-sm font-medium text-slate">{t.import.selectSheet}</label>
              <select
                className="input-field ml-2"
                value={selectedSheet}
                onChange={e => selectSheet(sheets, parseInt(e.target.value))}
              >
                {sheets.map((s, i) => (
                  <option key={i} value={i}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate">Cible</label>
              <select
                className="input-field ml-2"
                value={target}
                onChange={e => setTarget(e.target.value as 'revenue' | 'po')}
              >
                <option value="revenue">CA & Projets</option>
                <option value="po">Purchase Orders</option>
              </select>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-medium">{t.import.mapColumns}</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.keys(COLUMN_ALIASES).map(field => (
                <div key={field} className="flex items-center gap-2">
                  <span className="w-24 text-slate">{field}</span>
                  <select
                    className="input-field flex-1"
                    value={mapping[field] ?? -1}
                    onChange={e => setMapping(m => ({ ...m, [field]: parseInt(e.target.value) }))}
                  >
                    <option value={-1}>— Non mappé —</option>
                    {headers.map((h, i) => (
                      <option key={i} value={i}>{h}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {preview.length > 0 && (
            <div className="overflow-x-auto">
              <h3 className="mb-2 text-sm font-medium">{t.import.preview}</h3>
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    {headers.map((h, i) => (
                      <th key={i} className="border-b p-1 text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i}>
                      {headers.map((_, j) => (
                        <td key={j} className="border-b p-1">{row[j] ?? ''}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={applyImport} className="btn-primary">{t.import.apply}</button>
            <button onClick={() => { setStep('drop'); setSheets([]) }} className="btn-secondary">
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
