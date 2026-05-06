import React from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Eye, MapPin } from 'lucide-react'
import { getApplicantDashboardData, getApplications } from '../../lib/applicantApi'
import StatCard from '../../components/ui/StatCard'
import Badge, { StatusBadge } from '../../components/ui/Badge'

function formatSubmitted(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function ApplicationRow({ app, isFirst }) {
  const project = app.projects || {}
  return (
    <div
      className={[
        'flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5',
        isFirst ? '' : 'border-t border-line',
      ].join(' ')}
    >
      <div className="min-w-0">
        <div className="truncate text-[13px] font-medium text-ink">
          {project.title || app.project_title || 'Untitled project'}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-ink-3">
          {project.department && <span>{project.department}</span>}
          {project.department && app.submitted_at && <span>•</span>}
          {app.submitted_at && <span>{formatSubmitted(app.submitted_at)}</span>}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2.5">
        <StatusBadge status={app.status} />
        <Link
          to="/applicant_dashboard/applications"
          className="inline-flex items-center gap-1 rounded-sm px-2 py-1 text-[12px] text-ink-2 transition-colors hover:text-ink"
        >
          <Eye className="h-3.5 w-3.5" /> Review
        </Link>
      </div>
    </div>
  )
}

function ProjectMiniCard({ project }) {
  const tags = project.tags || []
  const compensation = project.is_paid ? 'Paid' : 'Unpaid'
  return (
    <Link
      to={`/applicant_dashboard/opportunities/${project.id}`}
      className="block rounded-DEFAULT border border-line bg-card p-4 transition-all hover:border-line-strong hover:shadow-card"
    >
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider2 text-ink-3">
        {project.department || 'Research'}
      </div>
      <div className="mb-2.5 line-clamp-2 text-[13px] font-semibold leading-[1.4] text-ink">
        {project.title}
      </div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {tags.slice(0, 2).map((t) => (
          <Badge key={t}>{t}</Badge>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-[11px] text-ink-3">
          <MapPin className="h-3 w-3" /> {project.location || '—'}
        </span>
        <Badge variant={project.is_paid ? 'green' : 'neutral'}>{compensation}</Badge>
      </div>
    </Link>
  )
}

export default function ApplicantHome() {
  const [state, setState] = React.useState({
    loading: true,
    profile: null,
    stats: { totalApplications: 0, inReview: 0, accepted: 0 },
    recommendedProjects: [],
    recentApplications: [],
  })

  React.useEffect(() => {
    let mounted = true
    Promise.all([getApplicantDashboardData(), getApplications('all')])
      .then(([dashboard, apps]) => {
        if (!mounted) return
        setState({
          loading: false,
          profile: dashboard.profile,
          stats: dashboard.stats,
          recommendedProjects: dashboard.recommendedProjects || [],
          recentApplications: (apps || []).slice(0, 3),
        })
      })
      .catch(() => {
        if (mounted) setState((prev) => ({ ...prev, loading: false }))
      })
    return () => {
      mounted = false
    }
  }, [])

  const firstName = state.profile?.first_name || 'there'

  return (
    <div className="px-6 py-8 sm:px-9 lg:max-w-[1000px]">
      <header className="fade-up mb-8">
        <h1 className="text-[22px] font-bold tracking-tightish">Welcome back, {firstName}</h1>
        <p className="mt-1 text-[13px] text-ink-2">
          Here&apos;s an overview of your research journey.
        </p>
      </header>

      <section className="fade-up fade-up-1 mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label="Total Applications"
          value={state.stats.totalApplications}
          sub="Active & submitted"
        />
        <StatCard
          label="In Review"
          value={state.stats.inReview}
          sub="Awaiting feedback"
        />
        <StatCard
          label="Accepted"
          value={state.stats.accepted}
          sub="Ready to start"
          accent
        />
      </section>

      <section className="fade-up fade-up-2 mb-8">
        <div className="mb-3.5 flex items-center justify-between">
          <h2 className="text-[14px] font-semibold">Recent Applications</h2>
          <Link
            to="/applicant_dashboard/applications"
            className="inline-flex items-center gap-1 text-[12px] text-ink-3 hover:text-ink"
          >
            View all <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="overflow-hidden rounded-DEFAULT border border-line bg-card">
          {state.recentApplications.length === 0 ? (
            <div className="px-5 py-8 text-center text-[13px] text-ink-3">
              {state.loading ? 'Loading…' : 'No applications yet.'}
            </div>
          ) : (
            state.recentApplications.map((app, i) => (
              <ApplicationRow
                key={app.application_id || app.id || i}
                app={app}
                isFirst={i === 0}
              />
            ))
          )}
        </div>
      </section>

      <section className="fade-up fade-up-3">
        <div className="mb-3.5 flex items-center justify-between">
          <h2 className="text-[14px] font-semibold">Recommended for You</h2>
          <Link
            to="/applicant_dashboard/opportunities"
            className="inline-flex items-center gap-1 text-[12px] text-ink-3 hover:text-ink"
          >
            Browse all <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {state.recommendedProjects.map((project) => (
            <ProjectMiniCard key={project.id} project={project} />
          ))}
          {state.recommendedProjects.length === 0 && !state.loading && (
            <div className="col-span-full rounded-DEFAULT border border-line bg-card px-5 py-8 text-center text-[13px] text-ink-3">
              No recommended projects yet.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
