import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="size-full flex bg-background">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(v => !v)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          onMenuToggle={() => setSidebarCollapsed(v => !v)}
          sidebarCollapsed={sidebarCollapsed}
        />
        <main className="flex-1 overflow-y-auto bg-gray-50 relative">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
