import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { AuditRow, Site, Plan, Certificate } from '../lib/types'
import { api } from '../lib/api'

export type Persona = 'utility' | 'facility' | 'technician'

export interface EventState {
  active: boolean
  step: 1 | 2 | 3 | 4 | 5 | 6 | 7
  plan: Plan | null
  deliveredMw: number
  elapsedMin: number
  isExtensionProposed: boolean
  extensionAccepted: boolean | null
  checkpointProgress: number
}

interface EventContextType {
  persona: Persona
  setPersona: (p: Persona) => void
  site: Site | null
  lockout: { active: boolean; feeder: string; by: string | null; timestamp: string | null }
  toggleLockout: (electricianName?: string) => void
  event: EventState
  startEvent: () => void
  approvePlan: () => void
  rejectPlan: () => void
  approveProposal: () => void
  rejectProposal: () => void
  resetEvent: () => void
  auditLog: AuditRow[]
  addAuditRow: (row: Omit<AuditRow, 'id' | 'time'>) => void
  isAuditLogOpen: boolean
  setIsAuditLogOpen: (open: boolean) => void
  activeNav: string
  setActiveNav: (nav: string) => void
  latestCertificate: Certificate | null
}

const EventContext = createContext<EventContextType | undefined>(undefined)

const initialLogs: AuditRow[] = [
  { id: '1', time: '13:45', who: 'EIA 930', action: 'Telemetry sync', detail: 'Substation baseline 44.4 MW verified via OpenADR', status: 'ok' },
  { id: '2', time: '13:48', who: 'LightGBM', action: 'Forecast registered', detail: 'Day-ahead P50 model anchored at 44.2 MW peak', status: 'ok' },
  { id: '3', time: '13:52', who: 'Telemetry', action: 'Thermal check', detail: 'Substation transformer core steady at 71°C (<95°C threshold)', status: 'ok' },
]

