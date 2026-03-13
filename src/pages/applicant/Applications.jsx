import React from 'react'
import { BriefcaseBusiness, MapPin, Trash2, UserRound } from 'lucide-react'
import { discardApplication, getApplications } from '../../lib/applicantApi'

const tabs = [
  { key: 'all', label: 'All Applications' },
  { key: 'in_review', label: 'In Review' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'rejected', label: 'Rejected' },
]

const timelineSteps = [
  { key: 'submitted', label: 'Application submitted' },
  { key: 'in_review', label: 'Your documents are being reviewed' },
  { key: 'supervisor_review', label: 'Supervisor is reviewing your application' },
  { key: 'decision', label: 'Accepted/Rejected' },
]

function getStepIndex(status) {
  if (status === 'submitted') {
    return 0
  }
  if (status === 'in_review') {
    return 1
  }
  if (status === 'accepted' || status === 'rejected') {
    return 3
  }
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
  const isRejected = application.status === 'rejected'

  return (
    <article className="rounded border border-neutral-200 bg-white p-8">
      <header className="flex flex-col justify-between gap-3 border-b border-neutral-200 pb-5 xl:flex-row xl:items-start">
        <div>
          <h3 className="text-5xl font-bold leading-tight text-black">{application.projects?.title}</h3>
          <div className="mt-4 flex flex-wrap gap-6 text-lg text-neutral-600">
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {application.projects?.location}
            </span>
            <span className="inline-flex items-center gap-2">
              <UserRound className="h-5 w-5" />
              {application.projects?.supervisor_name}
            </span>
            <span className="inline-flex items-center gap-2">
              <BriefcaseBusiness className="h-5 w-5" />
              {application.projects?.department}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onDiscard}
          className="inline-flex items-center gap-2 self-start rounded-full border border-red-400 px-4 py-2 text-base text-red-500 transition hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
          Discard
        </button>
      </header>

      <div className="mt-6 flex flex-col justify-between gap-6 xl:flex-row">
        <div>
          <p className="text-lg text-neutral-500">Application ID</p>
          <p className="text-3xl font-medium text-neutral-800">#{application.id}</p>
        </div>

        <div className="text-left xl:text-right">
          <p className="text-lg text-neutral-500">Submitted</p>
          <p className="text-3xl font-medium text-neutral-800">{formatDate(application.submitted_at)}</p>
        </div>
      </div>

      <ol className="mt-8 space-y-6">
        {timelineSteps.map((step, index) => {
          const active = index <= stepIndex
          const isFinal = step.key === 'decision' && (application.status === 'accepted' || isRejected)

          return (
            <li key={step.key} className="relative flex items-start gap-4 pl-2">
              <span
                className={`mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full border ${
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
                className={`text-2xl ${
                  active
                    ? isRejected && isFinal
                      ? 'text-red-500'
                      : 'text-yellow-600'
                    : 'text-neutral-500'
                }`}
              >
                {step.key === 'decision' && (application.status === 'accepted' || isRejected)
                  ? application.status === 'accepted'
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
  const [activeTab, setActiveTab] = React.useState('in_review')
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
    <main className="mx-auto w-full max-w-[1500px] px-4 py-12 sm:px-8">
      <h1 className="text-7xl font-bold tracking-tight text-black">My Applications</h1>
      <p className="mt-3 text-2xl text-neutral-600">Track the status of your submitted applications.</p>

      <div className="mt-8 flex flex-wrap gap-3">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-full border px-6 py-2 text-xl transition ${
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
            key={application.id}
            application={application}
            onDiscard={() => handleDiscard(application.id)}
          />
        ))}
      </section>
    </main>
  )
}
