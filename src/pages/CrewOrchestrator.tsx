import React from 'react'
import { Users, Award, Clock, CheckCircle2, AlertCircle } from 'lucide-react'

interface CrewMember {
  id: string
  name: string
  netaLevel: string
  certStatus: 'Certified' | 'Expiring Soon' | 'Pending'
  location: string
  availability: string
}

const mockCrews: CrewMember[] = [
  { id: 'CR-101', name: 'Marcus Sterling', netaLevel: 'NETA Level 4 Senior Tech', certStatus: 'Certified', location: 'Dallas, TX', availability: 'Immediate' },
  { id: 'CR-102', name: 'Elena Rostova', netaLevel: 'NETA Level 3 Specialist', certStatus: 'Certified', location: 'Ashburn, VA', availability: 'In 24h' },
  { id: 'CR-103', name: 'DeShawn Washington', netaLevel: 'NETA Level 3 High Voltage', certStatus: 'Expiring Soon', location: 'Columbus, OH', availability: 'Immediate' },
  { id: 'CR-104', name: 'Tyler Bennett', netaLevel: 'NETA Level 2 Field Tech', certStatus: 'Certified', location: 'Phoenix, AZ', availability: 'In 48h' },
]

export const CrewOrchestrator: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Crew Orchestrator & NETA Labor Matcher</h1>
        <p className="text-slate-600 text-sm">Automated dispatch and NETA certification matching for mission-critical electrical commissioning.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-medium text-slate-500">Available Technicians</div>
            <div className="text-2xl font-bold text-slate-900">28 Active</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-medium text-slate-500">NETA Level 3 & 4 Lead</div>
            <div className="text-2xl font-bold text-slate-900">14 Verified</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-medium text-slate-500">Avg Deployment Time</div>
            <div className="text-2xl font-bold text-slate-900">1.8 hrs</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Certified Workforce Roster</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold">
              <tr>
                <th className="px-6 py-3">Technician ID & Name</th>
                <th className="px-6 py-3">Certification Tier</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Location</th>
                <th className="px-6 py-3">Availability</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {mockCrews.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{c.name}</div>
                    <div className="text-xs text-slate-400">{c.id}</div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-700">{c.netaLevel}</td>
                  <td className="px-6 py-4">
                    {c.certStatus === 'Certified' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Certified
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        <AlertCircle className="w-3.5 h-3.5 mr-1" /> Expiring Soon
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">{c.location}</td>
                  <td className="px-6 py-4 text-emerald-600 font-medium">{c.availability}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition">
                      Dispatch
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
export default CrewOrchestrator
