import React from 'react'
import { ArrowLeft, Clock3, MapPin, UserRound, GraduationCap } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ApplicationModal from '../../components/applicant/ApplicationModal'
import { getProjectDetails, submitApplication } from '../../lib/applicantApi'

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 text-neutral-700" />
      <div>
        <p className="text-xs text-neutral-500">{label}</p>
        <p className="text-sm font-medium text-neutral-800">{value}</p>
      </div>
    </div>
  )
}

function QuickInfo({ project }) {
  return (
    <aside className="h-fit rounded border border-neutral-200 bg-white p-7 lg:sticky lg:top-28">
      <h2 className="text-lg font-semibold text-black">Quick Info</h2>

      <div className="mt-5 space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Research Center</p>
          <p className="mt-1 text-sm text-neutral-800">{project.research_center}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Department</p>
          <p className="mt-1 text-sm text-neutral-800">{project.department}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Location</p>
          <p className="mt-1 text-sm text-neutral-800">{project.location}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Duration</p>
          <p className="mt-1 text-sm text-neutral-800">{project.duration}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Education Level</p>
          <p className="mt-1 text-sm text-neutral-800">{project.education_level}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Compensation</p>
          <p className="mt-1 text-sm text-neutral-800">
            {project.compensation === 'paid' ? 'Paid' : 'Unpaid'}
          </p>
        </div>
      </div>
    </aside>
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

  React.useEffect(() => {
    let mounted = true

    getProjectDetails(projectId).then((data) => {
      if (!mounted) {
        return
      }
      setProject(data)
      setLoading(false)
    })

    return () => {
      mounted = false
    }
  }, [projectId])

  const handleSubmit = async ({ coverLetter, file }) => {
    if (!project) {
      return
    }

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
      setFeedback('Application submitted successfully.')
    } catch (err) {
      setFeedback(err?.message || 'Submission failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-[1100px] px-6 py-10">
        <p className="text-neutral-600">Loading project...</p>
      </main>
    )
  }

  if (!project) {
    return (
      <main className="mx-auto max-w-[1100px] px-6 py-10">
        <p className="text-neutral-700">Project not found.</p>
        <button
          type="button"
          onClick={() => navigate('/applicant_dashboard/opportunities')}
          className="mt-3 rounded border border-neutral-300 px-4 py-2"
        >
          Back to Opportunities
        </button>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-[1100px] px-6 py-10">
      <button
        type="button"
        onClick={() => navigate('/applicant_dashboard/opportunities')}
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 transition hover:text-black"
      >
        <ArrowLeft className="h-5 w-5" />
        Back to Projects
      </button>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <section className="rounded border border-neutral-200 bg-white p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold leading-tight text-black">{project.title}</h1>
                <p className="mt-1 text-sm text-neutral-600">{project.department}</p>
              </div>
              <span className="rounded border border-green-200 bg-green-50 px-3 py-1 text-xs text-green-700">
                Active
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-neutral-700">{project.summary}</p>
          </section>

          <section className="rounded border border-neutral-200 bg-white p-7">
            <h2 className="text-lg font-semibold text-black">Project Details</h2>
            <span className="mt-3 inline-block rounded bg-neutral-100 px-3 py-1 text-xs text-neutral-600">
              {project.compensation === 'paid' ? 'Paid Position' : 'Unpaid Position'}
            </span>

            <div className="mt-6 space-y-4">
              <DetailRow icon={MapPin} label="Location" value={project.location} />
              <DetailRow icon={Clock3} label="Duration" value={project.duration} />
              <DetailRow icon={GraduationCap} label="Education Level" value={project.education_level} />
              <DetailRow icon={UserRound} label="Supervisor" value={project.supervisor_name} />
            </div>
          </section>

          <section className="rounded border border-neutral-200 bg-white p-7">
            <h2 className="text-lg font-semibold text-black">Research Areas</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {(project.tags || []).map((tag) => (
                <span key={tag} className="rounded bg-neutral-100 px-2.5 py-1 text-xs text-neutral-600">
                  {tag}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded border border-neutral-200 bg-white p-7">
            <h2 className="text-lg font-semibold text-black">Special Requirements</h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-700">{project.requirements}</p>
          </section>

          <section className="rounded border border-neutral-200 bg-white p-7">
            <h2 className="text-lg font-semibold text-black">Ready to Apply?</h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-700">
              Submit your application to express your interest in this research project. We&apos;ll review your qualifications and get back to you soon.
            </p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="mt-4 rounded bg-black px-6 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              Submit an Application
            </button>
            {feedback && (
              <p className={`mt-4 text-base ${feedback.includes('success') ? 'text-green-700' : 'text-red-600'}`}>
                {feedback}
              </p>
            )}
          </section>
        </div>

        <QuickInfo project={project} />
      </div>

      <ApplicationModal
        projectTitle={project.title}
        isOpen={isModalOpen}
        isSubmitting={isSubmitting}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </main>
  )
}
