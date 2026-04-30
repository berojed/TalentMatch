import React from 'react'
import { Plus, Trash2 } from 'lucide-react'
import {
  parseExperienceText,
  serializeExperienceRows,
  parseProjectsText,
  serializeProjectRows,
  parseSkillsArray,
  parseAwardsText,
} from '../../lib/applicantApi'

const TEXT_LIMIT_SHORT = 120
const TEXT_LIMIT_LONG = 600
const NOTES_LIMIT = 1500

const emptyExperience = () => ({ role: '', organization: '', duration: '', description: '' })
const emptyProject = () => ({ title: '', description: '', methods_technologies: '' })

function trimExperience(list) {
  return list
    .map((entry) => ({
      role: (entry.role || '').trim(),
      organization: (entry.organization || '').trim(),
      duration: (entry.duration || '').trim(),
      description: (entry.description || '').trim(),
    }))
    .filter((entry) => entry.role || entry.organization || entry.duration || entry.description)
}

function trimProjects(list) {
  return list
    .map((entry) => ({
      title: (entry.title || '').trim(),
      description: (entry.description || '').trim(),
      methods_technologies: (entry.methods_technologies || '').trim(),
    }))
    .filter((entry) => entry.title || entry.description || entry.methods_technologies)
}

function trimStringArray(list) {
  return list.map((s) => (s || '').trim()).filter(Boolean)
}

function buildInitialForm(initial) {
  const src = initial || {}
  const experienceRows = parseExperienceText(src.experience)
  const projectRows = parseProjectsText(src.projects)
  const skills = parseSkillsArray(src.skills)
  const awards = parseAwardsText(src.awards)
  return {
    degree_level_id: src.degree_level_id ?? '',
    institution: src.institution || '',
    field_of_study: src.field_of_study || '',
    graduation_year: src.graduation_year != null ? String(src.graduation_year) : '',
    experience: experienceRows.length ? experienceRows : [emptyExperience()],
    projects_research: projectRows.length ? projectRows : [emptyProject()],
    skills: skills.join(', '),
    awards: awards.join(', '),
    additional_notes: src.additional_notes || '',
  }
}

