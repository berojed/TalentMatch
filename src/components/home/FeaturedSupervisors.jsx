import { useEffect, useState } from 'react'
import { getFeaturedSupervisors } from '../../lib/applicantApi'

export default function FeaturedSupervisors() {
  const [supervisors, setSupervisors] = useState([])

  useEffect(() => {
    getFeaturedSupervisors(6).then(setSupervisors)
  }, [])

  if (!supervisors.length) {
    return (
      <section className="py-16 sm:py-24 max-w-screen-xl mx-auto px-4 sm:px-6">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase mb-2">Featured Supervisors</h2>
        <div className="w-full h-px bg-gray-200 mb-12" />
        <p className="text-center text-gray-500">No supervisors to display yet.</p>
      </section>
    )
  }

  return (
    <section className="py-16 sm:py-24 max-w-screen-xl mx-auto px-4 sm:px-6">
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase mb-2">Featured Supervisors</h2>
      <div className="w-full h-px bg-gray-200 mb-12" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {supervisors.map((sv) => (
          <div
            key={sv.id}
            className="border border-gray-200 p-6 sm:p-8 hover:border-gray-400 transition-colors cursor-pointer"
          >
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 block mb-4">
              {sv.domain}
            </span>
            <h3 className="font-bold text-lg mb-1">{sv.name}</h3>
            <p className="text-sm text-gray-500 mb-6">{sv.title}</p>
            <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{sv.summary}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
