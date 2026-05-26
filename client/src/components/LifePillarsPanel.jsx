const PILLARS = [
  { key: 'health', label: 'Health', icon: '💪' },
  { key: 'projects', label: 'Projects', icon: '🔨' },
  { key: 'relationships', label: 'Relationships', icon: '💬' },
  { key: 'mindset', label: 'Mindset', icon: '🧠' },
  { key: 'spirituality', label: 'Spirituality', icon: '🌿' },
]

function scoreColor(score) {
  if (!score || score === 0) return 'bg-gray-700'
  if (score <= 2) return 'bg-amber-600'
  if (score === 3) return 'bg-yellow-500'
  return 'bg-emerald-500'
}

export default function LifePillarsPanel({ debrief, loading }) {
  const pillars = debrief?.pillars || {}

  return (
    <div className="flex gap-3 mb-6">
      {PILLARS.map((pillar) => {
        const data = pillars[pillar.key] || {}
        const score = data.score ?? 0
        const summary = data.summary || ''
        const fillPct = Math.min(100, Math.max(0, (score / 5) * 100))

        return (
          <div
            key={pillar.key}
            className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex-1 min-w-0"
          >
            {loading ? (
              <div className="space-y-2">
                <div className="skeleton h-6 w-6 rounded" />
                <div className="skeleton h-3 w-16" />
                <div className="skeleton h-2 w-full rounded-full" />
                <div className="skeleton h-3 w-full" />
              </div>
            ) : (
              <>
                <div className="text-2xl mb-1">{pillar.icon}</div>
                <p className="text-xs font-medium text-gray-300 mb-2">
                  {pillar.label}
                </p>
                <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${scoreColor(score)}`}
                    style={{ width: `${fillPct}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 leading-tight line-clamp-2">
                  {summary || 'No data'}
                </p>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
