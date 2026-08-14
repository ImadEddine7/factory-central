import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom'
import { DigestProvider } from '@digest/lib/context'
import { DigestPage } from '@digest/pages/Digest'
import { AdminPage } from '@digest/pages/Admin'
import { ArchivePage } from '@digest/pages/Archive'
import { useAuth } from '@shared/auth/AuthContext'
import { t } from '@digest/i18n'
import { cn } from '@shared/utils/cn'

function DigestNav() {
  const location = useLocation()
  const { isAdmin } = useAuth()
  const basePath = '/digest'

  const links = [
    { to: basePath, label: t.nav.digest, end: true, adminOnly: false },
    { to: `${basePath}/archive`, label: t.nav.archive, end: false, adminOnly: true },
    { to: `${basePath}/admin`, label: t.nav.admin, end: false, adminOnly: true },
  ]

  const visibleLinks = links.filter(l => !l.adminOnly || isAdmin)

  return (
    <nav className="sticky top-0 z-20 border-b border-slate/10 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <span className="text-sm font-bold tracking-tight text-ink">{t.app.title}</span>
        <div className="flex gap-1">
          {visibleLinks.map(link => {
            const isActive = link.end
              ? location.pathname === basePath || location.pathname === basePath + '/' || /^\/digest\/\d{4}-\d{2}$/.test(location.pathname)
              : location.pathname.startsWith(link.to)

            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={cn(
                  'rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all',
                  isActive ? 'bg-ink text-white' : 'text-slate hover:text-ink'
                )}
              >
                {link.label}
              </NavLink>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAuth()
  if (!isAdmin) return <Navigate to="/digest" replace />
  return <>{children}</>
}

export function DigestApp() {
  return (
    <DigestProvider>
      <DigestNav />
      <Routes>
        <Route index element={<DigestPage />} />
        <Route path=":period" element={<DigestPage />} />
        <Route path="admin" element={<AdminGuard><AdminPage /></AdminGuard>} />
        <Route path="archive" element={<AdminGuard><ArchivePage /></AdminGuard>} />
      </Routes>
    </DigestProvider>
  )
}
