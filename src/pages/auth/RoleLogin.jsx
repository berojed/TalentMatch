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
  const [showEmailForm, setShowEmailForm] = React.useState(false)
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  if (!roleLabelMap[role]) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-6 py-10">
        <div className="w-full max-w-md rounded border border-neutral-200 p-8 text-center">
          <p className="text-lg text-neutral-700">Invalid role. Please go back and try again.</p>
          <Link to="/auth/login" className="mt-4 inline-block text-blue-600 hover:underline">
            Back to role selection
          </Link>
        </div>
      </main>
    )
  }

  const handleGoogleSignIn = async () => {
    setError('')

    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
        queryParams: {
          role,
          mode: 'signin',
        },
      },
    })

    if (authError) {
      setError(authError.message)
    }
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

    navigate(role === 'supervisor' ? '/supervisor' : '/applicant')
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-white px-6 py-10 text-neutral-900">
      <button
        type="button"
        onClick={() => navigate('/auth/login')}
        aria-label="Close"
        className="absolute right-6 top-6 rounded p-2 text-neutral-700 transition hover:bg-neutral-100"
      >
        <X className="h-8 w-8" />
      </button>

      <section className="w-full max-w-md text-center">
        <h1 className="text-6xl font-bold tracking-tight text-black">Log In</h1>
        <p className="mt-4 text-3xl text-neutral-700">
          New to this site?{' '}
          <Link to="/auth/signup" className="text-blue-600 hover:underline">
            Sign Up
          </Link>
        </p>
        <p className="mt-3 text-base text-neutral-500">Signing in as {roleLabelMap[role]}</p>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="mt-10 w-full rounded border border-neutral-300 bg-white px-5 py-3 text-2xl font-medium text-neutral-900 transition hover:bg-neutral-100"
        >
          Log in with Google
        </button>

        <div className="my-7 flex items-center gap-4">
          <span className="h-px flex-1 bg-neutral-300" />
          <span className="text-3xl text-neutral-600">or</span>
          <span className="h-px flex-1 bg-neutral-300" />
        </div>

        {!showEmailForm && (
          <button
            type="button"
            onClick={() => setShowEmailForm(true)}
            className="w-full rounded border border-neutral-300 bg-white px-5 py-3 text-2xl font-medium text-neutral-900 transition hover:bg-neutral-100"
          >
            Log in with Email
          </button>
        )}

        {showEmailForm && (
          <form className="mt-6 space-y-3 text-left" onSubmit={handleEmailSignIn}>
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
        )}

        {error && <p className="mt-4 text-left text-base text-red-600">{error}</p>}
      </section>
    </main>
  )
}
