import { useState, useRef, useEffect, useCallback, type FormEvent } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@shared/utils/cn'
import { ContextPanel } from './ContextPanel'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  thinking?: string
  files?: FileAttachment[]
}

interface FileAttachment {
  name: string
  size: number
  type: string
}

interface StreamEvent {
  timestamp: number
  type: string
  data: any
}

interface ConversationSummary {
  id: string
  title: string
  updatedAt: string
}

const API_URL = import.meta.env.VITE_API_URL || ''
const isStatic = !import.meta.env.VITE_API_URL && location.hostname.endsWith('github.io')

export default function ChatApp() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [events, setEvents] = useState<StreamEvent[]>([])
  const [showEvents, setShowEvents] = useState(false)
  const [showContext, setShowContext] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const eventsEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const loadConversations = useCallback(async () => {
    if (isStatic) return
    try {
      const res = await fetch(`${API_URL}/api/conversations`)
      if (res.ok) setConversations(await res.json())
    } catch { /* backend unreachable */ }
  }, [])

  useEffect(() => { loadConversations() }, [loadConversations])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (showEvents) eventsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [events, showEvents])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px'
    }
  }, [input])

  async function loadConversation(id: string) {
    const res = await fetch(`${API_URL}/api/conversations/${id}`)
    if (!res.ok) return
    const convo = await res.json()
    setActiveId(id)
    setMessages(convo.messages || [])
    setEvents([])
  }

  async function saveConversation(msgs: Message[]) {
    if (!activeId) {
      const title = msgs.find(m => m.role === 'user')?.content.slice(0, 50) || 'New conversation'
      const res = await fetch(`${API_URL}/api/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
      if (res.ok) {
        const convo = await res.json()
        setActiveId(convo.id)
        await fetch(`${API_URL}/api/conversations/${convo.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: msgs }),
        })
        loadConversations()
      }
    } else {
      await fetch(`${API_URL}/api/conversations/${activeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: msgs }),
      })
      loadConversations()
    }
  }

  async function deleteConversation(id: string) {
    await fetch(`${API_URL}/api/conversations/${id}`, { method: 'DELETE' })
    if (activeId === id) {
      setActiveId(null)
      setMessages([])
    }
    loadConversations()
  }

  function startNewConversation() {
    setActiveId(null)
    setMessages([])
    setEvents([])
  }

  function pushEvent(type: string, data: any) {
    setEvents(prev => [...prev, { timestamp: Date.now(), type, data }])
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!input.trim() && files.length === 0) return
    if (isStreaming) return
    if (isStatic) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      files: files.map(f => ({ name: f.name, size: f.size, type: f.type })),
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setIsStreaming(true)
    setEvents([])

    pushEvent('request', {
      model: 'claude-sonnet-5',
      messages_count: updatedMessages.length,
      files_count: files.length,
    })

    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      thinking: '',
    }
    setMessages([...updatedMessages, assistantMessage])

    try {
      const formData = new FormData()
      const chatMessages = updatedMessages.map(m => ({ role: m.role, content: m.content }))
      formData.append('messages', JSON.stringify(chatMessages))
      for (const file of files) {
        formData.append('files', file)
      }

      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Request failed')
      }

      pushEvent('stream_connected', { status: response.status })

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = JSON.parse(line.slice(6))

          if (data.type === 'text') {
            assistantMessage.content += data.text
            setMessages(prev => prev.map(m => m.id === assistantMessage.id ? { ...assistantMessage } : m))
          } else if (data.type === 'thinking') {
            assistantMessage.thinking = (assistantMessage.thinking || '') + data.text
            setMessages(prev => prev.map(m => m.id === assistantMessage.id ? { ...assistantMessage } : m))
          } else if (data.type === 'event') {
            pushEvent(data.event, data.data)
          } else if (data.type === 'error') {
            pushEvent('error', { message: data.error })
            throw new Error(data.error)
          } else if (data.type === 'done') {
            pushEvent('done', {})
          }
        }
      }

      const finalMessages = [...updatedMessages, { ...assistantMessage }]
      setMessages(finalMessages)
      await saveConversation(finalMessages)
    } catch (err: any) {
      pushEvent('error', { message: err.message })
      setMessages(prev => prev.map(m =>
        m.id === assistantMessage.id
          ? { ...m, content: m.content || `Error: ${err.message}` }
          : m
      ))
    } finally {
      setFiles([])
      setIsStreaming(false)
    }
  }

  function handleFileSelect() {
    fileInputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)])
    }
    e.target.value = ''
  }

  function removeFile(index: number) {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  function formatTime(ts: number): string {
    const d = new Date(ts)
    const ms = String(d.getMilliseconds()).padStart(3, '0')
    return d.toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + '.' + ms
  }

  function formatDate(iso: string): string {
    const d = new Date(iso)
    const now = new Date()
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    }
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  }

  function getEventColor(type: string): string {
    if (type === 'error') return 'text-danger'
    if (type === 'message_start') return 'text-gold'
    if (type === 'content_block_start' || type === 'content_block_stop') return 'text-accent'
    if (type === 'message_delta') return 'text-success'
    if (type === 'done') return 'text-success'
    return 'text-slate'
  }

  return (
    <div className="flex h-full">
      {/* History sidebar */}
      <div className="flex w-64 flex-col border-r border-slate/10 bg-mist/50">
        <div className="flex items-center justify-between border-b border-slate/10 px-4 py-3">
          <span className="text-xs font-medium uppercase tracking-wider text-slate">History</span>
          <button
            onClick={startNewConversation}
            className="rounded-md bg-ink px-2.5 py-1 text-xs font-medium text-white hover:bg-ink/80"
          >
            + New
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 && (
            <p className="px-4 py-6 text-center text-xs text-slate/50">No conversations yet</p>
          )}
          {conversations.map(convo => (
            <div
              key={convo.id}
              className={cn(
                'group flex items-start gap-2 border-b border-slate/5 px-4 py-2.5 cursor-pointer transition-colors',
                activeId === convo.id ? 'bg-white shadow-sm' : 'hover:bg-white/60'
              )}
              onClick={() => loadConversation(convo.id)}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{convo.title}</p>
                <p className="text-xs text-slate">{formatDate(convo.updatedAt)}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); deleteConversation(convo.id) }}
                className="mt-0.5 shrink-0 rounded p-1 text-slate/40 opacity-0 transition-opacity hover:bg-danger/10 hover:text-danger group-hover:opacity-100"
                title="Delete"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex flex-1 flex-col">
        {/* Chat toolbar */}
        <div className="flex items-center justify-end border-b border-slate/10 px-4 py-2">
          <button
            onClick={() => setShowContext(!showContext)}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              showContext ? 'bg-accent text-white' : 'text-slate hover:bg-mist hover:text-ink'
            )}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
              <path d="M8 11a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm0 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
            </svg>
            Context
          </button>
        </div>
        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {messages.length === 0 && (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="mb-3 text-4xl opacity-40">🤖</div>
                <h2 className="text-lg font-medium text-ink/70">Digital EM</h2>
                <p className="mt-1 text-sm text-slate">Your delivery assistant. Ask about projects, revenue, headcount, planning.</p>
                {isStatic && (
                  <div className="mt-4 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3">
                    <p className="text-sm text-warning font-medium">Backend requis</p>
                    <p className="mt-1 text-xs text-slate">Digital EM nécessite le serveur Express (API Claude + base de données). Déployez le backend sur Render pour activer cette fonctionnalité.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mx-auto max-w-3xl space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'max-w-[85%] rounded-2xl px-4 py-3 text-sm',
                  msg.role === 'user'
                    ? 'bg-ink text-white'
                    : 'border border-slate/10 bg-white shadow-card'
                )}>
                  {msg.files && msg.files.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {msg.files.map((f, i) => (
                        <span key={i} className="inline-flex items-center gap-1 rounded-md bg-white/20 px-2 py-0.5 text-xs">
                          📎 {f.name}
                        </span>
                      ))}
                    </div>
                  )}
                  {msg.thinking && (
                    <details className="mb-2">
                      <summary className="cursor-pointer text-xs text-slate opacity-70 hover:opacity-100">
                        Thinking...
                      </summary>
                      <pre className="mt-1 max-h-40 overflow-y-auto whitespace-pre-wrap text-xs text-slate/80">
                        {msg.thinking}
                      </pre>
                    </details>
                  )}
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none prose-headings:text-ink prose-p:text-ink prose-strong:text-ink prose-td:text-ink prose-th:text-ink prose-li:text-ink prose-a:text-accent prose-code:rounded prose-code:bg-mist prose-code:px-1 prose-code:py-0.5 prose-code:text-xs prose-pre:bg-mist prose-pre:text-xs prose-table:text-sm prose-th:border prose-th:border-slate/20 prose-th:bg-mist prose-th:px-3 prose-th:py-1.5 prose-td:border prose-td:border-slate/20 prose-td:px-3 prose-td:py-1.5">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  )}
                  {msg.role === 'assistant' && !msg.content && isStreaming && (
                    <span className="inline-block h-4 w-1 animate-pulse bg-ink/40" />
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input area */}
        <div className="border-t border-slate/10 bg-white px-4 py-3">
          <div className="mx-auto max-w-3xl">
            {files.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {files.map((file, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 rounded-lg border border-slate/15 bg-mist/50 px-2.5 py-1 text-xs text-ink">
                    📎 {file.name}
                    <span className="text-slate">({formatFileSize(file.size)})</span>
                    <button onClick={() => removeFile(i)} className="ml-0.5 text-slate hover:text-danger">×</button>
                  </span>
                ))}
              </div>
            )}
            <form onSubmit={handleSubmit} className="flex items-end gap-2">
              <button
                type="button"
                onClick={handleFileSelect}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate/15 text-slate transition-colors hover:border-gold/30 hover:text-ink"
                title="Attach file"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                </svg>
              </button>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Digital EM..."
                rows={1}
                className="input-field min-h-[40px] flex-1 resize-none"
                disabled={isStreaming}
              />
              <button
                type="button"
                onClick={() => setShowEvents(!showEvents)}
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-colors',
                  showEvents
                    ? 'border-gold/40 bg-gold/10 text-gold'
                    : 'border-slate/15 text-slate hover:border-gold/30 hover:text-ink'
                )}
                title="Toggle event stream"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                type="submit"
                disabled={isStreaming || (!input.trim() && files.length === 0)}
                className="btn-primary h-10 shrink-0 px-4 disabled:opacity-40"
              >
                {isStreaming ? '...' : 'Send'}
              </button>
            </form>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.txt,.md,.csv,.json,.js,.ts,.tsx,.py,.html,.css"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Context panel */}
      {showContext && (
        <div className="w-96">
          <ContextPanel onClose={() => setShowContext(false)} />
        </div>
      )}

      {/* Event stream panel */}
      {showEvents && (
        <div className="flex w-80 flex-col border-l border-slate/10 bg-ink">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
            <span className="text-xs font-medium uppercase tracking-wider text-white/70">Live Stream</span>
            <div className="flex items-center gap-2">
              {isStreaming && (
                <span className="flex items-center gap-1.5 text-xs text-success">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
                  Live
                </span>
              )}
              <button
                onClick={() => setEvents([])}
                className="text-xs text-white/40 hover:text-white/70"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 font-mono text-xs">
            {events.length === 0 && (
              <p className="text-white/30">Events will appear here when you send a message...</p>
            )}
            {events.map((evt, i) => (
              <div key={i} className="mb-1.5 leading-relaxed">
                <span className="text-white/30">{formatTime(evt.timestamp)}</span>{' '}
                <span className={cn('font-medium', getEventColor(evt.type))}>{evt.type}</span>
                {evt.data && Object.keys(evt.data).length > 0 && (
                  <div className="ml-4 mt-0.5 text-white/50">
                    {Object.entries(evt.data).map(([k, v]) => (
                      <div key={k}>
                        <span className="text-white/30">{k}:</span>{' '}
                        <span className="text-white/60">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={eventsEndRef} />
          </div>
        </div>
      )}
    </div>
  )
}
