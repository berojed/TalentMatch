import React from 'react'
import { FileText, PenLine, Settings } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import {
  getApplicantProfile,
  updateApplicantProfile,
  getApplicantCvFilePath,
  getStorageFileUrls,
  uploadApplicantCv,
  deleteApplicantCv,
} from '../../lib/applicantApi'
import { supabase } from '../../lib/supabase'

function InfoItem({ label, value, muted }) {
  return (
    <div>
      <p className="text-lg uppercase tracking-wide text-neutral-500">{label}</p>
      <p className={`mt-1 text-3xl ${muted ? 'text-neutral-500' : 'text-neutral-800'}`}>{value}</p>
    </div>
  )
}

export default function Profile() {
  const navigate = useNavigate()
  const [profile, setProfile] = React.useState(null)
  const [form, setForm] = React.useState({
    degree_level: '',
    research_interests: '',
  })
  const [editingPreferences, setEditingPreferences] = React.useState(false)
  const [message, setMessage] = React.useState('')
  const [cvFilePath, setCvFilePath] = React.useState(null)
  const [cvLoading, setCvLoading] = React.useState(false)
  const cvInputRef = React.useRef(null)

  React.useEffect(() => {
    getApplicantProfile().then(({ profile: profileData }) => {
      setProfile(profileData)
      setForm({
        degree_level: profileData.degree_level || '',
        research_interests: profileData.research_interests || '',
      })
    })
    getApplicantCvFilePath().then(setCvFilePath)
  }, [])

  const handleCvView = async () => {
    setCvLoading(true)
    try {
      const { viewUrl } = await getStorageFileUrls(cvFilePath)
      if (viewUrl) window.open(viewUrl, '_blank')
    } finally {
      setCvLoading(false)
    }
  }

  const handleCvDownload = async () => {
    setCvLoading(true)
    try {
      const { downloadUrl } = await getStorageFileUrls(cvFilePath)
      if (downloadUrl) window.open(downloadUrl, '_blank')
    } finally {
      setCvLoading(false)
    }
  }

  const handleCvUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setCvLoading(true)
    try {
      const uploadedPath = await uploadApplicantCv(file)
      setCvFilePath(uploadedPath)
      setMessage('CV uploaded successfully.')
    } finally {
      event.target.value = ''
      setCvLoading(false)
    }
  }

  const handleCvDelete = async () => {
    setCvLoading(true)
    try {
      await deleteApplicantCv()
      setCvFilePath(null)
      setMessage('CV removed.')
    } finally {
      setCvLoading(false)
    }
  }

  const cvFileName = cvFilePath ? cvFilePath.split('/').pop() : 'No CV uploaded'

  const savePreferences = async () => {
    const updated = await updateApplicantProfile({
      degree_level: form.degree_level,
      research_interests: form.research_interests,
    })
    setProfile((prev) => ({ ...prev, ...updated }))
    setEditingPreferences(false)
    setMessage('Profile preferences updated.')
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/auth/login')
  }

  if (!profile) {
    return (
      <main className="mx-auto w-full max-w-[1500px] px-4 py-12 sm:px-8">
        <p className="text-neutral-600">Loading profile...</p>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 py-12 sm:px-8">
      <h1 className="text-7xl font-bold tracking-tight text-black">My Profile</h1>
      <p className="mt-3 text-2xl text-neutral-600">Manage your account information and preferences.</p>

      {message && <p className="mt-4 text-base text-green-700">{message}</p>}

      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_460px]">
        <div className="space-y-4">
          <section className="rounded border border-neutral-200 bg-white p-8">
            <h2 className="text-5xl font-bold text-black">Account Information</h2>

            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <InfoItem label="First Name" value={profile.first_name || '-'} />
              <InfoItem label="Last Name" value={profile.last_name || '-'} />
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <InfoItem label="Email" value={profile.email || '-'} />
                <p className="mt-1 text-base text-green-600">Verified</p>
              </div>
              <InfoItem label="Nickname" value={profile.nickname || '-'} />
            </div>

            <div className="mt-6">
              <InfoItem
                label="Member Since"
                value={new Date(profile.member_since || Date.now()).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              />
            </div>
          </section>

          <section className="rounded border border-neutral-200 bg-white p-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-5xl font-bold text-black">Research Preferences</h2>
              <button
                type="button"
                onClick={() => setEditingPreferences((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded border border-neutral-300 px-4 py-2 text-base text-neutral-700"
              >
                <PenLine className="h-4 w-4" />
                {editingPreferences ? 'Cancel' : 'Edit'}
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block text-lg uppercase tracking-wide text-neutral-500">
                Degree Level
                <select
                  disabled={!editingPreferences}
                  value={form.degree_level}
                  onChange={(event) => setForm((prev) => ({ ...prev, degree_level: event.target.value }))}
                  className="mt-2 w-full rounded border border-neutral-300 px-4 py-3 text-2xl text-neutral-700 disabled:bg-neutral-50"
                >
                  <option value="">Select degree level</option>
                  <option value="Bachelor">Bachelor</option>
                  <option value="Master">Master</option>
                  <option value="PhD">PhD</option>
                </select>
              </label>

              <label className="block text-lg uppercase tracking-wide text-neutral-500">
                Research Interests
                <textarea
                  disabled={!editingPreferences}
                  value={form.research_interests}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, research_interests: event.target.value }))
                  }
                  rows={4}
                  placeholder="Describe your research interests and areas of focus..."
                  className="mt-2 w-full rounded border border-neutral-300 px-4 py-3 text-2xl text-neutral-700 disabled:bg-neutral-50"
                />
              </label>

              {editingPreferences && (
                <button
                  type="button"
                  onClick={savePreferences}
                  className="rounded bg-black px-6 py-3 text-sm font-semibold uppercase tracking-wider text-white"
                >
                  Save Preferences
                </button>
              )}
            </div>
          </section>

          <section className="rounded border border-neutral-200 bg-white p-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-5xl font-bold text-black">Curriculum Vitae (CV)</h2>
              <button
                type="button"
                disabled={cvLoading}
                onClick={() => cvInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded border border-neutral-300 px-4 py-2 text-base text-neutral-700"
              >
                <PenLine className="h-4 w-4" />
                {cvFilePath ? 'Replace' : 'Upload'}
              </button>
            </div>

            <div className="mt-6 flex flex-col justify-between gap-4 rounded border border-neutral-200 bg-neutral-50 p-5 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-neutral-700" />
                <div>
                  <p className="text-3xl text-neutral-800">{cvFileName}</p>
                  <p className="text-lg text-neutral-500">Last updated: {new Date().toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  disabled={!cvFilePath || cvLoading}
                  onClick={handleCvView}
                  className="rounded bg-black px-5 py-2 text-white disabled:opacity-40"
                >
                  View
                </button>
                <button
                  disabled={!cvFilePath || cvLoading}
                  onClick={handleCvDownload}
                  className="rounded border border-neutral-300 px-5 py-2 text-neutral-700 disabled:opacity-40"
                >
                  Download
                </button>
                <button
                  disabled={!cvFilePath || cvLoading}
                  onClick={handleCvDelete}
                  className="rounded border border-red-200 px-5 py-2 text-red-700 disabled:opacity-40"
                >
                  Delete
                </button>
              </div>
            </div>

            <p className="mt-4 text-xl text-neutral-600">
              Your CV is visible to supervisors when you apply for research opportunities.
            </p>
            <input
              ref={cvInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={handleCvUpload}
            />
          </section>

          <section className="rounded border border-neutral-200 bg-white p-8">
            <h2 className="text-5xl font-bold text-black">Account Actions</h2>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/applicant/settings"
                className="inline-flex items-center gap-2 rounded bg-black px-6 py-3 text-sm font-semibold uppercase tracking-wider text-white"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded border border-neutral-300 px-6 py-3 text-base text-neutral-700"
              >
                Sign Out
              </button>
            </div>
          </section>
        </div>

        <aside className="h-fit rounded border border-neutral-200 bg-white p-8 lg:sticky lg:top-28">
          <h2 className="text-5xl font-bold text-black">Profile Picture</h2>
          <div className="mt-6 flex aspect-square items-center justify-center rounded bg-emerald-800 text-[11rem] lowercase text-white">
            {profile.first_name?.[0] || 'a'}
          </div>
          <p className="mt-4 text-xl text-neutral-600">
            Profile information is managed through your account.
          </p>
        </aside>
      </div>
    </main>
  )
}
