import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Mail,
  GraduationCap,
  Briefcase,
  MapPin,
  Eye,
  Download,
} from 'lucide-react'
import {
  getSupervisorApplications,
  updateApplicationStatus,
  getApplicationCvPath,
  getStorageFileUrls,
} from '../../lib/supervisorApi'

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'SUBMITTED', label: 'Pending' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'SHORTLISTED', label: 'Shortlisted' },
  { value: 'UNDER_REVIEW', label: 'In Review' },
]

function statusLabel(status) {
  const map = {
    SUBMITTED: 'Pending',
    ACCEPTED: 'Accepted',
    REJECTED: 'Rejected',
    SHORTLISTED: 'Shortlisted',
    UNDER_REVIEW: 'In Review',
    WITHDRAWN: 'Withdrawn',
  }
  return map[status] || status
}

export default function SupervisorApplications() {
  const [searchParams] = useSearchParams()
  const projectFilter = searchParams.get('project')
  const statusParam = searchParams.get('status')

  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(() => {
    if (!statusParam) return 'SUBMITTED'
    if (statusParam === 'ALL') return ''
    return statusParam
  })
  const [viewMode, setViewMode] = useState('list')
  const [swipeIndex, setSwipeIndex] = useState(0)
  const [undoAction, setUndoAction] = useState(null)
  const [statusMutationError, setStatusMutationError] = useState('')
  const [isMutatingStatus, setIsMutatingStatus] = useState(false)
  const undoTimerRef = useRef(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const data = await getSupervisorApplications(projectFilter || null)
        setApplications(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [projectFilter])

  const filtered = useMemo(() => {
    return applications.filter((app) => {
      if (statusFilter && app.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        const name =
          `${app.applicants?.first_name || ''} ${app.applicants?.last_name || ''}`.toLowerCase()
        const email = (app.applicant_email || '').toLowerCase()
        const degree = (app.degree_label || '').toLowerCase()
        if (!name.includes(q) && !email.includes(q) && !degree.includes(q)) return false
      }
      return true
    })
  }, [applications, search, statusFilter])

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('')
  }

  const mutateStatusLocally = (applicationId, nextStatus) => {
    setApplications((prev) =>
      prev.map((application) =>
        application.application_id === applicationId
          ? { ...application, status: nextStatus }
          : application,
      ),
    )
  }

  const commitStatusChange = async (application, nextStatus) => {
    if (!application?.application_id || isMutatingStatus) return

    const previousStatus = application.status
    const applicantName = `${application.applicants?.first_name || ''} ${
      application.applicants?.last_name || ''
    }`.trim()

    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current)
      undoTimerRef.current = null
    }

    setStatusMutationError('')
    mutateStatusLocally(application.application_id, nextStatus)
    setSwipeIndex((value) => value + 1)
    setUndoAction({
      applicationId: application.application_id,
      previousStatus,
      nextStatus,
      applicantName,
    })

    setIsMutatingStatus(true)
    try {
      await updateApplicationStatus(application.application_id, nextStatus)
      undoTimerRef.current = setTimeout(() => {
        setUndoAction(null)
        undoTimerRef.current = null
      }, 5000)
    } catch (error) {
      mutateStatusLocally(application.application_id, previousStatus)
      setUndoAction(null)
      setStatusMutationError('Could not update application status. Please try again.')
    } finally {
      setIsMutatingStatus(false)
    }
  }

  const handleUndo = async () => {
    if (!undoAction || isMutatingStatus) return

    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current)
      undoTimerRef.current = null
    }

    setStatusMutationError('')
    mutateStatusLocally(undoAction.applicationId, undoAction.previousStatus)

    setIsMutatingStatus(true)
    try {
      await updateApplicationStatus(undoAction.applicationId, undoAction.previousStatus)
      setUndoAction(null)
    } catch (error) {
      mutateStatusLocally(undoAction.applicationId, undoAction.nextStatus)
      setStatusMutationError('Undo failed. Refresh and retry.')
    } finally {
      setIsMutatingStatus(false)
    }
  }

  useEffect(() => {
    const maxIndex = Math.max(filtered.length - 1, 0)
    if (swipeIndex > maxIndex) {
      setSwipeIndex(maxIndex)
    }
  }, [filtered.length, swipeIndex])

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current)
      }
    }
  }, [])

  return (
    <main className="mx-auto max-w-[1100px] px-6 py-10">
      {/* Back */}
      <Link
        to="/supervisor"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-black mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <h1 className="text-4xl font-bold tracking-tight text-black">
        All Applications
      </h1>
      <p className="mt-1 text-neutral-500">
        Review and manage all student applications across your projects.
      </p>

      {/* Filters card */}
      <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-5">
        <div className="flex gap-5">
          {/* Search */}
          <div className="flex-1">
            <p className="mb-1.5 text-xs font-semibold tracking-widest text-neutral-500 uppercase">
              Search Applications
            </p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by student name, email, or degree level..."
                className="w-full rounded border border-neutral-200 pl-9 pr-4 py-2.5 text-sm focus:border-neutral-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Status dropdown */}
          <div className="w-56">
            <p className="mb-1.5 text-xs font-semibold tracking-widest text-neutral-500 uppercase">
              Filter by Status
            </p>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full appearance-none rounded border border-neutral-200 px-4 py-2.5 text-sm focus:border-neutral-400 focus:outline-none pr-8 bg-white"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            </div>
          </div>
        </div>

        <button
          onClick={clearFilters}
          className="mt-3 rounded border border-neutral-200 px-3 py-1.5 text-xs text-neutral-500 hover:text-black hover:bg-neutral-50 transition"
        >
          Clear Filters
        </button>
      </div>

      {/* View mode toggle */}
      <div className="mt-5 flex gap-1">
        <button
          onClick={() => setViewMode('list')}
          className={`rounded px-5 py-2 text-sm font-medium transition ${
            viewMode === 'list'
              ? 'bg-black text-white'
              : 'border border-neutral-300 text-neutral-600 hover:bg-neutral-50'
          }`}
        >
          List View
        </button>
        <button
          onClick={() => {
            setViewMode('swipe')
            setSwipeIndex(0)
          }}
          className={`rounded px-5 py-2 text-sm font-medium transition ${
            viewMode === 'swipe'
              ? 'bg-black text-white'
              : 'border border-neutral-300 text-neutral-600 hover:bg-neutral-50'
          }`}
        >
          Swipe Mode
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
        </div>
      ) : viewMode === 'list' ? (
        <ListView filtered={filtered} />
      ) : (
        <SwipeView
          filtered={filtered}
          index={swipeIndex}
          setIndex={setSwipeIndex}
          onStatusSwipe={commitStatusChange}
          isMutatingStatus={isMutatingStatus}
        />
      )}

      {statusMutationError && (
        <div className="mt-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {statusMutationError}
        </div>
      )}

      {undoAction && (
        <div className="fixed bottom-6 right-6 z-50 rounded border border-neutral-200 bg-white px-4 py-3 shadow-lg">
          <p className="text-sm text-neutral-700">
            {undoAction.applicantName || 'Application'} marked as {statusLabel(undoAction.nextStatus)}.
          </p>
          <button
            type="button"
            onClick={handleUndo}
            disabled={isMutatingStatus}
            className="mt-2 text-sm font-semibold text-black underline disabled:opacity-50"
          >
            Undo
          </button>
        </div>
      )}
    </main>
  )
}

