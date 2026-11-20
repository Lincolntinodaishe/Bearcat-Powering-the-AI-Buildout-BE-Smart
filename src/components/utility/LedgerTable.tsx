import React, { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import type { LedgerRow } from '../../lib/types'
import { ShieldCheck, ChevronRight } from 'lucide-react'
import { useEvent } from '../../context/EventContext'

export const LedgerTable: React.FC = () => {
  const { setActiveNav, latestCertificate } = useEvent()
  const [ledger, setLedger] = useState<LedgerRow[]>([])

  // Signed certificates from the server (refreshes when a new one is issued)
  useEffect(() => {
    api.certificates().then(setLedger)
  }, [latestCertificate])

  const rows = ledger.map((r) => ({
    id: r.dispatch_id,
    committed: `${r.committed_mw.toFixed(1)} MW`,
    verified: `${r.verified_mw.toFixed(1)} MW`,
    compliance: `${Math.round(r.compliance * 100)}%`,
    valid: r.valid,
  }))

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
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-6 text-center text-ink2">
                  No settled events yet. Run a dispatch to issue a signed certificate.
                </td>
              </tr>
            )}
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
                  <span className={`inline-flex items-center gap-1 font-medium text-[12px] ${r.valid ? 'text-ok' : 'text-danger'}`}>
                    {r.valid && <ShieldCheck className="w-3.5 h-3.5" />}
                    <span>{r.valid ? 'Verified' : 'Failed'}</span>
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
