import { useState, useEffect } from 'react'

export default function DirectoryBrowser({ value, onChange }) {
  const [browsing, setBrowsing] = useState(false)
  const [currentPath, setCurrentPath] = useState(null)
  const [entries, setEntries] = useState([])
  const [parent, setParent] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function browse(path) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/config/browse?path=${encodeURIComponent(path)}`)
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
    browse(value || '~')
  }

  function selectFolder() {
    onChange(currentPath)
    setBrowsing(false)
  }

  return (
    <>
      {/* Trigger row */}
      <div className="flex gap-2">
        <div className="flex-1 bg-gray-800 rounded-lg px-3 py-2.5 text-sm text-gray-300 font-mono truncate border border-gray-700">
          {value || <span className="text-gray-500">No folder selected</span>}
        </div>
        <button
          type="button"
          onClick={openBrowser}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors flex-shrink-0"
        >
          Browse
        </button>
      </div>

      {/* Browser modal */}
      {browsing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg mx-4 flex flex-col overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <h3 className="font-semibold text-white">Select Obsidian Vault Folder</h3>
              <button
                onClick={() => setBrowsing(false)}
                className="text-gray-400 hover:text-white text-xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Current path */}
            <div className="px-5 py-2 bg-gray-800/50 border-b border-gray-800">
              <p className="text-xs text-gray-400 font-mono truncate">{currentPath || '…'}</p>
            </div>

            {/* Directory list */}
            <div className="flex-1 overflow-y-auto" style={{ maxHeight: '320px' }}>
              {loading ? (
                <div className="flex items-center justify-center py-12 text-gray-500 text-sm">Loading…</div>
              ) : error ? (
                <div className="px-5 py-4 text-red-400 text-sm">{error}</div>
              ) : (
                <ul className="py-1">
                  {parent && (
                    <li>
                      <button
                        onClick={() => browse(parent)}
                        className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-gray-800 transition-colors text-left text-sm text-gray-400"
                      >
                        <span className="text-lg">↑</span>
                        <span className="font-mono">..</span>
                      </button>
                    </li>
                  )}
                  {entries.length === 0 && (
                    <li className="px-5 py-4 text-gray-500 text-sm">No subdirectories</li>
                  )}
                  {entries.map((dir) => (
                    <li key={dir.path}>
                      <button
                        onClick={() => browse(dir.path)}
                        className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-gray-800 transition-colors text-left"
                      >
                        <span className="text-lg">📁</span>
                        <span className="text-sm text-gray-200">{dir.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-gray-800 bg-gray-800/30">
              <p className="text-xs text-gray-500 truncate flex-1">
                Selecting: <span className="text-gray-300 font-mono">{currentPath}</span>
              </p>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => setBrowsing(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={selectFolder}
                  disabled={!currentPath}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors"
                >
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