/* ── List view ── */
function ListView({ filtered }) {
  return (
    <>
      <p className="mt-4 text-sm text-neutral-500">
        {filtered.length} application{filtered.length !== 1 ? 's' : ''} found
      </p>
      {filtered.length === 0 ? (
        <p className="py-16 text-center text-neutral-400">No applications found.</p>
      ) : (
        <div className="mt-3 rounded-lg border border-neutral-200 bg-white divide-y divide-neutral-100">
          {filtered.map((app) => (
            <ApplicationRow key={app.application_id} app={app} />
          ))}
        </div>
      )}
    </>
  )
}

function ApplicationRow({ app }) {
  const submitted = new Date(app.submitted_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="flex items-center justify-between gap-4 px-6 py-4">
      <div className="min-w-0">
        <p className="font-semibold text-black">
          {app.applicants?.first_name} {app.applicants?.last_name}
        </p>
        <p className="text-sm text-neutral-500">
          {app.degree_label ? `${app.degree_label} \u2022 ` : ''}
          {app.applicant_email}
        </p>
        <p className="mt-0.5 text-xs text-neutral-400">Submitted {submitted}</p>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <span className="text-sm text-neutral-500">{statusLabel(app.status)}</span>
        <Link
          to={`/supervisor/applications/${app.application_id}`}
          className="rounded bg-black px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-800 transition"
        >
          Review
        </Link>
      </div>
    </div>
  )
}

