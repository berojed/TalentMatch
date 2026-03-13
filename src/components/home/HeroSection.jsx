import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export default function HeroSection() {
  return (
    <section className="h-screen flex">
      {/* Left – dark content */}
      <div className="w-1/2 bg-black flex flex-col justify-center px-16 pt-16">
        <div className="flex items-center gap-2 mb-8">
          <span className="w-2 h-2 rounded-full bg-[#CAFC02]" />
          <span className="text-white text-xs font-semibold tracking-[0.2em] uppercase">
            Research Infrastructure Portal
          </span>
        </div>

        <h1 className="text-white font-black uppercase leading-none mb-8" style={{ fontSize: 'clamp(4rem, 8vw, 7rem)' }}>
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
        className="w-1/2 bg-gray-200 bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1466611653911-95081537e5b7?q=80&w=2070&auto=format&fit=crop')`,
          filter: 'grayscale(100%)',
        }}
      />
    </section>
  )
}
