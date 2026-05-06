import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BriefcaseBusiness, GraduationCap } from 'lucide-react'

const roleConfig = {
  student: {
    label: 'Student',
    description:
      'Create an account to discover and apply to research projects.',
    loginDescription:
      'Find and apply to research opportunities with leading supervisors.',
    icon: GraduationCap,
  },
  supervisor: {
    label: 'Supervisor',
    description: 'Create an account to post opportunities and manage applications.',
    loginDescription:
      'Post opportunities and manage applications from talented students.',
    icon: BriefcaseBusiness,
  },
}

function RoleCard({ mode, role }) {
  const navigate = useNavigate()
  const config = roleConfig[role]
  const Icon = config.icon

  const handlePrimaryAction = () => {
    if (mode === 'login') {
      navigate(`/auth/login/${role}`)
      return
    }
    navigate(`/auth/signup/${role}`)
  }

  return (
    <button
      type="button"
      onClick={handlePrimaryAction}
      className="group flex h-full w-full flex-col rounded-DEFAULT border border-line bg-card p-7 text-left transition-all hover:border-line-strong hover:shadow-card"
    >
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-DEFAULT bg-subtle">
        <Icon className="h-5 w-5 text-ink" strokeWidth={1.8} />
      </div>

      <div className="mb-2 text-[16px] font-semibold text-ink">{config.label}</div>

      <p className="mb-5 text-[13px] leading-[1.6] text-ink-2">
        {mode === 'signup' ? config.description : config.loginDescription}
      </p>

      <span className="mt-auto inline-flex w-full items-center justify-center rounded-sm bg-ink px-4 py-2 text-[13px] font-medium text-white transition-opacity group-hover:opacity-85">
        {mode === 'signup' ? `Sign up as ${config.label}` : `Sign in as ${config.label}`}
      </span>
    </button>
  )
}

export default function AuthRoleSelection({ mode }) {
  return (
    <main className="flex min-h-screen flex-col bg-bg text-ink">
      <header className="border-b border-line bg-card px-8 py-5">
        <Link to="/" className="text-[15px] font-bold tracking-tightish text-ink">
          TalentMatch
        </Link>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="fade-up mb-10 text-center">
          <h1 className="mb-2 text-[28px] font-bold tracking-tightish">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-[14px] text-ink-2">
            {mode === 'login'
              ? 'Sign in to continue your research journey'
              : 'Choose your role to get started'}
          </p>
        </div>

        <div className="fade-up fade-up-1 grid w-full max-w-[560px] grid-cols-1 gap-3.5 sm:grid-cols-2">
          <RoleCard mode={mode} role="student" />
          <RoleCard mode={mode} role="supervisor" />
        </div>

        <div className="fade-up fade-up-2 mt-6 text-[13px] text-ink-3">
          {mode === 'login' ? (
            <span>
              Don&apos;t have an account?{' '}
              <Link to="/auth/signup" className="font-medium text-ink hover:underline">
                Sign up
              </Link>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <Link to="/auth/login" className="font-medium text-ink hover:underline">
                Sign in
              </Link>
            </span>
          )}
        </div>
      </div>
    </main>
  )
}
