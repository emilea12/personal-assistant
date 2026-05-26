const OPTIONS = [
  { label: '3 days', days: 3 },
  { label: '1 week', days: 7 },
  { label: '2 weeks', days: 14 },
  { label: '1 month', days: 30 },
]

export default function TimeWindowToggle({ value, onChange }) {
  return (
    <div className="flex rounded-lg overflow-hidden border border-gray-700">
      {OPTIONS.map((opt, idx) => {
        const active = opt.days === value
        return (
          <button
            key={opt.days}
            onClick={() => onChange(opt.days)}
            className={[
              'px-4 py-1.5 text-sm font-medium transition-colors',
              idx !== 0 ? 'border-l border-gray-700' : '',
              active
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-gray-200',
            ].join(' ')}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
