import React from 'react'
import { Check } from 'lucide-react'

interface EventStepperProps {
  currentStep: number
}

const steps = [
  'Signal ingested',
  'Plan and approve',
  'Checkpoint staged',
  'GPU power capped',
  'Batch drained',
  'Target achieved',
  'Certificate',
]

export const EventStepper: React.FC<EventStepperProps> = ({ currentStep }) => {
  return (
    <div className="w-full bg-panel border border-line rounded-card p-4 overflow-x-auto">
      <div className="flex items-center justify-between min-w-[650px] gap-2">
        {steps.map((label, idx) => {
          const stepNum = idx + 1
          const isComplete = currentStep > stepNum
          const isCurrent = currentStep === stepNum

          return (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-medium transition-all ${
                  isComplete
                    ? 'bg-accent text-white'
                    : isCurrent
                    ? 'border-2 border-accent text-accent font-semibold bg-white ring-4 ring-accent/15'
                    : 'bg-white border border-line text-ink3'
                }`}
              >
                {isComplete ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : stepNum}
              </div>
              <span
                className={`text-[13px] whitespace-nowrap ${
                  isCurrent ? 'font-semibold text-ink' : isComplete ? 'text-ink' : 'text-ink3'
                }`}
              >
                {label}
              </span>
              {stepNum < steps.length && <span className="text-line text-[14px] mx-1">→</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
export default EventStepper
