import { t } from '@digest/i18n'
import { useDigest } from '@digest/lib/context'
import { downloadJson } from '@digest/lib/storage'

export function PublishPanel() {
  const { digest, updateDigest, saveToGitHub, saving, githubMode } = useDigest()
  const isPublished = digest.meta.status === 'published'

  const publish = async () => {
    updateDigest(d => ({
      ...d,
      meta: {
        ...d.meta,
        status: 'published',
        publishedAt: new Date().toISOString(),
      },
    }))
    if (githubMode) {
      await saveToGitHub()
    }
  }

  const unpublish = () => {
    updateDigest(d => ({
      ...d,
      meta: { ...d.meta, status: 'draft', publishedAt: undefined },
    }))
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold">{t.admin.nav.publish}</h2>

      <div className="rounded-lg border border-slate/10 p-4">
        <div className="flex items-center gap-3">
          <div className={`h-3 w-3 rounded-full ${isPublished ? 'bg-success' : 'bg-warning'}`} />
          <span className="font-medium">
            {isPublished ? t.admin.published : t.admin.draft}
          </span>
          {digest.meta.publishedAt && (
            <span className="text-sm text-slate">
              — {new Date(digest.meta.publishedAt).toLocaleDateString('fr-FR')}
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        {!isPublished && (
          <button onClick={publish} disabled={saving} className="btn-primary">
            {saving ? t.admin.saving : t.admin.publish}
          </button>
        )}
        {isPublished && (
          <button onClick={unpublish} className="btn-secondary">
            {t.admin.unpublish}
          </button>
        )}
        <button onClick={() => downloadJson(digest)} className="btn-secondary">
          Télécharger JSON
        </button>
      </div>

      <div className="text-sm text-slate">
        <p>Période : <strong>{digest.meta.period}</strong></p>
        <p>Titre : {digest.meta.subtitle}</p>
        <p>Mode : {githubMode ? 'GitHub' : 'Local'}</p>
      </div>
    </div>
  )
}
