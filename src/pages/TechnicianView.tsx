import React from 'react'
import PageHeader from '../components/layout/PageHeader'
import TransformerGauge from '../components/technician/TransformerGauge'
import PhaseBars from '../components/charts/PhaseBars'
import LockoutToggle from '../components/technician/LockoutToggle'
import ProcedureChecklist from '../components/technician/ProcedureChecklist'
import { useEvent } from '../context/EventContext'

export const TechnicianView: React.FC = () => {
  const { site } = useEvent()

  const temp = site?.substation.transformer_temp_c ?? 71
  const alarm = site?.substation.transformer_alarm_c ?? 95
  const trip = site?.substation.transformer_trip_c ?? 110
  const phases = site?.phases ?? { a_mw: 14.9, b_mw: 14.6, c_mw: 14.9 }

  return (
    <div className="max-w-[560px] mx-auto space-y-6">
      <PageHeader
        title="Field technician"
        description="High-voltage switchgear safety, thermal thresholds, and feeder lockouts."
      />

      {/* 1. Transformer Gauge */}
      <TransformerGauge temp={temp} alarm={alarm} trip={trip} />

      {/* 2. Phase Bars */}
      <PhaseBars phases={phases} />

      {/* 3. Lockout Toggle */}
      <LockoutToggle />

      {/* 4. Procedure Checklist */}
      <ProcedureChecklist />
    </div>
  )
}
export default TechnicianView
