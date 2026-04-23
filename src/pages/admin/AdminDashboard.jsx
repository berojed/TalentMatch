import React from 'react'
import { Link } from 'react-router-dom'
import { Shield, Users, FolderOpen, FileText, GraduationCap } from 'lucide-react'
import { supabase } from '../../lib/supabase'

function StatCard({ title, value, icon: Icon }) {
  return (
    <div className="rounded border border-neutral-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">{title}</p>
        <Icon className="h-4 w-4 text-neutral-400" />
      </div>
      <p className="mt-2 text-2xl font-bold text-black">{value}</p>
    </div>
  )
}

function DataTable({ title, columns, rows, renderRow }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold text-black">{title}</h2>
      <div className="mt-3 overflow-x-auto rounded border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50">
            <tr>
              {columns.map((col) => (
                <th key={col} className="px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-neutral-500">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-6 text-center text-neutral-400">
                  No data
                </td>
              </tr>
            ) : (
              rows.map(renderRow)
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

const SESSION_KEY = 'tm_admin_session'

function AdminLoginForm({ onSuccess }) {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // Sign out any existing session first so RLS sees the admin user
      await supabase.auth.signOut()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (signInError) {
        setError(signInError.message)
        return
      }
      sessionStorage.setItem(SESSION_KEY, '1')
      onSuccess()
    } catch (err) {
      setError(err.message || 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <Shield className="h-12 w-12 text-neutral-300" />
      <h1 className="text-2xl font-bold text-black">Admin Login</h1>
      <p className="max-w-md text-neutral-500">Enter admin credentials to access the dashboard.</p>
      <form onSubmit={handleSubmit} className="mt-2 w-full max-w-xs space-y-3 text-left">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          className="w-full rounded border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-neutral-500"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          className="w-full rounded border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-neutral-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
        {error && <p className="text-center text-sm text-red-600">{error}</p>}
      </form>
      <Link to="/" className="mt-2 text-sm text-neutral-500 hover:text-black hover:underline transition">
        &larr; Back to Home
      </Link>
    </main>
  )
}

export default function AdminDashboard() {
  const [authorized, setAuthorized] = React.useState(() => sessionStorage.getItem(SESSION_KEY) === '1')
  const [stats, setStats] = React.useState({ applicants: 0, supervisors: 0, projects: 0, applications: 0 })
  const [applicants, setApplicants] = React.useState([])
  const [supervisors, setSupervisors] = React.useState([])
  const [projects, setProjects] = React.useState([])
  const [applications, setApplications] = React.useState([])
  const [loading, setLoading] = React.useState(false)
  const [queryError, setQueryError] = React.useState('')

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    setQueryError('')

    // Verify there is a real Supabase auth session before querying
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      sessionStorage.removeItem(SESSION_KEY)
      setAuthorized(false)
      setLoading(false)
      return
    }

    try {
      const results = await Promise.all([
        supabase.from('applicants').select('user_id, first_name, last_name, degree_level_id, institution, education_levels ( label )', { count: 'exact' }).limit(50),
        supabase.from('supervisors').select('user_id, first_name, last_name, department, institution, is_verified', { count: 'exact' }).limit(50),
        supabase.from('projects').select('project_id, title, department, location, status, supervisor_id', { count: 'exact' }).order('created_at', { ascending: false }).limit(50),
        supabase.from('applications').select('application_id, project_id, applicant_id, student_id, status, submitted_at', { count: 'exact' }).order('submitted_at', { ascending: false }).limit(50),
      ])

      // Surface any query errors instead of silently treating them as empty
      const errors = results.map((r, i) => r.error ? `${['applicants','supervisors','projects','applications'][i]}: ${r.error.message}` : null).filter(Boolean)
      if (errors.length) {
        setQueryError(errors.join(' | '))
      }

      const [appResult, supResult, projResult, applResult] = results

      setStats({
        applicants: appResult.count || 0,
        supervisors: supResult.count || 0,
        projects: projResult.count || 0,
        applications: applResult.count || 0,
      })
      setApplicants(appResult.data || [])
      setSupervisors(supResult.data || [])
      setProjects(projResult.data || [])

      // Enrich applications with applicant names and project titles
      const applRows = applResult.data || []
      const applicantMap = {}
      ;(appResult.data || []).forEach((a) => { applicantMap[a.user_id] = `${a.first_name} ${a.last_name}` })
      const projectMap = {}
      ;(projResult.data || []).forEach((p) => { projectMap[p.project_id] = p.title })
      setApplications(applRows.map((a) => ({
        ...a,
        applicant_name: applicantMap[a.applicant_id] || applicantMap[a.student_id] || '—',
        project_title: projectMap[a.project_id] || '—',
      })))
    } catch (err) {
      console.error('Admin data fetch error:', err)
      setQueryError(err.message || 'Failed to fetch admin data.')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    if (authorized) fetchData()
  }, [authorized, fetchData])

  if (!authorized) {
    return <AdminLoginForm onSuccess={() => setAuthorized(true)} />
  }

  const handleLogout = async () => {
    sessionStorage.removeItem(SESSION_KEY)
    await supabase.auth.signOut()
    setAuthorized(false)
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-[1100px] px-6 py-10">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-neutral-700" />
        <h1 className="text-3xl font-bold tracking-tight text-black">Admin Dashboard</h1>
      </div>
      

      <div className="mt-4 flex items-center gap-4">
        <button
          type="button"
          onClick={handleLogout}
          className="rounded border border-neutral-500 px-3 py-1.5 text-sm text-neutral-600 transition hover:bg-neutral-100"
        >
          Admin Logout
        </button>
      </div>

      {queryError && (
        <p className="mt-4 rounded border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {queryError}
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Applicants" value={stats.applicants} icon={GraduationCap} />
        <StatCard title="Supervisors" value={stats.supervisors} icon={Users} />
        <StatCard title="Projects" value={stats.projects} icon={FolderOpen} />
        <StatCard title="Applications" value={stats.applications} icon={FileText} />
      </div>

      <DataTable
        title="Applicants"
        columns={['Name', 'Degree Level', 'Institution']}
        rows={applicants}
        renderRow={(a) => (
          <tr key={a.user_id}>
            <td className="px-4 py-2.5 font-medium text-black">{a.first_name} {a.last_name}</td>
            <td className="px-4 py-2.5 text-neutral-600">{a.education_levels?.label || '—'}</td>
            <td className="px-4 py-2.5 text-neutral-600">{a.institution || '—'}</td>
          </tr>
        )}
      />

      <DataTable
        title="Supervisors"
        columns={['Name', 'Department', 'Institution', 'Verified']}
        rows={supervisors}
        renderRow={(s) => (
          <tr key={s.user_id}>
            <td className="px-4 py-2.5 font-medium text-black">{s.first_name} {s.last_name}</td>
            <td className="px-4 py-2.5 text-neutral-600">{s.department || '—'}</td>
            <td className="px-4 py-2.5 text-neutral-600">{s.institution || '—'}</td>
            <td className="px-4 py-2.5">{s.is_verified ? 'Yes' : 'No'}</td>
          </tr>
        )}
      />

      <DataTable
        title="Projects"
        columns={['Title', 'Department', 'Location', 'Status']}
        rows={projects}
        renderRow={(p) => (
          <tr key={p.project_id}>
            <td className="px-4 py-2.5 font-medium text-black">{p.title}</td>
            <td className="px-4 py-2.5 text-neutral-600">{p.department || '—'}</td>
            <td className="px-4 py-2.5 text-neutral-600">{p.location || '—'}</td>
            <td className="px-4 py-2.5">
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                p.status === 'OPEN' ? 'bg-green-50 text-green-700' :
                p.status === 'CLOSED' ? 'bg-red-50 text-red-700' :
                'bg-neutral-100 text-neutral-600'
              }`}>
                {p.status}
              </span>
            </td>
          </tr>
        )}
      />

      <DataTable
        title="Applications"
        columns={['ID', 'Applicant', 'Project', 'Status', 'Submitted']}
        rows={applications}
        renderRow={(a) => (
          <tr key={a.application_id}>
            <td className="px-4 py-2.5 font-mono text-xs text-neutral-600">{a.application_id.slice(0, 8)}</td>
            <td className="px-4 py-2.5 font-medium text-black">{a.applicant_name}</td>
            <td className="px-4 py-2.5 text-neutral-600 truncate max-w-xs">{a.project_title}</td>
            <td className="px-4 py-2.5">
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                a.status === 'ACCEPTED' ? 'bg-green-50 text-green-700' :
                a.status === 'REJECTED' ? 'bg-red-50 text-red-700' :
                a.status === 'UNDER_REVIEW' ? 'bg-yellow-50 text-yellow-700' :
                'bg-neutral-100 text-neutral-600'
              }`}>
                {a.status}
              </span>
            </td>
            <td className="px-4 py-2.5 text-neutral-600">
              {a.submitted_at ? new Date(a.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
            </td>
          </tr>
        )}
      />
    </main>
  )
}
