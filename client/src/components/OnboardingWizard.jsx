import { useState } from 'react'
import DirectoryBrowser from './DirectoryBrowser'

const STEPS = ['welcome', 'provider', 'apikey', 'vault', 'tour', 'done']

const TOUR_FEATURES = [
  { icon: '🧠', title: 'Daily Debrief', desc: "Claude reads your recent notes and generates a summary of your state of mind, active projects, and what you've been focused on — automatically every time you open the app." },
  { icon: '🌱', title: 'Life Pillars', desc: "See at a glance how you're doing across Health, Projects, Relationships, Mindset, and Spirituality — scored and summarised from what you've actually been writing about." },
  { icon: '✅', title: 'Smart Todos', desc: 'Todos are extracted from your notes automatically. The app tracks how long each has been on your list and flags ones that keep showing up without getting done.' },
  { icon: '🎯', title: 'Goal Tracker', desc: "Weekly goals are pulled from your weekly notes. Progress is inferred from your todos so you can see what's on track without manually updating anything." },
  { icon: '💬', title: 'Chat with AI', desc: 'The AI already knows your full vault context. Ask it anything about your notes, or say things like "delete that task" and "add a note" — it takes real action in your files.' },
  { icon: '🎤', title: 'Voice Updates', desc: 'Hit the mic button and speak an update — it gets written to your daily note in Obsidian automatically. Works in Chrome and Edge.' },
  { icon: '📅', title: 'Time Window', desc: 'Toggle between 3 days, 1 week, 2 weeks, or 1 month. Every section reruns based on the window you select.' },
]

const PROVIDERS = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    icon: '✦',
    badge: 'Free tier available',
    badgeColor: 'bg-emerald-900 text-emerald-300',
    desc: 'Gemini 2.0 Flash. Fast and capable. Free tier is generous enough for daily personal use — no credit card needed.',
    keyLabel: 'Gemini API Key',
    keyPlaceholder: 'AIza…',
    keyHint: 'Get a free key from Google AI Studio',
    keyLink: 'https://aistudio.google.com/app/apikey',
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    icon: '◆',
    badge: 'Pay per use',
    badgeColor: 'bg-amber-900 text-amber-300',
    desc: 'Claude Sonnet. Best quality for journal analysis and nuanced writing. ~$1–2/month for typical personal use.',
    keyLabel: 'Anthropic API Key',
    keyPlaceholder: 'sk-ant-…',
    keyHint: 'Get a key from console.anthropic.com',
    keyLink: 'https://console.anthropic.com/account/keys',
  },
]

