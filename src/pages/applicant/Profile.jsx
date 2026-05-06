import React from 'react'
import { PenLine, Settings } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { getApplicantProfile, updateApplicantProfile } from '../../lib/applicantApi'
import { supabase } from '../../lib/supabase'
import ApplicantProfileForm from '../../components/applicant/ApplicantProfileForm'

function InfoItem({ label, value, muted }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">{label}</p>
      <p className={`mt-1 text-sm ${muted ? 'text-neutral-500' : 'text-neutral-800'}`}>{value}</p>
    </div>
  )
}

export default function Profile() {
  const navigate = useNavigate()
  const [profile, setProfile] = React.useState(null)
  const [editing, setEditing] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [message, setMessage] = React.useState('')

  React.useEffect(() => {
    getApplicantProfile().then(({ profile: profileData }) => {
      setProfile(profileData)
    })
  }, [])

  const handleSubmit = async (payload) => {
    setSaving(true)
    setMessage('')
    try {
      const updated = await updateApplicantProfile(payload)
      setProfile((prev) => ({ ...prev, ...updated }))
      setEditing(false)
      setMessage('Profile updated.')
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  if (!profile) {
    return (
      <main className="mx-auto w-full max-w-[1100px] px-4 sm:px-6 lg:px-10 py-6 sm:py-10">
        <p className="text-neutral-600">Loading profile...</p>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-[1100px] px-4 sm:px-6 lg:px-10 py-6 sm:py-10">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-black">My Profile</h1>
      <p className="mt-1 text-neutral-500">Manage your account information and preferences.</p>

      {message && <p className="mt-4 text-sm text-green-700">{message}</p>}

      <div className="mt-8">
        <div className="space-y-4">
          <section className="rounded border border-neutral-200 bg-white p-7">
            <h2 className="text-lg font-semibold text-black">Account Information</h2>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <InfoItem label="First Name" value={profile.first_name || '-'} />
              <InfoItem label="Last Name" value={profile.last_name || '-'} />
            </div>

            <div className="mt-6">
              <InfoItem label="Email" value={profile.email || '-'} />
              <p className="mt-1 text-xs text-green-600">Verified</p>
            </div>

            <div className="mt-6">
              <InfoItem
                label="Member Since"
                value={new Date(profile.member_since || profile.created_at || Date.now()).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              />
            </div>
          </section>

          <section className="rounded border border-neutral-200 bg-white p-7">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-black">Profile Details</h2>
              <button
                type="button"
                onClick={() => setEditing((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700"
              >
                <PenLine className="h-4 w-4" />
                {editing ? 'Cancel' : 'Edit'}
              </button>
            </div>

            <div className="mt-5">
              <ApplicantProfileForm
                initialValues={profile}
                onSubmit={handleSubmit}
                submitting={saving}
                disabled={!editing}
                submitLabel="Save Profile"
              />
            </div>
          </section>

          <section className="rounded border border-neutral-200 bg-white p-7">
            <h2 className="text-lg font-semibold text-black">Account Actions</h2>

            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                to="/applicant_dashboard/settings"
                className="inline-flex items-center gap-2 rounded bg-black px-5 py-2 text-sm font-medium text-white"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded border border-neutral-300 px-5 py-2 text-sm font-medium text-neutral-700"
              >
                Sign Out
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
