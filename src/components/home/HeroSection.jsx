import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export default function HeroSection() {
  return (
    <section className="min-h-screen flex flex-col md:flex-row">
      {/* Left – dark content */}
      <div className="w-full md:w-1/2 bg-black flex flex-col justify-center px-6 sm:px-10 md:px-16 py-16 md:py-20">
        <div className="flex items-center gap-2 mb-8">
          <span className="w-2 h-2 rounded-full bg-[#CAFC02]" />
          <span className="text-white text-xs font-semibold tracking-[0.2em] uppercase">
            Research Infrastructure Portal
          </span>
        </div>

        <h1 className="text-white font-black uppercase leading-none mb-8" style={{ fontSize: 'clamp(2.5rem, 10vw, 7rem)' }}>
          GET<br />
          <span className="text-gray-500">INVOL</span>VED
        </h1>

        <p className="text-gray-400 text-base leading-relaxed max-w-xs mb-12">
          Connecting ambitious students with world-class research supervisors across the European scientific network.
        </p>

        <Link
          to="/projects"
          className="inline-flex items-center gap-3 bg-[#CAFC02] text-black font-bold text-sm tracking-widest uppercase px-7 py-4 w-fit hover:brightness-110 transition-all"
        >
          Find a Project
          <ArrowRight size={16} />
        </Link>
      </div>

      {/* Right – image */}
      <div
        className="w-full md:w-1/2 bg-gray-200 bg-cover bg-center min-h-[35vh] sm:min-h-[45vh] md:min-h-0"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1466611653911-95081537e5b7?q=80&w=2070&auto=format&fit=crop')`,
          filter: 'grayscale(100%)',
        }}
      />
    </section>
  )
}
