import { Link, NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

function navClassName({ isActive }) {
  return `px-3 py-1 text-[0.95rem] font-medium transition ${
    isActive
      ? 'text-black border-b-2 border-black'
      : 'text-neutral-500 hover:text-black'
  }`
}

export default function SupervisorHeader() {
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/auth/login')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white">
      <div className="mx-auto flex h-16 w-full max-w-[1500px] items-center justify-between px-6 sm:px-10">
        <Link
          to="/supervisor"
          className="text-xl font-bold tracking-tight text-black"
        >
          TalentMatch
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <NavLink to="/supervisor" end className={navClassName}>
            Home
          </NavLink>
          <NavLink to="/supervisor/opportunities" className={navClassName}>
            Posted Opportunities
          </NavLink>
          <NavLink to="/supervisor/applications" className={navClassName}>
            Applications
          </NavLink>
          <NavLink to="/supervisor/profile" className={navClassName}>
            Profile
          </NavLink>
        </nav>

        <button
          type="button"
          onClick={handleSignOut}
          className="text-sm text-neutral-500 transition hover:text-black"
        >
          Sign Out
        </button>
      </div>
    </header>
  )
}
