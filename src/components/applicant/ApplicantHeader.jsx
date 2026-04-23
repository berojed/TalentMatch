import React from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Settings, UserRound } from 'lucide-react'
import { supabase } from '../../lib/supabase'

function navClassName({ isActive }) {
  return `px-3 py-1 text-[0.95rem] font-medium transition ${
    isActive
      ? 'text-black border-b-2 border-black'
      : 'text-neutral-500 hover:text-black'
  }`
}

export default function ApplicantHeader() {
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white">
      <div className="mx-auto flex h-16 w-full max-w-[1100px] items-center justify-between px-6 sm:px-10">
        <Link to="/applicant_dashboard" className="text-xl font-bold tracking-tight text-black">
          TalentMatch
        </Link>

        <nav className="hidden items-center gap-3 md:flex">
          <NavLink to="/applicant_dashboard" end className={navClassName}>
            Home
          </NavLink>
          <NavLink to="/applicant_dashboard/opportunities" className={navClassName}>
            Opportunities
          </NavLink>
          <NavLink to="/applicant_dashboard/applications" className={navClassName}>
            My Applications
          </NavLink>
        </nav>

        <div className="flex items-center gap-1 sm:gap-3">
          <NavLink
            to="/applicant_dashboard/profile"
            className={({ isActive }) =>
              `rounded p-2 transition ${
                isActive ? 'bg-neutral-200 text-black' : 'text-neutral-600 hover:bg-neutral-200'
              }`
            }
            aria-label="Profile"
          >
            <UserRound className="h-5 w-5" />
          </NavLink>

          <NavLink
            to="/applicant_dashboard/settings"
            className={({ isActive }) =>
              `rounded p-2 transition ${
                isActive ? 'bg-neutral-200 text-black' : 'text-neutral-600 hover:bg-neutral-200'
              }`
            }
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" />
          </NavLink>

          <button
            type="button"
            onClick={handleSignOut}
            className="rounded px-3 py-2 text-[0.95rem] text-neutral-700 transition hover:bg-neutral-200 hover:text-black"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  )
}
