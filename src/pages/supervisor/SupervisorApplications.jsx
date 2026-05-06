import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Eye,
  Layers,
  List as ListIcon,
  Mail,
  Search,
  X,
} from 'lucide-react'
import {
  getSupervisorApplications,
  updateApplicationStatus,
} from '../../lib/supervisorApi'
import Badge, { StatusBadge } from '../../components/ui/Badge'

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'SUBMITTED', label: 'Pending' },
  { value: 'UNDER_REVIEW', label: 'In Review' },
  { value: 'SHORTLISTED', label: 'Shortlisted' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'REJECTED', label: 'Rejected' },
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

function formatSubmitted(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Illustrative match score from available profile signals.
function computeMatchScore(app) {
  const summary = app.applicants?.profile_summary || {}
  const skills = (summary.skills || []).length
  const experience = (summary.experience_top || []).length
  const projects = (summary.projects_top || []).length
  const hasAcademic = !!summary?.academic?.field_of_study ? 1 : 0
  return Math.min(98, 55 + skills * 4 + experience * 6 + projects * 5 + hasAcademic * 8)
}

function fullName(app) {
  const f = app.applicants?.first_name || ''
  const l = app.applicants?.last_name || ''
  return `${f} ${l}`.trim() || app.applicant_email || 'Applicant'
}

export default function SupervisorApplications() {
  const [showFavorites, setShowFavorites] = useState(false)
  const [searchParams] = useSearchParams()
  const projectFilter = searchParams.get('project')
  const statusParam = searchParams.get('status')

  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(() => {
    if (!statusParam) return ''
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
        const data = await getSupervisorApplications(projectFilter || null, {
          favoritedOnly: showFavorites,
        })
        setApplications(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [projectFilter, showFavorites])

  const filtered = useMemo(() => {
    return applications.filter((app) => {
      if (statusFilter && app.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        const name = fullName(app).toLowerCase()
        const email = (app.applicant_email || '').toLowerCase()
        const degree = (app.degree_label || '').toLowerCase()
        if (!name.includes(q) && !email.includes(q) && !degree.includes(q)) return false
      }
      return true
    })
  }, [applications, search, statusFilter])
  const swipeDeck = useMemo(
    () =>
      filtered.filter(
        (a) =>
          a.status !== 'ACCEPTED' &&
          a.status !== 'REJECTED' &&
          a.status !== 'WITHDRAWN',
      ),
    [filtered],
  )

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
    const applicantName = fullName(application)

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
    const maxIndex = Math.max(swipeDeck.length - 1, 0)
    if (swipeIndex > maxIndex) setSwipeIndex(maxIndex)
  }, [swipeDeck.length, swipeIndex])

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    }
  }, [])

  return (
    <div className="px-6 py-8 sm:px-9 lg:max-w-[1000px]">
      <Link
        to="/supervisor"
        className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-ink-2 hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
      </Link>

      <header className="fade-up mb-6">
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="text-[22px] font-bold tracking-tightish">
            {showFavorites ? 'Shortlisted Applications' : 'All Applications'}
          </h1>
          <button
            type="button"
            onClick={() => setShowFavorites((v) => !v)}
            className="text-[12px] text-ink-3 hover:text-ink"
          >
            {showFavorites ? 'Show All' : 'Show Shortlisted'}
          </button>
        </div>
        <p className="mt-1 text-[13px] text-ink-2">
          {showFavorites
            ? 'Applications you’ve shortlisted for follow-up.'
            : 'Review and manage student applications across your projects.'}
        </p>
      </header>

      {/* Filter row */}
      <div className="fade-up fade-up-1 mb-5 flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-3" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, degree..."
            className="w-full rounded-sm border border-line bg-card py-2 pl-9 pr-3 text-[13px] outline-none transition-colors focus:border-line-strong"
          />
        </div>
        <div className="relative w-[180px]">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full appearance-none rounded-sm border border-line bg-card px-3 py-2 pr-8 text-[13px] outline-none focus:border-line-strong"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-ink-3" />
        </div>
        <div className="flex gap-1.5 rounded-sm border border-line bg-card p-[3px]">
          {[
            { key: 'list', Icon: ListIcon, label: 'List' },
            { key: 'swipe', Icon: Layers, label: 'Swipe' },
          ].map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => {
                setViewMode(m.key)
                if (m.key === 'swipe') setSwipeIndex(0)
              }}
              className={[
                'inline-flex items-center gap-1.5 rounded-sm px-3 py-1 text-[12px] font-medium transition-colors',
                viewMode === m.key ? 'bg-ink text-white' : 'text-ink-2 hover:text-ink',
              ].join(' ')}
            >
              <m.Icon className="h-3 w-3" />
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <span className="spinner" />
        </div>
      ) : viewMode === 'list' ? (
        <ListView filtered={filtered} />
      ) : (
        <SwipeView
          filtered={swipeDeck}
          index={swipeIndex}
          setIndex={setSwipeIndex}
          onStatusSwipe={commitStatusChange}
          isMutatingStatus={isMutatingStatus}
        />
      )}

      {statusMutationError && (
        <div className="mt-4 rounded-sm border border-danger-border bg-danger-bg px-3 py-2 text-[13px] text-danger">
          {statusMutationError}
        </div>
      )}

      {undoAction && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-DEFAULT border border-line bg-card px-4 py-3 text-[13px] shadow-pop"
          style={{ animation: 'slideDown .2s ease' }}
        >
          <span>
            <strong>{undoAction.applicantName}</strong> marked as{' '}
            {statusLabel(undoAction.nextStatus)}.
          </span>
          <button
            type="button"
            onClick={handleUndo}
            disabled={isMutatingStatus}
            className="font-semibold text-ink underline disabled:opacity-50"
          >
            Undo
          </button>
        </div>
      )}
    </div>
  )
}

