import { useEffect, useState, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Clock,
  Eye,
  FileText,
  GraduationCap,
  MapPin,
  Plus,
  Search,
  Settings,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import {
  getSupervisorProjects,
  createProject,
  updateProject,
  deleteProject,
} from '../../lib/supervisorApi'
import { supabase } from '../../lib/supabase'
import Badge, { StatusBadge } from '../../components/ui/Badge'

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

  const inputClass =
    'w-full rounded-sm border border-line bg-card px-3 py-2 text-[13px] outline-none transition-colors focus:border-line-strong'
  const labelClass =
    'mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-2'

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-DEFAULT border border-line bg-card p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[15px] font-semibold">
          {initial ? 'Edit Opportunity' : 'Create New Opportunity'}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1 rounded-sm px-2 py-1 text-[12px] text-ink-2 transition-colors hover:text-ink"
        >
          <X className="h-3 w-3" /> Cancel
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Project Title *</label>
          <input required value={form.title} onChange={set('title')} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Department *</label>
          <input
            required
            value={form.department}
            onChange={set('department')}
            placeholder="e.g. Computer Science"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Location *</label>
          <input
            required
            value={form.location}
            onChange={set('location')}
            placeholder="e.g. Berlin, Germany"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Duration *</label>
          <input
            required
            value={form.duration_text}
            onChange={set('duration_text')}
            placeholder="e.g. 3–4 years"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Education Level *</label>
          <select
            required
            value={form.degree_level_id}
            onChange={set('degree_level_id')}
            className={inputClass}
          >
            <option value="">Select level</option>
            {educationLevels.map((el) => (
              <option key={el.education_level_id} value={el.education_level_id}>
                {el.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Research Areas</label>
          <input
            value={form.research_areas_text}
            onChange={set('research_areas_text')}
            placeholder="Comma-separated, e.g. Quantum, Optics"
            className={inputClass}
          />
        </div>
      </div>

      <div className="mt-3.5">
        <label className={labelClass}>Description *</label>
        <textarea
          required
          rows={4}
          value={form.description}
          onChange={set('description')}
          placeholder="Describe the research project, objectives, and expected outcomes..."
          className={`${inputClass} resize-y`}
        />
      </div>

      <div className="mt-3.5">
        <label className={labelClass}>Special Requirements</label>
        <textarea
          rows={2}
          value={form.special_requirements}
          onChange={set('special_requirements')}
          className={`${inputClass} resize-y`}
        />
      </div>

      <div className="mt-3.5 flex flex-wrap gap-5">
        <label className="flex items-center gap-2 text-[12px]">
          <input
            type="checkbox"
            checked={form.language_required}
            onChange={set('language_required')}
            className="h-3.5 w-3.5 rounded-sm border-line"
          />
          German language required
        </label>
        <label className="flex items-center gap-2 text-[12px]">
          <input
            type="checkbox"
            checked={form.is_paid}
            onChange={set('is_paid')}
            className="h-3.5 w-3.5 rounded-sm border-line"
          />
          Paid position
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-sm bg-ink px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-85 disabled:opacity-50"
        >
          {saving ? 'Saving…' : initial ? 'Save Changes' : 'Create Opportunity'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-sm border border-line bg-card px-4 py-2 text-[13px] font-medium text-ink transition-colors hover:border-line-strong"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

function MetaItem({ Icon, val }) {
  if (!val) return null
  return (
    <span className="flex items-center gap-1.5 text-[12px] text-ink-2">
      <Icon className="h-3 w-3 shrink-0" />
      <span className="truncate">{val}</span>
    </span>
  )
}

function ProjectCard({ project, educationLevels, onRefresh }) {
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

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
    <article className="overflow-hidden rounded-DEFAULT border border-line bg-card transition-colors hover:border-line-strong">
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider2 text-ink-3">
              {project.department || 'Research'}
            </div>
            <h3 className="mb-2 text-[15px] font-semibold leading-[1.3]">
              {project.title}
            </h3>
            <div className="flex flex-wrap gap-3.5">
              <MetaItem Icon={MapPin} val={project.location} />
              <MetaItem
                Icon={Clock}
                val={
                  project.duration_text ||
                  (project.duration_weeks ? `${project.duration_weeks} weeks` : null)
                }
              />
              <MetaItem Icon={GraduationCap} val={project.education_label} />
              <MetaItem
                Icon={Users}
                val={`${project.applicant_count || 0} applicant${
                  project.applicant_count === 1 ? '' : 's'
                }`}
              />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <StatusBadge status={project.status} />
            <Badge variant={project.is_paid ? 'green' : 'neutral'}>
              {project.is_paid ? 'Paid' : 'Unpaid'}
            </Badge>
            <button
              type="button"
              onClick={() => setEditing(true)}
              aria-label="Edit"
              className="flex h-7 w-7 items-center justify-center rounded-sm bg-subtle text-ink-2 transition-colors hover:text-ink"
            >
              <Settings className="h-3.5 w-3.5" />
            </button>
            {confirmDelete ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={async () => {
                    await deleteProject(project.project_id)
                    onRefresh()
                  }}
                  className="rounded-sm bg-danger px-2 py-1 text-[11px] font-medium text-white"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-sm border border-line bg-card px-2 py-1 text-[11px]"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                aria-label="Delete"
                className="flex h-7 w-7 items-center justify-center rounded-sm border border-danger-border bg-danger-bg text-danger transition-opacity hover:opacity-85"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {project.description && (
          <p className="mt-2.5 line-clamp-2 text-[12px] text-ink-2">{project.description}</p>
        )}

        {project.research_areas?.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {project.research_areas.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-line px-5 py-2.5">
        <Link
          to={`/supervisor/applications?project=${project.project_id}`}
          className="inline-flex items-center gap-1.5 rounded-sm border border-line bg-card px-3 py-1.5 text-[12px] font-medium text-ink transition-colors hover:border-line-strong"
        >
          <FileText className="h-3 w-3" />
          View {project.applicant_count || 0} Applications
        </Link>
        <Link
          to={`/supervisor/project/${project.project_id}`}
          className="inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-[12px] text-ink-2 transition-colors hover:text-ink"
        >
          <Eye className="h-3 w-3" /> View Details
        </Link>
      </div>
    </article>
  )
}

export default function PostedOpportunities() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [educationLevels, setEducationLevels] = useState([])
  const debounceRef = useRef(null)

  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedSearch(value), 300)
  }

  const loadProjects = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getSupervisorProjects(debouncedSearch)
      setProjects(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  useEffect(() => {
    supabase
      .from('education_levels')
      .select('*')
      .then(({ data }) => setEducationLevels(data || []))
  }, [])

  return (
    <div className="px-6 py-8 sm:px-9 lg:max-w-[1000px]">
      <header className="fade-up mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold tracking-tightish">Posted Opportunities</h1>
          <p className="mt-1 text-[13px] text-ink-2">
            Manage your research project postings and view applications.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-1.5 rounded-sm bg-ink px-3.5 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-85"
        >
          <Plus className="h-3.5 w-3.5" /> New Opportunity
        </button>
      </header>

      <div className="fade-up fade-up-1 mb-5 relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-3" />
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          placeholder="Search opportunities..."
          className="w-full rounded-sm border border-line bg-card py-2 pl-9 pr-3 text-[13px] outline-none transition-colors focus:border-line-strong"
        />
      </div>

      {creating && (
        <div className="fade-up mb-5">
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

      <div className="fade-up fade-up-2">
        {loading ? (
          <div className="flex justify-center py-16">
            <span className="spinner" />
          </div>
        ) : (
          <>
            <div className="mb-2.5 text-[12px] text-ink-3">
              {projects.length}{' '}
              {projects.length === 1 ? 'opportunity' : 'opportunities'}
            </div>
            <div className="flex flex-col gap-3">
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
              <div className="rounded-DEFAULT border border-line bg-card px-5 py-12 text-center text-[13px] text-ink-3">
                No opportunities posted yet. Click <strong>New Opportunity</strong> to get
                started.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
