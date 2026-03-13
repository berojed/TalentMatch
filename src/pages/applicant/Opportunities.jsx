import React from 'react'
import {
  Layers3,
  List,
  Search,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { getOpportunities, submitApplication } from '../../lib/applicantApi'
import ApplicationModal from '../../components/applicant/ApplicationModal'

const defaultFilters = {
  search: '',
  department: 'all',
  location: 'all',
  educationLevel: 'all',
  duration: 'all',
}

function formatCompensation(compensation) {
  return compensation === 'paid' ? 'PAID' : 'UNPAID'
}

function ListProjectCard({ project }) {
  return (
    <article className="rounded border border-neutral-200 bg-white p-6">
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="text-5xl font-bold leading-tight text-black">{project.title}</h3>
        <span className="rounded-full border border-neutral-300 px-3 py-1 text-xs font-bold tracking-wider text-neutral-600">
          {formatCompensation(project.compensation)}
        </span>
      </div>

      <p className="text-lg text-neutral-600">{project.summary}</p>

      <div className="mt-5 grid gap-4 border-t border-neutral-200 pt-4 md:grid-cols-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-neutral-400">Department</p>
          <p className="text-lg text-neutral-700">{project.department}</p>
        </div>
        <div>
          <p className="text-sm uppercase tracking-wide text-neutral-400">Location</p>
          <p className="text-lg text-neutral-700">{project.location}</p>
        </div>
        <div>
          <p className="text-sm uppercase tracking-wide text-neutral-400">Duration</p>
          <p className="text-lg text-neutral-700">{project.duration}</p>
        </div>
        <div>
          <p className="text-sm uppercase tracking-wide text-neutral-400">Education Level</p>
          <p className="text-lg text-neutral-700">{project.education_level}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(project.tags || []).map((tag) => (
          <span
            key={`${project.id}-${tag}`}
            className="rounded bg-neutral-100 px-2 py-1 text-xs text-neutral-500"
          >
            {tag}
          </span>
        ))}
      </div>

      <Link
        to={`/applicant/opportunities/${project.id}`}
        className="mt-5 inline-flex rounded bg-black px-5 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-neutral-800"
      >
        View Details
      </Link>
    </article>
  )
}

