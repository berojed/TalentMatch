import { useEffect, useState } from 'react'
import { Pencil, Check, X } from 'lucide-react'
import {
  getSupervisorProfile,
  updateSupervisorProfile,
} from '../../lib/supervisorApi'
import { supabase } from '../../lib/supabase'
import SupervisorProfileForm from '../../components/supervisor/SupervisorProfileForm'

const TABS = ['Account Information', 'Profile Details']

export default function SupervisorProfile() {
  const [activeTab, setActiveTab] = useState('Account Information')
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const p = await getSupervisorProfile()
        setProfile(p)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const refreshProfile = async () => {
    const p = await getSupervisorProfile()
    setProfile(p)
  }

  const handleProfileSubmit = async (payload) => {
    setSaving(true)
    setMessage('')
    try {
      await updateSupervisorProfile(payload)
      await refreshProfile()
      setEditing(false)
      setMessage('Profile updated.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
      </div>
    )
  }

  return (
    <main className="mx-auto w-full max-w-[1100px] px-4 sm:px-6 lg:px-10 py-6 sm:py-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-black">My Profile</h1>
      <p className="mt-1 text-neutral-500">
        Manage your account, research information, and supervision activities.
      </p>

      {message && <p className="mt-4 text-sm text-green-700">{message}</p>}

      <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="w-full shrink-0 lg:w-56">
          <nav className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full px-5 py-3.5 text-sm text-left font-medium transition border-b border-neutral-100 last:border-b-0 ${
                  activeTab === tab
                    ? 'bg-black text-white'
                    : 'text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1 min-w-0">
          {activeTab === 'Account Information' && (
            <AccountInformation profile={profile} onSave={refreshProfile} />
          )}
          {activeTab === 'Profile Details' && (
            <div className="rounded-lg border border-neutral-200 bg-white p-7">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-black">Profile Details</h2>
                <button
                  type="button"
                  onClick={() => setEditing((prev) => !prev)}
                  className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-black transition"
                >
                  <Pencil className="h-4 w-4" /> {editing ? 'Cancel' : 'Edit'}
                </button>
              </div>
              <SupervisorProfileForm
                initialValues={profile}
                onSubmit={handleProfileSubmit}
                submitting={saving}
                disabled={!editing}
                submitLabel="Save Profile"
              />
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

function AccountInformation({ profile, onSave }) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    academic_title: profile?.academic_title || '',
  })

  const set = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : '—'

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateSupervisorProfile({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        academic_title: form.academic_title.trim(),
      })
      await onSave()
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-7">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-black">Account Information</h2>
        <EditSaveButtons
          editing={editing}
          saving={saving}
          onEdit={() => setEditing(true)}
          onSave={handleSave}
          onCancel={() => setEditing(false)}
        />
      </div>

      {!editing ? (
        <>
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-6">
            <FieldDisplay label="First Name" value={profile?.first_name} />
            <FieldDisplay label="Last Name" value={profile?.last_name} />
            <FieldDisplay label="Academic Title" value={profile?.academic_title} />
          </div>

          <div className="mt-6">
            <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-1">Email</p>
            <div className="flex items-center gap-2">
              <p className="text-sm text-black">{profile?.email || '—'}</p>
              {profile?.email && (
                <span className="text-xs font-medium text-green-600">✓ Verified</span>
              )}
            </div>
          </div>

          <div className="mt-6">
            <FieldDisplay label="Member Since" value={memberSince} />
          </div>

          <div className="mt-8 border-t border-neutral-100 pt-6">
            <h3 className="font-semibold text-black mb-3">Account Actions</h3>
            <button
              onClick={() =>
                supabase.auth.signOut().then(() => (window.location.href = '/'))
              }
              className="rounded border border-neutral-300 px-5 py-2 text-sm font-medium text-black hover:bg-neutral-50 transition"
            >
              Sign Out
            </button>
          </div>
        </>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FieldInput label="First Name" value={form.first_name} onChange={set('first_name')} />
            <FieldInput label="Last Name" value={form.last_name} onChange={set('last_name')} />
          </div>
          <FieldInput label="Academic Title" value={form.academic_title} onChange={set('academic_title')} />
          <FieldDisplay label="Email" value={profile?.email} />
          <FieldDisplay label="Member Since" value={memberSince} />
        </div>
      )}
    </div>
  )
}

function EditSaveButtons({ editing, saving, onEdit, onSave, onCancel }) {
  if (!editing) {
    return (
      <button
        onClick={onEdit}
        className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-black transition"
      >
        <Pencil className="h-4 w-4" /> Edit
      </button>
    )
  }
  return (
    <div className="flex gap-2">
      <button
        onClick={onSave}
        disabled={saving}
        className="flex items-center gap-1 rounded bg-black px-3 py-1.5 text-sm text-white disabled:opacity-50 transition"
      >
        <Check className="h-3.5 w-3.5" />
        {saving ? 'Saving...' : 'Save'}
      </button>
      <button
        onClick={onCancel}
        className="flex items-center gap-1 rounded border border-neutral-200 px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-50 transition"
      >
        <X className="h-3.5 w-3.5" /> Cancel
      </button>
    </div>
  )
}

function FieldDisplay({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-1">{label}</p>
      <p className="text-sm text-black">{value || '—'}</p>
    </div>
  )
}

function FieldInput({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-1">
        {label}
      </label>
      <input
        type="text"
        value={value || ''}
        onChange={onChange}
        className="w-full rounded border border-neutral-200 px-3 py-2.5 text-sm focus:border-neutral-400 focus:outline-none"
      />
    </div>
  )
}
