import React from 'react'
import {
  Bell,
  Globe,
  Lock,
  Shield,
  Trash2,
  Eye,
} from 'lucide-react'
import {
  getApplicantProfile,
  updateApplicantSettings,
  updatePassword,
} from '../../lib/applicantApi'

const initialPasswordForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
}

export default function Settings() {
  const [profile, setProfile] = React.useState(null)
  const [settings, setSettings] = React.useState(null)
  const [passwordForm, setPasswordForm] = React.useState(initialPasswordForm)
  const [message, setMessage] = React.useState('')
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    getApplicantProfile().then(({ profile: profileData, settings: settingsData }) => {
      setProfile(profileData)
      setSettings(settingsData)
    })
  }, [])

  const updateField = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const saveSettings = async () => {
    setMessage('')
    setError('')

    if (!settings) {
      return
    }

    await updateApplicantSettings(settings)
    setMessage('Settings saved successfully.')
  }

  const changePassword = async () => {
    setMessage('')
    setError('')

    if (passwordForm.newPassword.length < 8) {
      setError('New password must be at least 8 characters long.')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New password and confirmation do not match.')
      return
    }

    await updatePassword(passwordForm.currentPassword, passwordForm.newPassword)
    setPasswordForm(initialPasswordForm)
    setMessage('Password updated successfully.')
  }

  if (!settings || !profile) {
    return (
      <main className="mx-auto w-full max-w-[1500px] px-4 py-12 sm:px-8">
        <p className="text-neutral-600">Loading settings...</p>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 py-12 sm:px-8">
      <h1 className="text-7xl font-bold tracking-tight text-black">Settings</h1>
      <p className="mt-3 text-2xl text-neutral-600">Manage your preferences and notification settings.</p>

      {message && <p className="mt-4 text-base text-green-700">{message}</p>}
      {error && <p className="mt-4 text-base text-red-600">{error}</p>}

      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_460px]">
        <div className="space-y-4">
          <section className="rounded border border-neutral-200 bg-white p-8">
            <h2 className="inline-flex items-center gap-3 text-5xl font-bold text-black">
              <Globe className="h-7 w-7" />
              General Settings
            </h2>

            <div className="mt-6 space-y-4">
              <label className="block text-lg uppercase tracking-wide text-neutral-500">
                Language Preference
                <select
                  value={settings.language}
                  onChange={(event) => updateField('language', event.target.value)}
                  className="mt-2 w-full rounded border border-neutral-300 px-4 py-3 text-2xl text-neutral-700"
                >
                  <option>English</option>
                  <option>German</option>
                  <option>French</option>
                  <option>Croatian</option>
                </select>
                <span className="mt-2 block text-base normal-case tracking-normal text-neutral-500">
                  Choose your preferred language for the platform interface
                </span>
              </label>

              <label className="block text-lg uppercase tracking-wide text-neutral-500">
                Time Zone
                <select
                  value={settings.timezone}
                  onChange={(event) => updateField('timezone', event.target.value)}
                  className="mt-2 w-full rounded border border-neutral-300 px-4 py-3 text-2xl text-neutral-700"
                >
                  <option>UTC</option>
                  <option>Europe/Zagreb</option>
                  <option>Europe/Berlin</option>
                  <option>America/New_York</option>
                </select>
                <span className="mt-2 block text-base normal-case tracking-normal text-neutral-500">
                  Set your time zone for accurate deadline and notification times
                </span>
              </label>
            </div>
          </section>

          <section className="rounded border border-neutral-200 bg-white p-8">
            <h2 className="inline-flex items-center gap-3 text-5xl font-bold text-black">
              <Bell className="h-7 w-7" />
              Email Notifications
            </h2>

            <div className="mt-6 space-y-4 text-2xl text-neutral-700">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={settings.email_notifications}
                  onChange={(event) => updateField('email_notifications', event.target.checked)}
                  className="mt-1 h-5 w-5"
                />
                <span>
                  Email Notifications
                  <span className="block text-lg text-neutral-500">
                    Receive email notifications for important updates
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={settings.status_updates}
                  onChange={(event) => updateField('status_updates', event.target.checked)}
                  className="mt-1 h-5 w-5"
                />
                <span>
                  Application Status Updates
                  <span className="block text-lg text-neutral-500">
                    Get notified when your application status changes
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={settings.new_opportunities}
                  onChange={(event) => updateField('new_opportunities', event.target.checked)}
                  className="mt-1 h-5 w-5"
                />
                <span>
                  New Opportunities
                  <span className="block text-lg text-neutral-500">
                    Be alerted about newly posted projects in your field
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={settings.marketing_emails}
                  onChange={(event) => updateField('marketing_emails', event.target.checked)}
                  className="mt-1 h-5 w-5"
                />
                <span>
                  Marketing Emails
                  <span className="block text-lg text-neutral-500">
                    Receive tips, news, and updates about the platform
                  </span>
                </span>
              </label>
            </div>
          </section>

          <section className="rounded border border-neutral-200 bg-white p-8">
            <h2 className="inline-flex items-center gap-3 text-5xl font-bold text-black">
              <Lock className="h-7 w-7" />
              Password Management
            </h2>

            <div className="mt-6 space-y-4">
              <label className="block text-lg uppercase tracking-wide text-neutral-500">
                Current Password
                <div className="relative">
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(event) =>
                      setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))
                    }
                    placeholder="Enter current password"
                    className="mt-2 w-full rounded border border-neutral-300 px-4 py-3 pr-10 text-2xl text-neutral-700"
                  />
                  <Eye className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
                </div>
              </label>

              <label className="block text-lg uppercase tracking-wide text-neutral-500">
                New Password
                <div className="relative">
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(event) =>
                      setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))
                    }
                    placeholder="Enter new password"
                    className="mt-2 w-full rounded border border-neutral-300 px-4 py-3 pr-10 text-2xl text-neutral-700"
                  />
                  <Eye className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
                </div>
                <span className="mt-2 block text-base normal-case tracking-normal text-neutral-500">
                  Must be at least 8 characters long
                </span>
              </label>

              <label className="block text-lg uppercase tracking-wide text-neutral-500">
                Confirm New Password
                <div className="relative">
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(event) =>
                      setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
                    }
                    placeholder="Confirm new password"
                    className="mt-2 w-full rounded border border-neutral-300 px-4 py-3 pr-10 text-2xl text-neutral-700"
                  />
                  <Eye className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
                </div>
              </label>

              <button
                type="button"
                onClick={changePassword}
                className="rounded bg-black px-6 py-3 text-sm font-semibold uppercase tracking-wider text-white"
              >
                Change Password
              </button>
            </div>
          </section>

          <section className="rounded border border-neutral-200 bg-white p-8">
            <h2 className="inline-flex items-center gap-3 text-5xl font-bold text-black">
              <Shield className="h-7 w-7" />
              Privacy Settings
            </h2>

            <div className="mt-6 space-y-4">
              <label className="block text-lg uppercase tracking-wide text-neutral-500">
                Profile Visibility
                <select
                  value={settings.profile_visibility}
                  onChange={(event) => updateField('profile_visibility', event.target.value)}
                  className="mt-2 w-full rounded border border-neutral-300 px-4 py-3 text-2xl text-neutral-700"
                >
                  <option value="public">Public - Visible to all supervisors</option>
                  <option value="limited">Limited - Visible after applying</option>
                  <option value="private">Private</option>
                </select>
              </label>

              <label className="flex items-start gap-3 text-2xl text-neutral-700">
                <input
                  type="checkbox"
                  checked={settings.show_email_address}
                  onChange={(event) => updateField('show_email_address', event.target.checked)}
                  className="mt-1 h-5 w-5"
                />
                <span>
                  Show Email Address
                  <span className="block text-lg text-neutral-500">
                    Allow supervisors to see your email address on your profile
                  </span>
                </span>
              </label>
            </div>
          </section>

          <section className="rounded border border-neutral-200 bg-white p-8">
            <h2 className="inline-flex items-center gap-3 text-5xl font-bold text-black">
              <Trash2 className="h-7 w-7 text-red-500" />
              Account Management
            </h2>

            <div className="mt-6 border-b border-neutral-200 pb-6">
              <h3 className="text-4xl font-semibold text-neutral-900">Deactivate Account</h3>
              <p className="mt-2 text-xl text-neutral-600">
                Temporarily deactivate your account. You can reactivate it any time by contacting support.
              </p>
              <button
                type="button"
                className="mt-4 rounded border border-neutral-400 px-6 py-3 text-neutral-700"
              >
                Deactivate Account
              </button>
            </div>

            <div className="pt-6">
              <h3 className="text-4xl font-semibold text-red-500">Delete Account</h3>
              <p className="mt-2 text-xl text-neutral-600">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <button
                type="button"
                className="mt-4 rounded bg-red-500 px-6 py-3 text-white"
              >
                Delete Account Permanently
              </button>
            </div>
          </section>

          <button
            type="button"
            onClick={saveSettings}
            className="w-fit rounded bg-black px-8 py-4 text-xl font-semibold text-white"
          >
            Save All Settings
          </button>
        </div>

        <aside className="h-fit rounded border border-neutral-200 bg-white p-8 lg:sticky lg:top-28">
          <h2 className="text-5xl font-bold text-black">Account Information</h2>

          <div className="mt-6 space-y-5">
            <div>
              <p className="text-lg uppercase tracking-wide text-neutral-500">Email</p>
              <p className="mt-1 text-3xl text-neutral-800">{profile.email}</p>
              <p className="text-base text-green-600">Verified</p>
            </div>

            <div>
              <p className="text-lg uppercase tracking-wide text-neutral-500">Member Since</p>
              <p className="mt-1 text-3xl text-neutral-800">
                {new Date(profile.member_since || Date.now()).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>

            <div>
              <p className="text-lg uppercase tracking-wide text-neutral-500">Profile Picture</p>
              <div className="mt-3 flex aspect-square items-center justify-center rounded bg-emerald-800 text-[11rem] lowercase text-white">
                {profile.first_name?.[0] || 'a'}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
}
