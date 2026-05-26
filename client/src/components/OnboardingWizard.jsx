import { useState } from 'react'
import DirectoryBrowser from './DirectoryBrowser'

const STEPS = ['welcome', 'provider', 'apikey', 'vault', 'tour', 'done']

const TOUR_FEATURES = [
  { icon: '🧠', title: 'Daily Debrief',   desc: "The AI reads your recent notes and generates a summary of your state of mind, active projects, and what you've been focused on — automatically every time you open the app." },
  { icon: '🌱', title: 'Life Pillars',    desc: "See at a glance how you're doing across Health, Projects, Relationships, Mindset, and Spirituality — scored and summarised from what you've actually been writing about." },
  { icon: '✅', title: 'Smart Todos',     desc: 'Todos are extracted from your notes automatically. The app tracks how long each has been on your list and flags ones that keep showing up without getting done.' },
  { icon: '🎯', title: 'Goal Tracker',   desc: "Weekly goals are pulled from your weekly notes. Progress is inferred from your todos so you can see what's on track without manually updating anything." },
  { icon: '💬', title: 'Chat with AI',   desc: 'The AI already knows your full vault context. Ask it anything, or say "delete that task" / "add a note" — it takes real action directly in your Obsidian files.' },
  { icon: '🎤', title: 'Voice Updates',  desc: 'Hit the mic button and speak an update — it gets written to your daily note in Obsidian automatically. Works in Chrome and Edge.' },
  { icon: '📅', title: 'Time Window',    desc: 'Toggle between 3 days, 1 week, 2 weeks, or 1 month. Every section — debrief, todos, goals, chat context — reruns based on the window you select.' },
]

const PROVIDERS = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    icon: '✦',
    badge: 'Free tier',
    badgeColor: 'bg-emerald-900 text-emerald-300',
    desc: 'Gemini 2.0 Flash. Fast, capable, and free for personal use. Just needs a free Google account — no credit card.',
  },
  {
    id: 'local',
    name: 'Local AI (Ollama)',
    icon: '🖥️',
    badge: 'Free & offline',
    badgeColor: 'bg-blue-900 text-blue-300',
    desc: 'Run open-source models (Llama, Mistral, Qwen…) entirely on your Mac. No internet, no accounts, nothing leaves your machine.',
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    icon: '◆',
    badge: 'Pay per use',
    badgeColor: 'bg-amber-900 text-amber-300',
    desc: 'Claude Sonnet — highest quality for journal analysis and nuanced writing. ~$1–2/month for typical personal use.',
  },
]

const POPULAR_MODELS = ['llama3.2', 'llama3.1', 'mistral', 'qwen2.5', 'phi4', 'gemma3']

