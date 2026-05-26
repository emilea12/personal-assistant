import { useState, useRef, useEffect } from 'react'
import VoiceButton from './VoiceButton'

export default function ChatPanel({ windowDays }) {
  const [isOpen, setIsOpen] = useState(true)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [voiceNoteStatus, setVoiceNoteStatus] = useState(null) // null | 'saving' | 'saved' | 'error'
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  async function sendMessage(text) {
    const userMessage = { role: 'user', content: text }
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setInput('')
    setIsLoading(true)

    // Placeholder for streaming assistant message
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages, window: windowDays }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n\n')
        buffer = parts.pop() // keep incomplete chunk

        for (const part of parts) {
          const lines = part.split('\n')
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const raw = line.slice(6).trim()
            if (raw === '[DONE]') continue

            try {
              const chunk = JSON.parse(raw)
              if (chunk.type === 'text') {
                setMessages((prev) => {
                  const updated = [...prev]
                  const last = updated[updated.length - 1]
                  if (last && last.role === 'assistant') {
                    updated[updated.length - 1] = {
                      ...last,
                      content: last.content + chunk.text,
                    }
                  }
                  return updated
                })
              } else if (chunk.type === 'action') {
                setMessages((prev) => [
                  ...prev,
                  { role: 'action', content: chunk.message },
                ])
              }
            } catch {
              // ignore parse errors
            }
          }
        }
      }
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev]
        const last = updated[updated.length - 1]
        if (last && last.role === 'assistant' && last.content === '') {
          updated[updated.length - 1] = {
            ...last,
            content: `Error: ${err.message}`,
          }
        }
        return updated
      })
    } finally {
      setIsLoading(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text || isLoading) return
    sendMessage(text)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  async function handleVoiceNote(transcript) {
    setVoiceNoteStatus('saving')
    try {
      const res = await fetch('/api/notes/append', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: transcript }),
      })
      if (!res.ok) throw new Error('Failed to save')
      setVoiceNoteStatus('saved')
    } catch {
      setVoiceNoteStatus('error')
    } finally {
      setTimeout(() => setVoiceNoteStatus(null), 3000)
    }
  }

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
        <h2 className="text-lg font-semibold text-white">Chat</h2>
        <button
          onClick={() => setIsOpen((v) => !v)}
          className="text-gray-400 hover:text-white transition-colors text-sm px-2 py-1 rounded hover:bg-gray-800"
        >
          {isOpen ? '▲ Collapse' : '▼ Expand'}
        </button>
      </div>

      {isOpen && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[420px]">
            {messages.length === 0 && (
              <p className="text-gray-600 text-sm text-center mt-8">
                Ask anything about your notes…
              </p>
            )}
            {messages.map((msg, i) => {
              if (msg.role === 'action') {
                return (
                  <div
                    key={i}
                    className="bg-emerald-900/50 text-emerald-300 rounded-lg px-3 py-1 text-sm self-start inline-block"
                  >
                    ✓ {msg.content}
                  </div>
                )
              }
              return (
                <div
                  key={i}
                  className={`flex ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={[
                      'rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap break-words',
                      msg.role === 'user'
                        ? 'bg-indigo-700 text-white max-w-[80%]'
                        : 'bg-gray-800 text-gray-200 max-w-[80%]',
                    ].join(' ')}
                  >
                    {msg.content}
                    {msg.role === 'assistant' &&
                      msg.content === '' &&
                      isLoading && (
                        <span className="inline-flex gap-0.5 ml-1">
                          <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                          <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                          <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                        </span>
                      )}
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="border-t border-gray-800 p-3 space-y-2">
            {/* Voice note status */}
            {voiceNoteStatus && (
              <div
                className={`text-xs px-3 py-1.5 rounded-lg ${
                  voiceNoteStatus === 'saved'
                    ? 'bg-emerald-900 text-emerald-300'
                    : voiceNoteStatus === 'error'
                    ? 'bg-red-900 text-red-300'
                    : 'bg-gray-800 text-gray-400'
                }`}
              >
                {voiceNoteStatus === 'saving' && 'Saving voice note…'}
                {voiceNoteStatus === 'saved' && 'Voice note saved to Obsidian'}
                {voiceNoteStatus === 'error' && 'Failed to save voice note'}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Message… (Enter to send)"
                className="flex-1 bg-gray-800 text-gray-200 placeholder-gray-600 rounded-xl px-4 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-600"
                style={{ minHeight: '38px', maxHeight: '120px' }}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-colors flex-shrink-0"
              >
                Send
              </button>
            </form>

            <div className="flex items-center gap-2">
              <VoiceButton
                onTranscript={(t) => setInput((prev) => (prev ? prev + ' ' + t : t))}
                label="Voice chat"
              />
              <VoiceButton
                onTranscript={handleVoiceNote}
                label="Voice update"
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
