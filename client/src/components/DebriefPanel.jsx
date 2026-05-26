export default function DebriefPanel({ debrief, loading, onRefresh }) {
  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Debrief</h2>
        <button
          onClick={onRefresh}
          disabled={loading}
          title="Refresh debrief"
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-5/6" />
          <div className="skeleton h-4 w-4/6" />
          <div className="skeleton h-3 w-1/3 mt-4" />
          <div className="skeleton h-4 w-2/3" />
        </div>
      ) : !debrief ? (
        <p className="text-gray-500 text-sm">No notes found in this window</p>
      ) : (
        <div className="space-y-4">
          {debrief.summary && (
            <p className="text-gray-300 text-sm leading-relaxed">
              {debrief.summary}
            </p>
          )}

          {debrief.stateOfMind && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 uppercase tracking-wide">
                State of mind
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-900 text-indigo-300">
                {debrief.stateOfMind}
              </span>
            </div>
          )}

          {debrief.activeProjects && debrief.activeProjects.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                Active Projects
              </p>
              <ul className="space-y-1">
                {debrief.activeProjects.map((project, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                    {project}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
