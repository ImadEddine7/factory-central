import { t } from '@digest/i18n'
import { getMonthsBetween, shortMonth, currentPeriod } from '@digest/lib/utils'
import type { Digest } from '@digest/lib/schema'

export function Planning({ digest }: { digest: Digest }) {
  const { planning } = digest
  if (!planning.startMonth || !planning.endMonth) return null

  const months = getMonthsBetween(planning.startMonth, planning.endMonth)
  const today = currentPeriod()
  const todayIdx = months.indexOf(today)
  const visibleRows = planning.rows.filter(r => !r.hidden)

  return (
    <section className="mb-10 print-break">
      <h2 className="mb-4 text-xl font-bold text-ink">{t.planning.title}</h2>
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="flex">
            <div className="w-48 flex-shrink-0" />
            <div className="flex flex-1">
              {months.map((m, i) => {
                const [y, mo] = m.split('-').map(Number)
                const isQ = mo % 3 === 1 && i > 0
                return (
                  <div
                    key={m}
                    className={`flex-1 border-l px-0.5 text-center text-[10px] text-slate/60 ${isQ ? 'border-slate/30' : 'border-slate/10'}`}
                  >
                    {shortMonth(m)}
                    {mo === 1 && <div className="text-[9px] font-medium text-ink">{y}</div>}
                  </div>
                )
              })}
            </div>
          </div>

          {visibleRows.map(row => (
            <div key={row.id} className="flex items-center border-b border-slate/5">
              <div
                className={`w-48 flex-shrink-0 truncate py-2 text-sm ${row.type === 'section' ? 'font-bold text-ink' : 'text-slate'}`}
                style={{ paddingLeft: `${row.indent * 16 + 8}px` }}
              >
                {row.label}
              </div>
              <div className="relative flex flex-1">
                {months.map((m, i) => {
                  const [, mo] = m.split('-').map(Number)
                  const isQ = mo % 3 === 1 && i > 0
                  return (
                    <div
                      key={m}
                      className={`h-10 flex-1 border-l ${isQ ? 'border-slate/30' : 'border-slate/10'}`}
                    />
                  )
                })}

                {todayIdx >= 0 && (
                  <div
                    className="absolute top-0 h-full w-px bg-danger/40"
                    style={{ left: `${((todayIdx + 0.5) / months.length) * 100}%` }}
                  />
                )}

                {row.bars.map(bar => {
                  const startIdx = months.indexOf(bar.start)
                  const endIdx = months.indexOf(bar.end)
                  if (startIdx < 0 || endIdx < 0) return null
                  const left = (startIdx / months.length) * 100
                  const width = ((endIdx - startIdx + 1) / months.length) * 100

                  return (
                    <div
                      key={bar.id}
                      className="absolute top-2 flex h-6 items-center overflow-hidden rounded"
                      style={{
                        left: `${left}%`,
                        width: `${width}%`,
                        backgroundColor: bar.color,
                        opacity: bar.style === 'hatched' ? 0.6 : 1,
                        backgroundImage: bar.style === 'hatched'
                          ? 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.3) 3px, rgba(255,255,255,0.3) 6px)'
                          : undefined,
                      }}
                      title={bar.label}
                    >
                      {bar.progress !== undefined && (
                        <div
                          className="absolute inset-y-0 left-0 bg-black/10"
                          style={{ width: `${bar.progress}%` }}
                        />
                      )}
                      <span className="relative z-10 truncate px-1.5 text-[10px] font-medium text-white">
                        {bar.label}
                      </span>
                    </div>
                  )
                })}

                {row.milestones.map(ms => {
                  const idx = months.indexOf(ms.month)
                  if (idx < 0) return null
                  const left = ((idx + 0.5) / months.length) * 100
                  return (
                    <div
                      key={ms.id}
                      className="absolute top-1"
                      style={{ left: `${left}%`, transform: 'translateX(-50%)' }}
                      title={ms.label}
                    >
                      <div
                        className="h-3 w-3 rotate-45"
                        style={{ backgroundColor: ms.color }}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
