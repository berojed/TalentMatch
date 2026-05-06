import React from 'react'
import { Briefcase, Check, MapPin, Trash2, User, X } from 'lucide-react'
import { discardApplication, getApplications } from '../../lib/applicantApi'
import { StatusBadge } from '../../components/ui/Badge'

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'UNDER_REVIEW', label: 'In Review' },
  { key: 'ACCEPTED', label: 'Accepted' },
  { key: 'REJECTED', label: 'Rejected' },
]

const TIMELINE = [
  { key: 'SUBMITTED', label: 'Submitted' },
  { key: 'UNDER_REVIEW', label: 'Under Review' },
  { key: 'SHORTLISTED', label: 'Shortlisted' },
  { key: 'decision', label: 'Decision' },
]

function getStepIndex(status) {
  const s = String(status || '').toUpperCase()
  if (s === 'SUBMITTED') return 0
  if (s === 'UNDER_REVIEW') return 1
  if (s === 'SHORTLISTED') return 2
  if (s === 'ACCEPTED' || s === 'REJECTED') return 3
  return 0
}

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })
}

function ApplicationCard({ application, onDiscard }) {
  const status = String(application.status || '').toUpperCase()
  const stepIndex = getStepIndex(status)
  const isRejected = status === 'REJECTED'
  const project = application.projects || {}
  const idShort = (application.application_id || application.id || '')
    .toString()
    .toUpperCase()
    .slice(0, 8)

  return (
    <article className="rounded-DEFAULT border border-line bg-card p-5">
      {/* Header */}
      <div className="mb-3.5 flex flex-col justify-between gap-3 border-b border-line pb-3.5 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <h3 className="mb-1.5 text-[14px] font-semibold leading-[1.3] text-ink">
            {project.title || 'Untitled project'}
          </h3>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-ink-2">
            {project.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-2.5 w-2.5" />
                {project.location}
              </span>
            )}
            {project.supervisor_name && (
              <span className="inline-flex items-center gap-1">
                <User className="h-2.5 w-2.5" />
                {project.supervisor_name}
              </span>
            )}
            {project.department && (
              <span className="inline-flex items-center gap-1">
                <Briefcase className="h-2.5 w-2.5" />
                {project.department}
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StatusBadge status={status} />
          <button
            type="button"
            onClick={onDiscard}
            className="inline-flex items-center gap-1 rounded-sm px-2 py-1 text-[12px] text-ink-2 transition-colors hover:text-danger"
          >
            <Trash2 className="h-3 w-3" />
            Discard
          </button>
        </div>
      </div>

      {/* Horizontal stepper */}
      <div className="flex items-center gap-0">
        {TIMELINE.map((ts, i) => {
          const active = i <= stepIndex
          const isLast = i === TIMELINE.length - 1
          const isCurrent = i === stepIndex
          const showRejectIcon = isRejected && isCurrent
          return (
            <React.Fragment key={ts.key}>
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={[
                    'flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2 transition-all',
                    active
                      ? showRejectIcon
                        ? 'bg-danger border-danger text-white'
                        : 'bg-ink border-ink text-white'
                      : 'bg-subtle border-line text-transparent',
                  ].join(' ')}
                >
                  {active &&
                    (showRejectIcon ? (
                      <X className="h-2.5 w-2.5" />
                    ) : (
                      <Check className="h-2.5 w-2.5" />
                    ))}
                </div>
                <span
                  className={[
                    'whitespace-nowrap text-[10px]',
                    active ? 'font-medium text-ink' : 'text-ink-3',
                  ].join(' ')}
                >
                  {ts.label}
                </span>
              </div>
              {!isLast && (
                <div
                  className={[
                    'mb-[14px] mx-1 h-0.5 flex-1',
                    i < stepIndex ? 'bg-ink' : 'bg-line',
                  ].join(' ')}
                />
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* Footer */}
      <div className="mt-3.5 flex justify-between text-[11px] text-ink-3">
        <span>ID: #{idShort}</span>
        <span>Submitted {formatDate(application.submitted_at)}</span>
      </div>
    </article>
  )
}

export default function Applications() {
  const [activeTab, setActiveTab] = React.useState('all')
  const [applications, setApplications] = React.useState([])
  const [loading, setLoading] = React.useState(true)

  const fetchApplications = React.useCallback(async () => {
    setLoading(true)
    const data = await getApplications(activeTab)
    setApplications(data)
    setLoading(false)
  }, [activeTab])

  React.useEffect(() => {
    fetchApplications()
  }, [fetchApplications])

  const handleDiscard = async (applicationId) => {
    await discardApplication(applicationId)
    fetchApplications()
  }

  return (
    <div className="px-6 py-8 sm:px-9 lg:max-w-[900px]">
      <header className="fade-up mb-6">
        <h1 className="text-[22px] font-bold tracking-tightish">My Applications</h1>
        <p className="mt-1 text-[13px] text-ink-2">
          Track the status of all your submitted applications.
        </p>
      </header>

      <div className="fade-up fade-up-1 mb-5 flex flex-wrap gap-1.5">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={[
              'rounded-full border px-3.5 py-1 text-[12px] font-medium transition-colors',
              activeTab === tab.key
                ? 'border-ink bg-ink text-white'
                : 'border-line bg-card text-ink-2 hover:border-line-strong',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="fade-up fade-up-2 flex flex-col gap-3">
        {loading && <p className="text-[13px] text-ink-3">Loading applications…</p>}

        {!loading && !applications.length && (
          <div className="rounded-DEFAULT border border-line bg-card px-5 py-10 text-center text-[13px] text-ink-3">
            No applications found for this filter.
          </div>
        )}

        {applications.map((application) => (
          <ApplicationCard
            key={application.application_id || application.id}
            application={application}
            onDiscard={() =>
              handleDiscard(application.application_id || application.id)
            }
          />
        ))}
      </div>
    </div>
  )
}
