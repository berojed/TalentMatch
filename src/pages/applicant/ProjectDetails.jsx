import React from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Check,
  Clock,
  GraduationCap,
  MapPin,
  User,
} from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ApplicationModal from '../../components/applicant/ApplicationModal'
import { getProjectDetails, submitApplication } from '../../lib/applicantApi'
import Badge, { StatusBadge } from '../../components/ui/Badge'

function QuickInfoRow({ Icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-px flex text-ink-3">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.04em] text-ink-3">
          {label}
        </div>
        <div className="text-[13px] font-medium">{value || '—'}</div>
      </div>
    </div>
  )
}

export default function ProjectDetails() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = React.useState(null)
  const [loading, setLoading] = React.useState(true)
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [feedback, setFeedback] = React.useState('')
  const [applied, setApplied] = React.useState(false)

  React.useEffect(() => {
    let mounted = true
    getProjectDetails(projectId).then((data) => {
      if (!mounted) return
      setProject(data)
      setLoading(false)
    })
    return () => {
      mounted = false
    }
  }, [projectId])

  const handleSubmit = async ({ coverLetter, file }) => {
    if (!project) return

    if (!coverLetter?.trim() && !file) {
      setFeedback('Please provide a cover letter or upload a file before submitting.')
      return
    }

    setIsSubmitting(true)
    setFeedback('')
    try {
      await submitApplication({
        projectId: project.project_id || project.id,
        coverLetterText: coverLetter,
        coverLetterFile: file,
      })
      setIsModalOpen(false)
      setApplied(true)
      setFeedback('')
    } catch (err) {
      setFeedback(err?.message || 'Submission failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="px-6 py-8 sm:px-9">
        <p className="text-[13px] text-ink-3">Loading project…</p>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="px-6 py-8 sm:px-9">
        <p className="text-[13px] text-ink-2">Project not found.</p>
        <button
          type="button"
          onClick={() => navigate('/applicant_dashboard/opportunities')}
          className="mt-3 rounded-sm border border-line bg-card px-3 py-1.5 text-[12px] hover:border-line-strong"
        >
          Back to Opportunities
        </button>
      </div>
    )
  }

  return (
    <div className="px-6 py-8 sm:px-9 lg:max-w-[960px]">
      <button
        type="button"
        onClick={() => navigate('/applicant_dashboard/opportunities')}
        className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-ink-2 hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Opportunities
      </button>

      <div className="fade-up grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_280px]">
        <div className="flex flex-col gap-4">
          {/* Title card */}
          <div className="rounded-DEFAULT border border-line bg-card p-5">
            <div className="mb-3.5 flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider2 text-ink-3">
                  {project.department}
                </div>
                <h1 className="text-[20px] font-bold leading-[1.3] tracking-tightish">
                  {project.title}
                </h1>
              </div>
              <div className="flex shrink-0 gap-2">
                <StatusBadge status="OPEN" />
                <Badge variant={project.compensation === 'paid' ? 'green' : 'neutral'}>
                  {project.compensation === 'paid' ? 'Paid' : 'Unpaid'}
                </Badge>
              </div>
            </div>
            <p className="text-[13px] leading-[1.7] text-ink-2">{project.summary}</p>
          </div>

          {/* Research areas */}
          {(project.tags || []).length > 0 && (
            <div className="rounded-DEFAULT border border-line bg-card p-5">
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider2 text-ink-3">
                Research Areas
              </div>
              <div className="flex flex-wrap gap-1.5">
                {project.tags.map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Requirements */}
          {project.requirements && (
            <div className="rounded-DEFAULT border border-line bg-card p-5">
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider2 text-ink-3">
                Special Requirements
              </div>
              <p className="text-[13px] leading-[1.7] text-ink-2">{project.requirements}</p>
            </div>
          )}

          {/* Apply CTA */}
          {applied ? (
            <div className="rounded-DEFAULT border border-ok-border bg-ok-bg p-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ok">
                  <Check className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-ok">Application Submitted!</div>
                  <div className="text-[12px] text-ok/75">
                    The supervisor will review your application soon.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-DEFAULT border border-line bg-card p-5">
              <div className="mb-1.5 text-[14px] font-semibold">Ready to Apply?</div>
              <p className="mb-4 text-[13px] text-ink-2">
                Submit your cover letter to express interest in this research position.
              </p>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-sm bg-ink px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-85"
              >
                Submit Application <ArrowRight className="h-3 w-3" />
              </button>
              {feedback && (
                <p className="mt-3 text-[12px] text-danger">{feedback}</p>
              )}
            </div>
          )}
        </div>

        {/* Quick Info sidebar */}
        <aside className="lg:sticky lg:top-6">
          <div className="rounded-DEFAULT border border-line bg-card p-5">
            <div className="mb-4 text-[11px] font-semibold uppercase tracking-wider2 text-ink-3">
              Quick Info
            </div>
            <div className="flex flex-col gap-3.5">
              <QuickInfoRow Icon={User} label="Supervisor" value={project.supervisor_name} />
              <QuickInfoRow Icon={MapPin} label="Location" value={project.location} />
              <QuickInfoRow Icon={Clock} label="Duration" value={project.duration} />
              <QuickInfoRow
                Icon={GraduationCap}
                label="Level"
                value={project.education_level}
              />
              <QuickInfoRow Icon={Briefcase} label="Department" value={project.department} />
            </div>
          </div>
        </aside>
      </div>

      <ApplicationModal
        projectTitle={project.title}
        isOpen={isModalOpen}
        isSubmitting={isSubmitting}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
