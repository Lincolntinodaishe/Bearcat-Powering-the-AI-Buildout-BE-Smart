import React, { useEffect, useState } from 'react'
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
import { api } from '../../lib/api'
import { formatMw, formatMwh } from '../../lib/format'

interface CertificateCardProps {
  certificate: Certificate
}

export const CertificateCard: React.FC<CertificateCardProps> = ({ certificate }) => {
  const { addAuditRow } = useEvent()
  const [cert, setCert] = useState<Certificate>(certificate)
  const [verifyState, setVerifyState] = useState<'unverified' | 'valid' | 'invalid'>('unverified')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [isTampered, setIsTampered] = useState(false)
  const [copied, setCopied] = useState(false)

  // A new certificate (e.g. issued at the end of an event) starts unverified
  useEffect(() => {
    setCert(certificate)
    setIsTampered(false)
    setVerifyState('unverified')
    setReason('')
  }, [certificate])

  // Real check: server verifies hash + Ed25519 signature + signing key;
  // if the API is unreachable, the browser recomputes the SHA-256 hash.
  const runVerify = async (target: Certificate, who: string) => {
    setBusy(true)
    try {
      const result = await api.verify(target)
      setVerifyState(result.valid ? 'valid' : 'invalid')
      setReason(result.reason)
      addAuditRow({
        who,
        action: result.valid ? 'Certificate verified' : 'Verification failed',
        detail: `${target.id}: ${result.reason}`,
        status: result.valid ? 'ok' : 'danger',
      })
    } finally {
      setBusy(false)
    }
  }

  const handleVerify = () => runVerify(cert, 'Auditor')

  // Tamper test: silently change one interval's metered_mw by -0.5, then re-verify
  const handleTamperTest = () => {
    const tampered = {
      ...cert,
      intervals: cert.intervals.map((inv, idx) =>
        idx === 2 ? { ...inv, metered_mw: inv.metered_mw - 0.5 } : inv
      ),
    }
    setCert(tampered)
    setIsTampered(true)
    addAuditRow({
      who: 'Tamper test',
      action: 'Interval modified',
      detail: `${cert.id}: metered load in interval 3 altered by -0.5 MW`,
      status: 'watch',
    })
    runVerify(tampered, 'Tamper test')
  }

  // Restore the original as issued, then re-verify
  const handleRestore = () => {
    setCert(certificate)
    setIsTampered(false)
    addAuditRow({
      who: 'Tamper test',
      action: 'Restored original',
      detail: `${certificate.id}: original certificate restored`,
      status: 'ok',
    })
    runVerify(certificate, 'Tamper test')
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
                <span>Valid — {reason.charAt(0).toLowerCase() + reason.slice(1)}</span>
              </span>
            )}
            {verifyState === 'invalid' && (
              <span className="inline-flex items-center gap-1 text-[12px] font-medium text-danger bg-danger/10 px-2.5 py-0.5 rounded-full">
                <span>Invalid — {reason.charAt(0).toLowerCase() + reason.slice(1)}</span>
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
              disabled={busy}
              className="px-3.5 py-1.5 border border-line hover:bg-panel text-ink rounded-[8px] text-[13px] font-medium transition"
            >
              Restore original
            </button>
          ) : (
            <button
              onClick={handleTamperTest}
              disabled={busy}
              className="px-3.5 py-1.5 border border-line hover:bg-panel text-ink2 hover:text-ink rounded-[8px] text-[13px] font-medium transition"
            >
              Tamper test
            </button>
          )}

          <button
            onClick={handleVerify}
            disabled={busy}
            className="px-4 py-1.5 bg-accent hover:bg-accent/90 text-white rounded-[8px] text-[13px] font-medium transition disabled:opacity-60"
          >
            {busy ? 'Verifying…' : 'Verify certificate'}
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
