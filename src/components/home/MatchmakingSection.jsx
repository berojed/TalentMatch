import { UserCheck, Microscope, Award } from 'lucide-react'

const steps = [
  {
    number: '01',
    icon: UserCheck,
    title: 'Submit Your Profile',
    description:
      'Share your academic background, research interests, skills, and experience. We focus solely on your knowledge and qualifications—no demographic data required.',
  },
  {
    number: '02',
    icon: Microscope,
    title: 'Algorithm Analysis',
    description:
      'Our intelligent matching system analyzes your expertise, research areas, and academic achievements to identify the most compatible supervisors and projects.',
  },
  {
    number: '03',
    icon: Award,
    title: 'Receive Matches',
    description:
      'Get a curated list of supervisors and projects ranked by compatibility. Review profiles, explore research opportunities, and connect directly.',
  },
]

export default function MatchmakingSection() {
  return (
    <section className="py-28 max-w-screen-xl mx-auto px-6">
      <div className="grid grid-cols-5 gap-16">
        {/* Left */}
        <div className="col-span-2">
          <h2 className="text-5xl font-black uppercase leading-tight mb-6">
            Bias-Free<br />Matchmaking
          </h2>
          <div className="w-12 h-1 bg-[#CAFC02] mb-8" />
          <p className="text-gray-500 text-sm leading-relaxed">
            An intelligent algorithm that connects candidates with supervisors based purely on
            knowledge, experience, and research compatibility.
          </p>
        </div>

        {/* Right – steps */}
        <div className="col-span-3 divide-y divide-gray-200">
          {steps.map((step) => {
            const Icon = step.icon
            return (
              <div key={step.number} className="py-10 flex gap-8 items-start">
                <span className="text-6xl font-black text-gray-100 leading-none select-none w-20 shrink-0">
                  {step.number}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Icon size={20} className="text-black" />
                    <h3 className="font-bold text-base">{step.title}</h3>
                  </div>
                  <p className="text-gray-500 text-sm leading-relaxed">{step.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
