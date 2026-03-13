import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BriefcaseBusiness, GraduationCap } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const roleConfig = {
  student: {
    label: 'Student',
    description:
      'Create an account to find and apply to research opportunities.',
    loginDescription:
      'Find and apply to research opportunities with leading supervisors.',
    icon: GraduationCap,
  },
  supervisor: {
    label: 'Research Supervisor',
    description: 'Create an account to post opportunities and manage applications.',
    loginDescription:
      'Post opportunities and manage applications from talented students.',
    icon: BriefcaseBusiness,
  },
}

function RoleCard({ mode, role, setError }) {
  const navigate = useNavigate()
  const config = roleConfig[role]
  const Icon = config.icon

  const startGoogleAuth = async () => {
    setError('')

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
        queryParams: {
          role,
        },
      },
    })

    if (error) {
      setError(error.message)
    }
  }

  const handlePrimaryAction = () => {
    if (mode === 'login') {
      navigate(`/auth/login/${role}`)
      return
    }

    navigate(`/auth/signup/${role}`)
  }

  return (
    <article className="w-full rounded border border-neutral-200 bg-white px-7 py-10">
      <div className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
        <Icon className="h-8 w-8 text-neutral-900" strokeWidth={1.8} />
      </div>

      <h2 className="mb-3 text-center text-[2rem] font-bold leading-tight text-neutral-950">
        {config.label}
      </h2>

      <p className="mb-8 text-center text-lg leading-relaxed text-neutral-600">
        {mode === 'signup' ? config.description : config.loginDescription}
      </p>

      <button
        type="button"
        onClick={handlePrimaryAction}
        className="mb-3 w-full rounded-full bg-black px-6 py-4 text-xl font-medium text-white transition hover:bg-neutral-800"
      >
        {mode === 'signup' ? 'Sign Up with Email' : `Sign In as ${config.label}`}
      </button>

      {mode === 'signup' && (
        <button
          type="button"
          onClick={startGoogleAuth}
          className="w-full rounded-full border-2 border-neutral-900 bg-white px-6 py-4 text-xl font-medium text-neutral-900 transition hover:bg-neutral-100"
        >
          Sign Up with Google
        </button>
      )}
    </article>
  )
}

export default function AuthRoleSelection({ mode }) {
  const [error, setError] = React.useState('')

  return (
    <main className="min-h-screen bg-neutral-100 px-4 py-20 text-neutral-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-14 text-center">
          <h1 className="mb-3 text-6xl font-bold tracking-tight text-black">TalentMatch</h1>
          <p className="text-3xl text-neutral-600">
            {mode === 'signup'
              ? 'Create Your Account'
              : 'Connect Research Talent with Opportunities'}
          </p>
        </header>

        <section className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-2">
          <RoleCard mode={mode} role="student" setError={setError} />
          <RoleCard mode={mode} role="supervisor" setError={setError} />
        </section>

        {error && <p className="mt-6 text-center text-base text-red-600">{error}</p>}

        <footer className="mt-12 text-center">
          {mode === 'signup' ? (
            <p className="text-2xl text-neutral-500">
              Already have an account?{' '}
              <Link to="/auth/login" className="font-medium text-black hover:underline">
                Sign in here
              </Link>
            </p>
          ) : (
            <>
              <p className="text-2xl text-neutral-500">
                Don&apos;t have an account?{' '}
                <Link to="/auth/signup" className="font-medium text-black hover:underline">
                  Sign up here
                </Link>
              </p>
              <p className="mt-4 text-base text-neutral-500">
                By signing in, you agree to our Terms of Service and Privacy Policy
              </p>
            </>
          )}
        </footer>
      </div>
    </main>
  )
}
