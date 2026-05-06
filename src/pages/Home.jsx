import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Badge from '../components/ui/Badge'

const HERO_PROJECTS = [
  { dept: 'Computer Science', title: 'Machine Learning', loc: 'Berlin, DE', comp: 'Paid' },
  { dept: 'Physics', title: 'Quantum Computing', loc: 'Frankfurt, DE', comp: 'Paid' },
  { dept: 'Biology', title: 'Genomics Research', loc: 'Munich, DE', comp: 'Unpaid' },
  { dept: 'Earth Science', title: 'Climate Modelling', loc: 'Zurich, CH', comp: 'Paid' },
]

const STATS = [
  { v: '150+', l: 'Research Supervisors' },
  { v: '25', l: 'Research Centers' },
  { v: '40+', l: 'Active Projects' },
  { v: '3', l: 'Degree Levels' },
]

const STEPS = [
  {
    n: '01',
    title: 'Submit Your Profile',
    desc: 'Share your academic background, research interests, and skills. No demographic data required — pure merit.',
  },
  {
    n: '02',
    title: 'Algorithm Analysis',
    desc: 'Our intelligent system analyzes your expertise and research areas to identify the most compatible supervisors.',
  },
  {
    n: '03',
    title: 'Receive Matches',
    desc: 'Get a curated list ranked by compatibility. Review profiles, explore research, and connect directly.',
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-bg text-ink">
      <Navbar />

      {/* Hero */}
      <section className="mx-auto grid max-w-[1160px] grid-cols-1 items-center gap-12 px-6 pb-16 pt-20 md:grid-cols-2 md:gap-12 md:pt-24">
        <div className="fade-up">
          
          <h1 className="mb-6 text-[2.8rem] font-extrabold leading-[1.08] tracking-[-0.03em] sm:text-[4rem] lg:text-[5rem]">
            Match talent
            <br />
            <span className="text-ink-3">with research.</span>
          </h1>
          <p className="mb-9 max-w-[420px] text-[16px] leading-[1.65] text-ink-2">
            Connecting ambitious students with world-class research supervisors across the European
            scientific network. Bias-free, merit-driven matching.
          </p>
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/projects"
              className="inline-flex items-center gap-1.5 rounded-sm bg-ink px-5 py-2.5 text-[14px] font-medium text-white transition-opacity hover:opacity-85"
            >
              Browse Projects <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              to="/auth/signup"
              className="inline-flex items-center gap-1.5 rounded-sm border border-line bg-card px-5 py-2.5 text-[14px] font-medium text-ink transition-colors hover:border-line-strong"
            >
              Create Account
            </Link>
          </div>
        </div>

        <div className="fade-up fade-up-2 grid grid-cols-2 gap-3">
          {HERO_PROJECTS.map((p) => (
            <div
              key={p.title}
              className="rounded-DEFAULT border border-line bg-card p-4"
            >
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider2 text-ink-3">
                {p.dept}
              </div>
              <div className="mb-2.5 text-[13px] font-semibold leading-[1.35] text-ink">
                {p.title}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-ink-3">{p.loc}</span>
                <Badge variant={p.comp === 'Paid' ? 'green' : 'neutral'}>{p.comp}</Badge>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-line">
        <div className="mx-auto grid max-w-[1160px] grid-cols-2 sm:grid-cols-4">
          {STATS.map((s, i) => (
            <div
              key={s.l}
              className={[
                'px-8 py-7',
                i < STATS.length - 1 ? 'sm:border-r sm:border-line' : '',
                i < STATS.length - 2 && i % 2 === 0 ? 'border-r border-line sm:border-r' : '',
                i < 2 ? 'border-b border-line sm:border-b-0' : '',
              ].join(' ')}
            >
              <div className="mb-1 text-[36px] font-extrabold tracking-[-0.03em]">{s.v}</div>
              <div className="text-[11px] font-semibold uppercase tracking-wider2 text-ink-3">
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-[1160px] px-6 py-20">
        <div className="grid grid-cols-1 gap-16 md:grid-cols-[1fr_2fr]">
          <div>
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">
              How It Works
            </div>
            <h2 className="mb-4 text-[1.6rem] font-bold leading-[1.2] tracking-tightish sm:text-[2.4rem]">
              Bias-free
              <br />
              matchmaking
            </h2>
            <div className="h-[3px] w-8 rounded-[2px] bg-accent" />
            <p className="mt-4 max-w-[280px] text-[13px] leading-[1.7] text-ink-2">
              An intelligent algorithm that connects candidates with supervisors based purely on
              knowledge, experience, and research compatibility.
            </p>
          </div>
          <div>
            {STEPS.map((step, i) => (
              <div
                key={step.n}
                className={[
                  'flex items-start gap-6 py-7',
                  i < STEPS.length - 1 ? 'border-b border-line' : '',
                ].join(' ')}
              >
                <span className="min-w-[60px] text-[42px] font-extrabold leading-none text-line font-mono-tabular">
                  {step.n}
                </span>
                <div>
                  <div className="mb-1.5 font-semibold">{step.title}</div>
                  <div className="text-[13px] leading-[1.65] text-ink-2">{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="mx-auto max-w-[1160px] px-6 pb-20">
        <div className="flex flex-wrap items-center justify-between gap-8 rounded-lg bg-ink px-12 py-12">
          <div>
            <h3 className="mb-2 text-[24px] font-bold tracking-tightish text-white">
              Ready to find your research match?
            </h3>
            <p className="text-[14px] text-white/55">
              Join hundreds of students already matched with their ideal supervisors.
            </p>
          </div>
          <Link
            to="/auth/signup"
            className="inline-flex items-center gap-1.5 rounded-sm bg-accent px-5 py-2.5 text-[14px] font-semibold text-accent-fg transition-opacity hover:opacity-90"
          >
            Get Started Free <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
