import { t } from '@digest/i18n'
import { useDigest } from '@digest/lib/context'
import { generateId } from '@digest/lib/utils'
import type { KeyMessage } from '@digest/lib/schema'

export function MessagesEditor() {
  const { digest, updateDigest } = useDigest()
  const messages = [...digest.keyMessages].sort((a, b) => a.order - b.order)

  const addMessage = () => {
    const order = messages.length > 0 ? Math.max(...messages.map(m => m.order)) + 1 : 1
    const msg: KeyMessage = {
      id: generateId('msg'),
      order,
      title: '',
      body: '',
      tag: '',
      date: new Date().toISOString().slice(0, 10),
    }
    updateDigest(d => ({ ...d, keyMessages: [...d.keyMessages, msg] }))
  }

  const updateMessage = (id: string, field: keyof KeyMessage, value: any) => {
    updateDigest(d => ({
      ...d,
      keyMessages: d.keyMessages.map(m => m.id === id ? { ...m, [field]: value } : m),
    }))
  }

  const deleteMessage = (id: string) => {
    if (!confirm(t.admin.confirmDelete)) return
    updateDigest(d => ({ ...d, keyMessages: d.keyMessages.filter(m => m.id !== id) }))
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">{t.admin.nav.messages}</h2>
        <button onClick={addMessage} className="btn-primary text-sm">
          + Ajouter un message
        </button>
      </div>
      <div className="space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className="rounded-lg border border-slate/10 p-4">
            <div className="mb-3 flex gap-3">
              <input
                className="input-field flex-1"
                value={msg.title}
                onChange={e => updateMessage(msg.id, 'title', e.target.value)}
                placeholder="Titre du message"
              />
              <input
                className="input-field w-28"
                value={msg.tag || ''}
                onChange={e => updateMessage(msg.id, 'tag', e.target.value)}
                placeholder="Tag"
              />
              <input
                type="date"
                className="input-field w-36"
                value={msg.date || ''}
                onChange={e => updateMessage(msg.id, 'date', e.target.value)}
              />
              <button
                onClick={() => deleteMessage(msg.id)}
                className="text-sm text-danger hover:underline"
              >
                ✕
              </button>
            </div>
            <textarea
              className="input-field w-full"
              rows={4}
              value={msg.body}
              onChange={e => updateMessage(msg.id, 'body', e.target.value)}
              placeholder="Corps du message (Markdown supporté : **gras**, *italique*, [lien](url))"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
