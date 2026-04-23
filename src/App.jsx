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
import AdminDashboard from './pages/admin/AdminDashboard'
import Navbar from './components/layout/Navbar'

function PublicProjectsPage() {
  return (
    <>
      <Navbar />
      <div className="pt-16">
        <Opportunities publicPreview />
      </div>
    </>
  )
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
        <Route path="/" element={<Home />} />
        <Route path="/projects" element={<PublicProjectsPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/auth/login" element={<AuthRoleSelection mode="login" />} />
        <Route path="/auth/signup" element={<AuthRoleSelection mode="signup" />} />
        <Route path="/auth/login/:role" element={<RoleLogin />} />
        <Route path="/auth/signup/student" element={<StudentSignup />} />
        <Route path="/auth/signup/supervisor" element={<SupervisorSignup />} />

        <Route path="/applicant_dashboard" element={<ApplicantLayout />}>
          <Route index element={<ApplicantHome />} />
          <Route path="opportunities" element={<Opportunities />} />
          <Route path="opportunities/:projectId" element={<ProjectDetails />} />
          <Route path="applications" element={<Applications />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        {/* Backward-compatible redirects */}
        <Route path="/applicant" element={<Navigate to="/applicant_dashboard" replace />} />
        <Route path="/applicant/opportunities" element={<Navigate to="/applicant_dashboard/opportunities" replace />} />
        <Route path="/applicant/applications" element={<Navigate to="/applicant_dashboard/applications" replace />} />
        <Route path="/applicant/profile" element={<Navigate to="/applicant_dashboard/profile" replace />} />
        <Route path="/applicant/settings" element={<Navigate to="/applicant_dashboard/settings" replace />} />

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
