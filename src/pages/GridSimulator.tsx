import React, { useState } from 'react'
import { Zap, CloudLightning, Wind, Thermometer, Play, Pause, RefreshCw } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const gridLoadData = [
  { step: 'T-10m', demandMW: 4200, capacityMW: 5000, weatherImpact: 5 },
  { step: 'T-8m', demandMW: 4450, capacityMW: 5000, weatherImpact: 8 },
  { step: 'T-6m', demandMW: 4700, capacityMW: 4900, weatherImpact: 14 },
  { step: 'T-4m', demandMW: 4890, capacityMW: 4850, weatherImpact: 22 },
  { step: 'T-2m', demandMW: 4950, capacityMW: 4800, weatherImpact: 35 },
  { step: 'Now', demandMW: 5100, capacityMW: 4750, weatherImpact: 42 },
]

export const GridSimulator: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false)
  const [curtailmentLevel, setCurtailmentLevel] = useState(15)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">EIA Grid & Weather Disruption Simulator</h1>
          <p className="text-slate-600 text-sm">Real-time simulation of regional ISO stress, storm front vectors, and AI cluster load shifting.</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
              isRunning ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {isRunning ? <><Pause className="w-4 h-4" /><span>Pause Live Sim</span></> : <><Play className="w-4 h-4" /><span>Start Simulation</span></>}
          </button>
          <button className="p-2 border border-slate-300 rounded-lg hover:bg-slate-100 text-slate-600">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">EIA Regional Reserve</span>
            <Zap className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">350 MW Margin</div>
          <div className="text-xs text-red-500 mt-1 font-medium">Critical deficit alert: &lt; 5% margin</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">Storm Velocity</span>
            <Wind className="w-5 h-5 text-sky-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">58 mph Gusts</div>
          <div className="text-xs text-slate-500 mt-1">Impact ETA: 35 minutes (Dallas-Fort Worth)</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">Ambient Heat Index</span>
            <Thermometer className="w-5 h-5 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">104.2°F</div>
          <div className="text-xs text-rose-500 mt-1">Cooling chiller efficiency down 12%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Grid Load vs Available Generation Capacity (MW)</h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={gridLoadData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="step" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Line type="monotone" dataKey="demandMW" stroke="#ef4444" strokeWidth={2.5} name="Total Demand (MW)" />
                <Line type="monotone" dataKey="capacityMW" stroke="#3b82f6" strokeWidth={2.5} strokeDasharray="5 5" name="Grid Capacity (MW)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Curtailment Controls</h2>
          <p className="text-xs text-slate-500">Dynamically throttle non-essential AI model training jobs to protect grid stability.</p>

          <div>
            <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
              <span>AI Cluster Throttling Level</span>
              <span className="font-bold text-blue-600">{curtailmentLevel}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={curtailmentLevel}
              onChange={(e) => setCurtailmentLevel(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="font-semibold text-slate-800 flex items-center gap-1">
              <CloudLightning className="w-3.5 h-3.5 text-amber-500" /> Predictive Action
            </div>
            <p>At {curtailmentLevel}% throttling, 82 MW is freed up to support critical healthcare & municipal feeders.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
export default GridSimulator
