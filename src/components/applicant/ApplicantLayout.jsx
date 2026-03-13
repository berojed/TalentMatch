import { Outlet } from 'react-router-dom'
import ApplicantHeader from './ApplicantHeader'

export default function ApplicantLayout() {
  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900">
      <ApplicantHeader />
      <Outlet />
    </div>
  )
}
