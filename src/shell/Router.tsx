import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Suspense } from 'react'
import { Shell } from './Shell'
import { apps } from './AppRegistry'

function LoadingSpinner() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate/20 border-t-accent" />
    </div>
  )
}

export function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Shell />}>
          <Route index element={<Navigate to={apps[0].basePath} replace />} />
          {apps.map(app => (
            <Route
              key={app.id}
              path={`${app.basePath}/*`}
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <app.component />
                </Suspense>
              }
            />
          ))}
          <Route path="*" element={<Navigate to={apps[0].basePath} replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
