import { Link } from 'react-router-dom'
import { Shield } from 'lucide-react'

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1160px] items-center justify-between px-6">
        <Link to="/" className="text-[16px] font-bold tracking-tightish text-ink">
          TalentMatch
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            to="/auth/login"
            className="rounded-sm px-3 py-1.5 text-[12px] font-medium text-ink-2 transition-colors hover:text-ink"
          >
            Sign In
          </Link>
          <Link
            to="/auth/signup"
            className="rounded-sm bg-ink px-3 py-1.5 text-[12px] font-medium text-white transition-opacity hover:opacity-85"
          >
            Get Started
          </Link>
          <Link
            to="/admin"
            aria-label="Admin"
            className="ml-1 rounded-sm p-1.5 text-ink-3 transition-colors hover:text-ink"
          >
            <Shield className="h-4 w-4" />
          </Link>
        </nav>
      </div>
    </header>
  )
}