function ApplicantProfileForm(
  {
    initialValues,
    onSubmit,
    submitting = false,
    submitLabel = 'Save Profile',
    disabled = false,
    onCancel,
    hideSubmitButton = false,
  },
  ref,
) {
  const [form, setForm] = React.useState(() => buildInitialForm(initialValues))
  const [error, setError] = React.useState('')

  // Re-hydrate when initialValues identity changes (e.g. profile load).
  React.useEffect(() => {
    setForm(buildInitialForm(initialValues))
  }, [initialValues])

  const editable = !disabled

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const updateExperienceRow = (idx, key, value) => {
    setForm((prev) => ({
      ...prev,
      experience: prev.experience.map((row, i) => (i === idx ? { ...row, [key]: value } : row)),
    }))
  }

  const updateProjectRow = (idx, key, value) => {
    setForm((prev) => ({
      ...prev,
      projects_research: prev.projects_research.map((row, i) =>
        i === idx ? { ...row, [key]: value } : row,
      ),
    }))
  }

  const validate = () => {
    if (!form.degree_level_id) return 'Degree level is required.'
    if (!form.field_of_study.trim()) return 'Field of study is required.'
    if (!form.institution.trim()) return 'Institution is required.'
    const year = Number(form.graduation_year)
    if (!form.graduation_year || !Number.isFinite(year)) {
      return 'Graduation year is required.'
    }
    if (year < 1950 || year > 2100) {
      return 'Graduation year must be between 1950 and 2100.'
    }
    if (trimExperience(form.experience).length === 0) {
      return 'Add at least one experience entry.'
    }
    if (trimProjects(form.projects_research).length === 0) {
      return 'Add at least one project or research entry.'
    }
    if (trimStringArray(form.skills.split(',')).length === 0) {
      return 'Add at least one skill.'
    }
    return null
  }

  const buildPayload = () => {
    const experienceRows = trimExperience(form.experience).map((e) => ({
      role: e.role.slice(0, TEXT_LIMIT_SHORT),
      organization: e.organization.slice(0, TEXT_LIMIT_SHORT),
      duration: e.duration.slice(0, TEXT_LIMIT_SHORT),
      description: e.description.slice(0, TEXT_LIMIT_LONG),
    }))
    const projectRows = trimProjects(form.projects_research).map((p) => ({
      title: p.title.slice(0, TEXT_LIMIT_SHORT),
      description: p.description.slice(0, TEXT_LIMIT_LONG),
      methods_technologies: p.methods_technologies.slice(0, TEXT_LIMIT_SHORT),
    }))
    const skills = trimStringArray(form.skills.split(',')).map((s) => s.slice(0, TEXT_LIMIT_SHORT))
    const awards = trimStringArray(form.awards.split(','))
      .map((s) => s.slice(0, TEXT_LIMIT_SHORT))
      .join('\n')
    return {
      degree_level_id: form.degree_level_id ? Number(form.degree_level_id) : null,
      institution: form.institution.trim(),
      field_of_study: form.field_of_study.trim().slice(0, TEXT_LIMIT_SHORT),
      graduation_year: form.graduation_year ? Number(form.graduation_year) : null,
      experience: serializeExperienceRows(experienceRows),
      projects: serializeProjectRows(projectRows),
      skills,
      awards,
      additional_notes: (form.additional_notes || '').trim().slice(0, NOTES_LIMIT),
    }
  }

  const handleSubmit = async () => {
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    setError('')
    try {
      await onSubmit(buildPayload())
    } catch (err) {
      setError(err?.message || 'Could not save profile.')
    }
  }

  React.useImperativeHandle(ref, () => ({ submit: handleSubmit }))

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-700">{error}</p>}

      {/* Academic */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-black">Academic</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-semibold uppercase tracking-widest text-neutral-400">
            Degree Level *
            <select
              disabled={!editable}
              value={form.degree_level_id}
              onChange={(event) => setField('degree_level_id', event.target.value)}
              className="mt-1.5 w-full rounded border border-neutral-300 px-3 py-2.5 text-sm text-neutral-700 disabled:bg-neutral-50"
            >
              <option value="">Select degree level</option>
              <option value="1">Bachelor</option>
              <option value="2">Master</option>
              <option value="3">PhD</option>
            </select>
          </label>
          <label className="block text-xs font-semibold uppercase tracking-widest text-neutral-400">
            Field of Study *
            <input
              disabled={!editable}
              value={form.field_of_study}
              onChange={(event) => setField('field_of_study', event.target.value)}
              maxLength={TEXT_LIMIT_SHORT}
              placeholder="e.g., Applied Physics"
              className="mt-1.5 w-full rounded border border-neutral-300 px-3 py-2.5 text-sm text-neutral-700 disabled:bg-neutral-50"
            />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-semibold uppercase tracking-widest text-neutral-400">
            Institution *
            <input
              disabled={!editable}
              value={form.institution}
              onChange={(event) => setField('institution', event.target.value)}
              maxLength={TEXT_LIMIT_SHORT}
              placeholder="e.g., TU Darmstadt"
              className="mt-1.5 w-full rounded border border-neutral-300 px-3 py-2.5 text-sm text-neutral-700 disabled:bg-neutral-50"
            />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-widest text-neutral-400">
            Graduation Year *
            <input
              disabled={!editable}
              type="number"
              min={1950}
              max={2100}
              value={form.graduation_year}
              onChange={(event) => setField('graduation_year', event.target.value)}
              placeholder="e.g., 2024"
              className="mt-1.5 w-full rounded border border-neutral-300 px-3 py-2.5 text-sm text-neutral-700 disabled:bg-neutral-50"
            />
          </label>
        </div>
      </div>

      {/* Experience */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-black">Experience *</h3>
          {editable && (
            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  experience: [...prev.experience, emptyExperience()],
                }))
              }
              className="inline-flex items-center gap-1 rounded border border-neutral-300 px-2.5 py-1 text-xs text-neutral-700"
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          )}
        </div>
        {form.experience.map((row, idx) => (
          <div key={idx} className="rounded border border-neutral-200 p-3 space-y-2">
            <div className="grid gap-2 sm:grid-cols-3">
              <input
                disabled={!editable}
                value={row.role}
                onChange={(e) => updateExperienceRow(idx, 'role', e.target.value)}
                maxLength={TEXT_LIMIT_SHORT}
                placeholder="Role"
                className="rounded border border-neutral-300 px-3 py-2 text-sm disabled:bg-neutral-50"
              />
              <input
                disabled={!editable}
                value={row.organization}
                onChange={(e) => updateExperienceRow(idx, 'organization', e.target.value)}
                maxLength={TEXT_LIMIT_SHORT}
                placeholder="Organization"
                className="rounded border border-neutral-300 px-3 py-2 text-sm disabled:bg-neutral-50"
              />
              <input
                disabled={!editable}
                value={row.duration}
                onChange={(e) => updateExperienceRow(idx, 'duration', e.target.value)}
                maxLength={TEXT_LIMIT_SHORT}
                placeholder="Duration (e.g., Jun 2023 – Sep 2023)"
                className="rounded border border-neutral-300 px-3 py-2 text-sm disabled:bg-neutral-50"
              />
            </div>
            <textarea
              disabled={!editable}
              value={row.description}
              onChange={(e) => updateExperienceRow(idx, 'description', e.target.value)}
              maxLength={TEXT_LIMIT_LONG}
              rows={2}
              placeholder="What did you do?"
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm disabled:bg-neutral-50"
            />
            {editable && form.experience.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    experience: prev.experience.filter((_, i) => i !== idx),
                  }))
                }
                className="inline-flex items-center gap-1 text-xs text-red-700"
              >
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Projects / Research */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-black">Projects / Research *</h3>
          {editable && (
            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  projects_research: [...prev.projects_research, emptyProject()],
                }))
              }
              className="inline-flex items-center gap-1 rounded border border-neutral-300 px-2.5 py-1 text-xs text-neutral-700"
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          )}
        </div>
        {form.projects_research.map((row, idx) => (
          <div key={idx} className="rounded border border-neutral-200 p-3 space-y-2">
            <input
              disabled={!editable}
              value={row.title}
              onChange={(e) => updateProjectRow(idx, 'title', e.target.value)}
              maxLength={TEXT_LIMIT_SHORT}
              placeholder="Project title"
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm disabled:bg-neutral-50"
            />
            <textarea
              disabled={!editable}
              value={row.description}
              onChange={(e) => updateProjectRow(idx, 'description', e.target.value)}
              maxLength={TEXT_LIMIT_LONG}
              rows={2}
              placeholder="Description"
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm disabled:bg-neutral-50"
            />
            <input
              disabled={!editable}
              value={row.methods_technologies}
              onChange={(e) => updateProjectRow(idx, 'methods_technologies', e.target.value)}
              maxLength={TEXT_LIMIT_SHORT}
              placeholder="Methods / Technologies (comma-separated)"
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm disabled:bg-neutral-50"
            />
            {editable && form.projects_research.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    projects_research: prev.projects_research.filter((_, i) => i !== idx),
                  }))
                }
                className="inline-flex items-center gap-1 text-xs text-red-700"
              >
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Skills */}
      <label className="block text-xs font-semibold uppercase tracking-widest text-neutral-400">
        Skills * (comma-separated)
        <input
          disabled={!editable}
          value={form.skills}
          onChange={(event) => setField('skills', event.target.value)}
          placeholder="e.g., Python, C++, Geant4"
          className="mt-1.5 w-full rounded border border-neutral-300 px-3 py-2.5 text-sm text-neutral-700 disabled:bg-neutral-50"
        />
      </label>

      {/* Awards */}
      <label className="block text-xs font-semibold uppercase tracking-widest text-neutral-400">
        Awards (comma-separated)
        <input
          disabled={!editable}
          value={form.awards}
          onChange={(event) => setField('awards', event.target.value)}
          placeholder="e.g., DAAD Scholarship 2023"
          className="mt-1.5 w-full rounded border border-neutral-300 px-3 py-2.5 text-sm text-neutral-700 disabled:bg-neutral-50"
        />
      </label>

      {/* Notes */}
      <label className="block text-xs font-semibold uppercase tracking-widest text-neutral-400">
        Additional Notes
        <textarea
          disabled={!editable}
          value={form.additional_notes}
          onChange={(event) => setField('additional_notes', event.target.value)}
          rows={4}
          maxLength={NOTES_LIMIT}
          placeholder="Anything else supervisors should know..."
          className="mt-1.5 w-full rounded border border-neutral-300 px-3 py-2.5 text-sm text-neutral-700 disabled:bg-neutral-50"
        />
      </label>

      {!hideSubmitButton && editable && (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmit}
            className="rounded bg-black px-6 py-3 text-sm font-semibold uppercase tracking-wider text-white disabled:opacity-50"
          >
            {submitting ? 'Saving...' : submitLabel}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded border border-neutral-300 px-5 py-3 text-sm font-medium text-neutral-700"
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default React.forwardRef(ApplicantProfileForm)
