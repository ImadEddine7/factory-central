import { t } from '@digest/i18n'
import type { Digest } from '@digest/lib/schema'

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-accent underline" target="_blank">$1</a>')
    .replace(/\n/g, '<br/>')
}

export function KeyMessages({ digest }: { digest: Digest }) {
  const messages = [...digest.keyMessages].sort((a, b) => a.order - b.order)

  if (messages.length === 0) return null

  return (
    <section className="mb-10">
      <h2 className="mb-4 text-xl font-bold text-ink">{t.messages.title}</h2>
      <div className="space-y-6">
        {messages.map(msg => (
          <article key={msg.id} className="flex gap-4 rounded-lg border border-slate/10 p-5">
            {msg.icon && (
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-mist text-2xl">
                {msg.icon}
              </div>
            )}
            <div className="flex-1">
              <div className="mb-2 flex items-start justify-between">
                <h3 className="text-lg font-semibold text-ink">{msg.title}</h3>
                <div className="flex gap-2">
                  {msg.tag && (
                    <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
                      {msg.tag}
                    </span>
                  )}
                  {msg.date && (
                    <span className="text-xs text-slate/60">
                      {new Date(msg.date).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                </div>
              </div>
              {msg.image && (
                <div className={`mb-3 ${msg.image.layout === 'full' ? 'w-full' : msg.image.layout === 'left' ? 'float-left mr-4 w-2/5' : 'float-right ml-4 w-2/5'}`}>
                  <img
                    src={msg.image.src}
                    alt={msg.image.alt}
                    className="rounded-md"
                  />
                </div>
              )}
              <div
                className="text-sm leading-relaxed text-slate"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.body) }}
              />
              <div className="clear-both" />
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
