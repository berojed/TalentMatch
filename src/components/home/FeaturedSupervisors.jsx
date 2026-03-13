import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function FeaturedSupervisors() {
  const [supervisors, setSupervisors] = useState([])

  useEffect(() => {
    async function fetchSupervisors() {
      const { data, error } = await supabase
        .from('supervisors')
        .select(`
          user_id,
          first_name,
          last_name,
          department,
          institution,
          users!inner(user_id),
          projects(
            project_id,
            title,
            description,
            project_fields(
              fields_of_research(field_name)
            )
          )
        `)
        .limit(6)

      if (!error && data) setSupervisors(data)
    }

    fetchSupervisors()
  }, [])

  // Fallback sample data for display when DB has fewer records
  const displayData = supervisors.length > 0 ? supervisors : sampleSupervisors

  return (
    <section className="py-24 max-w-screen-xl mx-auto px-6">
      <h2 className="text-5xl font-black uppercase mb-2">Featured Supervisors</h2>
      <div className="w-full h-px bg-gray-200 mb-12" />

      <div className="grid grid-cols-3 gap-6">
        {displayData.map((sv, i) => {
          const name = sv.first_name
            ? `${sv.first_name} ${sv.last_name}`
            : sv.name
          const field = sv.field || sv.projects?.[0]?.project_fields?.[0]?.fields_of_research?.field_name || 'Research'
          const role = sv.role || sv.department || 'Researcher'
          const description = sv.description || sv.projects?.[0]?.description || ''

          return (
            <div
              key={sv.user_id || i}
              className="border border-gray-200 p-8 hover:border-gray-400 transition-colors cursor-pointer"
            >
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 block mb-4">
                {field}
              </span>
              <h3 className="font-bold text-lg mb-1">{name}</h3>
              <p className="text-sm text-gray-500 mb-6">{role}</p>
              <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{description}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

const sampleSupervisors = [
  {
    name: 'Dr. Elena Petrova',
    field: 'Computational Neuroscience',
    role: 'Senior Researcher',
    description:
      'Our lab focuses on developing novel computational models to understand complex brain functions and translate these insights into practical applications for neuro-rehabilitation.',
  },
  {
    name: 'Prof. Dr. Klaus Richter',
    field: 'Quantum Optics',
    role: 'Professor of Quantum Physics',
    description:
      'The Quantum Optics group investigates fundamental aspects of light-matter interaction at the quantum level, with applications in quantum computing and metrology.',
  },
  {
    name: 'Dr. Sofia Rossi',
    field: 'Environmental Engineering',
    role: 'Research Group Leader',
    description:
      'Our team develops innovative solutions for global water challenges, focusing on advanced filtration, resource recovery, and climate resilience in urban water systems.',
  },
  {
    name: 'Prof. Jean-Luc Dubois',
    field: 'Artificial Intelligence & Robotics',
    role: 'Distinguished Professor',
    description:
      'The AI & Robotics lab explores the frontiers of intelligent systems, focusing on autonomous navigation, learning from demonstration, and ethical AI.',
  },
  {
    name: 'Dr. Anya Sharma',
    field: 'Molecular Medicine and Surgery',
    role: 'Postdoctoral Fellow (Supervising)',
    description:
      'Our research focuses on identifying novel therapeutic targets for aggressive cancers using high-throughput genomic and proteomic approaches.',
  },
  {
    name: 'Prof. Marco Bianchi',
    field: 'Applied Mathematics and Theoretical Physics',
    role: 'Professor of Astrophysics',
    description:
      'The Astrophysics group uses theoretical models and numerical simulations to understand extreme astrophysical phenomena and the evolution of the universe.',
  },
]
