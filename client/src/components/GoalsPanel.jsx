function StatusBadge({ status }) {
  if (status === 'complete') {
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-900 text-emerald-300">
        Done
      </span>
    )
  }
  if (status === 'in-progress') {
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-900 text-indigo-300">
        In progress
      </span>
    )
  }
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-gray-400">
      Unknown
    </span>
  )
}

export default function GoalsPanel({ goals, loading }) {
  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <h2 className="text-lg font-semibold text-white mb-4">Weekly Goals</h2>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between gap-3">
              <div className="skeleton h-4 flex-1" />
              <div className="skeleton h-5 w-20 rounded-full" />
            </div>
          ))}
        </div>
      ) : !goals || goals.length === 0 ? (
        <p className="text-gray-500 text-sm">No weekly goals found</p>
      ) : (
        <ul className="space-y-2">
          {goals.map((goal, i) => (
            <li
              key={goal.id ?? i}
              className="flex items-start justify-between gap-3 py-1"
            >
              <span
                className={`text-sm flex-1 ${
                  goal.status === 'complete'
                    ? 'text-gray-500 line-through'
                    : 'text-gray-200'
                }`}
              >
                {goal.text}
              </span>
              <StatusBadge status={goal.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