function SwipeProjectCard({ project, onReject, onApply }) {
  const dragState = React.useRef({ active: false, startX: 0, pointerId: null })
  const [dragX, setDragX] = React.useState(0)
  const [dragging, setDragging] = React.useState(false)
  const swipeThreshold = 100

  const onPointerDown = (e) => {
    // Don't capture if clicking a link
    if (e.target.closest('a')) return
    dragState.current = { active: true, startX: e.clientX, pointerId: e.pointerId }
    setDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e) => {
    if (!dragState.current.active || dragState.current.pointerId !== e.pointerId) return
    setDragX(e.clientX - dragState.current.startX)
  }

  const resetDrag = () => {
    dragState.current = { active: false, startX: 0, pointerId: null }
    setDragging(false)
    setDragX(0)
  }

  const onPointerUp = (e) => {
    if (!dragState.current.active || dragState.current.pointerId !== e.pointerId) return
    e.currentTarget.releasePointerCapture(e.pointerId)

    if (dragX < -swipeThreshold) {
      onReject()
    } else if (dragX > swipeThreshold) {
      onApply()
    }

    resetDrag()
  }

  const swipeHint =
    dragX < -40 ? 'SKIP' : dragX > 40 ? 'APPLY' : null

  return (
    <div className="relative mx-auto w-full max-w-2xl">
      {/* Swipe hint overlays */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-8 z-10">
        <span
          className={`rounded border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold text-red-600 transition-opacity ${
            swipeHint === 'SKIP' ? 'opacity-100' : 'opacity-0'
          }`}
        >
          SKIP
        </span>
        <span
          className={`rounded border border-green-200 bg-green-50 px-3 py-1 text-xs font-bold text-green-600 transition-opacity ${
            swipeHint === 'APPLY' ? 'opacity-100' : 'opacity-0'
          }`}
        >
          APPLY
        </span>
      </div>

      <article
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={resetDrag}
        className="rounded-[20px] border-[3px] border-neutral-900 bg-white shadow-2xl select-none touch-pan-y cursor-grab active:cursor-grabbing"
        style={{
          transform: `translateX(${dragX}px) rotate(${dragX / 28}deg)`,
          transition: dragging ? 'none' : 'transform 0.25s ease',
        }}
      >
        <header className="rounded-t-[16px] bg-gradient-to-r from-black to-slate-900 p-6 text-white">
          <h3 className="text-5xl font-bold leading-tight">{project.title}</h3>
          <p className="mt-3 inline-block rounded bg-white/10 px-3 py-1 text-sm text-neutral-200">
            {(project.tags || []).join(', ')}
          </p>
        </header>

        <div className="space-y-3 p-5">
          <span className="inline-flex rounded-full border border-neutral-400 px-3 py-1 text-xs font-bold tracking-wider text-neutral-700">
            {formatCompensation(project.compensation)} OPPORTUNITY
          </span>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded border border-neutral-200 p-3">
              <p className="text-xs uppercase tracking-wide text-neutral-400">Duration</p>
              <p className="text-base font-semibold text-neutral-700">{project.duration}</p>
            </div>
            <div className="rounded border border-neutral-200 p-3">
              <p className="text-xs uppercase tracking-wide text-neutral-400">Location</p>
              <p className="text-base font-semibold text-neutral-700">{project.location}</p>
            </div>
            <div className="rounded border border-neutral-200 p-3">
              <p className="text-xs uppercase tracking-wide text-neutral-400">Study Level</p>
              <p className="text-base font-semibold text-neutral-700">{project.education_level}</p>
            </div>
            <div className="rounded border border-neutral-200 p-3">
              <p className="text-xs uppercase tracking-wide text-neutral-400">Supervisor</p>
              <p className="text-base font-semibold text-neutral-700">{project.supervisor_name}</p>
            </div>
          </div>

          <div className="rounded border border-neutral-200 p-3">
            <p className="text-lg font-semibold text-neutral-800">Requirements</p>
            <p className="mt-1 text-sm text-neutral-600">{project.requirements}</p>
          </div>

          <div className="rounded border border-neutral-200 p-3">
            <p className="text-lg font-semibold text-neutral-800">Project Summary</p>
            <p className="mt-1 text-sm text-neutral-600">{project.summary}</p>
          </div>

          <Link
            to={`/applicant/opportunities/${project.id}`}
            className="inline-flex w-full items-center justify-center rounded-full bg-black px-4 py-3 text-center text-base font-semibold text-white transition hover:bg-neutral-800"
          >
            View Full Details & Apply
          </Link>
        </div>
      </article>

      <p className="mt-4 text-center text-xs text-neutral-400">
        Drag left to skip &bull; Drag right to apply
      </p>
    </div>
  )
}

export default function Opportunities() {
  const navigate = useNavigate()
  const [filters, setFilters] = React.useState(defaultFilters)
  const [projects, setProjects] = React.useState([])
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

  const refreshProjects = React.useCallback(async () => {
    setLoading(true)
    const data = await getOpportunities(filters)
    setProjects(data.projects)
    setFilterOptions(data.filterOptions)
    setSwipeIndex(0)
    setLoading(false)
  }, [filters])

  React.useEffect(() => {
    refreshProjects()
  }, [refreshProjects])

  const onChangeFilter = (name, value) => {
    setFilters((prevState) => ({
      ...prevState,
      [name]: value,
    }))
  }

  const clearAllFilters = () => setFilters(defaultFilters)

  const currentSwipeProject = projects[swipeIndex]

  const handleSwipeNext = () => {
    setSwipeIndex((prev) => {
      if (!projects.length) {
        return 0
      }
      return (prev + 1) % projects.length
    })
  }

  const handleSubmitApplication = async ({ coverLetter, file }) => {
    if (!applicationProject) {
      return
    }

    setIsSubmitting(true)
    await submitApplication({
      projectId: applicationProject.id,
      coverLetterText: coverLetter,
      coverLetterFile: file,
    })
    setIsSubmitting(false)
    setApplicationProject(null)
    setFeedback('Application submitted successfully.')
  }

  return (
    <main>
      <section className="border-b border-neutral-200">
        <div className="mx-auto w-full max-w-[1200px] px-4 py-12 sm:px-8">
          <h1 className="text-7xl font-bold tracking-tight text-black">Find Your Research Project</h1>
          <p className="mt-4 max-w-3xl text-2xl text-neutral-600">
            Search and filter through research projects to find the perfect opportunity for your academic journey.
          </p>

          {viewMode === 'list' && (
            <label className="mt-10 block">
              <span className="sr-only">Search projects</span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(event) => onChangeFilter('search', event.target.value)}
                  placeholder="Search by project title, description, or research field..."
                  className="w-full rounded-full border border-neutral-300 bg-white px-12 py-4 text-lg outline-none transition focus:border-neutral-500"
                />
              </div>
            </label>
          )}

          <div className="mt-6 inline-flex rounded-2xl border border-neutral-300 bg-white p-1">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2 text-base transition ${
                viewMode === 'list'
                  ? 'bg-black font-medium text-white'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              <List className="h-4 w-4" />
              List View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('swipe')}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2 text-base transition ${
                viewMode === 'swipe'
                  ? 'bg-black font-medium text-white'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              <Layers3 className="h-4 w-4" />
              Swipe Mode
            </button>
          </div>

          {feedback && <p className="mt-4 text-base text-green-700">{feedback}</p>}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1200px] px-4 py-12 sm:px-8">
        {loading && <p className="text-base text-neutral-500">Loading projects...</p>}

        {!loading && viewMode === 'list' && (
          <div className="grid gap-5 lg:grid-cols-[290px_1fr]">
            <aside className="h-fit rounded border border-neutral-200 bg-white p-6">
              <h2 className="text-4xl font-bold text-black">Filters</h2>

              <div className="mt-5 space-y-4">
                <label className="block text-base text-neutral-700">
                  Department
                  <select
                    value={filters.department}
                    onChange={(event) => onChangeFilter('department', event.target.value)}
                    className="mt-2 w-full rounded border border-neutral-300 px-4 py-3 text-base"
                  >
                    <option value="all">All Departments</option>
                    {filterOptions.departments.map((department) => (
                      <option key={department} value={department}>
                        {department}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-base text-neutral-700">
                  Location
                  <select
                    value={filters.location}
                    onChange={(event) => onChangeFilter('location', event.target.value)}
                    className="mt-2 w-full rounded border border-neutral-300 px-4 py-3 text-base"
                  >
                    <option value="all">All Locations</option>
                    {filterOptions.locations.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-base text-neutral-700">
                  Education Level
                  <select
                    value={filters.educationLevel}
                    onChange={(event) => onChangeFilter('educationLevel', event.target.value)}
                    className="mt-2 w-full rounded border border-neutral-300 px-4 py-3 text-base"
                  >
                    <option value="all">All Levels</option>
                    <option value="Master">Master</option>
                    <option value="PhD">PhD</option>
                  </select>
                </label>

                <label className="block text-base text-neutral-700">
                  Duration
                  <select
                    value={filters.duration}
                    onChange={(event) => onChangeFilter('duration', event.target.value)}
                    className="mt-2 w-full rounded border border-neutral-300 px-4 py-3 text-base"
                  >
                    <option value="all">All Durations</option>
                    <option value="2">2 years</option>
                    <option value="3">3 years</option>
                    <option value="4">4 years</option>
                  </select>
                </label>

                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="w-full rounded border border-neutral-300 px-4 py-3 text-base font-medium text-neutral-700 transition hover:bg-neutral-100"
                >
                  Clear All Filters
                </button>
              </div>
            </aside>

            <div className="space-y-3">
              {projects.map((project) => (
                <ListProjectCard key={project.id} project={project} />
              ))}

              {!projects.length && (
                <p className="rounded border border-neutral-200 bg-white p-6 text-neutral-600">
                  No projects match your filters.
                </p>
              )}
            </div>
          </div>
        )}

        {!loading && viewMode === 'swipe' && (
          <div className="flex flex-col items-center gap-6 py-10">
            {currentSwipeProject ? (
              <SwipeProjectCard
                project={currentSwipeProject}
                onReject={handleSwipeNext}
                onApply={() => setApplicationProject(currentSwipeProject)}
              />
            ) : (
              <p className="text-neutral-600">No projects available in swipe mode.</p>
            )}
          </div>
        )}
      </section>

      <ApplicationModal
        projectTitle={applicationProject?.title}
        isOpen={Boolean(applicationProject)}
        isSubmitting={isSubmitting}
        onClose={() => setApplicationProject(null)}
        onSubmit={handleSubmitApplication}
      />
    </main>
  )
}
