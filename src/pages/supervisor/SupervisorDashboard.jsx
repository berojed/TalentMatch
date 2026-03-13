import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, CheckCircle2, Users } from 'lucide-react'
import { getSupervisorDashboardData } from '../../lib/supervisorApi'

function StatusBadge({ status }) {
  if (status === 'ACCEPTED' || status === 'SHORTLISTED') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Accepted
      </span>
    )
  }
  if (status === 'REJECTED') {
    return (
      <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
        Rejected
      </span>
    )
  }
  return (
    <span className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-medium text-neutral-600">
      Pending
    </span>
  )
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
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
      </div>
    )
  }

  const { profile, stats, recentApplications } = data || {
    profile: { first_name: 'User' },
    stats: { newApplications: 0, shortlisted: 0, totalApplications: 0 },
    recentApplications: [],
  }

  const firstName = profile?.first_name || 'User'

  return (
    <main className="mx-auto max-w-[1500px] px-6 py-10 sm:px-10">
      {/* Welcome */}
      <h1 className="text-4xl font-bold tracking-tight text-black">
        Welcome back, {firstName}
      </h1>
      <p className="mt-1 text-neutral-500">
        Here&apos;s a summary of your research supervision activity.
      </p>

      {/* Stat cards */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="NEW APPLICATIONS"
          value={stats.newApplications}
          sub="Awaiting your review"
          icon={<Clock className="h-5 w-5 text-blue-500" />}
          to="/supervisor/applications?status=SUBMITTED"
        />
        <StatCard
          label="SHORTLISTED"
          value={stats.shortlisted}
          sub="Accepted candidates"
          icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
          to="/supervisor/applications?status=SHORTLISTED"
        />
        <StatCard
          label="ALL APPLICATIONS"
          value={stats.totalApplications}
          sub="Total submissions"
          icon={<Users className="h-5 w-5 text-neutral-500" />}
          to="/supervisor/applications?status=ALL"
        />
      </div>

      {/* Recent Applications */}
      <section className="mt-10 rounded-lg border border-neutral-200 bg-white">
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-5">
          <h2 className="text-xl font-bold">Recent Applications</h2>
          <Link
            to="/supervisor/applications"
            className="text-sm font-medium text-neutral-500 hover:text-black"
          >
            View all
          </Link>
        </div>

        {recentApplications.length === 0 ? (
          <p className="px-6 py-10 text-center text-neutral-400">
            No applications yet.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {recentApplications.map((app) => (
              <li
                key={app.application_id}
                className="flex items-center justify-between px-6 py-4"
              >
                <div>
                  <p className="font-semibold text-black">
                    {app.applicants?.first_name} {app.applicants?.last_name}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {app.degree_label ? `${app.degree_label} \u2022 ` : ''}
                    {app.applicant_email}
                  </p>
                  <p className="text-xs text-neutral-400">
                    Submitted{' '}
                    {new Date(app.submitted_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: '2-digit',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={app.status} />
                  <Link
                    to={`/supervisor/applications/${app.application_id}`}
                    className="rounded border border-neutral-200 px-4 py-1.5 text-sm font-medium transition hover:bg-neutral-100"
                  >
                    Review
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

function StatCard({ label, value, sub, icon, to }) {
  return (
    <Link
      to={to}
      className="flex items-start justify-between rounded-lg border border-neutral-200 bg-white p-6 transition hover:border-neutral-400 hover:shadow-sm"
    >
      <div>
        <p className="text-xs font-semibold tracking-wide text-neutral-500">
          {label}
        </p>
        <p className="mt-1 text-3xl font-bold text-black">{value}</p>
        <p className="mt-1 text-sm text-neutral-400">{sub}</p>
      </div>
      {icon}
    </Link>
  )
}
