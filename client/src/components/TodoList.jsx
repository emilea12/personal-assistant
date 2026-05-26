import { useState } from 'react'

export default function TodoList({ todos, loading, onUpdate }) {
  const [pendingIds, setPendingIds] = useState(new Set())

  function sortedTodos(list) {
    if (!list) return []
    const incomplete = list.filter((t) => !t.complete)
    const complete = list.filter((t) => t.complete)
    const stale = incomplete.filter((t) => t.stale)
    const fresh = incomplete.filter((t) => !t.stale)
    return [...stale, ...fresh, ...complete]
  }

  async function handleToggle(todo) {
    const id = todo.id
    setPendingIds((prev) => new Set([...prev, id]))
    try {
      await fetch(`/api/todos/${id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath: todo.filePath,
          lineNumber: todo.lineNumber,
          complete: !todo.complete,
        }),
      })
      onUpdate()
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  async function handleDelete(todo) {
    const id = todo.id
    setPendingIds((prev) => new Set([...prev, id]))
    try {
      await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath: todo.filePath,
          lineNumber: todo.lineNumber,
        }),
      })
      onUpdate()
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const sorted = sortedTodos(todos)

  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <h2 className="text-lg font-semibold text-white mb-4">Todos</h2>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="skeleton w-5 h-5 rounded-full flex-shrink-0" />
              <div className="skeleton h-4 flex-1" />
            </div>
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <p className="text-gray-500 text-sm">No todos found</p>
      ) : (
        <ul className="space-y-1">
          {sorted.map((todo) => {
            const pending = pendingIds.has(todo.id)
            return (
              <li
                key={todo.id}
                className="group flex items-start gap-3 py-1.5 px-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                {/* Checkbox */}
                <button
                  onClick={() => handleToggle(todo)}
                  disabled={pending}
                  className={[
                    'mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all',
                    pending ? 'opacity-50' : '',
                    todo.complete
                      ? 'bg-indigo-600 border-indigo-600'
                      : 'border-gray-600 hover:border-indigo-500',
                  ].join(' ')}
                >
                  {todo.complete && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-sm ${
                        todo.complete
                          ? 'line-through text-gray-500'
                          : 'text-gray-200'
                      }`}
                    >
                      {todo.text}
                    </span>
                    {todo.stale && !todo.complete && (
                      <span className="text-xs bg-amber-900 text-amber-300 rounded px-1.5 py-0.5">
                        STALE
                      </span>
                    )}
                    {todo.daysSince != null && (
                      <span className="text-xs bg-gray-800 text-gray-500 rounded px-1 py-0.5">
                        {todo.daysSince}d
                      </span>
                    )}
                  </div>
                  {todo.sourceFile && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {todo.sourceFile}
                    </p>
                  )}
                </div>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(todo)}
                  disabled={pending}
                  className="opacity-0 group-hover:opacity-100 ml-1 flex-shrink-0 text-gray-600 hover:text-red-400 transition-all text-lg leading-none disabled:opacity-30"
                  title="Delete todo"
                >
                  ×
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
