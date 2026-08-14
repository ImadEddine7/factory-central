import { useState, useEffect } from 'react'
import { useAuth } from '@shared/auth/AuthContext'
import { cn } from '@shared/utils/cn'

export function TopBar() {
  const { isAdmin, login, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [showLoginForm, setShowLoginForm] = useState(false)
  const [logoutToast, setLogoutToast] = useState(false)
  const [loginId, setLoginId] = useState('')
  const [loginPass, setLoginPass] = useState('')
  const [loginError, setLoginError] = useState(false)

  useEffect(() => {
    if (logoutToast) {
      const timer = setTimeout(() => setLogoutToast(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [logoutToast])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = await login(loginId, loginPass)
    if (success) {
      setShowLoginForm(false)
      setLoginId('')
      setLoginPass('')
      setLoginError(false)
    } else {
      setLoginError(true)
    }
  }

  const handleLogout = () => {
    logout()
    setMenuOpen(false)
    setLogoutToast(true)
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate/10 bg-white/80 px-6 backdrop-blur-lg no-print">
      <div />

      <div className="flex items-center gap-2">
        <button
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-slate transition-colors hover:bg-mist hover:text-ink"
          title="Settings"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="hidden sm:inline">Settings</span>
        </button>

        <div className="relative">
          {isAdmin ? (
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-mist"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
                A
              </div>
              <span className="hidden sm:inline">Admin</span>
            </button>
          ) : (
            <button
              onClick={() => setShowLoginForm(!showLoginForm)}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-slate transition-colors hover:bg-mist hover:text-ink"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate/10 text-xs font-medium text-slate">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span className="hidden sm:inline">Login</span>
            </button>
          )}

          {/* Login form dropdown */}
          {showLoginForm && !isAdmin && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowLoginForm(false)} />
              <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-slate/10 bg-white p-4 shadow-card-hover">
                <form onSubmit={handleLogin} className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate">ID</label>
                    <input
                      type="text"
                      value={loginId}
                      onChange={e => { setLoginId(e.target.value); setLoginError(false) }}
                      className="input-field w-full text-sm"
                      placeholder="@dmin"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate">Passkey</label>
                    <input
                      type="password"
                      value={loginPass}
                      onChange={e => { setLoginPass(e.target.value); setLoginError(false) }}
                      className="input-field w-full text-sm"
                      placeholder="••••••"
                    />
                  </div>
                  {loginError && <p className="text-xs text-danger">Identifiants incorrects.</p>}
                  <button type="submit" className="btn-primary w-full text-sm">Se connecter</button>
                </form>
              </div>
            </>
          )}

          {/* Admin menu dropdown */}
          {menuOpen && isAdmin && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-slate/10 bg-white py-1.5 shadow-card-hover">
                <div className="border-b border-slate/10 px-4 py-2 mb-1">
                  <p className="text-xs font-medium text-ink">Administrateur</p>
                  <p className="text-[11px] text-slate">Mode édition activé</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-slate transition-colors hover:bg-danger/5 hover:text-danger"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Déconnexion
                </button>
              </div>
            </>
          )}

          {/* Logout toast */}
          {logoutToast && (
            <div className="absolute right-0 top-full z-50 mt-2 w-56 animate-fade-in rounded-xl border border-slate/10 bg-white px-4 py-3 shadow-card-hover">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-success/15">
                    <svg className="h-3.5 w-3.5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-ink">Déconnecté avec succès</p>
                </div>
                <button
                  onClick={() => setLogoutToast(false)}
                  className="rounded p-0.5 text-slate/50 transition-colors hover:text-ink"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
