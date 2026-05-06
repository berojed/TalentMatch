import { Link, useNavigate, useParams } from 'react-router-dom'
import { X } from 'lucide-react'
import React from 'react'
import { supabase } from '../../lib/supabase'

const roleLabelMap = {
  student: 'Student',
  supervisor: 'Research Supervisor',
}

export default function RoleLogin() {
  const { role } = useParams()
  const navigate = useNavigate()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  if (!roleLabelMap[role]) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-4 py-6 sm:px-6 sm:py-10">
        <div className="w-full max-w-md rounded border border-neutral-200 p-8 text-center">
          <p className="text-lg text-neutral-700">Invalid role. Please go back and try again.</p>
          <Link to="/auth/login" className="mt-4 inline-block text-blue-600 hover:underline">
            Back to role selection
          </Link>
        </div>
      </main>
    )
  }

  const handleEmailSignIn = async (event) => {
    event.preventDefault()
    setError('')
    setIsLoading(true)

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setIsLoading(false)

    if (authError) {
      setError(authError.message)
      return
    }

    navigate(role === 'supervisor' ? '/supervisor' : '/applicant_dashboard')
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-white px-4 py-6 sm:px-6 sm:py-10 text-neutral-900">
      <button
        type="button"
        onClick={() => navigate('/auth/login')}
        aria-label="Close"
        className="absolute right-3 top-3 rounded p-2 text-neutral-700 transition hover:bg-neutral-100 sm:right-6 sm:top-6"
      >
        <X className="h-6 w-6 sm:h-8 sm:w-8" />
      </button>

      <section className="w-full max-w-md text-center">
        <Link to="/" className="mb-4 inline-block text-2xl sm:text-3xl font-bold tracking-tight text-black hover:underline underline-offset-4 transition">TalentMatch</Link>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-black">Log In</h1>
        <p className="mt-4 text-xl sm:text-2xl md:text-3xl text-neutral-700">
          New to this site?{' '}
          <Link to="/auth/signup" className="text-blue-600 hover:underline">
            Sign Up
          </Link>
        </p>
        <p className="mt-3 text-base text-neutral-500">Signing in as {roleLabelMap[role]}</p>

        <form className="mt-10 space-y-3 text-left" onSubmit={handleEmailSignIn}>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            required
            className="w-full rounded border border-neutral-300 px-4 py-3 text-lg outline-none transition focus:border-neutral-500"
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            required
            className="w-full rounded border border-neutral-300 px-4 py-3 text-lg outline-none transition focus:border-neutral-500"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded bg-black px-5 py-3 text-xl font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-600"
          >
            {isLoading ? 'Signing in...' : 'Continue'}
          </button>
        </form>

        {error && <p className="mt-4 text-left text-base text-red-600">{error}</p>}
      </section>
    </main>
  )
}
