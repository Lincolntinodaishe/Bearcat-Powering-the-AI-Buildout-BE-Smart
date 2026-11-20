import React, { useState } from 'react'
import { Play, CheckCircle2 } from 'lucide-react'

export const CheckpointPanel: React.FC = () => {
  const [progress, setProgress] = useState(0)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)

  const handleTest = () => {
    setRunning(true)
    setProgress(0)
    setDone(false)

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setRunning(false)
          setDone(true)
          return 100
        }
        return prev + 25
      })
    }, 400) // ~1.6s accelerated
  }

  return (
    <div className="bg-white border border-line rounded-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[17px] font-semibold text-ink">Burst-buffer micro-checkpoint</h3>
        <button
          onClick={handleTest}
          disabled={running}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-panel hover:bg-line/50 border border-line text-[12px] font-medium text-ink transition"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{running ? 'Dumping state...' : 'Test checkpoint'}</span>
        </button>
      </div>

      <p className="text-[13px] text-ink2 leading-relaxed">
        Training state 2.4 TB → node-local burst buffers at 60 GB/s ≈ 40 s.
      </p>

      {/* Progress Bar */}
      <div className="space-y-1.5 pt-1">
        <div className="w-full bg-panel h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-accent h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-ink3">
          <span>simulated, shown 10× faster</span>
          <span>{progress}%</span>
        </div>
      </div>

      {done && (
        <div className="p-2.5 bg-panel rounded-[8px] border border-line text-[12px] text-ok flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-ok" />
          <span>Checkpoint safe — no training progress lost.</span>
        </div>
      )}
    </div>
  )
}
export default CheckpointPanel
