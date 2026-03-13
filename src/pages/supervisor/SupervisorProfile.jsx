import { useEffect, useRef, useState } from 'react'
import {
  Pencil,
  Check,
  X,
  BookOpen,
  FileText,
} from 'lucide-react'
import {
  getSupervisorProfile,
  updateSupervisorProfile,
  getSupervisorCvFilePath,
  uploadSupervisorCv,
  deleteSupervisorCv,
  getStorageFileUrls,
} from '../../lib/supervisorApi'
import { supabase } from '../../lib/supabase'

const TABS = [
  'Account Information',
  'Public Profile',
  'Research Information',
  'Contact & Availability',
]

export default function SupervisorProfile() {
  const [activeTab, setActiveTab] = useState('Account Information')
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

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

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
      </div>
    )
  }

  return (
    <main className="mx-auto max-w-[1100px] px-6 py-10">
      <h1 className="text-3xl font-bold text-black">My Profile</h1>
      <p className="mt-1 text-neutral-500">
        Manage your account, research information, and supervision activities.
      </p>

      <div className="mt-8 flex gap-6 items-start">
        {/* ── Left sidebar navigation ── */}
        <div className="w-56 shrink-0">
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

        {/* ── Main content panel ── */}
        <div className="flex-1 min-w-0">
          {activeTab === 'Account Information' && (
            <AccountInformation profile={profile} onSave={refreshProfile} />
          )}
          {activeTab === 'Public Profile' && (
            <PublicProfile profile={profile} onSave={refreshProfile} />
          )}
          {activeTab === 'Research Information' && (
            <ResearchInformation profile={profile} onSave={refreshProfile} />
          )}
          {activeTab === 'Contact & Availability' && (
            <ContactAvailability profile={profile} onSave={refreshProfile} />
          )}
        </div>
      </div>
    </main>
  )
}

/* ══════════════════════════════════════════════════════════════
   Account Information Tab
   ══════════════════════════════════════════════════════════════ */
