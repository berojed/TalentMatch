import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Search, Plus, Pencil, Trash2, Calendar, Users, MapPin } from 'lucide-react'
import {
  getSupervisorProjects,
  createProject,
  updateProject,
  deleteProject,
} from '../../lib/supervisorApi'
import { supabase } from '../../lib/supabase'

// ─── Inline edit / create form ──────────────────────────────
function OpportunityForm({ initial, educationLevels, onSave, onCancel }) {
  const [form, setForm] = useState({
    title: initial?.title || '',
    department: initial?.department || '',
    description: initial?.description || '',
    location: initial?.location || '',
    duration_text: initial?.duration_text || '',
    degree_level_id: initial?.degree_level_id || '',
    research_areas_text: initial?.research_areas?.join(', ') || '',
    special_requirements: initial?.special_requirements || '',
    language_required: initial?.language_required || false,
    is_paid: initial?.is_paid || false,
  })
  const [saving, setSaving] = useState(false)

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        title: form.title,
        department: form.department,
        description: form.description,
        location: form.location,
        duration_text: form.duration_text,
        degree_level_id: form.degree_level_id ? Number(form.degree_level_id) : null,
        special_requirements: form.special_requirements || null,
        language_required: form.language_required,
        is_paid: form.is_paid,
        researchAreas: form.research_areas_text
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      }
      await onSave(payload)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-neutral-200 bg-white p-6"
    >
      <h3 className="mb-6 text-lg font-bold">
        {initial ? 'Edit Opportunity' : 'Create Opportunity'}
      </h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Title */}
        <div>
          <label className="mb-1 block text-xs font-semibold tracking-wide text-neutral-500">
            PROJECT TITLE *
          </label>
          <input
            required
            value={form.title}
            onChange={set('title')}
            className="w-full rounded border border-neutral-300 px-4 py-2.5 text-sm focus:border-black focus:outline-none"
          />
        </div>

        {/* Department */}
        <div>
          <label className="mb-1 block text-xs font-semibold tracking-wide text-neutral-500">
            DEPARTMENT *
          </label>
          <input
            required
            value={form.department}
            onChange={set('department')}
            className="w-full rounded border border-neutral-300 px-4 py-2.5 text-sm focus:border-black focus:outline-none"
          />
        </div>
      </div>

      {/* Description */}
      <div className="mt-4">
        <label className="mb-1 block text-xs font-semibold tracking-wide text-neutral-500">
          PROJECT DESCRIPTION *
        </label>
        <textarea
          required
          rows={4}
          value={form.description}
          onChange={set('description')}
          className="w-full rounded border border-neutral-300 px-4 py-2.5 text-sm focus:border-black focus:outline-none"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Location */}
        <div>
          <label className="mb-1 block text-xs font-semibold tracking-wide text-neutral-500">
            LOCATION *
          </label>
          <input
            required
            value={form.location}
            onChange={set('location')}
            className="w-full rounded border border-neutral-300 px-4 py-2.5 text-sm focus:border-black focus:outline-none"
          />
        </div>

        {/* Duration */}
        <div>
          <label className="mb-1 block text-xs font-semibold tracking-wide text-neutral-500">
            DURATION *
          </label>
          <input
            required
            value={form.duration_text}
            onChange={set('duration_text')}
            placeholder="e.g. 3-4 years"
            className="w-full rounded border border-neutral-300 px-4 py-2.5 text-sm focus:border-black focus:outline-none"
          />
        </div>

        {/* Education level */}
        <div>
          <label className="mb-1 block text-xs font-semibold tracking-wide text-neutral-500">
            EDUCATION LEVEL *
          </label>
          <select
            required
            value={form.degree_level_id}
            onChange={set('degree_level_id')}
            className="w-full rounded border border-neutral-300 px-4 py-2.5 text-sm focus:border-black focus:outline-none"
          >
            <option value="">Select level</option>
            {educationLevels.map((el) => (
              <option key={el.education_level_id} value={el.education_level_id}>
                {el.label}
              </option>
            ))}
          </select>
        </div>

        {/* Research areas */}
        <div>
          <label className="mb-1 block text-xs font-semibold tracking-wide text-neutral-500">
            RESEARCH AREAS
          </label>
          <input
            value={form.research_areas_text}
            onChange={set('research_areas_text')}
            placeholder="Comma-separated, e.g. Nuclear Physics, Radiochemistry"
            className="w-full rounded border border-neutral-300 px-4 py-2.5 text-sm focus:border-black focus:outline-none"
          />
        </div>
      </div>

      {/* Special requirements */}
      <div className="mt-4">
        <label className="mb-1 block text-xs font-semibold tracking-wide text-neutral-500">
          SPECIAL REQUIREMENTS
        </label>
        <textarea
          rows={2}
          value={form.special_requirements}
          onChange={set('special_requirements')}
          className="w-full rounded border border-neutral-300 px-4 py-2.5 text-sm focus:border-black focus:outline-none"
        />
      </div>

      {/* Checkboxes */}
      <div className="mt-4 flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.language_required}
            onChange={set('language_required')}
            className="h-4 w-4 rounded border-neutral-300 accent-blue-600"
          />
          German language proficiency required
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_paid}
            onChange={set('is_paid')}
            className="h-4 w-4 rounded border-neutral-300 accent-blue-600"
          />
          This is a paid position
        </label>
      </div>

      {/* Buttons */}
      <div className="mt-6 flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-black px-6 py-2.5 text-sm font-semibold tracking-wide text-white transition hover:bg-neutral-800 disabled:opacity-50"
        >
          {saving
            ? 'SAVING...'
            : initial
            ? 'SAVE CHANGES'
            : 'CREATE OPPORTUNITY'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-neutral-300 px-6 py-2.5 text-sm font-semibold tracking-wide transition hover:bg-neutral-100"
        >
          CANCEL
        </button>
      </div>
    </form>
  )
}

