import React from 'react'
import { ShieldCheck, ChevronRight } from 'lucide-react'
import { useEvent } from '../../context/EventContext'

export const LedgerTable: React.FC = () => {
  const { setActiveNav } = useEvent()

  const rows = [
    { id: 'DR-1120-01', committed: '15.0 MW', verified: '15.3 MW', compliance: '98%', status: 'Verified' },
    { id: 'DR-1114-04', committed: '12.0 MW', verified: '12.2 MW', compliance: '99%', status: 'Verified' },
    { id: 'DR-1108-02', committed: '15.0 MW', verified: '15.1 MW', compliance: '97%', status: 'Verified' },
  ]

  return (
    <div className="bg-white border border-line rounded-card overflow-hidden">
      <div className="p-5 border-b border-line flex items-center justify-between">
        <div>
          <h3 className="text-[17px] font-semibold text-ink">M&V settlement ledger</h3>
          <p className="text-[13px] text-ink2 mt-0.5">Counterfactual verification certificates</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-panel border-b border-line text-ink2 font-medium">
            <tr>
              <th className="px-5 py-2.5">Event</th>
              <th className="px-5 py-2.5 text-right">Committed</th>
              <th className="px-5 py-2.5 text-right">Verified</th>
              <th className="px-5 py-2.5 text-right">Compliance</th>
              <th className="px-5 py-2.5 text-right">Certificate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line text-ink">
            {rows.map((r) => (
              <tr
                key={r.id}
                onClick={() => setActiveNav('certificates')}
                className="hover:bg-panel/50 cursor-pointer transition-colors"
              >
                <td className="px-5 py-3 font-mono text-[12px]">{r.id}</td>
                <td className="px-5 py-3 text-right text-ink2">{r.committed}</td>
                <td className="px-5 py-3 text-right font-medium text-ink">{r.verified}</td>
                <td className="px-5 py-3 text-right">{r.compliance}</td>
                <td className="px-5 py-3 text-right">
                  <span className="inline-flex items-center gap-1 text-ok font-medium text-[12px]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{r.status}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-ink3 ml-0.5" />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
export default LedgerTable
