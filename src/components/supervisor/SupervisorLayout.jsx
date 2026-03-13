import { Outlet } from 'react-router-dom'
import SupervisorHeader from './SupervisorHeader'

export default function SupervisorLayout() {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <SupervisorHeader />
      <Outlet />
      <footer className="border-t border-neutral-200 bg-white py-6">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-6 sm:px-10">
          <span className="text-sm text-neutral-400">
            &copy; {new Date().getFullYear()} TalentMatch. All rights reserved.
          </span>
          <div className="flex gap-4 text-sm text-neutral-400">
            <span className="cursor-pointer hover:text-neutral-600">Privacy</span>
            <span className="cursor-pointer hover:text-neutral-600">Terms</span>
            <span className="cursor-pointer hover:text-neutral-600">Support</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
