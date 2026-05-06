import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { getSupervisorDashboardData } from '../../lib/supervisorApi'
import StatCard from '../../components/ui/StatCard'
import { StatusBadge } from '../../components/ui/Badge'

function formatSubmitted(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function SupervisorDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSupervisorDashboardData()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="spinner" />
      </div>
    )
  }

  const { profile, stats, recentApplications } = data || {
    profile: { first_name: 'User' },
    stats: { newApplications: 0, underReview: 0, accepted: 0, totalApplications: 0 },
    recentApplications: [],
  }

  const firstName = profile?.first_name || 'there'

  return (
    <div className="px-6 py-8 sm:px-9 lg:max-w-[1100px]">
      <header className="fade-up mb-8">
        <h1 className="text-[22px] font-bold tracking-tightish">Welcome back, {firstName}</h1>
        <p className="mt-1 text-[13px] text-ink-2">
          Here&apos;s a summary of your research supervision activity.
        </p>
      </header>

      <section className="fade-up fade-up-1 mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="New Applications"
          value={stats.newApplications}
          sub="Awaiting review"
        />
        <StatCard
          label="Under Review"
          value={stats.underReview}
          sub="In progress"
        />
        <StatCard
          label="Accepted"
          value={stats.accepted}
          sub="Shortlisted candidates"
          success
        />
        <StatCard
          label="Total Applications"
          value={stats.totalApplications}
          sub="All time"
        />
      </section>

      <section className="fade-up fade-up-2">
        <div className="mb-3.5 flex items-center justify-between">
          <h2 className="text-[14px] font-semibold">Recent Applications</h2>
          <Link
            to="/supervisor/applications"
            className="inline-flex items-center gap-1 text-[12px] text-ink-3 hover:text-ink"
          >
            View all <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="overflow-hidden rounded-DEFAULT border border-line bg-card">
          <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_auto] gap-3 border-b border-line px-5 py-2.5 sm:grid">
            {['Applicant', 'Project', 'Submitted', 'Status', ''].map((h, i) => (
              <div
                key={i}
                className="text-[10px] font-semibold uppercase tracking-wider2 text-ink-3"
              >
                {h}
              </div>
            ))}
          </div>

          {recentApplications.length === 0 ? (
            <div className="px-5 py-10 text-center text-[13px] text-ink-3">
              No applications yet.
            </div>
          ) : (
            recentApplications.map((app, i) => {
              const fullName = [app.applicants?.first_name, app.applicants?.last_name]
                .filter(Boolean)
                .join(' ')
              const projectTitle = app.projects?.title || app.project_title || ''
              return (
                <div
                  key={app.application_id}
                  className={[
                    'grid grid-cols-1 items-center gap-3 px-5 py-3 sm:grid-cols-[2fr_1fr_1fr_1fr_auto]',
                    i < recentApplications.length - 1 ? 'border-b border-line' : '',
                  ].join(' ')}
                >
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium text-ink">
                      {fullName || app.applicant_email || 'Applicant'}
                    </div>
                    <div className="text-[11px] text-ink-3">
                      {app.degree_label || app.applicant_email || ''}
                    </div>
                  </div>
                  <div className="truncate text-[12px] text-ink-2">
                    {projectTitle}
                  </div>
                  <div className="text-[12px] text-ink-3">
                    {formatSubmitted(app.submitted_at)}
                  </div>
                  <StatusBadge status={app.status} />
                  <Link
                    to={`/supervisor/applications/${app.application_id}`}
                    className="inline-flex items-center justify-center rounded-sm border border-line bg-card px-3 py-1.5 text-[12px] font-medium text-ink transition-colors hover:border-line-strong sm:justify-self-end"
                  >
                    Review
                  </Link>
                </div>
              )
            })
          )}
        </div>
      </section>
    </div>
  )
}
