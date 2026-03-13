import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import AuthRoleSelection from './pages/auth/AuthRoleSelection'
import RoleLogin from './pages/auth/RoleLogin'
import StudentSignup from './pages/auth/StudentSignup'
import SupervisorSignup from './pages/auth/SupervisorSignup'
import ApplicantLayout from './components/applicant/ApplicantLayout'
import ApplicantHome from './pages/applicant/ApplicantHome'
import Opportunities from './pages/applicant/Opportunities'
import Applications from './pages/applicant/Applications'
import ProjectDetails from './pages/applicant/ProjectDetails'
import Profile from './pages/applicant/Profile'
import Settings from './pages/applicant/Settings'
import SupervisorLayout from './components/supervisor/SupervisorLayout'
import SupervisorDashboard from './pages/supervisor/SupervisorDashboard'
import PostedOpportunities from './pages/supervisor/PostedOpportunities'
import SupervisorProjectDetail from './pages/supervisor/SupervisorProjectDetail'
import SupervisorApplications from './pages/supervisor/SupervisorApplications'
import ApplicationReview from './pages/supervisor/ApplicationReview'
import SupervisorProfile from './pages/supervisor/SupervisorProfile'
import { supabase } from './lib/supabase'

function LoadingRoute() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-100">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
    </div>
  )
}

async function hasRecord(table, column, value) {
  const { data, error } = await supabase
    .from(table)
    .select(column)
    .eq(column, value)
    .limit(1)

  if (error) {
    return false
  }

  return Boolean(data && data.length > 0)
}

async function resolveInitialRoute() {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return '/auth/login'

  const metaRole =
    String(user.user_metadata?.role || user.app_metadata?.role || '').toLowerCase()

  if (metaRole.includes('supervisor')) return '/supervisor'
  if (metaRole.includes('student') || metaRole.includes('applicant')) return '/applicant'

  const isSupervisor =
    (await hasRecord('supervisors', 'user_id', user.id)) ||
    (await hasRecord('supervisors', 'id', user.id))

  if (isSupervisor) return '/supervisor'

  const isApplicant =
    (await hasRecord('applicants', 'user_id', user.id)) ||
    (await hasRecord('applicant_profiles', 'id', user.id))

  if (isApplicant) return '/applicant'

  return '/auth/login'
}

function RootRedirect() {
  const [target, setTarget] = useState(null)

  useEffect(() => {
    let active = true

    resolveInitialRoute()
      .then((path) => {
        if (active) setTarget(path)
      })
      .catch(() => {
        if (active) setTarget('/auth/login')
      })

    return () => {
      active = false
    }
  }, [])

  if (!target) return <LoadingRoute />

  return <Navigate to={target} replace />
}

export default function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/landing" element={<Home />} />
        <Route path="/auth/login" element={<AuthRoleSelection mode="login" />} />
        <Route path="/auth/signup" element={<AuthRoleSelection mode="signup" />} />
        <Route path="/auth/login/:role" element={<RoleLogin />} />
        <Route path="/auth/signup/student" element={<StudentSignup />} />
        <Route path="/auth/signup/supervisor" element={<SupervisorSignup />} />

        <Route path="/applicant" element={<ApplicantLayout />}>
          <Route index element={<ApplicantHome />} />
          <Route path="opportunities" element={<Opportunities />} />
          <Route path="opportunities/:projectId" element={<ProjectDetails />} />
          <Route path="applications" element={<Applications />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="/supervisor" element={<SupervisorLayout />}>
          <Route index element={<SupervisorDashboard />} />
          <Route path="opportunities" element={<PostedOpportunities />} />
          <Route path="project/:projectId" element={<SupervisorProjectDetail />} />
          <Route path="applications" element={<SupervisorApplications />} />
          <Route path="applications/:applicationId" element={<ApplicationReview />} />
          <Route path="profile" element={<SupervisorProfile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
