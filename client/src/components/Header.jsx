import TimeWindowToggle from './TimeWindowToggle'

export default function Header({ windowDays, setWindowDays }) {
  return (
    <header className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Personal Assistant
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Your Obsidian dashboard</p>
      </div>
      <TimeWindowToggle value={windowDays} onChange={setWindowDays} />
    </header>
  )
}
