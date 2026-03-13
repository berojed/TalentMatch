import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  MapPin,
  Clock,
  GraduationCap,
  User2,
  ArrowLeft,
  Users,
} from 'lucide-react'
import { getProjectById } from '../../lib/supervisorApi'

export default function SupervisorProjectDetail() {
  const { projectId } = useParams()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await getProjectById(projectId)
        setProject(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [projectId])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
      </div>
    )
  }

  if (!project) {
    return (
      <main className="mx-auto max-w-[1100px] px-6 py-10">
        <Link
          to="/supervisor/opportunities"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-black"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Opportunities
        </Link>
        <p className="mt-8 text-neutral-500">Project not found.</p>
      </main>
    )
  }

  const statusLabel =
    project.status === 'OPEN'
      ? 'Active'
      : project.status === 'CLOSED'
        ? 'Closed'
        : 'Draft'
  const statusColor =
    project.status === 'OPEN'
      ? 'bg-green-50 text-green-700 border-green-200'
      : project.status === 'CLOSED'
        ? 'bg-neutral-100 text-neutral-500 border-neutral-200'
        : 'bg-yellow-50 text-yellow-700 border-yellow-200'

  const researchCenter =
    project.supervisors?.institution || 'GSI Helmholtz Centre for Heavy Ion Research'

  return (
    <main className="mx-auto max-w-[1100px] px-6 py-10">
      {/* Back link */}
      <Link
        to="/supervisor/opportunities"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-black mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Opportunities
      </Link>

      <div className="flex gap-7 items-start">
        {/* ── Left column ── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Header card */}
          <div className="rounded-lg border border-neutral-200 bg-white p-7">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-2xl font-bold leading-snug text-black">
                  {project.title}
                </h1>
                {project.department && (
                  <p className="mt-1 text-sm text-neutral-500">{project.department}</p>
                )}
              </div>
              <span
                className={`shrink-0 rounded border px-3 py-1 text-xs font-semibold ${statusColor}`}
              >
                {statusLabel}
              </span>
            </div>
            {project.description && (
              <p className="mt-4 text-sm leading-relaxed text-neutral-600">
                {project.description}
              </p>
            )}
          </div>

          {/* Project Details card */}
          <div className="rounded-lg border border-neutral-200 bg-white p-7">
            <h2 className="font-semibold text-black mb-5">Project Details</h2>
            <div className="space-y-4">
              {project.location && (
                <DetailRow icon={<MapPin className="h-4 w-4" />} label="Location" value={project.location} />
              )}
              {(project.duration_text || project.duration_weeks) && (
                <DetailRow
                  icon={<Clock className="h-4 w-4" />}
                  label="Duration"
                  value={project.duration_text || `${project.duration_weeks} weeks`}
                />
              )}
              {project.education_label && (
                <DetailRow
                  icon={<GraduationCap className="h-4 w-4" />}
                  label="Education Level"
                  value={project.education_label}
                />
              )}
              {project.supervisor_name && (
                <DetailRow
                  icon={<User2 className="h-4 w-4" />}
                  label="Supervisor"
                  value={project.supervisor_name}
                />
              )}
            </div>
          </div>

          {/* Research Areas card */}
          {project.research_areas?.length > 0 && (
            <div className="rounded-lg border border-neutral-200 bg-white p-7">
              <h2 className="font-semibold text-black mb-3">Research Areas</h2>
              <p className="text-sm text-neutral-600">
                {project.research_areas.join(', ')}
              </p>
            </div>
          )}

          {/* Special Requirements card */}
          {project.special_requirements && (
            <div className="rounded-lg border border-neutral-200 bg-white p-7">
              <h2 className="font-semibold text-black mb-3">Special Requirements</h2>
              <p className="text-sm leading-relaxed text-neutral-600">
                {project.special_requirements}
              </p>
            </div>
          )}

          {/* View Applications button */}
          <Link
            to={`/supervisor/applications?project=${project.project_id}`}
            className="inline-flex items-center gap-2 rounded bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 transition"
          >
            <Users className="h-4 w-4" />
            View Applications
          </Link>
        </div>

        {/* ── Right: Quick Info sidebar ── */}
        <div className="w-72 shrink-0">
          <div className="rounded-lg border border-neutral-200 bg-white p-6 sticky top-6">
            <h2 className="font-semibold text-black mb-5">Quick Info</h2>
            <div className="space-y-4">
              <InfoRow label="Research Center" value={researchCenter} />
              <InfoRow label="Department" value={project.department} />
              <InfoRow label="Location" value={project.location} />
              <InfoRow
                label="Duration"
                value={
                  project.duration_text ||
                  (project.duration_weeks ? `${project.duration_weeks} weeks` : null)
                }
              />
              <InfoRow label="Education Level" value={project.education_label} />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

function DetailRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-neutral-400 shrink-0">{icon}</span>
      <div>
        <p className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">
          {label}
        </p>
        <p className="mt-0.5 text-sm text-black">{value}</p>
      </div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">
        {label}
      </p>
      <p className="mt-0.5 text-sm text-black">{value || '—'}</p>
    </div>
  )
}
