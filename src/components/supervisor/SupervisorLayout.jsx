import React from 'react'
import { Outlet } from 'react-router-dom'
import SupervisorSidebar, { MobileMenuButton } from './SupervisorSidebar'

export default function SupervisorLayout() {
  const [mobileOpen, setMobileOpen] = React.useState(false)

  return (
    <div className="flex min-h-screen bg-bg text-ink">
      <SupervisorSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <main className="flex min-w-0 flex-1 flex-col bg-bg">
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-card/90 px-4 py-2 backdrop-blur md:hidden">
          <MobileMenuButton onOpen={() => setMobileOpen(true)} />
          <span className="text-[14px] font-bold tracking-tightish">TalentMatch</span>
          <span className="w-9" />
        </div>
        <Outlet />
      </main>
    </div>
  )
}
