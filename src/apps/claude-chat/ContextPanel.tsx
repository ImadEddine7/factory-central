import { useState, useEffect, useCallback } from 'react'

interface ContextEntry {
  id: string
  source: 'EMAIL' | 'TEAMS' | 'SHAREPOINT' | 'OTHER'
  subject: string
  content: string
  date: string | null
  externalId: string | null
  createdAt: string
}

interface SyncConfig {
  id: string
  source: 'EMAIL' | 'TEAMS' | 'SHAREPOINT'
  name: string
  resourceId: string
  enabled: boolean
  lastSync: string | null
}

interface MsStatus {
  configured: boolean
  connected: boolean
  account: string | null
}

const SOURCES = [
  { value: 'EMAIL', label: 'Email', icon: '📧' },
  { value: 'TEAMS', label: 'Teams', icon: '💬' },
  { value: 'SHAREPOINT', label: 'SharePoint', icon: '📁' },
  { value: 'OTHER', label: 'Autre', icon: '📝' },
] as const

const API_URL = import.meta.env.VITE_API_URL || ''
const isStatic = !import.meta.env.VITE_API_URL && location.hostname.endsWith('github.io')

export function ContextPanel({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<'entries' | 'sources'>('sources')
  const [entries, setEntries] = useState<ContextEntry[]>([])
  const [syncConfigs, setSyncConfigs] = useState<SyncConfig[]>([])
  const [msStatus, setMsStatus] = useState<MsStatus>({ configured: false, connected: false, account: null })
  const [syncing, setSyncing] = useState<string | null>(null)
  const [showManualForm, setShowManualForm] = useState(false)
  const [source, setSource] = useState<ContextEntry['source']>('EMAIL')
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [date, setDate] = useState('')
  const [saving, setSaving] = useState(false)

  // Source browser state
  const [browsing, setBrowsing] = useState<'EMAIL' | 'TEAMS' | 'SHAREPOINT' | null>(null)
  const [browseItems, setBrowseItems] = useState<any[]>([])
  const [browseLoading, setBrowseLoading] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<any>(null)

  const loadAll = useCallback(async () => {
    if (isStatic) return
    try {
      const [entriesRes, configsRes, statusRes] = await Promise.all([
        fetch(`${API_URL}/api/business-context`),
        fetch(`${API_URL}/api/microsoft/sync-configs`),
        fetch(`${API_URL}/api/microsoft/status`),
      ])
      if (entriesRes.ok) setEntries(await entriesRes.json())
      if (configsRes.ok) setSyncConfigs(await configsRes.json())
      if (statusRes.ok) setMsStatus(await statusRes.json())
    } catch { /* backend unreachable */ }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  async function connectMicrosoft() {
    const res = await fetch(`${API_URL}/api/microsoft/connect`)
    if (!res.ok) {
      const err = await res.json()
      alert(err.error)
      return
    }
    const { url } = await res.json()
    window.open(url, '_blank', 'width=600,height=700')
    setTimeout(loadAll, 5000)
  }

  async function disconnectMicrosoft() {
    if (!confirm('Déconnecter Microsoft 365 ?')) return
    await fetch(`${API_URL}/api/microsoft/disconnect`, { method: 'DELETE' })
    loadAll()
  }

  async function browseSource(src: 'EMAIL' | 'TEAMS' | 'SHAREPOINT') {
    setBrowsing(src)
    setBrowseLoading(true)
    setBrowseItems([])
    setSelectedTeam(null)

    try {
      if (src === 'EMAIL') {
        const res = await fetch(`${API_URL}/api/microsoft/mail/folders`)
        if (res.ok) setBrowseItems(await res.json())
      } else if (src === 'TEAMS') {
        const res = await fetch(`${API_URL}/api/microsoft/teams/joined`)
        if (res.ok) setBrowseItems(await res.json())
      } else {
        const res = await fetch(`${API_URL}/api/microsoft/sharepoint/sites`)
        if (res.ok) setBrowseItems(await res.json())
      }
    } catch { /* ignore */ }
    setBrowseLoading(false)
  }

  async function browseTeamChannels(team: any) {
    setSelectedTeam(team)
    setBrowseLoading(true)
    const res = await fetch(`${API_URL}/api/microsoft/teams/${team.id}/channels`)
    if (res.ok) setBrowseItems(await res.json())
    setBrowseLoading(false)
  }

  async function addSyncConfig(name: string, resourceId: string) {
    if (!browsing) return
    await fetch(`${API_URL}/api/microsoft/sync-configs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: browsing, name, resourceId }),
    })
    setBrowsing(null)
    loadAll()
  }

  async function removeSyncConfig(id: string) {
    if (!confirm('Supprimer cette source ?')) return
    await fetch(`${API_URL}/api/microsoft/sync-configs/${id}`, { method: 'DELETE' })
    loadAll()
  }

  async function syncOne(id: string) {
    setSyncing(id)
    const res = await fetch(`${API_URL}/api/microsoft/sync-configs/${id}/sync`, { method: 'POST' })
    if (res.ok) {
      const { imported } = await res.json()
      alert(`${imported} éléments synchronisés`)
    } else {
      const err = await res.json()
      alert(`Erreur: ${err.error}`)
    }
    setSyncing(null)
    loadAll()
  }

  async function syncAll() {
    setSyncing('all')
    const res = await fetch(`${API_URL}/api/microsoft/sync-all`, { method: 'POST' })
    if (res.ok) {
      const { imported, sources } = await res.json()
      alert(`${imported} éléments synchronisés depuis ${sources} source(s)`)
    } else {
      const err = await res.json()
      alert(`Erreur: ${err.error}`)
    }
    setSyncing(null)
    loadAll()
  }

  // Manual entry handlers
  function resetForm() {
    setShowManualForm(false)
    setSource('EMAIL')
    setSubject('')
    setContent('')
    setDate('')
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim() || !content.trim()) return
    setSaving(true)
    await fetch(`${API_URL}/api/business-context`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source, subject, content, date: date || null }),
    })
    setSaving(false)
    resetForm()
    loadAll()
  }

  async function deleteEntry(id: string) {
    if (!confirm('Supprimer ?')) return
    await fetch(`${API_URL}/api/business-context/${id}`, { method: 'DELETE' })
    loadAll()
  }

  const sourceIcon = (s: string) => SOURCES.find(x => x.value === s)?.icon || '📝'
  const sourceLabel = (s: string) => SOURCES.find(x => x.value === s)?.label || s

  return (
    <div className="flex h-full flex-col border-l border-slate/10 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate/10 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">Business Context</h2>
          <p className="text-[10px] text-slate">Connectez vos sources Microsoft 365</p>
        </div>
        <button onClick={onClose} className="rounded p-1 text-slate hover:bg-mist hover:text-ink">
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate/10">
        <button
          onClick={() => setTab('sources')}
          className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${tab === 'sources' ? 'border-b-2 border-accent text-accent' : 'text-slate hover:text-ink'}`}
        >
          Sources
        </button>
        <button
          onClick={() => setTab('entries')}
          className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${tab === 'entries' ? 'border-b-2 border-accent text-accent' : 'text-slate hover:text-ink'}`}
        >
          Contenu ({entries.length})
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'sources' && (
          <div className="space-y-4">
            {/* Microsoft connection status */}
            <div className="rounded-lg border border-slate/10 p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5" viewBox="0 0 21 21" fill="none">
                    <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
                    <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
                    <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
                    <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
                  </svg>
                  <span className="text-sm font-medium text-ink">Microsoft 365</span>
                </div>
                {msStatus.connected ? (
                  <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">Connecté</span>
                ) : (
                  <span className="rounded-full bg-slate/10 px-2 py-0.5 text-[10px] font-medium text-slate">Déconnecté</span>
                )}
              </div>

              {msStatus.connected && msStatus.account && (
                <p className="mb-2 text-xs text-slate">{msStatus.account}</p>
              )}

              {!msStatus.configured && (
                <p className="text-xs text-warning">Variables d'environnement manquantes (MS_TENANT_ID, MS_CLIENT_ID, MS_CLIENT_SECRET)</p>
              )}

              {msStatus.configured && !msStatus.connected && (
                <button onClick={connectMicrosoft} className="btn-primary w-full text-xs">
                  Se connecter
                </button>
              )}

              {msStatus.connected && (
                <div className="flex gap-2">
                  <button onClick={syncAll} disabled={syncing === 'all'} className="btn-primary flex-1 text-xs">
                    {syncing === 'all' ? 'Sync...' : 'Tout synchroniser'}
                  </button>
                  <button onClick={disconnectMicrosoft} className="btn-secondary text-xs text-danger">
                    Déconnecter
                  </button>
                </div>
              )}
            </div>

            {/* Configured sync sources */}
            {syncConfigs.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-medium text-slate">Sources configurées</h3>
                <div className="space-y-2">
                  {syncConfigs.map(cfg => (
                    <div key={cfg.id} className="group flex items-center gap-2 rounded-lg border border-slate/10 p-2.5">
                      <span className="text-lg">{sourceIcon(cfg.source)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-xs font-medium text-ink">{cfg.name}</p>
                        <p className="text-[10px] text-slate">
                          {cfg.lastSync ? `Dernier sync: ${new Date(cfg.lastSync).toLocaleString('fr-FR')}` : 'Jamais synchronisé'}
                        </p>
                      </div>
                      <button
                        onClick={() => syncOne(cfg.id)}
                        disabled={syncing === cfg.id}
                        className="rounded p-1 text-slate hover:bg-mist hover:text-accent"
                        title="Synchroniser"
                      >
                        <svg className={`h-3.5 w-3.5 ${syncing === cfg.id ? 'animate-spin' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button
                        onClick={() => removeSyncConfig(cfg.id)}
                        className="rounded p-1 text-slate opacity-0 transition-opacity hover:bg-danger/10 hover:text-danger group-hover:opacity-100"
                        title="Supprimer"
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add source buttons */}
            {msStatus.connected && (
              <div>
                <h3 className="mb-2 text-xs font-medium text-slate">Ajouter une source</h3>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => browseSource('EMAIL')}
                    className="flex flex-col items-center gap-1 rounded-lg border border-slate/10 p-3 text-center transition-colors hover:border-accent/30 hover:bg-accent/5"
                  >
                    <span className="text-2xl">📧</span>
                    <span className="text-[10px] font-medium text-slate">Outlook</span>
                  </button>
                  <button
                    onClick={() => browseSource('TEAMS')}
                    className="flex flex-col items-center gap-1 rounded-lg border border-slate/10 p-3 text-center transition-colors hover:border-accent/30 hover:bg-accent/5"
                  >
                    <span className="text-2xl">💬</span>
                    <span className="text-[10px] font-medium text-slate">Teams</span>
                  </button>
                  <button
                    onClick={() => browseSource('SHAREPOINT')}
                    className="flex flex-col items-center gap-1 rounded-lg border border-slate/10 p-3 text-center transition-colors hover:border-accent/30 hover:bg-accent/5"
                  >
                    <span className="text-2xl">📁</span>
                    <span className="text-[10px] font-medium text-slate">SharePoint</span>
                  </button>
                </div>
              </div>
            )}

            {/* Source browser modal */}
            {browsing && (
              <div className="rounded-lg border border-accent/20 bg-accent/5 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-xs font-medium text-ink">
                    {browsing === 'EMAIL' && 'Dossiers Outlook'}
                    {browsing === 'TEAMS' && (selectedTeam ? `Channels — ${selectedTeam.displayName}` : 'Équipes Teams')}
                    {browsing === 'SHAREPOINT' && 'Sites SharePoint'}
                  </h4>
                  <button onClick={() => { setBrowsing(null); setSelectedTeam(null) }} className="text-xs text-slate hover:text-ink">
                    Fermer
                  </button>
                </div>

                {browseLoading && <p className="py-4 text-center text-xs text-slate">Chargement...</p>}

                {!browseLoading && browseItems.length === 0 && (
                  <p className="py-4 text-center text-xs text-slate/50">Aucun élément trouvé</p>
                )}

                <div className="max-h-48 space-y-1 overflow-y-auto">
                  {browseItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (browsing === 'TEAMS' && !selectedTeam) {
                          browseTeamChannels(item)
                        } else {
                          const name = item.displayName || item.topic || item.name || item.id
                          let resourceId = item.id
                          if (browsing === 'TEAMS' && selectedTeam) {
                            resourceId = `${selectedTeam.id}/${item.id}`
                          }
                          addSyncConfig(name, resourceId)
                        }
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-white"
                    >
                      <span className="text-sm">{sourceIcon(browsing)}</span>
                      <span className="flex-1 truncate text-ink">
                        {item.displayName || item.topic || item.name || item.id}
                      </span>
                      {browsing === 'TEAMS' && !selectedTeam && (
                        <span className="text-[10px] text-slate">→</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Manual add */}
            <div className="border-t border-slate/10 pt-4">
              <button
                onClick={() => setShowManualForm(!showManualForm)}
                className="w-full rounded-lg border border-dashed border-slate/20 py-2.5 text-xs text-slate transition-colors hover:border-accent hover:text-accent"
              >
                + Ajouter manuellement
              </button>
            </div>

            {showManualForm && (
              <form onSubmit={handleManualSubmit} className="rounded-lg border border-slate/10 bg-mist/50 p-3">
                <div className="mb-2 flex gap-1.5">
                  {SOURCES.map(s => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setSource(s.value)}
                      className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors ${
                        source === s.value ? 'bg-accent text-white' : 'bg-white border border-slate/15 text-slate'
                      }`}
                    >
                      {s.icon} {s.label}
                    </button>
                  ))}
                </div>
                <input className="input-field mb-2 w-full text-xs" placeholder="Sujet" value={subject} onChange={e => setSubject(e.target.value)} />
                <input type="date" className="input-field mb-2 w-full text-xs" value={date} onChange={e => setDate(e.target.value)} />
                <textarea className="input-field mb-2 w-full text-xs" rows={4} placeholder="Contenu..." value={content} onChange={e => setContent(e.target.value)} />
                <div className="flex gap-2">
                  <button type="submit" disabled={saving} className="btn-primary text-xs">{saving ? '...' : 'Ajouter'}</button>
                  <button type="button" onClick={resetForm} className="btn-secondary text-xs">Annuler</button>
                </div>
              </form>
            )}
          </div>
        )}

        {tab === 'entries' && (
          <div className="space-y-3">
            {entries.length === 0 && (
              <p className="py-8 text-center text-xs text-slate/50">
                Aucun contenu synchronisé.<br />
                Configurez vos sources dans l'onglet Sources.
              </p>
            )}
            {entries.map(entry => (
              <div key={entry.id} className="group rounded-lg border border-slate/10 p-3">
                <div className="mb-1 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{sourceIcon(entry.source)}</span>
                    <div className="min-w-0">
                      <span className="text-[10px] font-medium uppercase text-slate">{sourceLabel(entry.source)}</span>
                      <h3 className="truncate text-xs font-medium text-ink">{entry.subject}</h3>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteEntry(entry.id)}
                    className="rounded p-1 text-slate opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
                  >
                    <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                {entry.date && <p className="mb-1 text-[10px] text-slate/50">{entry.date}</p>}
                <p className="line-clamp-3 text-[11px] leading-relaxed text-slate">{entry.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
