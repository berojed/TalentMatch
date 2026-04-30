import React from 'react'

const TEXT_LIMIT_SHORT = 120
const TEXT_LIMIT_LONG = 1500

function trimStringArray(list) {
  return list.map((s) => (s || '').trim()).filter(Boolean)
}

function buildInitialForm(initial) {
  const src = initial || {}
  const researchAreas = Array.isArray(src.research_areas) ? src.research_areas : []
  return {
    lab_name: src.lab_name || '',
    institution: src.institution || '',
    department: src.department || '',
    research_areas: researchAreas.join(', '),
    years_experience:
      src.years_experience != null && src.years_experience !== ''
        ? String(src.years_experience)
        : '',
    short_bio: src.short_bio || '',
    past_projects: src.past_projects || '',
    key_achievements: src.key_achievements || '',
    current_project_info: src.current_project_info || '',
    applicant_expectations: src.applicant_expectations || '',
  }
}

function SupervisorProfileForm(
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

  React.useEffect(() => {
    setForm(buildInitialForm(initialValues))
  }, [initialValues])

  const editable = !disabled

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const validate = () => {
    if (!form.lab_name.trim()) return 'Lab name is required.'
    if (!form.institution.trim()) return 'Institution is required.'
    if (!form.department.trim()) return 'Department is required.'
    if (trimStringArray(form.research_areas.split(',')).length === 0) {
      return 'Add at least one research area.'
    }
    const years = Number(form.years_experience)
    if (!form.years_experience || !Number.isFinite(years) || years < 0 || years > 80) {
      return 'Years of experience must be a number between 0 and 80.'
    }
    if (!form.short_bio.trim()) return 'Short bio is required.'
    if (!form.current_project_info.trim()) return 'Current project info is required.'
    if (!form.applicant_expectations.trim()) return 'Applicant expectations are required.'
    return null
  }

  const buildPayload = () => {
    const research = trimStringArray(form.research_areas.split(',')).map((s) =>
      s.slice(0, TEXT_LIMIT_SHORT),
    )
    return {
      lab_name: form.lab_name.trim().slice(0, TEXT_LIMIT_SHORT),
      institution: form.institution.trim().slice(0, TEXT_LIMIT_SHORT),
      department: form.department.trim().slice(0, TEXT_LIMIT_SHORT),
      research_areas: research,
      years_experience: form.years_experience ? Number(form.years_experience) : null,
      short_bio: form.short_bio.trim().slice(0, TEXT_LIMIT_LONG),
      past_projects: (form.past_projects || '').trim().slice(0, TEXT_LIMIT_LONG),
      key_achievements: (form.key_achievements || '').trim().slice(0, TEXT_LIMIT_LONG),
      current_project_info: form.current_project_info.trim().slice(0, TEXT_LIMIT_LONG),
      applicant_expectations: form.applicant_expectations.trim().slice(0, TEXT_LIMIT_LONG),
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

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-black">Lab & Department</h3>
        <Field label="Lab Name *" disabled={!editable} value={form.lab_name} onChange={(v) => setField('lab_name', v)} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Institution *" disabled={!editable} value={form.institution} onChange={(v) => setField('institution', v)} />
          <Field label="Department *" disabled={!editable} value={form.department} onChange={(v) => setField('department', v)} />
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-black">Research & Experience</h3>
        <Field
          label="Research Areas * (comma-separated)"
          disabled={!editable}
          value={form.research_areas}
          onChange={(v) => setField('research_areas', v)}
          placeholder="e.g., Quantum Optics, QED, Precision Spectroscopy"
        />
        <Field
          label="Years of Experience *"
          type="number"
          disabled={!editable}
          value={form.years_experience}
          onChange={(v) => setField('years_experience', v)}
        />
        <Textarea
          label="Short Bio *"
          disabled={!editable}
          value={form.short_bio}
          onChange={(v) => setField('short_bio', v)}
          rows={5}
          placeholder="A brief description of your research background..."
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-black">Project History & Expectations</h3>
        <Textarea
          label="Past Projects"
          disabled={!editable}
          value={form.past_projects}
          onChange={(v) => setField('past_projects', v)}
          rows={3}
          placeholder="Notable past supervised projects..."
        />
        <Textarea
          label="Key Achievements"
          disabled={!editable}
          value={form.key_achievements}
          onChange={(v) => setField('key_achievements', v)}
          rows={3}
          placeholder="Awards, recognitions, key publications..."
        />
        <Textarea
          label="Current Project Info *"
          disabled={!editable}
          value={form.current_project_info}
          onChange={(v) => setField('current_project_info', v)}
          rows={4}
          placeholder="What's your group currently working on?"
        />
        <Textarea
          label="What I Expect from Applicants *"
          disabled={!editable}
          value={form.applicant_expectations}
          onChange={(v) => setField('applicant_expectations', v)}
          rows={4}
          placeholder="Skills, attitudes, and commitment expected..."
        />
      </div>

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

export default React.forwardRef(SupervisorProfileForm)

function Field({ label, value, onChange, disabled, placeholder, type = 'text' }) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-widest text-neutral-400">
      {label}
      <input
        type={type}
        disabled={disabled}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={type === 'number' ? undefined : TEXT_LIMIT_SHORT}
        className="mt-1.5 w-full rounded border border-neutral-300 px-3 py-2.5 text-sm text-neutral-700 disabled:bg-neutral-50"
      />
    </label>
  )
}

function Textarea({ label, value, onChange, disabled, placeholder, rows = 3 }) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-widest text-neutral-400">
      {label}
      <textarea
        disabled={disabled}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={TEXT_LIMIT_LONG}
        className="mt-1.5 w-full rounded border border-neutral-300 px-3 py-2.5 text-sm text-neutral-700 disabled:bg-neutral-50 resize-y"
      />
    </label>
  )
}
