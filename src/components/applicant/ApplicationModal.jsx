import React from 'react'
import { ArrowRight, X } from 'lucide-react'

export default function ApplicationModal({
  projectTitle,
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
}) {
  const [coverLetter, setCoverLetter] = React.useState('')
  const [file, setFile] = React.useState(null)
  const fileInputRef = React.useRef(null)

  React.useEffect(() => {
    if (!isOpen) {
      setCoverLetter('')
      setFile(null)
    }
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    onSubmit({ coverLetter, file })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 px-4 py-6"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[480px] rounded-lg bg-card p-7 shadow-pop"
        style={{ animation: 'slideDown .2s ease' }}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[16px] font-bold">Submit Application</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-sm p-1 text-ink-2 transition-colors hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-4 text-[12px] text-ink-2">
          Applying to:{' '}
          <strong className="text-ink">{projectTitle || 'this opportunity'}</strong>
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider2 text-ink-3">
              Cover Letter
            </label>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={5}
              placeholder="Tell the supervisor why you're interested in this project and what relevant experience you bring..."
              className="w-full resize-y rounded-sm border border-line bg-card px-3 py-2.5 text-[13px] text-ink outline-none transition-colors focus:border-line-strong"
            />
          </div>

          <div className="mb-5">
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider2 text-ink-3">
              Attachment (optional)
            </label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="block w-full rounded-sm border border-dashed border-line px-4 py-4 text-center text-[12px] text-ink-3 transition-colors hover:border-line-strong"
            >
              {file ? (
                <span className="text-ink">{file.name}</span>
              ) : (
                <>
                  Drop motivation letter here, or{' '}
                  <span className="text-ink underline">browse files</span>
                </>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm border border-line bg-card px-4 py-2 text-[13px] font-medium text-ink transition-colors hover:border-line-strong"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-sm bg-ink px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-85 disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting…' : 'Submit Application'}
              {!isSubmitting && <ArrowRight className="h-3.5 w-3.5" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