/* ── Swipe mode ── */
function SwipeView({ filtered, index, setIndex, onStatusSwipe, isMutatingStatus }) {
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [cvPath, setCvPath] = useState(null)
  const [cvLoading, setCvLoading] = useState(false)
  const dragState = useRef({ active: false, startX: 0, pointerId: null })

  const safeIndex = Math.min(Math.max(index, 0), filtered.length - 1)
  const app = filtered[safeIndex]

  useEffect(() => {
    if (!app) return
    setCvPath(null)
    getApplicationCvPath(app).then(setCvPath)
  }, [app?.application_id])

  if (filtered.length === 0) {
    return (
      <p className="py-16 text-center text-neutral-400">No applications to review.</p>
    )
  }

  const swipeable = app.status === 'SUBMITTED' || app.status === 'UNDER_REVIEW'
  const isFirst = safeIndex === 0
  const isLast = safeIndex === filtered.length - 1
  const swipeThreshold = 120

  const applicantName =
    `${app.applicants?.first_name || ''} ${app.applicants?.last_name || ''}`.trim()
  const submitted = new Date(app.submitted_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const handleCvAction = async (mode) => {
    setCvLoading(true)
    try {
      const urls = await getStorageFileUrls(cvPath)
      const url = mode === 'view' ? urls.viewUrl : urls.downloadUrl
      if (url) window.open(url, '_blank')
    } finally {
      setCvLoading(false)
    }
  }

  const swipeHint =
    dragX < -50 ? 'REJECT' : dragX > 50 ? 'ACCEPT' : null

  const onPointerDown = (event) => {
    if (!swipeable || isMutatingStatus) return
    if (event.target.closest('a, button')) return
    dragState.current = {
      active: true,
      startX: event.clientX,
      pointerId: event.pointerId,
    }
    setDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event) => {
    if (!dragState.current.active || dragState.current.pointerId !== event.pointerId) return
    setDragX(event.clientX - dragState.current.startX)
  }

  const resetDrag = () => {
    dragState.current = { active: false, startX: 0, pointerId: null }
    setDragging(false)
    setDragX(0)
  }

  const onPointerUp = async (event) => {
    if (!dragState.current.active || dragState.current.pointerId !== event.pointerId) return
    event.currentTarget.releasePointerCapture(event.pointerId)

    const decision =
      dragX > swipeThreshold
        ? 'ACCEPTED'
        : dragX < -swipeThreshold
        ? 'REJECTED'
        : null

    resetDrag()

    if (decision) {
      await onStatusSwipe(app, decision)
    }
  }

  return (
    <div className="mt-6">
      <p className="text-sm text-neutral-500 text-center mb-4">
        {safeIndex + 1} of {filtered.length}
      </p>

      <div className="relative mx-auto max-w-2xl">
        {/* Swipe hint overlays */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-8 z-10">
          <span
            className={`rounded border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold text-red-600 transition-opacity ${
              swipeHint === 'REJECT' ? 'opacity-100' : 'opacity-0'
            }`}
          >
            REJECT
          </span>
          <span
            className={`rounded border border-green-200 bg-green-50 px-3 py-1 text-xs font-bold text-green-600 transition-opacity ${
              swipeHint === 'ACCEPT' ? 'opacity-100' : 'opacity-0'
            }`}
          >
            ACCEPT
          </span>
        </div>

        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={resetDrag}
          className={`rounded-[20px] border-[3px] border-neutral-900 bg-white shadow-2xl select-none touch-pan-y ${
            swipeable && !isMutatingStatus ? 'cursor-grab active:cursor-grabbing' : ''
          }`}
          style={{
            transform: `translateX(${dragX}px) rotate(${dragX / 28}deg)`,
            transition: dragging ? 'none' : 'transform 0.25s ease',
            opacity: isMutatingStatus ? 0.7 : 1,
          }}
        >
          {/* Header */}
          <header className="rounded-t-[16px] bg-gradient-to-r from-black to-slate-900 p-6 text-white">
            <h3 className="text-2xl font-bold">{applicantName || 'Unknown Applicant'}</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {app.degree_label && (
                <span className="inline-flex items-center gap-1 rounded bg-white/10 px-2.5 py-1 text-xs text-neutral-200">
                  <GraduationCap className="h-3.5 w-3.5" />
                  {app.degree_label}
                </span>
              )}
              {app.applicant_email && (
                <span className="inline-flex items-center gap-1 rounded bg-white/10 px-2.5 py-1 text-xs text-neutral-200">
                  <Mail className="h-3.5 w-3.5" />
                  {app.applicant_email}
                </span>
              )}
              <span className="rounded bg-white/10 px-2.5 py-1 text-xs text-neutral-200">
                Submitted {submitted}
              </span>
            </div>
          </header>

          <div className="space-y-3 p-5">
            {/* Status chip */}
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold tracking-wider ${
                swipeable
                  ? 'border-yellow-400 text-yellow-700'
                  : app.status === 'ACCEPTED'
                  ? 'border-green-400 text-green-700'
                  : app.status === 'REJECTED'
                  ? 'border-red-400 text-red-700'
                  : 'border-neutral-400 text-neutral-700'
              }`}
            >
              {statusLabel(app.status)}
            </span>

            {/* Project info */}
            {app.projects?.title && (
              <div className="rounded border border-neutral-200 p-3">
                <p className="text-xs uppercase tracking-wide text-neutral-400">Applied to Project</p>
                <p className="mt-0.5 text-base font-semibold text-neutral-800">{app.projects.title}</p>
                <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-neutral-500">
                  {app.projects.department && (
                    <span className="inline-flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5" />
                      {app.projects.department}
                    </span>
                  )}
                  {app.projects.location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {app.projects.location}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Cover letter */}
            {app.message && (
              <div className="rounded border border-neutral-200 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Cover Letter</p>
                <p className="mt-1 text-sm leading-relaxed text-neutral-600 line-clamp-5">
                  {app.message}
                </p>
              </div>
            )}

            {/* CV actions */}
            <div className="flex items-center justify-between rounded border border-neutral-200 p-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Curriculum Vitae</p>
                <p className="text-xs text-neutral-500">{cvPath ? 'PDF document' : 'No CV available'}</p>
              </div>
              <div className="flex gap-1.5">
                <button
                  disabled={!cvPath || cvLoading}
                  onClick={() => handleCvAction('view')}
                  className="flex items-center gap-1 rounded border border-neutral-300 px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50 transition disabled:opacity-40"
                >
                  <Eye className="h-3.5 w-3.5" /> View
                </button>
                <button
                  disabled={!cvPath || cvLoading}
                  onClick={() => handleCvAction('download')}
                  className="flex items-center gap-1 rounded border border-neutral-300 px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50 transition disabled:opacity-40"
                >
                  <Download className="h-3.5 w-3.5" /> Download
                </button>
              </div>
            </div>

            {/* Full review CTA */}
            <Link
              to={`/supervisor/applications/${app.application_id}`}
              className="inline-flex w-full items-center justify-center rounded-full bg-black px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              View Full Application & Review
            </Link>
          </div>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-neutral-400">
        {swipeable
          ? 'Drag left to reject \u2022 Drag right to accept'
          : 'This application has been decided. Use full review for further actions.'}
      </p>

      <div className="flex justify-center gap-3 mt-5">
        <button
          disabled={isFirst}
          onClick={() => setIndex((i) => i - 1)}
          className="flex items-center gap-1 rounded border border-neutral-200 px-4 py-2 text-sm text-neutral-600 disabled:opacity-30 hover:bg-neutral-50 transition"
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </button>
        <button
          disabled={isLast}
          onClick={() => setIndex((i) => i + 1)}
          className="flex items-center gap-1 rounded border border-neutral-200 px-4 py-2 text-sm text-neutral-600 disabled:opacity-30 hover:bg-neutral-50 transition"
        >
          Next <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
