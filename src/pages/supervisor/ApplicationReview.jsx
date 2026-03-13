import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Mail, Bookmark, Eye, Download } from 'lucide-react'
import {
  getApplicationById,
  updateApplicationStatus,
  getApplicationCvPath,
  getStorageFileUrls,
} from '../../lib/supervisorApi'

const STATUS_LABELS = {
  SUBMITTED: 'New',
  UNDER_REVIEW: 'In Review',
  SHORTLISTED: 'Shortlisted',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
}

const STATUS_COLORS = {
  SUBMITTED: 'text-neutral-600',
  UNDER_REVIEW: 'text-yellow-600',
  SHORTLISTED: 'text-blue-600',
  ACCEPTED: 'text-green-600',
  REJECTED: 'text-red-600',
  WITHDRAWN: 'text-neutral-400',
}

export default function ApplicationReview() {
  const { applicationId } = useParams()
  const [application, setApplication] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deciding, setDeciding] = useState(false)
  const [cvPath, setCvPath] = useState(null)
  const [cvLoading, setCvLoading] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const data = await getApplicationById(applicationId)
        setApplication(data)
        if (data) {
          const path = await getApplicationCvPath(data)
          setCvPath(path)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [applicationId])

  const handleCvAction = async (mode) => {
    setCvLoading(true)
    try {
      const urls = await getStorageFileUrls(cvPath)
      const url = mode === 'view' ? urls.viewUrl : urls.downloadUrl
      if (url) window.open(url, '_blank')
    } finally {
      setCvLoading(false)
    }
  }

  const handleDecision = async (status) => {
    setDeciding(true)
    try {
      await updateApplicationStatus(applicationId, status)
      setApplication((prev) => ({ ...prev, status }))
    } finally {
      setDeciding(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
      </div>
    )
  }

  if (!application) {
    return (
      <main className="mx-auto max-w-[1100px] px-6 py-10">
        <Link
          to="/supervisor/applications"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-black"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <p className="mt-8 text-neutral-500">Application not found.</p>
      </main>
    )
  }

  const {
    applicants,
    projects,
    applicant_email,
    degree_label,
    status,
    submitted_at,
    message,
  } = application

  const applicantName =
    `${applicants?.first_name || ''} ${applicants?.last_name || ''}`.trim()
  const appliedDate = new Date(submitted_at).toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  })

  const isPending = status === 'SUBMITTED' || status === 'UNDER_REVIEW'

  return (
    <main className="mx-auto max-w-[1100px] px-6 py-10">
      {/* Back */}
      <Link
        to="/supervisor/applications"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-black mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="flex gap-7 items-start">
        {/* ── Left: application content ── */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Applicant header card */}
          <div className="rounded-lg border border-neutral-200 bg-white p-7">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-3xl font-bold text-black">{applicantName}</h1>
                <p className="mt-1 text-sm text-neutral-500">
                  {degree_label ? `${degree_label} Applicant` : 'Applicant'}
                  {applicants?.institution ? ` \u2022 ${applicants.institution}` : ''}
                </p>

                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-neutral-500">
                  {applicant_email && (
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-4 w-4 shrink-0" />
                      {applicant_email}
                    </span>
                  )}
                  <span>Applied {appliedDate}</span>
                </div>

                {projects?.title && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase">
                      Opportunity
                    </p>
                    <p className="mt-0.5 text-sm text-black">{projects.title}</p>
                  </div>
                )}
              </div>

              <button
                className="mt-1 shrink-0 text-neutral-300 hover:text-black transition"
                title="Bookmark"
              >
                <Bookmark className="h-5 w-5" />
              </button>
            </div>

            {status && (
              <div className="mt-4 pt-4 border-t border-neutral-100">
                <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase">
                  Status
                </p>
                <p
                  className={`mt-0.5 text-sm font-semibold ${STATUS_COLORS[status] || 'text-neutral-600'}`}
                >
                  {STATUS_LABELS[status] || status}
                </p>
              </div>
            )}
          </div>

          {/* Cover letter */}
          {message && (
            <div className="rounded-lg border border-neutral-200 bg-white p-7">
              <h2 className="font-semibold text-black mb-4">Cover Letter</h2>
              <div className="text-sm leading-relaxed text-neutral-700 whitespace-pre-wrap">
                {message}
              </div>
            </div>
          )}

          {/* CV */}
          <div className="rounded-lg border border-neutral-200 bg-white p-7">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-black">Curriculum Vitae</h2>
                <p className="mt-0.5 text-sm text-neutral-500">PDF document</p>
              </div>
              <div className="flex gap-2">
                <button
                  disabled={!cvPath || cvLoading}
                  onClick={() => handleCvAction('view')}
                  className="flex items-center gap-1.5 rounded border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition disabled:opacity-40"
                >
                  <Eye className="h-4 w-4" /> View
                </button>
                <button
                  disabled={!cvPath || cvLoading}
                  onClick={() => handleCvAction('download')}
                  className="flex items-center gap-1.5 rounded border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition disabled:opacity-40"
                >
                  <Download className="h-4 w-4" /> Download
                </button>
              </div>
            </div>
          </div>

          {/* Research interests / previous experience */}
          {applicants?.interests && (
            <div className="rounded-lg border border-neutral-200 bg-white p-7">
              <h2 className="font-semibold text-black mb-4">Previous Experience</h2>
              <p className="text-sm leading-relaxed text-neutral-600">
                {applicants.interests}
              </p>
            </div>
          )}
        </div>

        {/* ── Right: Decision sidebar (sticky) ── */}
        <div className="w-72 shrink-0 sticky top-6">
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <h2 className="font-semibold text-black mb-4">Your Decision</h2>

            {isPending ? (
              <div className="space-y-2">
                <button
                  onClick={() => handleDecision('ACCEPTED')}
                  disabled={deciding}
                  className="w-full rounded border border-neutral-300 px-4 py-3 text-sm text-black hover:bg-neutral-50 transition disabled:opacity-50"
                >
                  Accept to next stage
                </button>
                <button
                  onClick={() => handleDecision('REJECTED')}
                  disabled={deciding}
                  className="w-full rounded border border-neutral-300 px-4 py-3 text-sm text-black hover:bg-neutral-50 transition disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            ) : (
              <div className="text-center">
                <p
                  className={`text-sm font-semibold ${STATUS_COLORS[status] || 'text-neutral-600'}`}
                >
                  {STATUS_LABELS[status] || status}
                </p>
                <button
                  onClick={() => handleDecision('SUBMITTED')}
                  className="mt-3 text-xs text-neutral-400 hover:text-black underline transition"
                >
                  Undo decision
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
