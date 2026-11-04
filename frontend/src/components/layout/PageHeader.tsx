import type { ReactNode } from 'react'

interface PageHeaderProps {
  eyebrow: string
  title: ReactNode
  description?: string
  actions?: ReactNode
}

/** One page header for every app page: mono eyebrow, serif display title, sub, actions. */
export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <header className="page-head">
      <div style={{ minWidth: 0, maxWidth: '68ch' }}>
        <p className="page-eyebrow">{eyebrow}</p>
        <h1 className="page-title">{title}</h1>
        {description ? <p className="page-sub">{description}</p> : null}
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </header>
  )
}
