import React, { useState } from 'react'
import { useEvent } from '../../context/EventContext'

export const LockoutToggle: React.FC = () => {
  const { lockout, toggleLockout } = useEvent()
  const [electricianName, setElectricianName] = useState('Priyah')
  const [isPrompting, setIsPrompting] = useState(false)

  const handleToggle = () => {
    if (lockout.active) {
      toggleLockout()
    } else {
      setIsPrompting(true)
    }
  }

  const handleConfirmLockout = (e: React.FormEvent) => {
    e.preventDefault()
    if (!electricianName.trim()) return
    toggleLockout(electricianName.trim())
    setIsPrompting(false)
  }

  return (
    <div className="bg-white border border-line rounded-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[17px] font-semibold text-ink">Feeder lockout switch</h3>
        <span
          className={`text-[12px] font-medium px-2 py-0.5 rounded-[6px] ${
            lockout.active ? 'bg-watch/10 text-watch' : 'bg-panel text-ink2'
          }`}
        >
          {lockout.active ? 'Locked out' : 'Normal'}
        </span>
      </div>

      <p className="text-[13px] text-ink2 leading-relaxed">
        Crew on switchgear (Feeder 2B). While active, any dispatch lever using Feeder 2B is marked{' '}
        <strong>Blocked — crew lockout</strong> and excluded from automated execution.
      </p>

      {isPrompting ? (
        <form onSubmit={handleConfirmLockout} className="space-y-3 pt-2">
          <div>
            <label className="text-[12px] text-ink2 block mb-1">Technician name (required)</label>
            <input
              type="text"
              required
              value={electricianName}
              onChange={(e) => setElectricianName(e.target.value)}
              className="w-full px-3 py-1.5 text-[13px] border border-line rounded-[8px] focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="e.g. Priyah"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-accent text-white rounded-[8px] text-[13px] font-medium hover:bg-accent/90"
            >
              Confirm lockout
            </button>
            <button
              type="button"
              onClick={() => setIsPrompting(false)}
              className="px-3 py-1.5 border border-line rounded-[8px] text-[13px] text-ink2 hover:bg-panel"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="pt-2">
          <button
            onClick={handleToggle}
            className={`w-full py-2.5 rounded-[8px] text-[13px] font-medium transition ${
              lockout.active
                ? 'bg-panel hover:bg-line border border-line text-ink'
                : 'bg-white border border-watch text-watch hover:bg-watch/10'
            }`}
          >
            {lockout.active ? 'Release lockout' : 'Engage lockout (Feeder 2B)'}
          </button>
        </div>
      )}

      {lockout.active && lockout.by && (
        <div className="text-[12px] text-ink2 pt-1 border-t border-line">
          Engaged by <span className="font-medium text-ink">{lockout.by}</span> at {lockout.timestamp}
        </div>
      )}
    </div>
  )
}
export default LockoutToggle
