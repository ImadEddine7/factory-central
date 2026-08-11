import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@shared/utils/cn'
import { useMediaQuery } from '@shared/hooks/useMediaQuery'
import { EnvBadge } from './EnvBadge'
import { apps } from './AppRegistry'
import { useState, useEffect } from 'react'

export function Sidebar() {
  const isMobile = useMediaQuery('(max-width: 1023px)')
  const [open, setOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    if (isMobile) setOpen(false)
  }, [location.pathname, isMobile])

  if (isMobile) {
    return (
      <>
        <div className="sticky top-0 z-40 flex items-center gap-3 border-b border-slate/10 bg-white px-4 py-3 no-print">
          <button onClick={() => setOpen(true)} className="rounded-lg p-1.5 hover:bg-mist">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm font-bold tracking-tight">Factory Central</span>
          <EnvBadge />
        </div>

        {open && (
          <div className="fixed inset-0 z-50 no-print">
            <div className="absolute inset-0 bg-ink/20 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-64 bg-white shadow-xl">
              <SidebarContent />
            </aside>
          </div>
        )}
      </>
    )
  }

  return (
    <aside className="flex w-64 flex-shrink-0 flex-col border-r border-slate/10 bg-white no-print">
      <SidebarContent />
    </aside>
  )
}

function SidebarContent() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate/10">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink">
          <span className="text-xs font-bold text-gold">FC</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-tight">Factory Central</span>
          <span className="text-[11px] text-slate">Data Factory Delivery</span>
        </div>
        <EnvBadge />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate/60">
          Services
        </p>
        {apps.map(app => (
          <NavLink
            key={app.id}
            to={app.basePath}
            className={({ isActive }) => cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isActive ? 'bg-accent/10 text-accent' : 'text-slate hover:text-ink hover:bg-mist'
            )}
          >
            <app.icon className="h-5 w-5" />
            {app.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate/10 px-5 py-4">
        <p className="text-[10px] text-slate/50">v1.0.0</p>
      </div>
    </div>
  )
}
