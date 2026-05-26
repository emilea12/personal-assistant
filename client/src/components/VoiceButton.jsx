import { useState, useRef } from 'react'

export default function VoiceButton({ onTranscript, label }) {
  const [state, setState] = useState('idle') // 'idle' | 'listening' | 'done'
  const recognitionRef = useRef(null)

  const SpeechRecognition =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null

  if (!SpeechRecognition) {
    return (
      <button
        disabled
        title="Voice input requires Chrome or Edge"
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-800 text-gray-600 text-sm cursor-not-allowed opacity-60"
      >
        <span>🎤</span>
        {label && <span>{label}</span>}
      </button>
    )
  }

  function handleClick() {
    if (state === 'listening') {
      recognitionRef.current?.stop()
      setState('idle')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => setState('listening')

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      onTranscript(transcript)
      setState('done')
      setTimeout(() => setState('idle'), 1500)
    }

    recognition.onerror = () => setState('idle')
    recognition.onend = () => {
      if (state === 'listening') setState('idle')
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  const isListening = state === 'listening'

  return (
    <button
      onClick={handleClick}
      title={isListening ? 'Stop listening' : 'Start voice input'}
      className={[
        'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-all',
        isListening
          ? 'bg-red-900 text-red-300 animate-pulse'
          : state === 'done'
          ? 'bg-emerald-900 text-emerald-300'
          : 'bg-gray-800 text-gray-300 hover:bg-gray-700',
      ].join(' ')}
    >
      <span>🎤</span>
      {label && <span>{label}</span>}
      {isListening && <span className="text-xs">Listening…</span>}
    </button>
  )
}
