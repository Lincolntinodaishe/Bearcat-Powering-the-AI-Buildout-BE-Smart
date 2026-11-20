import React from 'react'
import { Database, ShieldCheck, CheckCircle2, Radio, Server, FileText } from 'lucide-react'

interface DataSourceItem {
  name: string
  provider: string
  frequency: string
  latency: string
  status: 'Live Stream' | 'Synced' | 'Degraded'
  description: string
}

const sources: DataSourceItem[] = [
  { name: 'EIA 930 Hourly Electric Grid Monitor', provider: 'U.S. Energy Information Admin', frequency: 'Hourly telemetry', latency: '42ms', status: 'Live Stream', description: 'Real-time generation by energy source, sub-regional hourly interchange, and demand forecasts.' },
  { name: 'NOAA Severe Weather API & Radar Vectors', provider: 'National Weather Service', frequency: '5-minute rapid scan', latency: '120ms', status: 'Live Stream', description: 'Doppler wind gusts, lightning strike triangulation, ambient wet-bulb thermal data.' },
  { name: 'NETA Technician Registry & Credential Ledger', provider: 'InterNational Electrical Testing Assoc.', frequency: 'Daily sync', latency: '180ms', status: 'Synced', description: 'Verified Level 2-4 technician certifications, CPR/OSHA compliance, and test accreditation.' },
  { name: 'ERCOT / PJM Interconnection Scrapes', provider: 'Regional Transmission Organizations', frequency: '1-minute market locational marginal prices', latency: '65ms', status: 'Live Stream', description: 'Real-time energy clearing pricing ($/MWh) and reserve capacity shortage alerts.' },
]

export const DataSources: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Data Sources & Packet Transparency</h1>
        <p className="text-slate-600 text-sm">Full verifiable audit trail of ingested public sector feeds, grid telemetry, and compliance streams.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-medium text-slate-500">Active Pipelines</div>
            <div className="text-2xl font-bold text-slate-900">4 Ingestion Feeds</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-medium text-slate-500">Average Packet Latency</div>
            <div className="text-2xl font-bold text-slate-900">84 ms</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-medium text-slate-500">Data Integrity Proof</div>
            <div className="text-2xl font-bold text-slate-900">SHA-256 Verified</div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Connected Data Feeds</h2>
        <div className="grid grid-cols-1 gap-4">
          {sources.map((src, idx) => (
            <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-3">
                  <Database className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <h3 className="font-semibold text-slate-900 text-base">{src.name}</h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> {src.status}
                  </span>
                </div>
                <p className="text-sm text-slate-600 pl-8">{src.description}</p>
                <div className="text-xs text-slate-400 pl-8 pt-1 flex items-center gap-4">
                  <span>Source: <strong>{src.provider}</strong></span>
                  <span>•</span>
                  <span>Cadence: {src.frequency}</span>
                  <span>•</span>
                  <span>Latency: {src.latency}</span>
                </div>
              </div>

              <div className="flex-shrink-0 flex items-center gap-2">
                <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50">
                  <FileText className="w-3.5 h-3.5" /> Schema
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
export default DataSources
