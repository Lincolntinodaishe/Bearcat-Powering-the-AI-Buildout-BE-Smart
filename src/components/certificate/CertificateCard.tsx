import React, { useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { ShieldCheck, Copy, Check } from 'lucide-react'
import type { Certificate } from '../../lib/types'
import { useEvent } from '../../context/EventContext'
import { formatMw, formatMwh } from '../../lib/format'

interface CertificateCardProps {
  certificate: Certificate
}

export const CertificateCard: React.FC<CertificateCardProps> = ({ certificate }) => {
  const { addAuditRow } = useEvent()
  const [cert, setCert] = useState<Certificate>(certificate)
  const [verifyState, setVerifyState] = useState<'unverified' | 'valid' | 'invalid'>('unverified')
  const [isTampered, setIsTampered] = useState(false)
  const [copied, setCopied] = useState(false)

  // Verify button handler
  const handleVerify = () => {
    if (isTampered) {
      setVerifyState('invalid')
      addAuditRow({
        who: 'Auditor',
        action: 'Verification failed',
        detail: 'Hash mismatch: interval payload does not match signed SHA-256 digest.',
        status: 'danger',
      })
    } else {
      setVerifyState('valid')
      addAuditRow({
        who: 'Auditor',
        action: 'Certificate verified',
        detail: 'Valid signature and hash match day-ahead counterfactual intervals.',
        status: 'ok',
      })
    }
  }

  // Tamper test handler
  const handleTamperTest = () => {
    // Silently change one interval's metered_mw by -0.5
    const tampered = {
      ...cert,
      intervals: cert.intervals.map((inv, idx) =>
        idx === 2 ? { ...inv, metered_mw: inv.metered_mw - 0.5 } : inv
      ),
    }
    setCert(tampered)
    setIsTampered(true)
    setVerifyState('invalid')
    addAuditRow({
      who: 'Tamper test',
      action: 'Interval modified',
      detail: 'Metered load altered by -0.5 MW. Cryptographic hash invalidated.',
      status: 'danger',
    })
  }

  // Restore original handler
  const handleRestore = () => {
    setCert(certificate)
    setIsTampered(false)
    setVerifyState('valid')
    addAuditRow({
      who: 'Tamper test',
      action: 'Restored original',
      detail: 'Certificate restored to verified baseline.',
      status: 'ok',
    })
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(cert.hash_sha256)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white border border-line rounded-card p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-[20px] font-semibold text-ink">{cert.id}</h3>
            {verifyState === 'valid' && (
              <span className="inline-flex items-center gap-1 text-[12px] font-medium text-ok bg-ok/10 px-2.5 py-0.5 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Valid — signature and hash match</span>
              </span>
            )}
            {verifyState === 'invalid' && (
              <span className="inline-flex items-center gap-1 text-[12px] font-medium text-danger bg-danger/10 px-2.5 py-0.5 rounded-full">
                <span>Invalid — hash mismatch</span>
              </span>
            )}
          </div>
          <p className="text-[13px] text-ink2 mt-0.5">
            Event {cert.event.dispatch_id} · Source: {cert.event.source} · Signed {cert.signed_at}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {isTampered ? (
            <button
              onClick={handleRestore}
              className="px-3.5 py-1.5 border border-line hover:bg-panel text-ink rounded-[8px] text-[13px] font-medium transition"
            >
              Restore original
            </button>
          ) : (
            <button
              onClick={handleTamperTest}
              className="px-3.5 py-1.5 border border-line hover:bg-panel text-ink2 hover:text-ink rounded-[8px] text-[13px] font-medium transition"
            >
              Tamper test
            </button>
          )}

          <button
            onClick={handleVerify}
            className="px-4 py-1.5 bg-accent hover:bg-accent/90 text-white rounded-[8px] text-[13px] font-medium transition"
          >
            Verify certificate
          </button>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
        <div className="p-3 bg-panel rounded-[10px]">
          <div className="text-[12px] text-ink2">Verified reduction</div>
          <div className="text-[18px] font-semibold text-ink mt-0.5">
            {formatMw(cert.summary.avg_reduction_mw)}
          </div>
          <div className="text-[11px] text-ink3">avg over event</div>
        </div>

        <div className="p-3 bg-panel rounded-[10px]">
          <div className="text-[12px] text-ink2">Energy shed</div>
          <div className="text-[18px] font-semibold text-ink mt-0.5">
            {formatMwh(cert.summary.energy_mwh)}
          </div>
          <div className="text-[11px] text-ink3">total volume</div>
        </div>

        <div className="p-3 bg-panel rounded-[10px]">
          <div className="text-[12px] text-ink2">Compliance</div>
          <div className="text-[18px] font-semibold text-ink mt-0.5">
            {Math.round(cert.summary.compliance * 100)}%
          </div>
          <div className="text-[11px] text-ink3">target met</div>
        </div>

        <div className="p-3 bg-panel rounded-[10px]">
          <div className="text-[12px] text-ink2">Inference curtailed</div>
          <div className="text-[18px] font-semibold text-ok mt-0.5">
            {cert.summary.inference_curtailed_mw} MW
          </div>
          <div className="text-[11px] text-ink3">protected tier</div>
        </div>

        <div className="p-3 bg-panel rounded-[10px]">
          <div className="text-[12px] text-ink2">SLA breaches</div>
          <div className="text-[18px] font-semibold text-ink mt-0.5">
            {cert.summary.sla_breaches}
          </div>
          <div className="text-[11px] text-ink3">0 violations</div>
        </div>
      </div>

      {/* Small Chart: Baseline vs Metered */}
      <div className="space-y-2">
        <div className="text-[13px] text-ink2">
          Baseline method: day-ahead model forecast (P50)
        </div>

        <div className="h-[200px] w-full border border-line rounded-[10px] p-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={cert.intervals} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid stroke="#F0F0F2" vertical={false} />
              <XAxis
                dataKey="t"
                stroke="#A1A1A6"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#6E6E73' }}
                tickFormatter={(v) => v.slice(11, 16)}
              />
              <YAxis
                stroke="#A1A1A6"
                tickLine={false}
                axisLine={false}
                domain={[24, 48]}
                tick={{ fontSize: 11, fill: '#6E6E73' }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload
                    return (
                      <div className="bg-white border border-line rounded-[8px] p-2 text-[12px] text-ink shadow-[0_1px_2px_rgba(0,0,0,0.04)] space-y-0.5">
                        <div className="text-ink2 font-medium">{d.t.slice(11, 16)}</div>
                        <div className="text-accent font-semibold">Baseline: {d.baseline_mw} MW</div>
                        <div className="text-ok font-semibold">Metered: {d.metered_mw} MW</div>
                        <div className="text-ink3 text-[11px]">Reduction: {d.reduction_mw} MW</div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Line
                type="monotone"
                dataKey="baseline_mw"
                stroke="#0A84FF"
                strokeWidth={1.5}
                dot={false}
                name="Baseline"
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="metered_mw"
                stroke={isTampered ? '#FF3B30' : '#34C759'}
                strokeWidth={2}
                dot={false}
                name="Metered"
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hash and Signature Code Box */}
      <div className="p-3 bg-panel border border-line rounded-[8px] text-[12px] space-y-1 font-mono">
        <div className="flex items-center justify-between text-ink2">
          <span>SHA-256 Digest: {cert.hash_sha256}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-ink2 hover:text-ink text-[11px] font-sans"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-ok" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
        <div className="text-ink3 truncate">Ed25519 Signature: {cert.signature_ed25519}</div>
      </div>
    </div>
  )
}
export default CertificateCard
