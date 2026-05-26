import { useState } from 'react'

function PathInput({ onGo }) {
  const [val, setVal] = useState('')
  return (
    <div className="flex gap-2 px-4 py-2.5 border-b border-gray-800 bg-gray-800/30">
      <input
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && val.trim()) { onGo(val.trim()); setVal('') } }}
        placeholder="Paste or type a path…"
        className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs font-mono text-gray-300 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
      />
      <button
        onClick={() => { if (val.trim()) { onGo(val.trim()); setVal('') } }}
        className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-xs transition-colors flex-shrink-0"
      >
        Go
      </button>
    </div>
  )
}

const SHORTCUTS = [
  { label: '🏠 Home',          path: '' },
  { label: '🖥️ Desktop',       path: '~/Desktop' },
  { label: '📄 Documents',     path: '~/Documents' },
  { label: '☁️ iCloud Drive',  path: '~/Library/Mobile Documents/com~apple~CloudDocs' },
  { label: '📱 Obsidian iCloud', path: '~/Library/Mobile Documents/iCloud~md~obsidian/Documents' },
]

export default function DirectoryBrowser({ value, onChange }) {
  const [browsing, setBrowsing]     = useState(false)
  const [currentPath, setCurrentPath] = useState(null)
  const [entries, setEntries]       = useState([])
  const [parent, setParent]         = useState(null)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState(null)

  async function browse(path) {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch(`/api/config/browse?path=${encodeURIComponent(path || '')}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCurrentPath(data.current)
      setEntries(data.dirs)
      setParent(data.parent)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function openBrowser() {
    setBrowsing(true)
    browse(value || '')
  }

  function selectFolder() {
    onChange(currentPath)
    setBrowsing(false)
  }

  return (
    <>
      <div className="flex gap-2">
        <div className="flex-1 bg-gray-800 rounded-lg px-3 py-2.5 text-sm text-gray-300 font-mono truncate border border-gray-700">
          {value || <span className="text-gray-500">No folder selected</span>}
        </div>
        <button type="button" onClick={openBrowser}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors flex-shrink-0">
          Browse
        </button>
      </div>

      {browsing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg mx-4 flex flex-col overflow-hidden shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <h3 className="font-semibold text-white">Select Obsidian Vault Folder</h3>
              <button onClick={() => setBrowsing(false)} className="text-gray-400 hover:text-white text-xl leading-none">×</button>
            </div>

            {/* Quick-access shortcuts */}
            <div className="px-4 py-3 border-b border-gray-800 flex flex-wrap gap-1.5">
              {SHORTCUTS.map(s => (
                <button key={s.label} onClick={() => browse(s.path)}
                  className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition-colors">
                  {s.label}
                </button>
              ))}
            </div>

            {/* Type-a-path input */}
            <PathInput onGo={browse} />

            {/* Current path breadcrumb */}
            <div className="px-5 py-2 bg-gray-800/50 border-b border-gray-800">
              <p className="text-xs text-gray-400 font-mono truncate">{currentPath || '…'}</p>
            </div>

            {/* Directory list */}
            <div className="overflow-y-auto" style={{ maxHeight: '300px' }}>
              {loading ? (
                <div className="flex items-center justify-center py-12 text-gray-500 text-sm">Loading…</div>
              ) : error ? (
                <div className="px-5 py-4 text-red-400 text-sm">
                  <p className="font-medium mb-1">Could not open folder</p>
                  <p className="text-red-500/80">{error}</p>
                </div>
              ) : (
                <ul className="py-1">
                  {parent && (
                    <li>
                      <button onClick={() => browse(parent)}
                        className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-gray-800 transition-colors text-left text-sm text-gray-400">
                        <span>↑</span>
                        <span className="font-mono">..</span>
                      </button>
                    </li>
                  )}
                  {!loading && entries.length === 0 && (
                    <li className="px-5 py-4 text-gray-500 text-sm">No subdirectories here</li>
                  )}
                  {entries.map(dir => (
                    <li key={dir.path}>
                      <button onClick={() => browse(dir.path)}
                        className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-gray-800 transition-colors text-left">
                        <span className="text-base">📁</span>
                        <span className="text-sm text-gray-200 truncate">{dir.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-gray-800 bg-gray-800/30">
              <p className="text-xs text-gray-500 truncate flex-1 min-w-0">
                <span className="font-mono text-gray-400">{currentPath || 'Nothing selected'}</span>
              </p>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => setBrowsing(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors">
                  Cancel
                </button>
                <button onClick={selectFolder} disabled={!currentPath}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors">
                  Select This Folder
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  )
}
