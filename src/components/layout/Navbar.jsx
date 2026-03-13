import { Link } from 'react-router-dom'
import { Shield } from 'lucide-react'

export default function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-screen-xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="text-black font-bold text-lg tracking-tight">
          TalentMatch
        </Link>

        {/* Nav Actions */}
        <div className="flex items-center gap-4">
          <Link
            to="/auth/login"
            className="text-sm font-medium text-gray-700 hover:text-black transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/auth/signup"
            className="bg-black text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-gray-800 transition-colors"
          >
            Sign Up
          </Link>
          <button className="p-1 text-gray-500 hover:text-black transition-colors">
            <Shield size={20} />
          </button>
        </div>
      </div>
    </header>
  )
}