export default function OnboardingWizard({ existingConfig, onComplete }) {
  const [step, setStep]           = useState(0)
  const [provider, setProvider]   = useState(existingConfig?.provider || 'gemini')
  const [apiKey, setApiKey]       = useState('')
  const [showKey, setShowKey]     = useState(false)
  const [localApiUrl, setLocalApiUrl] = useState(existingConfig?.localApiUrl || 'http://localhost:11434/v1')
  const [localModel, setLocalModel]   = useState(existingConfig?.localModel  || 'llama3.2')
  const [testStatus, setTestStatus]   = useState(null) // null | 'testing' | { ok, models?, error? }
  const [vaultPath, setVaultPath] = useState(existingConfig?.vaultPath || '')
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState(null)

  const stepId       = STEPS[step]
  const progress     = (step / (STEPS.length - 1)) * 100
  const activeP      = PROVIDERS.find(p => p.id === provider)

  // Skip apikey step for local (replace with local config)
  // We reuse the same 'apikey' step but render differently based on provider

  async function testLocalConnection() {
    setTestStatus('testing')
    try {
      const res = await fetch('/api/config/test-local', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiUrl: localApiUrl }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setTestStatus({ ok: true, models: data.models })
    } catch (err) {
      setTestStatus({ ok: false, error: err.message })
    }
  }

  async function saveAndFinish() {
    setSaving(true)
    setError(null)
    try {
      const body = { provider }
      if (provider === 'local') {
        body.localApiUrl = localApiUrl
        body.localModel  = localModel
      } else if (apiKey) {
        body[provider === 'gemini' ? 'geminiApiKey' : 'anthropicApiKey'] = apiKey
      }
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
      if (provider === 'local') {
        if (!localApiUrl) { setError('Enter the API URL for your local AI.'); return }
        if (!localModel)  { setError('Enter a model name.'); return }
      } else {
        if (!apiKey && !existingConfig?.hasApiKey) {
          setError('Please enter your API key to continue.')
          return
        }
        if (apiKey && provider === 'anthropic' && !apiKey.startsWith('sk-ant-')) {
          setError('Anthropic key should start with sk-ant-')
          return
        }
      }
    }

    if (stepId === 'vault') {
      if (!vaultPath) { setError('Please select your Obsidian vault folder.'); return }
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
              <div className="grid grid-cols-3 gap-4 mb-10">
                {[{ icon: '📓', label: 'Reads your Obsidian notes' }, { icon: '🤖', label: 'Powered by AI' }, { icon: '🔒', label: 'Fully local & private' }].map(item => (
                  <div key={item.label} className="bg-gray-800 rounded-xl p-4 flex flex-col items-center gap-2">
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-sm text-gray-300 text-center">{item.label}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setStep(1)} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-base transition-colors">
                Get Started →
              </button>
            </div>
          )}

          {/* ── Provider ── */}
          {stepId === 'provider' && (
            <div className="p-8">
              <div className="text-4xl mb-4">🤖</div>
              <h2 className="text-2xl font-bold text-white mb-2">Choose your AI</h2>
              <p className="text-gray-400 text-sm mb-6">
                Powers the debrief, life pillars analysis, and chat. You can switch this anytime from Settings.
              </p>
              <div className="space-y-3">
                {PROVIDERS.map(p => (
                  <button key={p.id} onClick={() => setProvider(p.id)}
                    className={['w-full text-left rounded-xl border p-4 transition-all', provider === p.id ? 'border-indigo-500 bg-indigo-950/50' : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'].join(' ')}>
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
                      <div className={['w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 transition-colors', provider === p.id ? 'border-indigo-500 bg-indigo-500' : 'border-gray-600'].join(' ')} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── API Key OR Local config ── */}
          {stepId === 'apikey' && provider !== 'local' && (
            <div className="p-8">
              <div className="text-4xl mb-4">🔑</div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {provider === 'gemini' ? 'Gemini API Key' : 'Anthropic API Key'}
              </h2>
              <p className="text-gray-400 text-sm mb-1">Your key is stored locally and only used to call {activeP?.name}'s API.</p>
              <a href={provider === 'gemini' ? 'https://aistudio.google.com/app/apikey' : 'https://console.anthropic.com/account/keys'}
                target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 text-sm underline inline-block mb-6">
                {provider === 'gemini' ? 'Get a free key from Google AI Studio →' : 'Get a key from console.anthropic.com →'}
              </a>
              {existingConfig?.hasApiKey && !apiKey && (
                <div className="bg-emerald-900/40 border border-emerald-800 rounded-lg px-4 py-3 text-emerald-300 text-sm mb-4">
                  ✓ A key is already saved. Leave blank to keep it.
                </div>
              )}
              <div className="relative">
                <input type={showKey ? 'text' : 'password'} value={apiKey} onChange={e => setApiKey(e.target.value)}
                  placeholder={provider === 'gemini' ? 'AIza…' : 'sk-ant-…'}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-gray-200 text-sm font-mono placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-600 pr-16" />
                <button type="button" onClick={() => setShowKey(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xs px-1">
                  {showKey ? 'Hide' : 'Show'}
                </button>
              </div>
              {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
            </div>
          )}

          {stepId === 'apikey' && provider === 'local' && (
            <div className="p-8">
              <div className="text-4xl mb-4">🖥️</div>
              <h2 className="text-2xl font-bold text-white mb-2">Local AI Setup</h2>

              {/* Install instructions */}
              <div className="bg-gray-800 rounded-xl p-4 mb-6 space-y-2">
                <p className="text-xs font-semibold text-gray-300 uppercase tracking-wide mb-3">Setup (if not already installed)</p>
                <div className="space-y-1.5">
                  {[
                    { n: '1', label: 'Install Ollama', sub: 'ollama.com — free, open source, runs on Mac/Linux/Windows' },
                    { n: '2', label: 'Pull a model', sub: 'Run in your terminal:', code: `ollama pull ${localModel}` },
                    { n: '3', label: 'Ollama starts automatically', sub: 'It runs in the background — no extra steps needed' },
                  ].map(s => (
                    <div key={s.n} className="flex gap-3">
                      <span className="w-5 h-5 rounded-full bg-indigo-700 text-indigo-200 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{s.n}</span>
                      <div>
                        <p className="text-sm text-gray-200">{s.label}</p>
                        <p className="text-xs text-gray-500">{s.sub}</p>
                        {s.code && <code className="text-xs bg-gray-700 text-emerald-300 px-2 py-0.5 rounded mt-1 inline-block font-mono">{s.code}</code>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* URL */}
              <div className="mb-4">
                <label className="block text-xs text-gray-400 font-medium mb-1.5">API URL</label>
                <div className="flex gap-2">
                  <input value={localApiUrl} onChange={e => { setLocalApiUrl(e.target.value); setTestStatus(null) }}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-gray-200 text-sm font-mono placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    placeholder="http://localhost:11434/v1" />
                  <button onClick={testLocalConnection} disabled={testStatus === 'testing'}
                    className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors flex-shrink-0">
                    {testStatus === 'testing' ? 'Testing…' : 'Test'}
                  </button>
                </div>
                {testStatus && testStatus !== 'testing' && (
                  <p className={`text-xs mt-2 ${testStatus.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                    {testStatus.ok
                      ? `✓ Connected — ${testStatus.models?.length || 0} model(s) available`
                      : `✗ ${testStatus.error}`}
                  </p>
                )}
                <p className="text-xs text-gray-600 mt-1">Default Ollama port · LM Studio uses port 1234</p>
              </div>

              {/* Model */}
              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1.5">Model</label>
                <input value={localModel} onChange={e => setLocalModel(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-gray-200 text-sm font-mono placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-600 mb-2"
                  placeholder="llama3.2" />
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_MODELS.map(m => (
                    <button key={m} onClick={() => setLocalModel(m)}
                      className={['text-xs px-2.5 py-1 rounded-lg transition-colors', localModel === m ? 'bg-indigo-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'].join(' ')}>
                      {m}
                    </button>
                  ))}
                </div>
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
                Select the root folder of your Obsidian vault. The app reads your daily notes (<code className="bg-gray-800 px-1 rounded text-gray-300">YYYY-MM-DD.md</code>), weekly notes, and any notes modified within your time window.
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
              <p className="text-gray-400 text-sm mb-8">Config saved. The dashboard is loading your notes now.</p>
              <button onClick={onComplete} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-base transition-colors">
                Open Dashboard →
              </button>
            </div>
          )}

          {/* Footer */}
          {stepId !== 'welcome' && stepId !== 'done' && (
            <div className="flex items-center justify-between px-8 py-5 border-t border-gray-800 bg-gray-800/30">
              <button onClick={() => { setError(null); setStep(s => s - 1) }} className="text-gray-400 hover:text-white text-sm transition-colors">
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
