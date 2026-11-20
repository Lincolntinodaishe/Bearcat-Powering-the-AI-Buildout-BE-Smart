import React from 'react'
import { Zap } from 'lucide-react'
import { useEvent, type Persona } from '../../context/EventContext'
import SegmentedControl from '../ui/SegmentedControl'

interface TopBarProps {
  title: string
}

export const TopBar: React.FC<TopBarProps> = ({ title }) => {
  const { persona, setPersona, startEvent, setActiveNav } = useEvent()

  const personaOptions: { value: Persona; label: string }[] = [
    { value: 'utility', label: 'Utility' },
    { value: 'facility', label: 'Facility & AI' },
    { value: 'technician', label: 'Field technician' },
  ]

  const handleSimulateClick = () => {
    startEvent()
    setActiveNav('event')
  }

  return (
    <header className="h-16 bg-white border-b border-line px-8 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Page Title */}
      <div className="text-[17px] font-semibold text-ink tracking-tight">{title}</div>

      {/* Center: Persona Segmented Control */}
      <div className="hidden md:block">
        <SegmentedControl options={personaOptions} value={persona} onChange={setPersona} />
      </div>

      {/* Right: Demo Pill + Action Button */}
      <div className="flex items-center gap-3">
        <span className="hidden sm:inline-block px-2.5 py-1 rounded-[6px] bg-panel text-[12px] text-ink3 border border-line">
          Synthetic demo data
        </span>

        <button
          onClick={handleSimulateClick}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-[8px] border border-watch text-watch hover:bg-watch/10 text-[13px] font-medium transition"
        >
          <Zap className="w-4 h-4 fill-watch" />
          <span>Simulate 15 MW dispatch</span>
        </button>
      </div>
    </header>
  )
}
export default TopBar
