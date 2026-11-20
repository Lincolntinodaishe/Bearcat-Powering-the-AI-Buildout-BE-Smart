import React from 'react'

interface MetricCardProps {
  label: string
  value: string | number
  context: string
}

export const MetricCard: React.FC<MetricCardProps> = ({ label, value, context }) => {
  return (
    <div className="bg-white border border-line rounded-card p-5 transition-colors">
      <div className="text-[13px] text-ink2 font-normal">{label}</div>
      <div className="text-[28px] sm:text-[32px] font-semibold text-ink tracking-tight mt-1 leading-none">
        {value}
      </div>
      <div className="text-[13px] text-ink2 mt-2 leading-tight">{context}</div>
    </div>
  )
}
export default MetricCard
