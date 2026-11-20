import React from 'react'
import {
  Zap,
  LayoutDashboard,
  TrendingUp,
  Activity,
  ShieldCheck,
  FileText,
  Sliders,
} from 'lucide-react'
import { useEvent } from '../../context/EventContext'

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'forecast', label: 'Forecast', icon: TrendingUp },
  { id: 'event', label: 'Load-shed event', icon: Activity },
  { id: 'certificates', label: 'Certificates', icon: ShieldCheck },
  { id: 'assumptions', label: 'Assumptions', icon: Sliders },
]

export const Sidebar: React.FC = () => {
  const { activeNav, setActiveNav, setIsAuditLogOpen } = useEvent()

  return (
    <aside className="w-[220px] bg-panel border-r border-line min-h-screen flex flex-col flex-shrink-0 select-none">
      {/* Brand Wordmark */}
      <div className="h-16 px-5 flex items-center gap-2 border-b border-line">
        <Zap className="w-[18px] h-[18px] text-accent fill-accent" />
        <span className="font-semibold text-[17px] text-ink tracking-tight">GridSync</span>
      </div>

      {/* Navigation Links */}
      <nav className="p-3 space-y-1 flex-1">
        {navItems.map((item) => {
          const isSelected = activeNav === item.id
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-[14px] transition-all text-left ${
                isSelected
                  ? 'bg-white border border-line font-medium text-ink shadow-[0_1px_2px_rgba(0,0,0,0.04)]'
                  : 'text-ink2 hover:text-ink hover:bg-black/[0.02]'
              }`}
            >
              <Icon className="w-[17px] h-[17px] text-ink2 stroke-[1.75]" />
              <span>{item.label}</span>
            </button>
          )
        })}

        {/* Audit Log Trigger */}
        <button
          onClick={() => setIsAuditLogOpen(true)}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-[14px] text-ink2 hover:text-ink hover:bg-black/[0.02] transition-all text-left"
        >
          <FileText className="w-[17px] h-[17px] text-ink2 stroke-[1.75]" />
          <span>Audit log</span>
        </button>
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-line text-[11px] text-ink3">
        Memphis AI Campus · 56 MW
      </div>
    </aside>
  )
}
export default Sidebar
