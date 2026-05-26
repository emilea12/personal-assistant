import TimeWindowToggle from './TimeWindowToggle'

export default function Header({ windowDays, setWindowDays, onOpenSettings }) {
  return (
    <header className="flex items-center justify-between mb-6 gap-4">
      <div className="flex-shrink-0">
        <h1 className="text-2xl font-bold text-white tracking-tight">Personal Assistant</h1>
        <p className="text-sm text-gray-500 mt-0.5">Your Obsidian dashboard</p>
      </div>
      <div className="flex items-center gap-3">
        <TimeWindowToggle value={windowDays} onChange={setWindowDays} />
        <button
          onClick={onOpenSettings}
          title="Settings"
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors flex-shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </header>
  )
}
