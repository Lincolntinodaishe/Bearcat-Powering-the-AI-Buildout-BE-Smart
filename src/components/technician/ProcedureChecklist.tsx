import React, { useState } from 'react'

interface Step {
  id: number
  text: string
  done: boolean
  signedBy?: string
  time?: string
}

const initialSteps: Step[] = [
  { id: 1, text: 'Confirm event window and target with control room', done: true, signedBy: 'Priyah', time: '13:30' },
  { id: 2, text: 'Verify standby chiller available and loop at setpoint', done: true, signedBy: 'Priyah', time: '13:35' },
  { id: 3, text: 'Confirm battery SOC above reserve', done: true, signedBy: 'Priyah', time: '13:40' },
  { id: 4, text: 'Check no crew lockout on affected feeders', done: true, signedBy: 'Priyah', time: '13:42' },
  { id: 5, text: 'Confirm automated breaker sequence in simulation', done: false },
  { id: 6, text: 'Observe transfer; confirm 3-phase balance within 5%', done: false },
  { id: 7, text: 'Log completion and sign off', done: false },
]

export const ProcedureChecklist: React.FC = () => {
  const [steps, setSteps] = useState<Step[]>(initialSteps)

  const handleToggle = (id: number) => {
    setSteps((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const next = !s.done
          const now = new Date()
          const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`
          return {
            ...s,
            done: next,
            signedBy: next ? 'Priyah' : undefined,
            time: next ? time : undefined,
          }
        }
        return s
      })
    )
  }

  const completed = steps.filter((s) => s.done).length

  return (
    <div className="bg-white border border-line rounded-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[17px] font-semibold text-ink">
            Fail-safe chiller and switchgear transfer
          </h3>
          <p className="text-[13px] text-ink2 mt-0.5">High-voltage switching sequence checklist</p>
        </div>
        <span className="text-[13px] font-medium text-ink2 bg-panel px-2.5 py-1 rounded-[6px] border border-line">
          {completed} of {steps.length}
        </span>
      </div>

      <div className="divide-y divide-line pt-1">
        {steps.map((step) => (
          <label
            key={step.id}
            onClick={() => handleToggle(step.id)}
            className="py-3 flex items-start gap-3 cursor-pointer hover:bg-panel/40 px-1 rounded-[6px] transition-colors"
          >
            <input
              type="checkbox"
              checked={step.done}
              onChange={() => {}}
              className="mt-0.5 h-4 w-4 rounded border-line text-accent accent-accent focus:ring-accent"
            />
            <div className="flex-1 text-[13px]">
              <div className={step.done ? 'text-ink2 line-through' : 'text-ink'}>
                {step.id}. {step.text}
              </div>
              {step.done && step.signedBy && (
                <div className="text-[11px] text-ink3 mt-0.5">
                  Checked by {step.signedBy} at {step.time}
                </div>
              )}
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}
export default ProcedureChecklist