export const EventProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Persona with localStorage persistence
  const [persona, setPersonaState] = useState<Persona>(() => {
    try {
      const saved = localStorage.getItem('gridsync_persona')
      if (saved === 'utility' || saved === 'facility' || saved === 'technician') return saved
    } catch {}
    return 'utility'
  })

  const [activeNav, setActiveNav] = useState('overview')
  const [site, setSite] = useState<Site | null>(null)
  const [lockout, setLockout] = useState({
    active: false,
    feeder: 'Feeder 2B',
    by: null as string | null,
    timestamp: null as string | null,
  })
  const [auditLog, setAuditLog] = useState<AuditRow[]>(initialLogs)
  const [isAuditLogOpen, setIsAuditLogOpen] = useState(false)
  const [latestCertificate, setLatestCertificate] = useState<Certificate | null>(null)

  // Event State Machine
  const [event, setEvent] = useState<EventState>({
    active: false,
    step: 1,
    plan: null,
    deliveredMw: 0,
    elapsedMin: 0,
    isExtensionProposed: false,
    extensionAccepted: null,
    checkpointProgress: 0,
  })

  // Load initial site data
  useEffect(() => {
    api.site().then((data) => setSite(data))
    api.certificate({}).then((cert) => setLatestCertificate(cert))
  }, [])

  const setPersona = (p: Persona) => {
    setPersonaState(p)
    try {
      localStorage.setItem('gridsync_persona', p)
    } catch {}
  }

  const addAuditRow = (row: Omit<AuditRow, 'id' | 'time'>) => {
    const d = new Date()
    const time = `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
    const newRow: AuditRow = { ...row, id: String(Date.now()), time }
    setAuditLog((prev) => [newRow, ...prev])
  }

  const toggleLockout = (electricianName?: string) => {
    setLockout((prev) => {
      const nextActive = !prev.active
      const by = nextActive ? (electricianName || 'Priyah (Lead Tech)') : null
      const timestamp = nextActive ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null

      addAuditRow({
        who: by || 'Field technician',
        action: nextActive ? 'Lockout engaged' : 'Lockout released',
        detail: nextActive
          ? `Feeder 2B switchgear locked out. Automated switching on this feeder blocked.`
          : `Feeder 2B cleared for remote switching.`,
        status: nextActive ? 'watch' : 'ok',
      })

      return { active: nextActive, feeder: 'Feeder 2B', by, timestamp }
    })
  }

  // Event Machine Functions
  const startEvent = () => {
    api.dispatch({
      target_mw: 15,
      duration_h: 2,
      warning_min: 20,
      max_tdp_w: 450,
      allow_batch_drain: true,
      lockout_feeders: lockout.active ? ['2B'] : [],
    }).then((plan) => {
      setEvent({
        active: true,
        step: 1,
        plan,
        deliveredMw: 0,
        elapsedMin: 0,
        isExtensionProposed: false,
        extensionAccepted: null,
        checkpointProgress: 0,
      })
      addAuditRow({
        who: 'MLGW / OpenADR',
        action: 'Dispatch signal ingested',
        detail: '15.0 MW curtailment requested for 2.0 h. Plan computed.',
        status: 'watch',
      })
    })
  }

  const approvePlan = () => {
    setEvent((prev) => ({ ...prev, step: 3 }))
    addAuditRow({
      who: 'Brenda / Tariq',
      action: 'Plan approved',
      detail: 'Committed 15.0 MW reduction. Initiating 45s burst-buffer checkpoint.',
      status: 'ok',
    })
  }

  const rejectPlan = () => {
    setEvent((prev) => ({ ...prev, active: false }))
    addAuditRow({
      who: 'Brenda / Tariq',
      action: 'Plan rejected',
      detail: 'Dispatch rejected by operator. Workloads untouched.',
      status: 'watch',
    })
  }

  // Accelerated Simulation Progress Loop
  useEffect(() => {
    if (!event.active) return

    // Step 3: Checkpointing simulation (~4 seconds accelerated)
    if (event.step === 3) {
      const interval = setInterval(() => {
        setEvent((prev) => {
          if (prev.checkpointProgress >= 100) {
            clearInterval(interval)
            addAuditRow({
              who: 'Slurm scheduler',
              action: 'Micro-checkpoint safe',
              detail: '2.4 TB training state safely committed to NVRAM burst-buffer in 38s.',
              status: 'ok',
            })
            return { ...prev, step: 4, deliveredMw: 7.0 }
          }
          return { ...prev, checkpointProgress: prev.checkpointProgress + 25 }
        })
      }, 400)
      return () => clearInterval(interval)
    }

    // Step 4: GPU TDP Capped
    if (event.step === 4) {
      const timer = setTimeout(() => {
        setEvent((prev) => ({ ...prev, step: 5, deliveredMw: 12.0 }))
        addAuditRow({
          who: 'NVIDIA NVML',
          action: 'GPU power capped',
          detail: 'H100 cluster capped 700 → 450 W. 3.0 MW freed at meter.',
          status: 'ok',
        })
      }, 1500)
      return () => clearTimeout(timer)
    }

    // Step 5: Batch Drained
    if (event.step === 5) {
      const timer = setTimeout(() => {
        setEvent((prev) => ({ ...prev, step: 6, deliveredMw: 15.2, elapsedMin: 60 }))
        addAuditRow({
          who: 'Slurm scheduler',
          action: 'Batch jobs drained',
          detail: 'Non-critical batch jobs drained at checkpoint. Target 15 MW achieved.',
          status: 'ok',
        })
      }, 1500)
      return () => clearTimeout(timer)
    }

    // Step 6: Mid-event extension trigger at ~55% into event
    if (event.step === 6 && !event.isExtensionProposed && event.extensionAccepted === null) {
      const timer = setTimeout(() => {
        setEvent((prev) => ({ ...prev, isExtensionProposed: true }))
        addAuditRow({
          who: 'MLGW / OpenADR',
          action: 'Event extended 30 min',
          detail: 'Utility prolonged event to 2.5 h. Shortfall of 0.2 MW projected.',
          status: 'watch',
        })
      }, 2500)
      return () => clearTimeout(timer)
    }
  }, [event.active, event.step, event.isExtensionProposed, event.extensionAccepted])

  const approveProposal = () => {
    setEvent((prev) => ({
      ...prev,
      isExtensionProposed: false,
      extensionAccepted: true,
      deliveredMw: 16.6,
      step: 7,
    }))
    addAuditRow({
      who: 'Tariq (Facility AI)',
      action: 'Deep cap approved',
      detail: 'Approved training cap 450 → 300 W (+1.8 MW). Target maintained at 98% compliance.',
      status: 'ok',
    })
  }

  const rejectProposal = () => {
    setEvent((prev) => ({
      ...prev,
      isExtensionProposed: false,
      extensionAccepted: false,
      deliveredMw: 14.8,
      step: 7,
    }))
    addAuditRow({
      who: 'Tariq (Facility AI)',
      action: 'Deep cap rejected',
      detail: 'Absorbed 0.2 MW shortfall to avoid further training slowdown. Compliance: 93%.',
      status: 'watch',
    })
  }

  const resetEvent = () => {
    setEvent({
      active: false,
      step: 1,
      plan: null,
      deliveredMw: 0,
      elapsedMin: 0,
      isExtensionProposed: false,
      extensionAccepted: null,
      checkpointProgress: 0,
    })
    addAuditRow({
      who: 'Operator',
      action: 'Event reset',
      detail: 'Emergency load-shed simulation reset to baseline.',
      status: 'ok',
    })
  }

  return (
    <EventContext.Provider
      value={{
        persona,
        setPersona,
        site,
        lockout,
        toggleLockout,
        event,
        startEvent,
        approvePlan,
        rejectPlan,
        approveProposal,
        rejectProposal,
        resetEvent,
        auditLog,
        addAuditRow,
        isAuditLogOpen,
        setIsAuditLogOpen,
        activeNav,
        setActiveNav,
        latestCertificate,
      }}
    >
      {children}
    </EventContext.Provider>
  )
}

export const useEvent = () => {
  const ctx = useContext(EventContext)
  if (!ctx) throw new Error('useEvent must be used within EventProvider')
  return ctx
}
