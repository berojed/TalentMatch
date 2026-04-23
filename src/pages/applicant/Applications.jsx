import React from 'react'
import { BriefcaseBusiness, MapPin, Trash2, UserRound } from 'lucide-react'
import { discardApplication, getApplications } from '../../lib/applicantApi'

const tabs = [
  { key: 'all', label: 'All Applications' },
  { key: 'UNDER_REVIEW', label: 'In Review' },
  { key: 'ACCEPTED', label: 'Accepted' },
  { key: 'REJECTED', label: 'Rejected' },
]

const timelineSteps = [
  { key: 'SUBMITTED', label: 'Application submitted' },
  { key: 'UNDER_REVIEW', label: 'Your documents are being reviewed' },
  { key: 'SHORTLISTED', label: 'Supervisor is reviewing your application' },
  { key: 'decision', label: 'Accepted/Rejected' },
]

function getStepIndex(status) {
  const s = String(status).toUpperCase()
  if (s === 'SUBMITTED') return 0
  if (s === 'UNDER_REVIEW') return 1
  if (s === 'SHORTLISTED') return 2
  if (s === 'ACCEPTED' || s === 'REJECTED') return 3
  return 0
}

function formatDate(dateValue) {
  if (!dateValue) {
    return '-'
  }

  return new Date(dateValue).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  })
}

function ApplicationCard({ application, onDiscard }) {
  const stepIndex = getStepIndex(application.status)
  const s = String(application.status).toUpperCase()
  const isRejected = s === 'REJECTED'

  return (
    <article className="rounded border border-neutral-200 bg-white p-6">
      <header className="flex flex-col justify-between gap-3 border-b border-neutral-200 pb-4 xl:flex-row xl:items-start">
        <div>
          <h3 className="text-lg font-bold leading-tight text-black">{application.projects?.title}</h3>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-neutral-500">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {application.projects?.location}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <UserRound className="h-4 w-4" />
              {application.projects?.supervisor_name || '—'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BriefcaseBusiness className="h-4 w-4" />
              {application.projects?.department}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onDiscard}
          className="inline-flex items-center gap-1.5 self-start rounded-full border border-red-400 px-3 py-1.5 text-sm text-red-500 transition hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
          Discard
        </button>
      </header>

      <div className="mt-4 flex flex-col justify-between gap-4 xl:flex-row">
        <div>
          <p className="text-xs text-neutral-500">Application ID</p>
          <p className="text-sm font-medium text-neutral-800">#{(application.application_id || application.id || '').slice(0, 8)}</p>
        </div>

        <div className="text-left xl:text-right">
          <p className="text-xs text-neutral-500">Submitted</p>
          <p className="text-sm font-medium text-neutral-800">{formatDate(application.submitted_at)}</p>
        </div>
      </div>

      <ol className="mt-6 space-y-4">
        {timelineSteps.map((step, index) => {
          const active = index <= stepIndex
          const isFinal = step.key === 'decision' && (s === 'ACCEPTED' || isRejected)

          return (
            <li key={step.key} className="relative flex items-start gap-3 pl-1">
              <span
                className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border ${
                  active
                    ? isRejected && isFinal
                      ? 'border-red-500 bg-red-500'
                      : 'border-yellow-500 bg-yellow-400'
                    : 'border-neutral-300 bg-white'
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-white" />
              </span>
              <p
                className={`text-sm ${
                  active
                    ? isRejected && isFinal
                      ? 'text-red-500'
                      : 'text-yellow-600'
                    : 'text-neutral-500'
                }`}
              >
                {step.key === 'decision' && (s === 'ACCEPTED' || isRejected)
                  ? s === 'ACCEPTED'
                    ? 'Accepted'
                    : 'Rejected'
                  : step.label}
              </p>
            </li>
          )
        })}
      </ol>
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
    <main className="mx-auto max-w-[1100px] px-6 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-black">My Applications</h1>
      <p className="mt-1 text-neutral-500">Track the status of your submitted applications.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-full border px-4 py-1.5 text-sm transition ${
              activeTab === tab.key
                ? 'border-yellow-500 bg-yellow-400 text-black'
                : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <section className="mt-8 space-y-4">
        {loading && <p className="text-base text-neutral-500">Loading applications...</p>}

        {!loading && !applications.length && (
          <p className="rounded border border-neutral-200 bg-white p-6 text-neutral-600">
            No applications found for this filter.
          </p>
        )}

        {applications.map((application) => (
          <ApplicationCard
            key={application.application_id || application.id}
            application={application}
            onDiscard={() => handleDiscard(application.application_id || application.id)}
          />
        ))}
      </section>
    </main>
  )
}
