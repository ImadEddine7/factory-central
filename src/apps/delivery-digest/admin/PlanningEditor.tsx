import { useState, useRef, useEffect, useCallback } from 'react'
import { useDigest } from '@digest/lib/context'
import { getMonthsBetween, shortMonth, generateId } from '@digest/lib/utils'
import type { PlanningRow, Bar, Milestone } from '@digest/lib/schema'

const DEFAULT_COLORS = ['#2F6F6B', '#4A90D9', '#B4472F', '#E6A023', '#6B5B95', '#88B04B', '#F7786B', '#34495E']

export function PlanningEditor() {
  const { digest, updateDigest } = useDigest()
  const { planning } = digest
  const months = getMonthsBetween(planning.startMonth || '2026-01', planning.endMonth || '2026-12')
  const totalMonths = months.length

  const updatePlanning = (field: string, value: string) => {
    updateDigest(d => ({ ...d, planning: { ...d.planning, [field]: value } }))
  }

  const addRow = () => {
    const row: PlanningRow = {
      id: generateId('row'),
      label: 'Nouvelle ligne',
      type: 'row',
      indent: 0,
      bars: [],
      milestones: [],
      hidden: false,
    }
    updateDigest(d => ({ ...d, planning: { ...d.planning, rows: [...d.planning.rows, row] } }))
  }

  const deleteRow = (rowId: string) => {
    updateDigest(d => ({
      ...d,
      planning: { ...d.planning, rows: d.planning.rows.filter(r => r.id !== rowId) },
    }))
  }

  const updateRowLabel = (rowId: string, label: string) => {
    updateDigest(d => ({
      ...d,
      planning: {
        ...d.planning,
        rows: d.planning.rows.map(r => r.id === rowId ? { ...r, label } : r),
      },
    }))
  }

  const addBar = (rowId: string) => {
    const centerIdx = Math.floor(totalMonths / 2)
    const bar: Bar = {
      id: generateId('bar'),
      label: '',
      start: months[Math.max(0, centerIdx - 1)] || planning.startMonth,
      end: months[Math.min(totalMonths - 1, centerIdx)] || planning.endMonth,
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

  const addMilestone = (rowId: string) => {
    const centerIdx = Math.floor(totalMonths / 2)
    const ms: Milestone = {
      id: generateId('ms'),
      month: months[centerIdx] || planning.startMonth,
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
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-bold">Planning</h2>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate">Début</span>
          <input
            type="month"
            className="input-field"
            value={planning.startMonth}
            onChange={e => updatePlanning('startMonth', e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate">Fin</span>
          <input
            type="month"
            className="input-field"
            value={planning.endMonth}
            onChange={e => updatePlanning('endMonth', e.target.value)}
          />
        </div>
        <button onClick={addRow} className="btn-primary text-sm">+ Ligne</button>
      </div>

      {totalMonths > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate/10">
          {/* Month header */}
          <div className="flex border-b border-slate/10 bg-mist/50">
            <div className="w-40 flex-shrink-0 border-r border-slate/10 px-3 py-2 text-xs font-medium text-slate">
              Activité
            </div>
            <div className="flex flex-1">
              {months.map((m, i) => (
                <div
                  key={m}
                  className="flex-1 border-r border-slate/5 px-1 py-2 text-center text-[11px] font-medium text-slate"
                  style={{ minWidth: 36 }}
                >
                  {shortMonth(m)}
                  {m.endsWith('-01') && <div className="text-[9px] text-slate/50">{m.split('-')[0]}</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Rows */}
          {planning.rows.map(row => (
            <GanttRow
              key={row.id}
              row={row}
              months={months}
              totalMonths={totalMonths}
              palette={digest.settings.palette}
              onUpdateLabel={label => updateRowLabel(row.id, label)}
              onAddBar={() => addBar(row.id)}
              onAddMilestone={() => addMilestone(row.id)}
              onDelete={() => deleteRow(row.id)}
              onUpdateBar={(barId, field, value) => {
                updateDigest(d => ({
                  ...d,
                  planning: {
                    ...d.planning,
                    rows: d.planning.rows.map(r =>
                      r.id === row.id
                        ? { ...r, bars: r.bars.map(b => b.id === barId ? { ...b, [field]: value } : b) }
                        : r
                    ),
                  },
                }))
              }}
              onDeleteBar={barId => {
                updateDigest(d => ({
                  ...d,
                  planning: {
                    ...d.planning,
                    rows: d.planning.rows.map(r =>
                      r.id === row.id ? { ...r, bars: r.bars.filter(b => b.id !== barId) } : r
                    ),
                  },
                }))
              }}
              onUpdateMilestone={(msId, field, value) => {
                updateDigest(d => ({
                  ...d,
                  planning: {
                    ...d.planning,
                    rows: d.planning.rows.map(r =>
                      r.id === row.id
                        ? { ...r, milestones: r.milestones.map(ms => ms.id === msId ? { ...ms, [field]: value } : ms) }
                        : r
                    ),
                  },
                }))
              }}
              onDeleteMilestone={msId => {
                updateDigest(d => ({
                  ...d,
                  planning: {
                    ...d.planning,
                    rows: d.planning.rows.map(r =>
                      r.id === row.id ? { ...r, milestones: r.milestones.filter(ms => ms.id !== msId) } : r
                    ),
                  },
                }))
              }}
            />
          ))}

          {planning.rows.length === 0 && (
            <div className="py-12 text-center text-sm text-slate/50">
              Cliquez sur "+ Ligne" pour commencer
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Gantt Row ───────────────────────────────────────────────────────────────

interface GanttRowProps {
  row: PlanningRow
  months: string[]
  totalMonths: number
  palette: string[]
  onUpdateLabel: (label: string) => void
  onAddBar: () => void
  onAddMilestone: () => void
  onDelete: () => void
  onUpdateBar: (barId: string, field: string, value: any) => void
  onDeleteBar: (barId: string) => void
  onUpdateMilestone: (msId: string, field: string, value: any) => void
  onDeleteMilestone: (msId: string) => void
}

function GanttRow({ row, months, totalMonths, palette, onUpdateLabel, onAddBar, onAddMilestone, onDelete, onUpdateBar, onDeleteBar, onUpdateMilestone, onDeleteMilestone }: GanttRowProps) {
  const [hovered, setHovered] = useState(false)
  const [editingLabel, setEditingLabel] = useState(false)
  const timelineRef = useRef<HTMLDivElement>(null)

  return (
    <div
      className="group flex border-b border-slate/5 last:border-b-0"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Label column */}
      <div className="relative flex w-40 flex-shrink-0 items-center border-r border-slate/10 px-2 py-3">
        {editingLabel ? (
          <input
            autoFocus
            className="input-field w-full text-xs"
            value={row.label}
            onChange={e => onUpdateLabel(e.target.value)}
            onBlur={() => setEditingLabel(false)}
            onKeyDown={e => e.key === 'Enter' && setEditingLabel(false)}
          />
        ) : (
          <span
            className="cursor-text truncate text-xs font-medium text-ink"
            onClick={() => setEditingLabel(true)}
            style={{ paddingLeft: row.indent * 12 }}
          >
            {row.label || <span className="italic text-slate/40">Sans titre</span>}
          </span>
        )}
        {hovered && (
          <button
            onClick={onDelete}
            className="absolute right-1 top-1 rounded p-0.5 text-slate/40 hover:text-danger"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Timeline column */}
      <div ref={timelineRef} className="relative flex-1" style={{ minHeight: 40 }}>
        {/* Grid lines */}
        <div className="pointer-events-none absolute inset-0 flex">
          {months.map(m => (
            <div key={m} className="flex-1 border-r border-slate/5" style={{ minWidth: 36 }} />
          ))}
        </div>

        {/* Bars */}
        {row.bars.map(bar => (
          <BarElement
            key={bar.id}
            bar={bar}
            months={months}
            totalMonths={totalMonths}
            palette={palette}
            timelineRef={timelineRef}
            onUpdate={(field, value) => onUpdateBar(bar.id, field, value)}
            onDelete={() => onDeleteBar(bar.id)}
          />
        ))}

        {/* Milestones */}
        {row.milestones.map(ms => (
          <MilestoneElement
            key={ms.id}
            milestone={ms}
            months={months}
            totalMonths={totalMonths}
            timelineRef={timelineRef}
            onUpdate={(field, value) => onUpdateMilestone(ms.id, field, value)}
            onDelete={() => onDeleteMilestone(ms.id)}
          />
        ))}

        {/* Row action buttons */}
        {hovered && (
          <div className="absolute right-1 top-1 flex gap-1">
            <button onClick={onAddBar} className="rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-slate shadow-sm ring-1 ring-slate/10 hover:text-ink">
              + barre
            </button>
            <button onClick={onAddMilestone} className="rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-slate shadow-sm ring-1 ring-slate/10 hover:text-ink">
              + ◆
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Bar Element ─────────────────────────────────────────────────────────────

interface BarElementProps {
  bar: Bar
  months: string[]
  totalMonths: number
  palette: string[]
  timelineRef: React.RefObject<HTMLDivElement | null>
  onUpdate: (field: string, value: any) => void
  onDelete: () => void
}

function BarElement({ bar, months, totalMonths, palette, timelineRef, onUpdate, onDelete }: BarElementProps) {
  const [dragging, setDragging] = useState<'move' | 'left' | 'right' | null>(null)
  const [editingLabel, setEditingLabel] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [dragOffset, setDragOffset] = useState({ startIdx: 0, endIdx: 0 })
  const dragStart = useRef({ x: 0, startIdx: 0, endIdx: 0 })

  const startIdx = months.indexOf(bar.start)
  const endIdx = months.indexOf(bar.end)
  const visibleStart = Math.max(0, startIdx)
  const visibleEnd = Math.min(totalMonths - 1, endIdx)

  const displayStart = dragging ? dragOffset.startIdx : visibleStart
  const displayEnd = dragging ? dragOffset.endIdx : visibleEnd

  const left = `${(displayStart / totalMonths) * 100}%`
  const width = `${((displayEnd - displayStart + 1) / totalMonths) * 100}%`

  const getColWidth = () => {
    if (!timelineRef.current) return 36
    return timelineRef.current.offsetWidth / totalMonths
  }

  const handleMouseDown = (e: React.MouseEvent, type: 'move' | 'left' | 'right') => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(type)
    dragStart.current = { x: e.clientX, startIdx: visibleStart, endIdx: visibleEnd }
    setDragOffset({ startIdx: visibleStart, endIdx: visibleEnd })
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging) return
    const colWidth = getColWidth()
    const dx = e.clientX - dragStart.current.x
    const monthDelta = Math.round(dx / colWidth)

    let newStart = dragStart.current.startIdx
    let newEnd = dragStart.current.endIdx

    if (dragging === 'move') {
      newStart += monthDelta
      newEnd += monthDelta
    } else if (dragging === 'left') {
      newStart += monthDelta
      if (newStart > newEnd) newStart = newEnd
    } else if (dragging === 'right') {
      newEnd += monthDelta
      if (newEnd < newStart) newEnd = newStart
    }

    newStart = Math.max(0, Math.min(totalMonths - 1, newStart))
    newEnd = Math.max(0, Math.min(totalMonths - 1, newEnd))

    setDragOffset({ startIdx: newStart, endIdx: newEnd })
  }, [dragging, totalMonths])

  const handleMouseUp = useCallback(() => {
    if (!dragging) return
    onUpdate('start', months[dragOffset.startIdx])
    onUpdate('end', months[dragOffset.endIdx])
    setDragging(null)
  }, [dragging, dragOffset, months, onUpdate])

  useEffect(() => {
    if (dragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [dragging, handleMouseMove, handleMouseUp])

  if (startIdx === -1 && endIdx === -1) return null

  const hatched = bar.style === 'hatched'

  return (
    <>
      <div
        className="absolute top-2 flex items-center rounded"
        style={{
          left,
          width,
          height: 24,
          backgroundColor: hatched ? 'transparent' : bar.color,
          backgroundImage: hatched
            ? `repeating-linear-gradient(45deg, ${bar.color} 0px, ${bar.color} 2px, transparent 2px, transparent 6px)`
            : undefined,
          cursor: dragging === 'move' ? 'grabbing' : 'grab',
          zIndex: dragging ? 20 : 10,
          userSelect: 'none',
        }}
        onMouseDown={e => handleMouseDown(e, 'move')}
        onDoubleClick={() => setEditingLabel(true)}
      >
        {/* Left resize handle */}
        <div
          className="absolute left-0 top-0 h-full w-2 cursor-col-resize rounded-l"
          onMouseDown={e => handleMouseDown(e, 'left')}
        />

        {/* Bar content */}
        <div className="flex flex-1 items-center justify-between overflow-hidden px-2">
          {editingLabel ? (
            <input
              autoFocus
              className="w-full bg-transparent text-[10px] font-medium text-white outline-none"
              value={bar.label}
              onChange={e => onUpdate('label', e.target.value)}
              onBlur={() => setEditingLabel(false)}
              onKeyDown={e => { if (e.key === 'Enter') setEditingLabel(false) }}
              onClick={e => e.stopPropagation()}
              onMouseDown={e => e.stopPropagation()}
            />
          ) : (
            <span className="truncate text-[10px] font-medium text-white">
              {bar.label}
            </span>
          )}

          {/* Color dot */}
          <div className="relative flex-shrink-0">
            <div
              className="h-3 w-3 cursor-pointer rounded-full border border-white/40"
              style={{ backgroundColor: bar.color }}
              onClick={e => { e.stopPropagation(); setShowColorPicker(!showColorPicker) }}
              onMouseDown={e => e.stopPropagation()}
            />
            {showColorPicker && (
              <ColorPicker
                color={bar.color}
                style={bar.style}
                palette={palette}
                onChange={color => onUpdate('color', color)}
                onStyleChange={style => onUpdate('style', style)}
                onClose={() => setShowColorPicker(false)}
              />
            )}
          </div>
        </div>

        {/* Right resize handle */}
        <div
          className="absolute right-0 top-0 h-full w-2 cursor-col-resize rounded-r"
          onMouseDown={e => handleMouseDown(e, 'right')}
        />

        {/* Delete button */}
        <button
          className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-danger text-[8px] text-white group-hover:flex"
          onClick={e => { e.stopPropagation(); onDelete() }}
          onMouseDown={e => e.stopPropagation()}
        >
          ✕
        </button>
      </div>
    </>
  )
}

// ─── Milestone Element ───────────────────────────────────────────────────────

interface MilestoneProps {
  milestone: Milestone
  months: string[]
  totalMonths: number
  timelineRef: React.RefObject<HTMLDivElement | null>
  onUpdate: (field: string, value: any) => void
  onDelete: () => void
}

function MilestoneElement({ milestone, months, totalMonths, timelineRef, onUpdate, onDelete }: MilestoneProps) {
  const [dragging, setDragging] = useState(false)
  const [dragIdx, setDragIdx] = useState(0)
  const dragStartRef = useRef({ x: 0, idx: 0 })
  const latestIdx = useRef(0)

  const idx = months.indexOf(milestone.month)
  if (idx === -1) return null

  const displayIdx = dragging ? dragIdx : idx
  const left = `${((displayIdx + 0.5) / totalMonths) * 100}%`

  const getColWidth = () => {
    if (!timelineRef.current) return 36
    return timelineRef.current.offsetWidth / totalMonths
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(true)
    dragStartRef.current = { x: e.clientX, idx }
    setDragIdx(idx)
    latestIdx.current = idx

    const onMove = (ev: MouseEvent) => {
      const colWidth = getColWidth()
      const dx = ev.clientX - dragStartRef.current.x
      const delta = Math.round(dx / colWidth)
      const newIdx = Math.max(0, Math.min(totalMonths - 1, dragStartRef.current.idx + delta))
      setDragIdx(newIdx)
      latestIdx.current = newIdx
    }

    const onUp = () => {
      setDragging(false)
      onUpdate('month', months[latestIdx.current] || months[idx])
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  return (
    <div
      className="absolute top-3 -translate-x-1/2 cursor-grab"
      style={{ left, zIndex: dragging ? 25 : 15 }}
      onMouseDown={handleMouseDown}
    >
      <div
        className="h-3 w-3 rotate-45 rounded-sm"
        style={{ backgroundColor: milestone.color }}
      />
      {milestone.label && (
        <span className="absolute left-4 top-0 whitespace-nowrap text-[9px] text-slate">
          {milestone.label}
        </span>
      )}
      <button
        className="absolute -right-3 -top-2 hidden h-3.5 w-3.5 items-center justify-center rounded-full bg-danger text-[7px] text-white group-hover:flex"
        onClick={e => { e.stopPropagation(); onDelete() }}
        onMouseDown={e => e.stopPropagation()}
      >
        ✕
      </button>
    </div>
  )
}

// ─── Color Picker ────────────────────────────────────────────────────────────

interface ColorPickerProps {
  color: string
  style: string
  palette: string[]
  onChange: (color: string) => void
  onStyleChange: (style: string) => void
  onClose: () => void
}

function ColorPicker({ color, style, palette, onChange, onStyleChange, onClose }: ColorPickerProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const allColors = [...new Set([...palette, ...DEFAULT_COLORS])]

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full z-50 mt-1 w-40 rounded-lg border border-slate/10 bg-white p-2 shadow-lg"
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
    >
      <div className="mb-2 grid grid-cols-5 gap-1.5">
        {allColors.map(c => (
          <button
            key={c}
            className="h-5 w-5 rounded-full ring-offset-1 transition-transform hover:scale-110"
            style={{
              backgroundColor: c,
              boxShadow: c === color ? `0 0 0 2px white, 0 0 0 3px ${c}` : undefined,
            }}
            onClick={() => onChange(c)}
          />
        ))}
      </div>
      <div className="mb-2 flex items-center gap-2">
        <input
          type="color"
          value={color}
          onChange={e => onChange(e.target.value)}
          className="h-6 w-6 cursor-pointer rounded border-0"
        />
        <span className="text-[10px] text-slate">Personnalisé</span>
      </div>
      <div className="flex gap-2 border-t border-slate/10 pt-2">
        <label className="flex items-center gap-1 text-[10px]">
          <input type="radio" name="style" checked={style === 'solid'} onChange={() => onStyleChange('solid')} className="h-3 w-3" />
          Plein
        </label>
        <label className="flex items-center gap-1 text-[10px]">
          <input type="radio" name="style" checked={style === 'hatched'} onChange={() => onStyleChange('hatched')} className="h-3 w-3" />
          Hachuré
        </label>
      </div>
    </div>
  )
}
