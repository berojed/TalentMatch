import React from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Settings, UserRound } from 'lucide-react'
import { supabase } from '../../lib/supabase'

function navClassName({ isActive }) {
  return `rounded-full px-3 py-1 text-[1.05rem] transition ${
    isActive ? 'bg-neutral-200 text-black' : 'text-neutral-600 hover:text-black'
  }`
}

export default function ApplicantHeader() {
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/auth/login')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-neutral-100/95 backdrop-blur">
      <div className="mx-auto flex h-20 w-full max-w-[1500px] items-center justify-between px-4 sm:px-8">
        <Link to="/applicant" className="text-5xl font-bold tracking-tight text-black sm:text-4xl">
          TalentMatch
        </Link>

        <nav className="hidden items-center gap-3 md:flex">
          <NavLink to="/applicant" end className={navClassName}>
            Home
          </NavLink>
          <NavLink to="/applicant/opportunities" className={navClassName}>
            Opportunities
          </NavLink>
          <NavLink to="/applicant/applications" className={navClassName}>
            My Applications
          </NavLink>
        </nav>

        <div className="flex items-center gap-1 sm:gap-3">
          <NavLink
            to="/applicant/profile"
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
            to="/applicant/settings"
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
            className="rounded px-3 py-2 text-[1.05rem] text-neutral-700 transition hover:bg-neutral-200 hover:text-black"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  )
}
