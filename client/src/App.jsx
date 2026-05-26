import { useState, useEffect, useCallback } from 'react'
import Header from './components/Header'
import LifePillarsPanel from './components/LifePillarsPanel'
import DebriefPanel from './components/DebriefPanel'
import TodoList from './components/TodoList'
import GoalsPanel from './components/GoalsPanel'
import ChatPanel from './components/ChatPanel'

const STORAGE_KEY = 'pa-window'

function getInitialWindow() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const n = parseInt(stored, 10)
      if ([3, 7, 14, 30].includes(n)) return n
    }
  } catch {
    // ignore
  }
  return 7
}

export default function App() {
  const [windowDays, setWindowDaysState] = useState(getInitialWindow)

  const [todos, setTodos] = useState([])
  const [goals, setGoals] = useState([])
  const [debrief, setDebrief] = useState(null)

  const [loadingTodos, setLoadingTodos] = useState(false)
  const [loadingGoals, setLoadingGoals] = useState(false)
  const [loadingDebrief, setLoadingDebrief] = useState(false)

  const [error, setError] = useState(null)

  function setWindowDays(days) {
    setWindowDaysState(days)
    try {
      localStorage.setItem(STORAGE_KEY, String(days))
    } catch {
      // ignore
    }
  }

  const fetchTodos = useCallback(async (days) => {
    setLoadingTodos(true)
    try {
      const res = await fetch(`/api/todos?window=${days}`)
      if (!res.ok) throw new Error(`Todos: HTTP ${res.status}`)
      const data = await res.json()
      setTodos(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingTodos(false)
    }
  }, [])

  const fetchGoals = useCallback(async (days) => {
    setLoadingGoals(true)
    try {
      const res = await fetch(`/api/goals?window=${days}`)
      if (!res.ok) throw new Error(`Goals: HTTP ${res.status}`)
      const data = await res.json()
      setGoals(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingGoals(false)
    }
  }, [])

  const fetchDebrief = useCallback(async (days) => {
    setLoadingDebrief(true)
    try {
      const res = await fetch('/api/debrief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ window: days }),
      })
      if (!res.ok) throw new Error(`Debrief: HTTP ${res.status}`)
      const data = await res.json()
      setDebrief(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingDebrief(false)
    }
  }, [])

  useEffect(() => {
    fetchTodos(windowDays)
    fetchGoals(windowDays)
    fetchDebrief(windowDays)
  }, [windowDays, fetchTodos, fetchGoals, fetchDebrief])

  function handleTodosUpdate() {
    fetchTodos(windowDays)
  }

  function handleDebriefRefresh() {
    fetchDebrief(windowDays)
  }

  return (
    <div className="min-h-screen">
      {/* Error toast */}
      {error && (
        <div className="fixed top-4 right-4 z-50 bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-xl text-sm shadow-lg flex items-center gap-3">
          <span>⚠ {error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-200 text-lg leading-none ml-2"
          >
            ×
          </button>
        </div>
      )}

      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <Header windowDays={windowDays} setWindowDays={setWindowDays} />

        <LifePillarsPanel debrief={debrief} loading={loadingDebrief} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left column */}
          <div className="flex flex-col gap-4">
            <DebriefPanel
              debrief={debrief}
              loading={loadingDebrief}
              onRefresh={handleDebriefRefresh}
            />
            <TodoList
              todos={todos}
              loading={loadingTodos}
              onUpdate={handleTodosUpdate}
            />
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4">
            <GoalsPanel goals={goals} loading={loadingGoals} />
            <ChatPanel windowDays={windowDays} />
          </div>
        </div>
      </div>
    </div>
  )
}
