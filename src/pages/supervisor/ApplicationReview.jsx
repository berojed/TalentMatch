import { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Mail, Bookmark, Check, Eye, X } from 'lucide-react'
import {
  getApplicationById,
  updateApplicationStatus,
  toggleApplicationFavorite,
} from '../../lib/supervisorApi'
import Badge, { StatusBadge } from '../../components/ui/Badge'

function formatDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Illustrative match-analysis breakdown until a real matching_score is wired up.
// Surfaced as a transparent UI affordance so supervisors can still reason about fit.
function buildMatchAnalysis(summary) {
  const skills = (summary?.skills || []).length
  const experience = (summary?.experience_top || []).length
  const projects = (summary?.projects_top || []).length
  const hasAcademic = !!summary?.academic?.field_of_study
  return [
    {
      label: 'Research Alignment',
      score: hasAcademic ? Math.min(95, 70 + projects * 8) : 65,
    },
    { label: 'Skills Match', score: Math.min(95, 60 + skills * 5) },
    { label: 'Experience', score: Math.min(95, 55 + experience * 12) },
    { label: 'Profile Completeness', score: hasAcademic ? 95 : 75 },
  ]
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
        if (data) setFavorited(data.is_favorited || false)
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

  const summary = application?.applicants?.profile_summary || null
  const matchBreakdown = useMemo(() => buildMatchAnalysis(summary), [summary])
  const matchAverage = useMemo(() => {
    if (!matchBreakdown.length) return null
    const sum = matchBreakdown.reduce((a, m) => a + m.score, 0)
    return Math.round(sum / matchBreakdown.length)
  }, [matchBreakdown])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="spinner" />
      </div>
    )
  }

  if (!application) {
    return (
      <div className="px-6 py-8 sm:px-9 lg:max-w-[1000px]">
        <Link
          to="/supervisor/applications"
          className="inline-flex items-center gap-1.5 text-[13px] text-ink-2 hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Applications
        </Link>
        <p className="mt-8 text-[13px] text-ink-3">Application not found.</p>
      </div>
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
    `${applicants?.first_name || ''} ${applicants?.last_name || ''}`.trim() ||
    applicant_email ||
    'Applicant'

  const initials = applicantName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const isPending = status === 'SUBMITTED' || status === 'UNDER_REVIEW'

  return (
    <div className="px-6 py-8 sm:px-9 lg:max-w-[1000px]">
      <Link
        to="/supervisor/applications"
        className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-ink-2 hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Applications
      </Link>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_280px]">
        <div className="flex flex-col gap-4">
          {/* Applicant header */}
          <div className="rounded-DEFAULT border border-line bg-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="mb-2 flex items-center gap-2.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-subtle text-[16px] font-semibold text-ink-2">
                    {initials || 'AP'}
                  </div>
                  <div className="min-w-0">
                    <h1 className="truncate text-[18px] font-bold tracking-[-0.01em]">
                      {applicantName}
                    </h1>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-ink-2">
                      {degree_label && <span>{degree_label}</span>}
                      {degree_label && applicant_email && <span>·</span>}
                      {applicant_email && (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {applicant_email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={status} />
                  {matchAverage != null && (
                    <span className="inline-flex items-center gap-1.5 rounded-sm bg-accent px-2 py-[2px]">
                      <span className="text-[13px] font-bold text-accent-fg">{matchAverage}</span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider2 text-accent-fg">
                        Match Score
                      </span>
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleToggleFavorite}
                className={[
                  'flex h-8 w-8 items-center justify-center rounded-sm border border-transparent bg-subtle transition-colors',
                  favorited ? 'text-ink' : 'text-ink-3 hover:text-ink',
                ].join(' ')}
                aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Bookmark className={`h-4 w-4 ${favorited ? 'fill-current' : ''}`} />
              </button>
            </div>

            <div className="my-4 h-px bg-line" />

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div>
                <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider2 text-ink-3">
                  Applied To
                </div>
                <div className="text-[13px] font-medium">
                  {projects?.title || application.project_title || '—'}
                </div>
              </div>
              <div>
                <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider2 text-ink-3">
                  Submitted
                </div>
                <div className="text-[13px] font-medium">{formatDate(submitted_at) || '—'}</div>
              </div>
            </div>
          </div>

          {/* Cover letter */}
          {message && (
            <div className="rounded-DEFAULT border border-line bg-card p-5">
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider2 text-ink-3">
                Cover Letter
              </div>
              <p className="whitespace-pre-wrap text-[13px] leading-[1.75] text-ink-2">{message}</p>
            </div>
          )}

          {/* Applicant profile */}
          {summary && <ApplicantSummary summary={summary} />}
        </div>

        {/* Decision sidebar */}
        <div className="lg:sticky lg:top-6 flex flex-col gap-3">
          <div className="rounded-DEFAULT border border-line bg-card p-5">
            <div className="mb-3.5 text-[11px] font-semibold uppercase tracking-wider2 text-ink-3">
              Your Decision
            </div>

            {isPending ? (
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => handleDecision('ACCEPTED')}
                  disabled={deciding}
                  className="inline-flex items-center justify-center gap-1.5 rounded-sm border border-ok-border bg-ok-bg px-3.5 py-2.5 text-[13px] font-semibold text-ok transition-opacity hover:opacity-85 disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" /> Accept to Next Stage
                </button>
                <button
                  type="button"
                  onClick={() => handleDecision('UNDER_REVIEW')}
                  disabled={deciding}
                  className="inline-flex items-center justify-center gap-1.5 rounded-sm border border-line bg-subtle px-3.5 py-2.5 text-[13px] font-medium text-ink-2 transition-colors hover:text-ink disabled:opacity-50"
                >
                  <Eye className="h-3.5 w-3.5" /> Mark as In Review
                </button>
                <button
                  type="button"
                  onClick={() => handleDecision('REJECTED')}
                  disabled={deciding}
                  className="inline-flex items-center justify-center gap-1.5 rounded-sm border border-danger-border bg-danger-bg px-3.5 py-2.5 text-[13px] font-medium text-danger transition-opacity hover:opacity-85 disabled:opacity-50"
                >
                  <X className="h-3.5 w-3.5" /> Reject
                </button>
              </div>
            ) : (
              <div>
                <StatusBadge status={status} />
                <button
                  type="button"
                  onClick={() => handleDecision('SUBMITTED')}
                  className="mt-3 text-[12px] text-ink-3 underline hover:text-ink"
                >
                  Undo decision
                </button>
              </div>
            )}

            {deciding && (
              <div className="mt-3.5 flex items-center justify-center gap-2">
                <span className="spinner" />
                <span className="text-[12px] text-ink-3">Saving…</span>
              </div>
            )}
          </div>

          {/* Match Analysis */}
          <div className="rounded-DEFAULT border border-line bg-card p-5">
            <div className="mb-3.5 text-[11px] font-semibold uppercase tracking-wider2 text-ink-3">
              Match Analysis
            </div>
            {matchBreakdown.map((m) => (
              <div key={m.label} className="mb-2.5">
                <div className="mb-1 flex justify-between">
                  <span className="text-[12px] text-ink-2">{m.label}</span>
                  <span className="text-[12px] font-semibold font-mono-tabular">{m.score}%</span>
                </div>
                <div className="h-1 rounded-full bg-subtle">
                  <div
                    className="h-1 rounded-full bg-ink transition-[width] duration-500"
                    style={{ width: `${m.score}%` }}
                  />
                </div>
              </div>
            ))}
            <div className="mt-3 text-[10px] text-ink-3">
              Illustrative — derived from profile data until a scoring model is wired up.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ApplicantSummary({ summary }) {
  const { academic, experience_top, projects_top, skills, awards, notes } = summary
  const hasAcademic = academic?.field_of_study || academic?.graduation_year
  const hasExp = experience_top && experience_top.length
  const hasProjects = projects_top && projects_top.length
  const hasSkills = skills && skills.length
  const hasAwards = awards && awards.length
  const isEmpty = !hasAcademic && !hasExp && !hasProjects && !hasSkills && !hasAwards && !notes

  if (isEmpty) {
    return (
      <div className="rounded-DEFAULT border border-line bg-card p-5">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider2 text-ink-3">
          Applicant Profile
        </div>
        <p className="text-[13px] text-ink-3">No profile information provided yet.</p>
      </div>
    )
  }

  return (
    <div className="rounded-DEFAULT border border-line bg-card p-5">
      <div className="mb-4 text-[11px] font-semibold uppercase tracking-wider2 text-ink-3">
        Applicant Profile
      </div>
      <div className="flex flex-col gap-4">
        {hasAcademic && (
          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">
              Academic
            </div>
            <div className="text-[13px] text-ink-2">
              {academic.field_of_study}
              {academic.graduation_year ? ` · Graduating ${academic.graduation_year}` : ''}
            </div>
          </div>
        )}

        {hasSkills && (
          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">
              Skills
            </div>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill, i) => (
                <Badge key={`${skill}-${i}`}>{skill}</Badge>
              ))}
            </div>
          </div>
        )}

        {hasExp && (
          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">
              Experience
            </div>
            <div className="flex flex-col gap-2">
              {experience_top.map((entry, i) => (
                <div key={i} className="rounded-sm border border-line p-3">
                  <div className="text-[13px] font-medium">
                    {entry.role}
                    {entry.organization ? ` · ${entry.organization}` : ''}
                  </div>
                  {entry.duration && (
                    <div className="mt-0.5 text-[11px] text-ink-3">{entry.duration}</div>
                  )}
                  {entry.description && (
                    <div className="mt-1.5 text-[12px] leading-[1.6] text-ink-2">
                      {entry.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {hasProjects && (
          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">
              Projects / Research
            </div>
            <div className="flex flex-col gap-2">
              {projects_top.map((entry, i) => (
                <div key={i} className="rounded-sm border border-line p-3">
                  <div className="text-[13px] font-medium">{entry.title}</div>
                  {entry.description && (
                    <div className="mt-1.5 text-[12px] leading-[1.6] text-ink-2">
                      {entry.description}
                    </div>
                  )}
                  {entry.methods_technologies && (
                    <div className="mt-1 text-[11px] text-ink-3">
                      Methods: {entry.methods_technologies}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {hasAwards && (
          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">
              Awards
            </div>
            <ul className="list-disc space-y-0.5 pl-5 text-[13px] text-ink-2">
              {awards.map((award, i) => (
                <li key={i}>{award}</li>
              ))}
            </ul>
          </div>
        )}

        {notes && (
          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">
              Notes
            </div>
            <p className="whitespace-pre-wrap text-[13px] text-ink-2">{notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
