import { useState } from 'react'
import { t } from '@digest/i18n'
import { useDigest } from '@digest/lib/context'
import { generateId } from '@digest/lib/utils'
import type { KeyMessage } from '@digest/lib/schema'

const WEATHER_ICONS = [
  { emoji: '☀️', label: 'Soleil' },
  { emoji: '🌤️', label: 'Éclaircies' },
  { emoji: '⛅', label: 'Nuageux' },
  { emoji: '🌧️', label: 'Pluie' },
  { emoji: '⛈️', label: 'Orage' },
  { emoji: '🌫️', label: 'Brouillard' },
  { emoji: '🚨', label: 'Alerte' },
  { emoji: '🔥', label: 'Urgence' },
  { emoji: '✅', label: 'OK' },
  { emoji: '⚠️', label: 'Attention' },
  { emoji: '🎯', label: 'Objectif' },
  { emoji: '🚀', label: 'Lancement' },
]

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
      icon: '☀️',
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
          <MessageCard
            key={msg.id}
            msg={msg}
            onUpdate={(field, value) => updateMessage(msg.id, field, value)}
            onDelete={() => deleteMessage(msg.id)}
          />
        ))}
      </div>
    </div>
  )
}

function MessageCard({ msg, onUpdate, onDelete }: {
  msg: KeyMessage
  onUpdate: (field: keyof KeyMessage, value: any) => void
  onDelete: () => void
}) {
  const [showPicker, setShowPicker] = useState(false)

  return (
    <div className="rounded-lg border border-slate/10 p-4">
      <div className="mb-3 flex items-start gap-3">
        {/* Icon display + picker */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-mist text-2xl transition-colors hover:bg-slate/10"
            title="Choisir une icône"
          >
            {msg.icon || '☀️'}
          </button>
          {showPicker && (
            <IconPicker
              selected={msg.icon}
              onSelect={icon => { onUpdate('icon', icon); setShowPicker(false) }}
              onClose={() => setShowPicker(false)}
            />
          )}
        </div>

        {/* Title + meta */}
        <div className="flex flex-1 flex-col gap-2">
          <input
            className="input-field w-full font-medium"
            value={msg.title}
            onChange={e => onUpdate('title', e.target.value)}
            placeholder="Titre du message"
          />
          <div className="flex gap-2">
            <input
              className="input-field flex-1"
              value={msg.tag || ''}
              onChange={e => onUpdate('tag', e.target.value)}
              placeholder="Tag"
            />
            <input
              type="date"
              className="input-field w-36"
              value={msg.date || ''}
              onChange={e => onUpdate('date', e.target.value)}
            />
          </div>
        </div>

        <button
          onClick={onDelete}
          className="flex-shrink-0 text-sm text-danger hover:underline"
        >
          ✕
        </button>
      </div>

      <textarea
        className="input-field w-full"
        rows={3}
        value={msg.body}
        onChange={e => onUpdate('body', e.target.value)}
        placeholder="Corps du message (Markdown supporté : **gras**, *italique*, [lien](url))"
      />
    </div>
  )
}

function IconPicker({ selected, onSelect, onClose }: {
  selected?: string
  onSelect: (icon: string) => void
  onClose: () => void
}) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute left-0 top-full z-50 mt-2 w-52 rounded-lg border border-slate/10 bg-white p-2 shadow-lg">
        <p className="mb-2 text-[10px] font-medium text-slate">Météo / Statut</p>
        <div className="grid grid-cols-4 gap-1">
          {WEATHER_ICONS.map(({ emoji, label }) => (
            <button
              key={emoji}
              onClick={() => onSelect(emoji)}
              className="flex flex-col items-center gap-0.5 rounded-md p-1.5 transition-colors hover:bg-mist"
              style={{ boxShadow: emoji === selected ? '0 0 0 2px var(--color-accent)' : undefined }}
              title={label}
            >
              <span className="text-xl">{emoji}</span>
              <span className="text-[8px] text-slate">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
