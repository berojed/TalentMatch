import React from 'react'
import { X } from 'lucide-react'

export default function ApplicationModal({
  projectTitle,
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
}) {
  const [coverLetter, setCoverLetter] = React.useState('')
  const [file, setFile] = React.useState(null)

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-10">
      <div className="w-full max-w-2xl rounded border border-neutral-200 bg-white p-6 shadow-xl sm:p-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-4xl font-bold tracking-tight text-black">Submit Your Application</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-2 text-neutral-600 transition hover:bg-neutral-100 hover:text-black"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-6 text-lg text-neutral-600">Applying to: {projectTitle}</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block text-base font-medium text-neutral-700">
            Cover Letter
            <textarea
              value={coverLetter}
              onChange={(event) => setCoverLetter(event.target.value)}
              rows={7}
              placeholder="Explain your motivation, background, and why you are a strong fit for this project..."
              className="mt-2 w-full rounded border border-neutral-300 px-4 py-3 text-lg outline-none transition placeholder:text-neutral-400 focus:border-neutral-500"
            />
          </label>

          <label className="block text-base font-medium text-neutral-700">
            Attach Cover Letter File (Optional)
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
              className="mt-2 block w-full text-sm text-neutral-600"
            />
          </label>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-neutral-300 px-5 py-3 text-base font-medium text-neutral-700 transition hover:bg-neutral-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded bg-black px-5 py-3 text-base font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-600"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
