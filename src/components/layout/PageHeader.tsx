import React from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, action }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div>
        <h1 className="text-[28px] font-semibold text-ink tracking-tight leading-tight">{title}</h1>
        {description && <p className="text-[15px] text-ink2 mt-1 leading-normal">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
export default PageHeader
