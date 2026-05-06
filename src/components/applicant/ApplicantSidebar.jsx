import React from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  Home as HomeIcon,
  Search,
  FileText,
  UserRound,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { getApplicantProfile } from '../../lib/applicantApi'

const NAV_ITEMS = [
  { to: '/applicant_dashboard', end: true, icon: HomeIcon, label: 'Dashboard' },
  { to: '/applicant_dashboard/opportunities', icon: Search, label: 'Opportunities' },
  { to: '/applicant_dashboard/applications', icon: FileText, label: 'My Applications' },
  { to: '/applicant_dashboard/profile', icon: UserRound, label: 'Profile' },
  { to: '/applicant_dashboard/settings', icon: Settings, label: 'Settings' },
]

function navItemClass({ isActive }) {
  return [
    'flex items-center gap-2.5 rounded-sm px-2.5 py-2 text-[13px] font-medium transition-colors',
    isActive
      ? 'bg-subtle text-ink'
      : 'text-ink-2 hover:bg-subtle hover:text-ink',
  ].join(' ')
}

export default function ApplicantSidebar({ open, onClose }) {
  const navigate = useNavigate()
  const [profile, setProfile] = React.useState(null)

  React.useEffect(() => {
    let active = true
    getApplicantProfile()
      .then((p) => active && setProfile(p))
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const initials = React.useMemo(() => {
    const f = (profile?.first_name || '').trim()
    const l = (profile?.last_name || '').trim()
    return ((f[0] || '') + (l[0] || '')).toUpperCase() || 'ME'
  }, [profile])

  const fullName = React.useMemo(() => {
    const f = (profile?.first_name || '').trim()
    const l = (profile?.last_name || '').trim()
    return [f, l].filter(Boolean).join(' ') || 'Student'
  }, [profile])

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
        />
      )}

      <aside
        className={[
          'flex w-[220px] shrink-0 flex-col gap-0.5 border-r border-line bg-card px-3 py-5',
          'fixed inset-y-0 left-0 z-40 transform transition-transform duration-200 md:sticky md:top-0 md:translate-x-0',
          'min-h-screen',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        ].join(' ')}
      >
        <div className="flex items-start justify-between px-2.5 mb-4">
          <Link to="/applicant_dashboard" className="block">
            <div className="text-[15px] font-bold tracking-tightish text-ink">TalentMatch</div>
            <div className="mt-0.5 text-[10px] uppercase tracking-wider2 text-ink-3">
              Student Portal
            </div>
          </Link>
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="rounded-sm p-1 text-ink-2 hover:bg-subtle md:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onClose}
                className={navItemClass}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        <div className="mt-auto px-1">
          <div className="my-3 h-px bg-line" />
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-[11px] font-semibold text-white">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="truncate text-[12px] font-medium text-ink">{fullName}</div>
              <div className="text-[11px] text-ink-3">Student</div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-1 flex w-full items-center gap-2 rounded-sm px-2.5 py-1.5 text-[12px] text-ink-3 transition-colors hover:bg-subtle hover:text-ink"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}

export function MobileMenuButton({ onOpen }) {
  return (
    <button
      type="button"
      aria-label="Open menu"
      onClick={onOpen}
      className="rounded-sm p-2 text-ink-2 hover:bg-subtle md:hidden"
    >
      <Menu className="h-5 w-5" />
    </button>
  )
}
