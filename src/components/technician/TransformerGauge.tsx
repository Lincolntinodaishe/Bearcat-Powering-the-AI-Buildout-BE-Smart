import React from 'react'

interface TransformerGaugeProps {
  temp: number
  alarm: number
  trip: number
}

export const TransformerGauge: React.FC<TransformerGaugeProps> = ({ temp, alarm, trip }) => {
  // SVG Semicircle gauge 0-120 C
  const radius = 70
  const cx = 90
  const cy = 85
  const max = 120
  const pct = Math.min(1, Math.max(0, temp / max))

  // Semicircle arc length = PI * radius
  const arcLength = Math.PI * radius
  const strokeDashoffset = arcLength * (1 - pct)

  return (
    <div className="bg-white border border-line rounded-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[17px] font-semibold text-ink">Transformer temperature</h3>
        <span className="text-[12px] text-ink2 bg-panel px-2 py-0.5 rounded-[6px] border border-line">
          0–120°C
        </span>
      </div>

      <div className="flex items-center justify-center pt-2">
        <div className="relative flex flex-col items-center">
          <svg width="180" height="95" className="overflow-visible">
            {/* Background Semicircle Track */}
            <path
              d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
              fill="none"
              stroke="#F7F7F8"
              strokeWidth="14"
              strokeLinecap="round"
            />
            {/* Foreground Fill */}
            <path
              d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
              fill="none"
              stroke={temp >= trip ? '#FF3B30' : temp >= alarm ? '#FF9F0A' : '#0A84FF'}
              strokeWidth="14"
              strokeDasharray={arcLength}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>

          <div className="absolute bottom-1 text-center">
            <div className="text-[28px] font-semibold text-ink leading-none">{temp}°C</div>
            <div className="text-[12px] text-ink2 mt-1">core reading</div>
          </div>
        </div>
      </div>

      <div className="flex justify-between text-[11px] text-ink2 pt-1 border-t border-line">
        <span>0°C</span>
        <span className="text-watch font-medium">Alarm: {alarm}°C</span>
        <span className="text-danger font-medium">Trip: {trip}°C</span>
      </div>

      <p className="text-[13px] text-ink2">Load 44.4 MW · cooling normal</p>
    </div>
  )
}
export default TransformerGauge
