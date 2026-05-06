import React from 'react'
import {
  ArrowRight,
  Check,
  Clock,
  GraduationCap,
  Layers,
  List as ListIcon,
  MapPin,
  Search,
  User,
  X,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { getOpportunities, submitApplication } from '../../lib/applicantApi'
import ApplicationModal from '../../components/applicant/ApplicationModal'
import Badge from '../../components/ui/Badge'

const defaultFilters = {
  search: '',
  department: 'all',
  location: 'all',
  educationLevel: 'all',
  duration: 'all',
}

function ListProjectCard({ project }) {
  const linkTo = `/applicant_dashboard/opportunities/${project.project_id || project.id}`
  return (
    <article className="overflow-hidden rounded-DEFAULT border border-line bg-card transition-colors hover:border-line-strong">
      <div className="px-5 py-4">
        <div className="mb-2.5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider2 text-ink-3">
              {project.department}
            </div>
            <Link
              to={linkTo}
              className="text-[15px] font-semibold leading-[1.35] text-ink hover:underline"
            >
              {project.title}
            </Link>
          </div>
          <Badge variant={project.compensation === 'paid' ? 'green' : 'neutral'}>
            {project.compensation === 'paid' ? 'Paid' : 'Unpaid'}
          </Badge>
        </div>

        <div className="mb-3 grid grid-cols-2 gap-x-5 gap-y-1.5 sm:grid-cols-4">
          {[
            { Icon: MapPin, val: project.location },
            { Icon: Clock, val: project.duration },
            { Icon: GraduationCap, val: project.education_level },
            { Icon: User, val: project.supervisor_name },
          ]
            .filter((d) => d.val)
            .map((d, i) => (
              <span
                key={i}
                className="flex items-center gap-1.5 text-[12px] text-ink-2"
              >
                <d.Icon className="h-3 w-3 shrink-0" />
                <span className="truncate">{d.val}</span>
              </span>
            ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(project.tags || []).map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
      </div>

      <div className="flex justify-end border-t border-line px-5 py-2.5">
        <Link
          to={linkTo}
          className="inline-flex items-center gap-1.5 rounded-sm bg-ink px-3 py-1.5 text-[12px] font-medium text-white transition-opacity hover:opacity-85"
        >
          View Details <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </article>
  )
}

function SwipeCard({ project, onSkip, onApply }) {
  const dragState = React.useRef({ active: false, startX: 0, pointerId: null })
  const [dragX, setDragX] = React.useState(0)
  const [dragging, setDragging] = React.useState(false)
  const swipeThreshold = 100

  const onPointerDown = (e) => {
    if (e.target.closest('a') || e.target.closest('button')) return
    dragState.current = { active: true, startX: e.clientX, pointerId: e.pointerId }
    setDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e) => {
    if (!dragState.current.active || dragState.current.pointerId !== e.pointerId) return
    setDragX(e.clientX - dragState.current.startX)
  }
  const reset = () => {
    dragState.current = { active: false, startX: 0, pointerId: null }
    setDragging(false)
    setDragX(0)
  }
  const onPointerUp = (e) => {
    if (!dragState.current.active || dragState.current.pointerId !== e.pointerId) return
    e.currentTarget.releasePointerCapture(e.pointerId)
    if (dragX < -swipeThreshold) onSkip()
    else if (dragX > swipeThreshold) onApply()
    reset()
  }

  const hint = dragX < -40 ? 'skip' : dragX > 40 ? 'apply' : null

  return (
    <div className="relative w-full max-w-[420px] sm:max-w-[520px] lg:max-w-[640px] xl:max-w-[720px] mx-auto">
      {hint && (
        <div
          className={[
            'pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-lg border-2',
            hint === 'apply'
              ? 'bg-ok-bg/30 border-ok'
              : 'bg-danger-bg/30 border-danger',
          ].join(' ')}
        >
          <span
            className={[
              'text-[22px] font-bold tracking-[0.1em]',
              hint === 'apply' ? 'text-ok' : 'text-danger',
            ].join(' ')}
          >
            {hint === 'apply' ? '✓ APPLY' : '✕ SKIP'}
          </span>
        </div>
      )}
      <article
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={reset}
        className="cursor-grab touch-pan-y select-none overflow-hidden rounded-lg border border-line bg-card shadow-pop active:cursor-grabbing"
        style={{
          transform: `translateX(${dragX}px) rotate(${dragX / 30}deg)`,
          transition: dragging ? 'none' : 'transform 0.25s ease',
        }}
      >
        <div className="bg-ink px-5 sm:px-6 lg:px-8 pb-5 pt-6 lg:pt-8">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider2 text-white/45">
            {project.department}
          </div>
          <h3 className="mb-2.5 text-[20px] sm:text-[22px] lg:text-[24px] font-bold leading-[1.3] text-white">
            {project.title}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {(project.tags || []).map((t) => (
              <span
                key={t}
                className="rounded-sm bg-white/10 px-2 py-0.5 text-[11px] text-white/80"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="p-5 sm:p-6 lg:p-8">
          <div className="mb-5 grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {[
              { Icon: MapPin, label: 'Location', val: project.location },
              { Icon: Clock, label: 'Duration', val: project.duration },
              { Icon: GraduationCap, label: 'Level', val: project.education_level },
              { Icon: User, label: 'Supervisor', val: project.supervisor_name },
            ].map((d, i) => (
              <div
                key={i}
                className="rounded-sm border border-line px-3 py-2.5"
              >
                <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider2 text-ink-3">
                  <d.Icon className="h-2.5 w-2.5" />
                  {d.label}
                </div>
                <div className="truncate text-[13px] font-medium">{d.val || '—'}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onSkip}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-sm border border-danger-border bg-danger-bg px-3 py-2.5 sm:py-3 text-[13px] sm:text-[14px] font-medium text-danger transition-opacity hover:opacity-85"
            >
              <X className="h-3.5 w-3.5" /> Skip
            </button>
            <button
              type="button"
              onClick={onApply}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-sm bg-accent px-3 py-2.5 sm:py-3 text-[13px] sm:text-[14px] font-semibold text-accent-fg transition-opacity hover:opacity-90"
            >
              <Check className="h-3.5 w-3.5" /> Apply
            </button>
          </div>
        </div>
      </article>
    </div>
  )
}

export default function Opportunities({ publicPreview = false }) {
  const navigate = useNavigate()
  const [filters, setFilters] = React.useState(defaultFilters)
  const [projects, setProjects] = React.useState([])
  const [hasMore, setHasMore] = React.useState(false)
  const [filterOptions, setFilterOptions] = React.useState({
    departments: [],
    locations: [],
  })
  const [viewMode, setViewMode] = React.useState('list')
  const [loading, setLoading] = React.useState(true)
  const [swipeIndex, setSwipeIndex] = React.useState(0)
  const [applicationProject, setApplicationProject] = React.useState(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [feedback, setFeedback] = React.useState('')

  const previewLimit = publicPreview ? 6 : null

  const refreshProjects = React.useCallback(async () => {
    setLoading(true)
    const data = await getOpportunities({ ...filters, limit: previewLimit })
    if (publicPreview && data.projects.length > 5) {
      setHasMore(true)
      setProjects(data.projects.slice(0, 5))
    } else {
      setHasMore(false)
      setProjects(data.projects)
    }
    setFilterOptions(data.filterOptions)
    setSwipeIndex(0)
    setLoading(false)
  }, [filters, previewLimit, publicPreview])

  React.useEffect(() => {
    refreshProjects()
  }, [refreshProjects])

  const onChangeFilter = (name, value) =>
    setFilters((prev) => ({ ...prev, [name]: value }))
  const clearAllFilters = () => setFilters(defaultFilters)

  const currentSwipeProject = projects[swipeIndex]

  const handleSwipeNext = () => {
    setSwipeIndex((prev) => (projects.length ? (prev + 1) % projects.length : 0))
  }

  const handleSubmitApplication = async ({ coverLetter, file }) => {
    if (!applicationProject) return
    setIsSubmitting(true)
    await submitApplication({
      projectId: applicationProject.project_id || applicationProject.id,
      coverLetterText: coverLetter,
      coverLetterFile: file,
    })
    setIsSubmitting(false)
    setApplicationProject(null)
    setFeedback('Application submitted successfully.')
  }

  const containerClass = publicPreview
    ? 'mx-auto w-full max-w-[1100px] px-6 py-10'
    : 'px-6 py-8 sm:px-9'

  return (
    <div className={containerClass}>
      <header className="fade-up mb-6">
        <h1 className="text-[22px] font-bold tracking-tightish">Find Your Research Project</h1>
        <p className="mt-1 text-[13px] text-ink-2">
          Search and filter through {projects.length} open opportunities.
        </p>
      </header>

      <div className="fade-up fade-up-1 mb-5 flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[260px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-3" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onChangeFilter('search', e.target.value)}
            placeholder="Search projects, research fields, supervisors..."
            className="w-full rounded-sm border border-line bg-card py-2 pl-9 pr-3 text-[13px] outline-none transition-colors focus:border-line-strong"
          />
        </div>

        {!publicPreview && (
          <div className="flex gap-1.5 rounded-sm border border-line bg-card p-[3px]">
            {[
              { key: 'list', Icon: ListIcon, label: 'List' },
              { key: 'swipe', Icon: Layers, label: 'Swipe' },
            ].map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setViewMode(m.key)}
                className={[
                  'inline-flex items-center gap-1.5 rounded-sm px-3 py-1 text-[12px] font-medium transition-colors',
                  viewMode === m.key
                    ? 'bg-ink text-white'
                    : 'text-ink-2 hover:text-ink',
                ].join(' ')}
              >
                <m.Icon className="h-3 w-3" />
                {m.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {feedback && (
        <p className="mb-4 rounded-sm border border-ok-border bg-ok-bg px-3 py-2 text-[13px] text-ok">
          {feedback}
        </p>
      )}

      {loading && <p className="text-[13px] text-ink-3">Loading projects…</p>}

      {!loading && viewMode === 'list' && (
        <div
          className={
            publicPreview
              ? 'flex flex-col gap-3'
              : 'grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr]'
          }
        >
          {!publicPreview && (
            <aside className="h-fit rounded-DEFAULT border border-line bg-card p-4">
              <div className="mb-3.5 text-[11px] font-semibold uppercase tracking-wider2 text-ink-3">
                Filters
              </div>
              <div className="flex flex-col gap-3">
                {[
                  {
                    key: 'department',
                    label: 'Department',
                    options: filterOptions.departments,
                  },
                  {
                    key: 'location',
                    label: 'Location',
                    options: filterOptions.locations,
                  },
                  {
                    key: 'educationLevel',
                    label: 'Education',
                    options: ['Master', 'PhD'],
                  },
                  {
                    key: 'duration',
                    label: 'Duration',
                    options: ['2', '3', '4'],
                  },
                ].map((f) => (
                  <label key={f.key} className="block">
                    <span className="mb-1 block text-[11px] font-medium text-ink-2">
                      {f.label}
                    </span>
                    <select
                      value={filters[f.key]}
                      onChange={(e) => onChangeFilter(f.key, e.target.value)}
                      className="w-full appearance-none rounded-sm border border-line bg-card px-3 py-2 pr-7 text-[13px] outline-none focus:border-line-strong"
                    >
                      <option value="all">{`All ${f.label}s`}</option>
                      {f.options.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}

                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="mt-1 text-left text-[12px] text-ink-3 hover:text-ink"
                >
                  Clear all filters
                </button>
              </div>
            </aside>
          )}

          <div className="flex flex-col gap-2.5">
            <div className="text-[12px] text-ink-3">
              {projects.length} project{projects.length === 1 ? '' : 's'} found
            </div>
            {projects.map((project) => (
              <ListProjectCard
                key={project.project_id || project.id}
                project={project}
              />
            ))}

            {!projects.length && (
              <div className="rounded-DEFAULT border border-line bg-card px-5 py-10 text-center text-[13px] text-ink-3">
                No projects match your filters.
              </div>
            )}

            {publicPreview && hasMore && (
              <div className="mt-4 rounded-DEFAULT border border-line bg-card px-6 py-7 text-center">
                <div className="text-[15px] font-semibold">Want to see more projects?</div>
                <p className="mt-1 text-[13px] text-ink-2">
                  Sign up to browse all opportunities and apply directly.
                </p>
                <Link
                  to="/auth/signup"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-sm bg-ink px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-85"
                >
                  Sign Up to See More
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {!loading && viewMode === 'swipe' && !publicPreview && (
        <div className="flex flex-col items-center gap-5 pt-4 px-4 sm:px-6">
          {currentSwipeProject ? (
            <>
              <p className="text-[12px] text-ink-3">
                {swipeIndex + 1} of {projects.length} — Drag left to skip, right to apply
              </p>
              <SwipeCard
                project={currentSwipeProject}
                onSkip={handleSwipeNext}
                onApply={() => setApplicationProject(currentSwipeProject)}
              />
            </>
          ) : (
            <div className="rounded-DEFAULT border border-line bg-card px-6 py-10 text-center text-[13px] text-ink-3">
              No projects available in swipe mode.
            </div>
          )}
        </div>
      )}

      <ApplicationModal
        projectTitle={applicationProject?.title}
        isOpen={Boolean(applicationProject)}
        isSubmitting={isSubmitting}
        onClose={() => setApplicationProject(null)}
        onSubmit={handleSubmitApplication}
      />
    </div>
  )
}