// ─── Project card ───────────────────────────────────────────
function ProjectCard({ project, educationLevels, onEdit, onDelete, onRefresh }) {
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const statusLabel =
    project.status === 'OPEN'
      ? 'Active'
      : project.status === 'CLOSED'
      ? 'Closed'
      : 'Draft'

  const statusColor =
    project.status === 'OPEN'
      ? 'border-green-200 bg-green-50 text-green-700'
      : project.status === 'CLOSED'
      ? 'border-red-200 bg-red-50 text-red-700'
      : 'border-neutral-200 bg-neutral-100 text-neutral-600'

  if (editing) {
    return (
      <OpportunityForm
        initial={project}
        educationLevels={educationLevels}
        onSave={async (payload) => {
          await updateProject(project.project_id, payload)
          setEditing(false)
          onRefresh()
        }}
        onCancel={() => setEditing(false)}
      />
    )
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white">
      {/* Top section */}
      <div className="p-6">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-bold text-black">{project.title}</h3>
          <div className="ml-4 flex shrink-0 gap-2">
            <button
              onClick={() => setEditing(true)}
              className="rounded p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-black"
              aria-label="Edit"
            >
              <Pencil className="h-4.5 w-4.5" />
            </button>
            {confirmDelete ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={async () => {
                    await deleteProject(project.project_id)
                    onRefresh()
                  }}
                  className="rounded bg-red-600 px-2 py-1 text-xs text-white"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="rounded border px-2 py-1 text-xs"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="rounded p-1.5 text-neutral-400 transition hover:bg-red-50 hover:text-red-600"
                aria-label="Delete"
              >
                <Trash2 className="h-4.5 w-4.5" />
              </button>
            )}
          </div>
        </div>

        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          {project.description}
        </p>

        {/* Research areas tags */}
        {project.research_areas && project.research_areas.length > 0 && (
          <div className="mt-3">
            <span className="rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-600">
              {project.research_areas.join(', ')}
            </span>
          </div>
        )}

        {/* Badges */}
        <div className="mt-3 flex flex-wrap gap-2">
          <span
            className={`rounded-full border px-3 py-0.5 text-xs font-medium ${statusColor}`}
          >
            {statusLabel}
          </span>
          {project.education_label && (
            <span className="rounded-full border border-neutral-200 px-3 py-0.5 text-xs font-medium text-neutral-600">
              {project.education_label}
            </span>
          )}
          <span
            className={`rounded-full border px-3 py-0.5 text-xs font-medium ${
              project.is_paid
                ? 'border-green-200 bg-green-50 text-green-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {project.is_paid ? 'Paid' : 'Unpaid'}
          </span>
        </div>
      </div>

      {/* Bottom meta */}
      <div className="grid grid-cols-2 gap-4 border-t border-neutral-100 px-6 py-4 sm:grid-cols-4">
        <div className="flex items-start gap-2">
          <Calendar className="mt-0.5 h-4 w-4 text-neutral-400" />
          <div>
            <p className="text-xs font-semibold tracking-wide text-neutral-500">
              DURATION
            </p>
            <p className="text-sm text-black">
              {project.duration_text || `${project.duration_weeks || '—'} weeks`}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Users className="mt-0.5 h-4 w-4 text-neutral-400" />
          <div>
            <p className="text-xs font-semibold tracking-wide text-neutral-500">
              APPLICANTS
            </p>
            <p className="text-sm text-black">{project.applicant_count}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 text-neutral-400" />
          <div>
            <p className="text-xs font-semibold tracking-wide text-neutral-500">
              LOCATION
            </p>
            <p className="text-sm text-black">{project.location}</p>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-wide text-neutral-500">
            DEPARTMENT
          </p>
          <p className="text-sm text-black">{project.department || '—'}</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 border-t border-neutral-100 px-6 py-4">
        <Link
          to={`/supervisor/applications?project=${project.project_id}`}
          className="rounded bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
        >
          View Applications
        </Link>
        <Link
          to={`/supervisor/project/${project.project_id}`}
          className="rounded border border-neutral-300 px-4 py-2 text-sm font-medium transition hover:bg-neutral-100"
        >
          View Project Details
        </Link>
      </div>
    </div>
  )
}

// ─── Page ───────────────────────────────────────────────────
export default function PostedOpportunities() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [educationLevels, setEducationLevels] = useState([])

  const loadProjects = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getSupervisorProjects(search)
      setProjects(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  useEffect(() => {
    supabase
      .from('education_levels')
      .select('*')
      .then(({ data }) => setEducationLevels(data || []))
  }, [])

  return (
    <main className="mx-auto max-w-[1500px] px-6 py-10 sm:px-10">
      {/* Header row */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-black">
            Posted Opportunities
          </h1>
          <p className="mt-1 text-neutral-500">
            Manage your research project postings and view applications.
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 rounded bg-black px-5 py-3 text-sm font-semibold tracking-wide text-white transition hover:bg-neutral-800"
        >
          <Plus className="h-4 w-4" />
          CREATE OPPORTUNITY
        </button>
      </div>

      {/* Search */}
      <div className="relative mt-6 max-w-2xl">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by project title, description, or research area..."
          className="w-full rounded-lg border border-neutral-300 bg-white py-3 pl-11 pr-4 text-sm placeholder-neutral-400 focus:border-black focus:outline-none"
        />
      </div>

      {/* Create form */}
      {creating && (
        <div className="mt-6">
          <OpportunityForm
            initial={null}
            educationLevels={educationLevels}
            onSave={async (payload) => {
              await createProject(payload)
              setCreating(false)
              loadProjects()
            }}
            onCancel={() => setCreating(false)}
          />
        </div>
      )}

      {/* Project list */}
      <div className="mt-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-neutral-500">
              {projects.length} {projects.length === 1 ? 'opportunity' : 'opportunities'} posted
            </p>
            <div className="flex flex-col gap-6">
              {projects.map((project) => (
                <ProjectCard
                  key={project.project_id}
                  project={project}
                  educationLevels={educationLevels}
                  onRefresh={loadProjects}
                />
              ))}
            </div>
            {projects.length === 0 && !creating && (
              <div className="py-20 text-center text-neutral-400">
                <p className="text-lg">No opportunities posted yet.</p>
                <p className="mt-1 text-sm">
                  Click &quot;Create Opportunity&quot; to get started.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
