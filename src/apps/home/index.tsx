import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import type { HomeData } from './types'
import { fetchHomeData } from '@shared/api/home'
import { NewsAdmin } from './NewsAdmin'
import { useAuth } from '@shared/auth/AuthContext'
import { cn } from '@shared/utils/cn'

const services = [
  { id: 'delivery-digest', label: 'Delivery Digest', path: '/digest', description: 'Monthly delivery reporting & KPIs', icon: '📊' },
  { id: 'staffing-pipeline', label: 'Staffing Pipeline', path: '/staffing-pipeline', description: 'Resource allocation & hiring tracker', icon: '👥' },
  { id: 'steering', label: 'Steering', path: '/steering', description: 'Steering committee materials', icon: '🎯' },
  { id: 'financial-view', label: 'Financial View', path: '/financial-view', description: 'Budget tracking & forecasts', icon: '💰' },
  { id: 'sales-funnel', label: 'Sales Funnel', path: '/sales-funnel', description: 'Pipeline & opportunity tracking', icon: '📈' },
  { id: 'dashboards', label: 'Dashboards', path: '/dashboards', description: 'Live operational dashboards', icon: '📋' },
]

export default function HomePage() {
  const [data, setData] = useState<HomeData>({ announcement: '', articles: [] })
  const [showAdmin, setShowAdmin] = useState(false)
  const { isAdmin, logout } = useAuth()

  useEffect(() => {
    fetchHomeData().then(setData).catch(() => {})
  }, [showAdmin])

  if (showAdmin && isAdmin) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <button onClick={() => setShowAdmin(false)} className="mb-4 text-sm text-slate hover:text-ink">
          ← Retour à l'accueil
        </button>
        <NewsAdmin data={data} onChange={setData} onLogout={logout} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Announcement Banner */}
      {data.announcement && (
        <div className="mb-8 rounded-xl border border-accent/20 bg-accent-light px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent/15">
              <svg className="h-4 w-4 text-accent" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-sm font-medium text-ink">{data.announcement}</p>
          </div>
        </div>
      )}

      {/* News Section */}
      <section className="mb-12">
        <div className="mb-4 flex items-center gap-2.5">
          <h2 className="text-xl font-bold">Actualités</h2>
          {isAdmin && (
            <button
              onClick={() => setShowAdmin(true)}
              className="rounded-md p-1.5 text-slate/60 transition-all hover:bg-slate/8 hover:text-ink"
              title="Gérer les actualités"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
            </button>
          )}
        </div>

        {data.articles.length === 0 ? (
          <p className="text-sm text-slate">Aucune actualité pour le moment.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.articles
              .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
              .map(article => (
                <article key={article.id} className={cn(
                  'section-card flex flex-col',
                  article.pinned && 'ring-1 ring-accent/20'
                )}>
                  {article.pinned && (
                    <span className="mb-2 self-start rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold text-accent">ÉPINGLÉ</span>
                  )}
                  <h3 className="font-semibold text-ink">{article.title}</h3>
                  <p className="mt-2 flex-1 text-sm text-slate">{article.body}</p>
                  <p className="mt-3 text-xs text-slate/50">{article.date}</p>
                </article>
              ))}
          </div>
        )}
      </section>

      {/* Delivery Suite */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-bold">Delivery Suite</h2>
          <p className="mt-1 text-sm text-slate">Accédez à l'ensemble des services de delivery.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map(service => (
            <Link
              key={service.id}
              to={service.path}
              className="section-card group flex items-start gap-4 transition-all hover:border-accent/20 hover:shadow-card-hover"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-mist text-lg group-hover:bg-accent/10">
                {service.icon}
              </div>
              <div>
                <h3 className="font-semibold text-ink group-hover:text-accent">{service.label}</h3>
                <p className="mt-1 text-sm text-slate">{service.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
