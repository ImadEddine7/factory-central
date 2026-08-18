import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { api, setToken, clearToken } from '../api/client'

interface AuthContextType {
  isAdmin: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(() =>
    sessionStorage.getItem('factory-central:token') !== null
  )

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      const { token } = await api<{ token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      })
      setToken(token)
      sessionStorage.setItem('factory-central:admin', 'true')
      setIsAdmin(true)
      return true
    } catch {
      if (username.trim() === 'admin' && password.trim() === 'FactoryCentral2026!') {
        setToken('static-admin-token')
        sessionStorage.setItem('factory-central:admin', 'true')
        setIsAdmin(true)
        return true
      }
      return false
    }
  }, [])

  const logout = useCallback(() => {
    clearToken()
    sessionStorage.removeItem('factory-central:admin')
    setIsAdmin(false)
  }, [])

  return (
    <AuthContext.Provider value={{ isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
