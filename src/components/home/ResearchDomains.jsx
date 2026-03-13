import { Link } from 'react-router-dom'
import { ArrowRight, Share2, Atom, Microscope, Globe } from 'lucide-react'

const domains = [
  {
    name: 'Biotechnology',
    icon: Share2,
    image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?q=80&w=2070&auto=format&fit=crop',
  },
  {
    name: 'Quantum Physics',
    icon: Atom,
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2070&auto=format&fit=crop',
  },
  {
    name: 'Material Science',
    icon: Microscope,
    image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=2070&auto=format&fit=crop',
  },
  {
    name: 'Sustainable Energy',
    icon: Globe,
    image: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?q=80&w=2070&auto=format&fit=crop',
  },
]

export default function ResearchDomains() {
  return (
    <section className="bg-black py-24">
      <div className="max-w-screen-xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-end justify-between mb-2">
          <h2 className="text-5xl font-black uppercase text-white">Research Domains</h2>
          <Link
            to="/areas"
            className="flex items-center gap-2 text-[#CAFC02] text-xs font-bold tracking-[0.2em] uppercase hover:opacity-80 transition-opacity"
          >
            View All Areas <ArrowRight size={14} />
          </Link>
        </div>
        <div className="w-full h-px bg-gray-700 mb-12" />

        {/* Domain Cards */}
        <div className="grid grid-cols-4 gap-4">
          {domains.map((domain) => {
            const Icon = domain.icon
            return (
              <div
                key={domain.name}
                className="relative h-80 overflow-hidden cursor-pointer group"
              >
                {/* Background image */}
                <div
                  className="absolute inset-0 bg-cover bg-center grayscale transition-transform duration-500 group-hover:scale-105"
                  style={{ backgroundImage: `url('${domain.image}')` }}
                />
                {/* Dark overlay */}
                <div className="absolute inset-0 bg-black/55" />

                {/* Icon top-left */}
                <div className="absolute top-4 left-4">
                  <Icon size={20} className="text-white" />
                </div>

                {/* Label bottom-left */}
                <div className="absolute bottom-5 left-5">
                  <span className="text-white font-bold text-lg">{domain.name}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
