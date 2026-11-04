import { ReactNode } from 'react'
import { TopNavigation } from './TopNavigation'

interface ApplicationShellProps {
  children: ReactNode
}

export function ApplicationShell({ children }: ApplicationShellProps) {
  return (
    <div className="app-shell">
      <TopNavigation />
      <main className="app-main">{children}</main>
    </div>
  )
}
