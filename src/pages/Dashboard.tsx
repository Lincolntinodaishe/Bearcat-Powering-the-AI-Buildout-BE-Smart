import React from 'react'
import { ShieldAlert, TrendingUp, DollarSign, Activity } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const sampleData = [
  { time: '00:00', risk: 18, roi: 85 },
  { time: '04:00', risk: 24, roi: 82 },
  { time: '08:00', risk: 45, roi: 74 },
  { time: '12:00', risk: 62, roi: 68 },
  { time: '16:00', risk: 38, roi: 79 },
  { time: '20:00', risk: 22, roi: 88 },
]

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Executive Risk & ROI Dashboard</h1>
        <p className="text-slate-600 text-sm">Strategic overview of infrastructure risk exposure and capital return metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Risk Exposure</span>
            <ShieldAlert className="w-5 h-5 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">Moderate (34%)</div>
          <p className="text-xs text-amber-600 mt-1">Grid stress projected in ERCOT region</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Projected ROI</span>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">24.8%</div>
          <p className="text-xs text-emerald-600 mt-1">+3.2% vs previous quarter baseline</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Capital Deployed</span>
            <DollarSign className="w-5 h-5 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">$142.5M</div>
          <p className="text-xs text-slate-500 mt-1">Across 8 active data center clusters</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">System Uptime</span>
            <Activity className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">99.98%</div>
          <p className="text-xs text-indigo-600 mt-1">Automated failover standby</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Risk & ROI Trendline</h2>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sampleData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRoi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="time" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip />
              <Area type="monotone" dataKey="roi" stroke="#10b981" fillOpacity={1} fill="url(#colorRoi)" name="ROI Score" />
              <Area type="monotone" dataKey="risk" stroke="#f59e0b" fillOpacity={1} fill="url(#colorRisk)" name="Risk Index" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
export default Dashboard