function AccountInformation({ profile, onSave }) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [cvPath, setCvPath] = useState(null)
  const [cvLoading, setCvLoading] = useState(false)
  const [cvMessage, setCvMessage] = useState('')
  const [form, setForm] = useState({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
  })
  const cvInputRef = useRef(null)

  useEffect(() => {
    getSupervisorCvFilePath().then(setCvPath).catch(console.error)
  }, [])

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
        first_name: form.first_name,
        last_name: form.last_name,
      })
      await onSave()
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const handleCvUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setCvLoading(true)
    try {
      const uploadedPath = await uploadSupervisorCv(file)
      setCvPath(uploadedPath)
      setCvMessage('CV uploaded successfully.')
    } finally {
      event.target.value = ''
      setCvLoading(false)
    }
  }

  const handleCvAction = async (mode) => {
    setCvLoading(true)
    try {
      const urls = await getStorageFileUrls(cvPath, 'supervisors_cvs')
      const url = mode === 'view' ? urls.viewUrl : urls.downloadUrl
      if (url) window.open(url, '_blank')
    } finally {
      setCvLoading(false)
    }
  }

  const handleCvDelete = async () => {
    setCvLoading(true)
    try {
      await deleteSupervisorCv()
      setCvPath(null)
      setCvMessage('CV removed.')
    } finally {
      setCvLoading(false)
    }
  }

  const cvFileName = cvPath ? cvPath.split('/').pop() : 'No CV uploaded'

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
          <div className="grid grid-cols-2 gap-x-10 gap-y-6">
            <FieldDisplay label="First Name" value={profile?.first_name} />
            <FieldDisplay label="Last Name" value={profile?.last_name} />
          </div>

          <div className="mt-6">
            <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-1">
              Email
            </p>
            <div className="flex items-center gap-2">
              <p className="text-sm text-black">{profile?.email || '—'}</p>
              {profile?.email && (
                <span className="text-xs font-medium text-green-600">
                  ✓ Verified
                </span>
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
                supabase.auth
                  .signOut()
                  .then(() => (window.location.href = '/auth/login'))
              }
              className="rounded border border-neutral-300 px-5 py-2 text-sm font-medium text-black hover:bg-neutral-50 transition"
            >
              Sign Out
            </button>
          </div>

          <div className="mt-8 border-t border-neutral-100 pt-6">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-black">Curriculum Vitae (CV)</h3>
              <button
                type="button"
                disabled={cvLoading}
                onClick={() => cvInputRef.current?.click()}
                className="rounded border border-neutral-300 px-4 py-2 text-sm font-medium text-black hover:bg-neutral-50 transition disabled:opacity-50"
              >
                {cvPath ? 'Replace CV' : 'Upload CV'}
              </button>
            </div>

            <div className="mt-4 flex flex-col justify-between gap-4 rounded border border-neutral-200 bg-neutral-50 p-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-neutral-700" />
                <p className="text-sm text-black">{cvFileName}</p>
              </div>
              <div className="flex gap-2">
                <button
                  disabled={!cvPath || cvLoading}
                  onClick={() => handleCvAction('view')}
                  className="rounded border border-neutral-300 px-4 py-2 text-sm text-neutral-700 disabled:opacity-40"
                >
                  View
                </button>
                <button
                  disabled={!cvPath || cvLoading}
                  onClick={() => handleCvAction('download')}
                  className="rounded border border-neutral-300 px-4 py-2 text-sm text-neutral-700 disabled:opacity-40"
                >
                  Download
                </button>
                <button
                  disabled={!cvPath || cvLoading}
                  onClick={handleCvDelete}
                  className="rounded border border-red-200 px-4 py-2 text-sm text-red-700 disabled:opacity-40"
                >
                  Delete
                </button>
              </div>
            </div>

            {cvMessage && <p className="mt-3 text-sm text-green-700">{cvMessage}</p>}
            <input
              ref={cvInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={handleCvUpload}
            />
          </div>
        </>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <FieldInput label="First Name" value={form.first_name} onChange={set('first_name')} />
            <FieldInput label="Last Name" value={form.last_name} onChange={set('last_name')} />
          </div>
          <FieldDisplay label="Email" value={profile?.email} />
          <FieldDisplay label="Member Since" value={memberSince} />
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   Public Profile Tab
   ══════════════════════════════════════════════════════════════ */
function PublicProfile({ profile, onSave }) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    institution: profile?.institution || '',
    department: profile?.department || '',
    academic_title: profile?.academic_title || '',
  })

  const set = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateSupervisorProfile(form)
      await onSave()
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-7">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-black">Public Profile</h2>
        <EditSaveButtons
          editing={editing}
          saving={saving}
          onEdit={() => setEditing(true)}
          onSave={handleSave}
          onCancel={() => setEditing(false)}
        />
      </div>

      {!editing ? (
        <div className="grid grid-cols-2 gap-x-10 gap-y-6">
          <FieldDisplay label="Institution" value={profile?.institution} />
          <FieldDisplay label="Department" value={profile?.department} />
          <FieldDisplay label="Academic Title" value={profile?.academic_title} />
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <FieldInput label="Institution" value={form.institution} onChange={set('institution')} />
            <FieldInput label="Department" value={form.department} onChange={set('department')} />
          </div>
          <FieldInput label="Academic Title" value={form.academic_title} onChange={set('academic_title')} />
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   Research Information Tab
   ══════════════════════════════════════════════════════════════ */
function ResearchInformation({ profile, onSave }) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    research_interests: profile?.research_interests || '',
    publications: profile?.publications || '',
    expertise_areas: profile?.expertise_areas || '',
    teachable_points: profile?.teachable_points || '',
  })

  const set = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateSupervisorProfile(form)
      await onSave()
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-neutral-200 bg-white p-7">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-black">Research Information</h2>
          <EditSaveButtons
            editing={editing}
            saving={saving}
            onEdit={() => setEditing(true)}
            onSave={handleSave}
            onCancel={() => setEditing(false)}
          />
        </div>

        {!editing ? (
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-1">
                Research Interests
              </p>
              <p className="text-sm text-black whitespace-pre-wrap">
                {profile?.research_interests || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-1">
                Areas of Expertise
              </p>
              <p className="text-sm text-black whitespace-pre-wrap">
                {profile?.expertise_areas || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-1">
                Key Publications
              </p>
              <p className="text-sm text-black whitespace-pre-wrap">
                {profile?.publications || '—'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <FieldTextarea
              label="Research Interests"
              value={form.research_interests}
              onChange={set('research_interests')}
              placeholder="Describe your current research interests and focus areas..."
              rows={3}
            />
            <FieldTextarea
              label="Areas of Expertise"
              value={form.expertise_areas}
              onChange={set('expertise_areas')}
              placeholder="List your areas of expertise (e.g., Nuclear Physics, Ion Trapping, Mass Spectrometry)..."
              rows={3}
            />
            <FieldTextarea
              label="Key Publications"
              value={form.publications}
              onChange={set('publications')}
              placeholder="List notable publications, one per line..."
              rows={4}
            />
          </div>
        )}
      </div>

      {/* ── Teachable Points ── */}
      <div className="rounded-lg border border-neutral-200 bg-white p-7">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-5 w-5 text-neutral-600" />
          <h2 className="text-lg font-semibold text-black">Teachable Points</h2>
        </div>
        <p className="text-xs text-neutral-500 mb-4">
          Skills, techniques, and knowledge areas you can teach to students working on your projects.
        </p>

        {!editing ? (
          <div>
            {profile?.teachable_points ? (
              <div className="space-y-2">
                {profile.teachable_points
                  .split('\n')
                  .filter(Boolean)
                  .map((point, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 rounded border border-neutral-100 bg-neutral-50 px-4 py-2.5 text-sm text-black"
                    >
                      <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-black" />
                      {point.trim()}
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-400 italic">
                No teachable points added yet. Click Edit above to add skills and knowledge areas you can teach.
              </p>
            )}
          </div>
        ) : (
          <FieldTextarea
            label="Teachable Points"
            value={form.teachable_points}
            onChange={set('teachable_points')}
            placeholder="Enter one teachable point per line, e.g.:\nExperimental techniques in nuclear physics\nData analysis with ROOT framework\nScientific paper writing\nLab safety procedures"
            rows={6}
          />
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   Contact & Availability Tab
   ══════════════════════════════════════════════════════════════ */
function ContactAvailability({ profile, onSave }) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    office_location: profile?.office_location || '',
    office_hours: profile?.office_hours || '',
    phone: profile?.phone || '',
    contact_preference: profile?.contact_preference || 'email',
    max_students: profile?.max_students ?? 5,
    currently_accepting: profile?.currently_accepting ?? true,
  })

  const set = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateSupervisorProfile({
        ...form,
        max_students: parseInt(form.max_students, 10) || 5,
      })
      await onSave()
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Contact Details */}
      <div className="rounded-lg border border-neutral-200 bg-white p-7">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-black">Contact & Availability</h2>
          <EditSaveButtons
            editing={editing}
            saving={saving}
            onEdit={() => setEditing(true)}
            onSave={handleSave}
            onCancel={() => setEditing(false)}
          />
        </div>

        {!editing ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-x-10 gap-y-6">
              <FieldDisplay label="Office Location" value={profile?.office_location} />
              <FieldDisplay label="Phone" value={profile?.phone} />
              <FieldDisplay
                label="Preferred Contact"
                value={
                  profile?.contact_preference === 'email'
                    ? 'Email'
                    : profile?.contact_preference === 'phone'
                      ? 'Phone'
                      : profile?.contact_preference || '—'
                }
              />
              <FieldDisplay
                label="Max Students"
                value={profile?.max_students != null ? String(profile.max_students) : '—'}
              />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-1">
                Office Hours
              </p>
              <p className="text-sm text-black whitespace-pre-wrap">
                {profile?.office_hours || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-1">
                Currently Accepting Students
              </p>
              <span
                className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                  profile?.currently_accepting
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {profile?.currently_accepting ? 'Yes — Accepting Applications' : 'Not Currently Accepting'}
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <FieldInput
                label="Office Location"
                value={form.office_location}
                onChange={set('office_location')}
                placeholder="e.g., Building S2|14, Room 212"
              />
              <FieldInput
                label="Phone"
                value={form.phone}
                onChange={set('phone')}
                placeholder="e.g., +49 6159 71-xxxx"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-1">
                  Preferred Contact Method
                </label>
                <select
                  value={form.contact_preference}
                  onChange={set('contact_preference')}
                  className="w-full rounded border border-neutral-200 px-3 py-2.5 text-sm focus:border-neutral-400 focus:outline-none bg-white"
                >
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="office">Office Visit</option>
                </select>
              </div>
              <FieldInput
                label="Max Students"
                value={form.max_students}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, max_students: e.target.value }))
                }
                type="number"
              />
            </div>
            <FieldTextarea
              label="Office Hours"
              value={form.office_hours}
              onChange={set('office_hours')}
              placeholder="e.g., Monday & Wednesday 14:00–16:00, or by appointment"
              rows={3}
            />
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.currently_accepting}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, currently_accepting: e.target.checked }))
                }
                className="h-4 w-4 rounded border-neutral-300"
              />
              <span className="text-sm text-black">Currently accepting new students</span>
            </label>
          </div>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   Shared Components
   ══════════════════════════════════════════════════════════════ */
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

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-neutral-300"
      />
      <span>
        <span className="text-sm text-black">{label}</span>
        {description && (
          <span className="block text-xs text-neutral-400">{description}</span>
        )}
      </span>
    </label>
  )
}

function FieldDisplay({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-1">
        {label}
      </p>
      <p className="text-sm text-black">{value || '—'}</p>
    </div>
  )
}

function FieldInput({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="block text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded border border-neutral-200 px-3 py-2.5 text-sm focus:border-neutral-400 focus:outline-none"
      />
    </div>
  )
}

function FieldTextarea({ label, value, onChange, placeholder, rows = 3 }) {
  return (
    <div>
      <label className="block text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-1">
        {label}
      </label>
      <textarea
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded border border-neutral-200 px-3 py-2.5 text-sm focus:border-neutral-400 focus:outline-none resize-y"
      />
    </div>
  )
}
