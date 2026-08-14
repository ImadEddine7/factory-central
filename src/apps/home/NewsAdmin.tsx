import { useState } from 'react'
import type { HomeData } from './types'
import * as homeApi from '@shared/api/home'
import { cn } from '@shared/utils/cn'

interface Props {
  data: HomeData
  onChange: (data: HomeData) => void
  onLogout: () => void
}

export function NewsAdmin({ data, onChange, onLogout }: Props) {
  const [editingAnnouncement, setEditingAnnouncement] = useState(data.announcement)
  const [newTitle, setNewTitle] = useState('')
  const [newBody, setNewBody] = useState('')

  const saveAnnouncement = async () => {
    await homeApi.saveAnnouncement(editingAnnouncement)
    onChange({ ...data, announcement: editingAnnouncement })
  }

  const addArticle = async () => {
    if (!newTitle.trim()) return
    const date = new Date().toISOString().split('T')[0]
    const created = await homeApi.createArticle({ title: newTitle, body: newBody, date })
    onChange({ ...data, articles: [created, ...data.articles] })
    setNewTitle('')
    setNewBody('')
  }

  const deleteArticle = async (id: string) => {
    await homeApi.deleteArticle(id)
    onChange({ ...data, articles: data.articles.filter(a => a.id !== id) })
  }

  const togglePin = async (id: string) => {
    const article = data.articles.find(a => a.id === id)
    if (!article) return
    await homeApi.togglePin(id, !article.pinned)
    onChange({
      ...data,
      articles: data.articles.map(a => a.id === id ? { ...a, pinned: !a.pinned } : a),
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Administration — News</h2>
        <button onClick={onLogout} className="btn-secondary text-sm">Déconnexion</button>
      </div>

      <div className="section-card">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate">Bannière d'annonce</h3>
        <textarea
          value={editingAnnouncement}
          onChange={e => setEditingAnnouncement(e.target.value)}
          className="input-field mb-3 w-full"
          rows={2}
        />
        <button onClick={saveAnnouncement} className="btn-primary text-sm">Sauvegarder</button>
      </div>

      <div className="section-card">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate">Nouvel article</h3>
        <input
          type="text"
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          className="input-field mb-2 w-full"
          placeholder="Titre de l'article"
        />
        <textarea
          value={newBody}
          onChange={e => setNewBody(e.target.value)}
          className="input-field mb-3 w-full"
          rows={4}
          placeholder="Contenu de l'article..."
        />
        <button onClick={addArticle} className="btn-primary text-sm">Publier</button>
      </div>

      <div className="section-card">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate">Articles publiés</h3>
        {data.articles.length === 0 ? (
          <p className="text-sm text-slate">Aucun article.</p>
        ) : (
          <div className="space-y-3">
            {data.articles.map(article => (
              <div key={article.id} className="flex items-start justify-between rounded-lg border border-slate/10 p-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{article.title}</span>
                    {article.pinned && (
                      <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold text-accent">ÉPINGLÉ</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate">{article.date}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => togglePin(article.id)}
                    className={cn(
                      'rounded p-1.5 text-xs transition-colors',
                      article.pinned ? 'bg-accent/10 text-accent' : 'text-slate hover:text-ink'
                    )}
                    title={article.pinned ? 'Désépingler' : 'Épingler'}
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 2a1 1 0 011 1v1.323l3.954.99a1 1 0 01.686 1.373L14.22 9.5H16a1 1 0 110 2h-2.5l1 5a1 1 0 01-1.857.514L10 13.5l-2.643 3.514A1 1 0 015.5 16.5l1-5H4a1 1 0 110-2h1.78L4.36 6.686a1 1 0 01.687-1.373L9 4.323V3a1 1 0 011-1z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => deleteArticle(article.id)}
                    className="rounded p-1.5 text-slate transition-colors hover:text-danger"
                    title="Supprimer"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
