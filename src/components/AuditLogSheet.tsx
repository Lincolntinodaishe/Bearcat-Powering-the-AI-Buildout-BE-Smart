import React from 'react'
import { X, FileText } from 'lucide-react'
import { useEvent } from '../context/EventContext'

export const AuditLogSheet: React.FC = () => {
  const { auditLog, isAuditLogOpen, setIsAuditLogOpen } = useEvent()

  if (!isAuditLogOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[2px] flex justify-end animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white h-full border-l border-line flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="h-16 px-6 border-b border-line flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-[18px] h-[18px] text-ink2 stroke-[1.75]" />
            <h2 className="text-[17px] font-semibold text-ink">Audit log</h2>
          </div>
          <button
            onClick={() => setIsAuditLogOpen(false)}
            className="p-1 rounded-[6px] hover:bg-panel text-ink2 hover:text-ink transition"
          >
            <X className="w-5 h-5 stroke-[1.75]" />
          </button>
        </div>

        {/* Content Rows */}
        <div className="flex-1 overflow-y-auto divide-y divide-line">
          {auditLog.map((row) => (
            <div key={row.id} className="p-4 hover:bg-panel/50 transition-colors">
              <div className="flex items-center justify-between text-[12px] mb-1">
                <span className="font-medium text-ink">{row.action}</span>
                <span className="text-ink3 font-mono">{row.time}</span>
              </div>
              <p className="text-[13px] text-ink2 leading-relaxed">{row.detail}</p>
              <div className="text-[12px] text-ink3 mt-1.5">
                Actor: <span className="text-ink2 font-medium">{row.who}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-line bg-panel text-[12px] text-ink2 text-center">
          Cryptographically timestamped ledger entries
        </div>
      </div>
    </div>
  )
}
export default AuditLogSheet
