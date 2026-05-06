const stats = [
  { value: '150+', label: 'Research Supervisors' },
  { value: '25', label: 'Research Centers' },
  { value: '40+', label: 'Active Projects' },
  { value: '03', label: 'Degree Levels' },
]

export default function StatsBar() {
  return (
    <section className="border-y border-gray-200">
      <div className="grid grid-cols-2 sm:grid-cols-4">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className={`py-6 px-6 sm:py-10 sm:px-12 border-gray-200 ${i < stats.length - 1 ? 'sm:border-r' : ''} ${i < 2 ? 'border-b sm:border-b-0' : ''}`}
          >
            <div className="text-3xl sm:text-5xl font-black text-black mb-2">{stat.value}</div>
            <div className="text-xs font-semibold tracking-[0.15em] uppercase text-gray-500">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