function ListView({ filtered }) {
  return (
    <div className="fade-up fade-up-2">
      <div className="mb-2.5 text-[12px] text-ink-3">
        {filtered.length} application{filtered.length !== 1 ? 's' : ''} found
      </div>
      {filtered.length === 0 ? (
        <div className="rounded-DEFAULT border border-line bg-card px-5 py-10 text-center text-[13px] text-ink-3">
          No applications match your filters.
        </div>
      ) : (
        <div className="overflow-hidden rounded-DEFAULT border border-line bg-card">
          <div className="hidden grid-cols-[2.5fr_2fr_1fr_1fr_auto] gap-3 border-b border-line px-5 py-2.5 sm:grid">
            {['Applicant', 'Project', 'Submitted', 'Status', ''].map((h, i) => (
              <div
                key={i}
                className="text-[10px] font-semibold uppercase tracking-wider2 text-ink-3"
              >
                {h}
              </div>
            ))}
          </div>
          {filtered.map((app, i) => (
            <ApplicationRow
              key={app.application_id}
              app={app}
              isLast={i === filtered.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ApplicationRow({ app, isLast }) {
  const skills = app.applicants?.profile_summary?.skills || []
  return (
    <div
      className={[
        'grid grid-cols-1 items-center gap-3 px-5 py-3 sm:grid-cols-[2.5fr_2fr_1fr_1fr_auto]',
        isLast ? '' : 'border-b border-line',
      ].join(' ')}
    >
      <div className="min-w-0">
        <div className="text-[13px] font-medium text-ink">{fullName(app)}</div>
        <div className="mt-0.5 flex items-center gap-1 text-[11px] text-ink-3">
          <Mail className="h-2.5 w-2.5 shrink-0" />
          <span className="truncate">{app.applicant_email || '—'}</span>
        </div>
        {skills.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {skills.slice(0, 3).map((s) => (
              <Badge key={s}>{s}</Badge>
            ))}
          </div>
        )}
      </div>
      <div className="line-clamp-2 text-[12px] text-ink-2">
        {app.projects?.title || '—'}
      </div>
      <div className="text-[12px] text-ink-3">{formatSubmitted(app.submitted_at)}</div>
      <StatusBadge status={app.status} />
      <Link
        to={`/supervisor/applications/${app.application_id}`}
        className="inline-flex items-center justify-center rounded-sm border border-line bg-card px-3 py-1.5 text-[12px] font-medium text-ink transition-colors hover:border-line-strong sm:justify-self-end"
      >
        Review
      </Link>
    </div>
  )
}

function SwipeView({ filtered, index, setIndex, onStatusSwipe, isMutatingStatus }) {
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const dragState = useRef({ active: false, startX: 0, pointerId: null })

  if (filtered.length === 0) {
    return (
      <div className="rounded-DEFAULT border border-line bg-card px-5 py-10 text-center text-[13px] text-ink-3">
        No applications to review.
      </div>
    )
  }

  const safeIndex = Math.min(Math.max(index, 0), filtered.length - 1)
  const app = filtered[safeIndex]
  const swipeable =
    app.status === 'SUBMITTED' || app.status === 'UNDER_REVIEW' || app.status === 'SHORTLISTED'
  const swipeThreshold = 120

  const matchScore = computeMatchScore(app)
  const skills = app.applicants?.profile_summary?.skills || []
  const hint = dragX < -50 ? 'REJECTED' : dragX > 50 ? 'ACCEPTED' : null

  const onPointerDown = (e) => {
    if (!swipeable || isMutatingStatus) return
    if (e.target.closest('a, button')) return
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
  const onPointerUp = async (e) => {
    if (!dragState.current.active || dragState.current.pointerId !== e.pointerId) return
    e.currentTarget.releasePointerCapture(e.pointerId)
    const decision =
      dragX > swipeThreshold ? 'ACCEPTED' : dragX < -swipeThreshold ? 'REJECTED' : null
    reset()
    if (decision) await onStatusSwipe(app, decision)
  }

  return (
    <div className="fade-up fade-up-2 flex flex-col items-center gap-5 pt-2 px-4 sm:px-6">
      <p className="text-[12px] text-ink-3">
        {safeIndex + 1} of {filtered.length} —{' '}
        {swipeable ? 'Drag left to reject, right to accept' : 'Decision already made'}
      </p>

      <div className="relative w-full max-w-[420px] sm:max-w-[520px] lg:max-w-[640px] xl:max-w-[720px] mx-auto">
        {hint && (
          <div
            className={[
              'pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-lg border-2',
              hint === 'ACCEPTED'
                ? 'bg-ok-bg/30 border-ok'
                : 'bg-danger-bg/30 border-danger',
            ].join(' ')}
          >
            <span
              className={[
                'text-[22px] font-bold tracking-[0.1em]',
                hint === 'ACCEPTED' ? 'text-ok' : 'text-danger',
              ].join(' ')}
            >
              {hint === 'ACCEPTED' ? '✓ ACCEPT' : '✕ REJECT'}
            </span>
          </div>
        )}

        <article
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={reset}
          className={[
            'select-none touch-pan-y overflow-hidden rounded-lg border border-line bg-card shadow-pop',
            swipeable && !isMutatingStatus
              ? 'cursor-grab active:cursor-grabbing'
              : 'cursor-default',
          ].join(' ')}
          style={{
            transform: `translateX(${dragX}px) rotate(${dragX / 30}deg)`,
            transition: dragging ? 'none' : 'transform 0.25s ease',
            opacity: isMutatingStatus ? 0.7 : 1,
          }}
        >
          <div className="bg-ink px-5 sm:px-6 lg:px-8 pb-5 pt-6 lg:pt-8">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="mb-1 text-[20px] sm:text-[22px] lg:text-[24px] font-bold text-white">{fullName(app)}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {app.degree_label && (
                    <span className="rounded-sm bg-white/10 px-2 py-0.5 text-[11px] text-white/80">
                      {app.degree_label}
                    </span>
                  )}
                  {app.applicant_email && (
                    <span className="rounded-sm bg-white/10 px-2 py-0.5 text-[11px] text-white/80">
                      {app.applicant_email}
                    </span>
                  )}
                </div>
              </div>
              <div className="rounded-sm bg-accent px-2.5 py-1 text-center">
                <div className="text-[18px] font-bold leading-none text-accent-fg">
                  {matchScore}
                </div>
                <div className="mt-0.5 text-[9px] font-semibold tracking-wider2 text-accent-fg">
                  MATCH
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6 lg:p-8">
            <div className="mb-3.5 rounded-sm border border-line px-3.5 py-3">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider2 text-ink-3">
                Applied to
              </div>
              <div className="text-[13px] font-medium">
                {app.projects?.title || '—'}
              </div>
            </div>

            <div className="mb-4">
              <div className="mb-1.5 flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider2 text-ink-3">
                  Status
                </span>
                <StatusBadge status={app.status} />
              </div>
            </div>

            {skills.length > 0 && (
              <div className="mb-4">
                <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider2 text-ink-3">
                  Skills
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((s) => (
                    <Badge key={s}>{s}</Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                disabled={!swipeable || isMutatingStatus}
                onClick={() => onStatusSwipe(app, 'REJECTED')}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-sm border border-danger-border bg-danger-bg px-3 py-2.5 sm:py-3 text-[13px] sm:text-[14px] font-medium text-danger transition-opacity hover:opacity-85 disabled:opacity-40"
              >
                <X className="h-3.5 w-3.5" /> Reject
              </button>
              <Link
                to={`/supervisor/applications/${app.application_id}`}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-sm border border-line bg-card px-3 py-2.5 sm:py-3 text-[13px] sm:text-[14px] font-medium text-ink transition-colors hover:border-line-strong"
              >
                <Eye className="h-3.5 w-3.5" /> Full Review
              </Link>
              <button
                type="button"
                disabled={!swipeable || isMutatingStatus}
                onClick={() => onStatusSwipe(app, 'ACCEPTED')}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-sm bg-accent px-3 py-2.5 sm:py-3 text-[13px] sm:text-[14px] font-semibold text-accent-fg transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                <Check className="h-3.5 w-3.5" /> Accept
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>
  )
}
