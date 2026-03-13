import React from 'react'
import { BookOpenText, Search, UsersRound, Clock3, MapPin, Microscope } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getApplicantDashboardData } from '../../lib/applicantApi'

function StatCard({ title, value, description, icon: Icon }) {
  return (
    <article className="rounded border border-neutral-200 bg-white p-6">
      <div className="mb-4 flex items-start justify-between">
        <p className="text-sm uppercase tracking-wide text-neutral-500">{title}</p>
        <span className="rounded-full bg-neutral-100 p-2 text-neutral-700">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="text-5xl font-bold text-black">{value}</p>
      <p className="mt-2 text-base text-neutral-500">{description}</p>
    </article>
  )
}

function ProjectCard({ project }) {
  return (
    <article className="rounded border border-neutral-200 bg-white p-6">
      <p className="mb-4 inline-block bg-neutral-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-600">
        {project.department}
      </p>
      <h3 className="text-3xl font-bold leading-tight text-black">{project.title}</h3>
      <p className="mt-3 text-base leading-relaxed text-neutral-600">{project.summary}</p>

      <ul className="mt-5 space-y-2 text-sm text-neutral-500">
        <li className="flex items-center gap-2">
          <Clock3 className="h-4 w-4" />
          {project.duration}
        </li>
        <li className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {project.location}
        </li>
        <li className="flex items-center gap-2">
          <Microscope className="h-4 w-4" />
          {(project.tags || []).join(', ')}
        </li>
      </ul>

      <Link
        to={`/applicant/opportunities/${project.id}`}
        className="mt-5 inline-flex rounded bg-black px-5 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-neutral-800"
      >
        View Details
      </Link>
    </article>
  )
}

function SupervisorCard({ supervisor }) {
  return (
    <article className="rounded border border-neutral-200 bg-white p-6">
      <p className="mb-4 inline-block bg-neutral-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-600">
        {supervisor.domain}
      </p>
      <h3 className="text-3xl font-bold text-black">{supervisor.name}</h3>
      <p className="mt-2 text-lg text-neutral-500">{supervisor.title}</p>
      <p className="mt-6 text-base leading-relaxed text-neutral-600">{supervisor.summary}</p>
    </article>
  )
}

export default function ApplicantHome() {
  const [state, setState] = React.useState({
    loading: true,
    profile: null,
    stats: {
      totalApplications: 0,
      inReview: 0,
      accepted: 0,
    },
    recommendedProjects: [],
    featuredSupervisors: [],
  })

  React.useEffect(() => {
    let mounted = true

    getApplicantDashboardData().then((data) => {
      if (!mounted) {
        return
      }

      setState({
        loading: false,
        profile: data.profile,
        stats: data.stats,
        recommendedProjects: data.recommendedProjects,
        featuredSupervisors: data.featuredSupervisors,
      })
    })

    return () => {
      mounted = false
    }
  }, [])

  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 py-12 sm:px-8">
      <section>
        <h1 className="text-6xl font-bold tracking-tight text-black sm:text-7xl">
          Welcome back, {state.profile?.first_name || 'Applicant'}
        </h1>
        <p className="mt-3 text-2xl text-neutral-600">Quick overview of your research journey.</p>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <StatCard
            title="Total Applications"
            value={state.stats.totalApplications}
            description="Active and submitted applications"
            icon={BookOpenText}
          />
          <StatCard
            title="In Review"
            value={state.stats.inReview}
            description="Awaiting supervisor feedback"
            icon={Search}
          />
          <StatCard
            title="Accepted"
            value={state.stats.accepted}
            description="Ready to start your research"
            icon={UsersRound}
          />
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/applicant/applications"
            className="inline-flex rounded bg-black px-10 py-4 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-neutral-800"
          >
            View All Applications
          </Link>
        </div>
      </section>

      <section className="mt-20 border-t border-neutral-200 pt-14">
        <h2 className="text-6xl font-bold tracking-tight text-black sm:text-7xl">Recommended for You</h2>
        <div className="mt-8 grid gap-4 xl:grid-cols-3">
          {(state.recommendedProjects || []).map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </section>

      <section className="mt-20 border-t border-neutral-200 pt-14">
        <h2 className="text-6xl font-bold uppercase tracking-tight text-black sm:text-7xl">
          Featured Supervisors
        </h2>
        <div className="mt-8 grid gap-4 xl:grid-cols-3">
          {(state.featuredSupervisors || []).map((supervisor) => (
            <SupervisorCard key={supervisor.id} supervisor={supervisor} />
          ))}
        </div>
      </section>

      {state.loading && <p className="mt-8 text-base text-neutral-500">Loading dashboard...</p>}
    </main>
  )
}
