import { Routes, Route } from 'react-router-dom'
import { DigestProvider } from '@digest/lib/context'
import { DigestPage } from '@digest/pages/Digest'
import { AdminPage } from '@digest/pages/Admin'
import { ArchivePage } from '@digest/pages/Archive'

export function DigestApp() {
  return (
    <DigestProvider>
      <Routes>
        <Route index element={<DigestPage />} />
        <Route path=":period" element={<DigestPage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="archive" element={<ArchivePage />} />
      </Routes>
    </DigestProvider>
  )
}