export default function OnboardingWizard({ existingConfig, onComplete }) {
  const [step, setStep] = useState(0)
  const [provider, setProvider] = useState(existingConfig?.provider || 'gemini')
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [vaultPath, setVaultPath] = useState(existingConfig?.vaultPath || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const stepId = STEPS[step]
  const activeProvider = PROVIDERS.find(p => p.id === provider)
  const progress = (step / (STEPS.length - 1)) * 100

  async function saveAndFinish() {
    setSaving(true)
    setError(null)
    try {
      const body = { provider }
      if (apiKey) body[provider === 'gemini' ? 'geminiApiKey' : 'anthropicApiKey'] = apiKey
      if (vaultPath) body.vaultPath = vaultPath

      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onComplete()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function validateAndNext() {
    setError(null)

    if (stepId === 'apikey') {
      if (!apiKey && !existingConfig?.hasApiKey) {
        setError('Please enter your API key to continue.')
        return
      }
      if (apiKey && provider === 'anthropic' && !apiKey.startsWith('sk-ant-')) {
        setError('Anthropic key should start with sk-ant-')
        return
      }
      if (apiKey && provider === 'gemini' && apiKey.length < 20) {
        setError('That doesn\'t look like a valid Gemini key.')
        return
      }
    }

    if (stepId === 'vault') {
      if (!vaultPath) {
        setError('Please select your Obsidian vault folder.')
        return
      }
    }

    if (stepId === 'tour') {
      await saveAndFinish()
      return
    }

    setStep(s => s + 1)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950">
      <div className="w-full max-w-2xl mx-4">
        {/* Progress bar */}
        <div className="h-0.5 bg-gray-800 rounded-full mb-8 overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">

          {/* ── Welcome ── */}
          {stepId === 'welcome' && (
            <div className="p-10 text-center">
              <div className="text-6xl mb-6">🧘</div>
              <h1 className="text-3xl font-bold text-white mb-3">Your Personal Assistant</h1>
              <p className="text-gray-400 text-lg mb-2 leading-relaxed">
                A local dashboard that reads your Obsidian vault and helps you stay on top of your life.
              </p>
              <p className="text-gray-500 text-sm mb-10">Everything runs locally. Your notes never leave your machine.</p>
              <div className="grid grid-cols-3 gap-4 mb-10 text-left">
                {[
                  { icon: '📓', label: 'Reads your Obsidian notes' },
                  { icon: '🤖', label: 'Powered by AI' },
                  { icon: '🔒', label: 'Fully local & private' },
                ].map(item => (
                  <div key={item.label} className="bg-gray-800 rounded-xl p-4 flex flex-col items-center text-center gap-2">
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-sm text-gray-300">{item.label}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setStep(1)} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-base transition-colors">
                Get Started →
              </button>
            </div>
          )}

          {/* ── Provider selection ── */}
          {stepId === 'provider' && (
            <div className="p-8">
              <div className="text-4xl mb-4">🤖</div>
              <h2 className="text-2xl font-bold text-white mb-2">Choose your AI</h2>
              <p className="text-gray-400 text-sm mb-6">
                The AI is used to generate your daily debrief, analyse your life pillars, and power the chat. You can change this later.
              </p>
              <div className="space-y-3">
                {PROVIDERS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setProvider(p.id)}
                    className={[
                      'w-full text-left rounded-xl border p-4 transition-all',
                      provider === p.id
                        ? 'border-indigo-500 bg-indigo-950/50'
                        : 'border-gray-700 bg-gray-800/50 hover:border-gray-600',
                    ].join(' ')}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{p.icon}</span>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-white text-sm">{p.name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.badgeColor}`}>{p.badge}</span>
                          </div>
                          <p className="text-xs text-gray-400 leading-relaxed">{p.desc}</p>
                        </div>
                      </div>
                      <div className={[
                        'w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 transition-colors',
                        provider === p.id ? 'border-indigo-500 bg-indigo-500' : 'border-gray-600',
                      ].join(' ')} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── API Key ── */}
          {stepId === 'apikey' && activeProvider && (
            <div className="p-8">
              <div className="text-4xl mb-4">🔑</div>
              <h2 className="text-2xl font-bold text-white mb-2">{activeProvider.keyLabel}</h2>
              <p className="text-gray-400 text-sm mb-1">
                Your key is stored locally on this machine and only used to call {activeProvider.name}'s API.
              </p>
              <a href={activeProvider.keyLink} target="_blank" rel="noreferrer"
                className="text-indigo-400 hover:text-indigo-300 text-sm underline inline-block mb-6">
                {activeProvider.keyHint} →
              </a>

              {existingConfig?.hasApiKey && !apiKey && (
                <div className="bg-emerald-900/40 border border-emerald-800 rounded-lg px-4 py-3 text-emerald-300 text-sm mb-4">
                  ✓ A key is already saved. Leave blank to keep it, or enter a new one to replace it.
                </div>
              )}

              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder={existingConfig?.hasApiKey ? 'Leave blank to keep current key' : activeProvider.keyPlaceholder}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-gray-200 text-sm font-mono placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-600 pr-16"
                />
                <button type="button" onClick={() => setShowKey(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xs px-1">
                  {showKey ? 'Hide' : 'Show'}
                </button>
              </div>
              {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
            </div>
          )}

          {/* ── Vault ── */}
          {stepId === 'vault' && (
            <div className="p-8">
              <div className="text-4xl mb-4">📂</div>
              <h2 className="text-2xl font-bold text-white mb-2">Obsidian Vault Folder</h2>
              <p className="text-gray-400 text-sm mb-6">
                Select the root folder of your Obsidian vault. The app reads your daily notes (<code className="bg-gray-800 px-1 rounded text-gray-300">YYYY-MM-DD.md</code>), weekly notes, and any notes modified within your selected time window.
              </p>
              <DirectoryBrowser value={vaultPath} onChange={setVaultPath} />
              {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
            </div>
          )}

          {/* ── Tour ── */}
          {stepId === 'tour' && (
            <div className="p-8">
              <div className="text-4xl mb-4">🗺️</div>
              <h2 className="text-2xl font-bold text-white mb-2">What's in the Dashboard</h2>
              <p className="text-gray-400 text-sm mb-6">Here's a quick look at what you'll see once you launch.</p>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {TOUR_FEATURES.map(f => (
                  <div key={f.title} className="flex gap-4 bg-gray-800 rounded-xl px-4 py-3">
                    <span className="text-2xl flex-shrink-0 mt-0.5">{f.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-white mb-0.5">{f.title}</p>
                      <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
            </div>
          )}

          {/* ── Done ── */}
          {stepId === 'done' && (
            <div className="p-10 text-center">
              <div className="text-6xl mb-6">🚀</div>
              <h2 className="text-2xl font-bold text-white mb-3">You're all set</h2>
              <p className="text-gray-400 text-sm mb-8">Your vault and API key are saved. The dashboard is loading your notes now.</p>
              <button onClick={onComplete} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-base transition-colors">
                Open Dashboard →
              </button>
            </div>
          )}

          {/* Footer nav */}
          {stepId !== 'welcome' && stepId !== 'done' && (
            <div className="flex items-center justify-between px-8 py-5 border-t border-gray-800 bg-gray-800/30">
              <button onClick={() => { setError(null); setStep(s => s - 1) }}
                className="text-gray-400 hover:text-white text-sm transition-colors">
                ← Back
              </button>
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  {STEPS.slice(1, -1).map((s, i) => (
                    <div key={s} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === step - 1 ? 'bg-indigo-500' : 'bg-gray-700'}`} />
                  ))}
                </div>
                <button onClick={validateAndNext} disabled={saving}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors">
                  {saving ? 'Saving…' : stepId === 'tour' ? 'Launch Dashboard →' : 'Continue →'}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-600 mt-4">Step {step + 1} of {STEPS.length}</p>
      </div>
    </div>
  )
}
