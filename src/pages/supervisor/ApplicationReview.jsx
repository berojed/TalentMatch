import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Mail, Bookmark } from 'lucide-react'
import {
  getApplicationById,
  updateApplicationStatus,
  toggleApplicationFavorite,
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
  const [favorited, setFavorited] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const data = await getApplicationById(applicationId)
        setApplication(data)
        if (data) {
          setFavorited(data.is_favorited || false)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [applicationId])

  const handleToggleFavorite = async () => {
    const next = !favorited
    setFavorited(next)
    try {
      await toggleApplicationFavorite(applicationId, next)
    } catch (err) {
      setFavorited(!next)
      console.error(err)
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

  const summary = applicants?.profile_summary || null
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
      <Link
        to="/supervisor/applications"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-black mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="flex gap-7 items-start">
        <div className="flex-1 min-w-0 space-y-4">
          {/* Applicant header card */}
          <div className="rounded-lg border border-neutral-200 bg-white p-7">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-3xl font-bold text-black">{applicantName}</h1>
                <p className="mt-1 text-sm text-neutral-500">
                  {degree_label ? `${degree_label} Applicant` : 'Applicant'}
                  {applicants?.institution ? ` • ${applicants.institution}` : ''}
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
                onClick={handleToggleFavorite}
                className={`mt-1 shrink-0 transition ${favorited ? 'text-black' : 'text-neutral-300 hover:text-black'}`}
                title={favorited ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Bookmark className={`h-5 w-5 ${favorited ? 'fill-current' : ''}`} />
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

          {/* Applicant Profile Summary */}
          {summary && <ApplicantSummary summary={summary} />}
        </div>

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

function ApplicantSummary({ summary }) {
  const { academic, experience_top, projects_top, skills, awards, notes } = summary
  const hasAcademic = academic.field_of_study || academic.graduation_year
  const hasExp = experience_top && experience_top.length
  const hasProjects = projects_top && projects_top.length
  const hasSkills = skills && skills.length
  const hasAwards = awards && awards.length
  const isEmpty = !hasAcademic && !hasExp && !hasProjects && !hasSkills && !hasAwards && !notes

  if (isEmpty) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-7">
        <h2 className="font-semibold text-black mb-2">Applicant Profile</h2>
        <p className="text-sm text-neutral-500">No profile information provided yet.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-7 space-y-5">
      <h2 className="font-semibold text-black">Applicant Profile</h2>

      {hasAcademic && (
        <div>
          <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-1">
            Academic
          </p>
          <p className="text-sm text-neutral-800">
            {academic.field_of_study}
            {academic.graduation_year ? ` • Graduating ${academic.graduation_year}` : ''}
          </p>
        </div>
      )}

      {hasExp && (
        <div>
          <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-2">
            Experience
          </p>
          <div className="space-y-2">
            {experience_top.map((entry, i) => (
              <div key={i} className="rounded border border-neutral-100 p-3">
                <p className="text-sm font-semibold text-black">
                  {entry.role}
                  {entry.organization ? ` • ${entry.organization}` : ''}
                </p>
                {entry.duration && (
                  <p className="text-xs text-neutral-500">{entry.duration}</p>
                )}
                {entry.description && (
                  <p className="mt-1 text-sm text-neutral-700">{entry.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {hasProjects && (
        <div>
          <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-2">
            Projects / Research
          </p>
          <div className="space-y-2">
            {projects_top.map((entry, i) => (
              <div key={i} className="rounded border border-neutral-100 p-3">
                <p className="text-sm font-semibold text-black">{entry.title}</p>
                {entry.description && (
                  <p className="mt-1 text-sm text-neutral-700">{entry.description}</p>
                )}
                {entry.methods_technologies && (
                  <p className="mt-1 text-xs text-neutral-500">
                    Methods: {entry.methods_technologies}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {hasSkills && (
        <div>
          <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-2">
            Skills
          </p>
          <div className="flex flex-wrap gap-1.5">
            {skills.map((skill, i) => (
              <span key={i} className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-700">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {hasAwards && (
        <div>
          <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-2">
            Awards
          </p>
          <ul className="list-disc pl-5 text-sm text-neutral-700 space-y-0.5">
            {awards.map((award, i) => (
              <li key={i}>{award}</li>
            ))}
          </ul>
        </div>
      )}

      {notes && (
        <div>
          <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-1">
            Notes
          </p>
          <p className="text-sm text-neutral-700 whitespace-pre-wrap">{notes}</p>
        </div>
      )}
    </div>
  )
}
