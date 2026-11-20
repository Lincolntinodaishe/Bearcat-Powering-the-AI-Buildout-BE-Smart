import React from 'react'
import PageHeader from '../components/layout/PageHeader'
import EventStepper from '../components/event/EventStepper'
import EventChart from '../components/charts/EventChart'
import LeverList from '../components/event/LeverList'
import ApprovalDialog from '../components/event/ApprovalDialog'
import ExtensionBanner from '../components/event/ExtensionBanner'
import CertificateCard from '../components/certificate/CertificateCard'
import { useEvent } from '../context/EventContext'
import { formatMw } from '../lib/format'

export const EventView: React.FC = () => {
  const {
    event,
    startEvent,
    approvePlan,
    rejectPlan,
    approveProposal,
    rejectProposal,
    resetEvent,
    latestCertificate,
  } = useEvent()

  // Generate chart data matching the current event state
  const chartPoints = []
  for (let min = 0; min <= 120; min += 15) {
    let delivered = 0
    if (event.step === 3) delivered = 4.0
    else if (event.step === 4) delivered = 9.0
    else if (event.step === 5) delivered = 12.0
    else if (event.step >= 6) {
      if (event.extensionAccepted === true) delivered = min > 90 ? 16.6 : 15.3
      else if (event.extensionAccepted === false) delivered = min > 90 ? 14.8 : 15.3
      else delivered = 15.2
    }

    chartPoints.push({
      minute: `${min}m`,
      requested: 15.0,
      plan: 15.0,
      delivered,
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Emergency load-shed event"
        description="OpenADR 2.0b automated 15 MW curtailment sequence with human-in-the-loop verification."
        action={
          <div className="flex items-center gap-2">
            {!event.active ? (
              <button
                onClick={startEvent}
                className="px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded-[8px] text-[13px] font-medium transition"
              >
                Start 15 MW simulation
              </button>
            ) : (
              <button
                onClick={resetEvent}
                className="px-3 py-1.5 border border-line hover:bg-panel text-ink rounded-[8px] text-[13px] font-medium transition"
              >
                Reset event
              </button>
            )}
          </div>
        }
      />

      {/* Stepper Header */}
      <EventStepper currentStep={event.step} />

      {/* Mid-Event Extension Banner if proposed */}
      {event.isExtensionProposed && (
        <ExtensionBanner
          onApprove={approveProposal}
          onReject={rejectProposal}
        />
      )}

      {/* Main Grid: Chart + Levers */}
      {event.plan ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Event Chart */}
          <div className="lg:col-span-7 space-y-4">
            <EventChart data={chartPoints} />

            {/* Micro-checkpoint progress bar when step 3 */}
            {event.step === 3 && (
              <div className="bg-white border border-line rounded-card p-5 space-y-2">
                <div className="flex justify-between text-[13px]">
                  <span className="font-medium text-ink">Staging burst-buffer micro-checkpoint</span>
                  <span className="font-semibold text-accent">{event.checkpointProgress}%</span>
                </div>
                <div className="w-full bg-panel h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-accent h-2 rounded-full transition-all duration-300"
                    style={{ width: `${event.checkpointProgress}%` }}
                  />
                </div>
                <div className="text-[12px] text-ink2">
                  Dumping 2.4 TB training state from VRAM to NVRAM burst-buffer at 60 GB/s.
                </div>
              </div>
            )}

            {/* Bottom Status Context Card */}
            <div className="bg-panel border border-line rounded-card p-4 flex items-center justify-between text-[13px]">
              <div>
                <span className="text-ink2">Current delivered: </span>
                <span className="font-semibold text-ink">{formatMw(event.deliveredMw)}</span>
              </div>
              <div className="text-ink font-medium">
                Inference protected · 20.4 MW untouched
              </div>
            </div>
          </div>

          {/* Right Column: Levers or Approval */}
          <div className="lg:col-span-5 space-y-4">
            {event.step === 2 && (
              <ApprovalDialog
                plan={event.plan}
                onApprove={approvePlan}
                onReject={rejectPlan}
              />
            )}

            <LeverList plan={event.plan} currentStep={event.step} />
          </div>
        </div>
      ) : (
        <div className="bg-panel border border-line rounded-card p-12 text-center space-y-3">
          <p className="text-[15px] text-ink font-medium">No event currently active</p>
          <p className="text-[13px] text-ink2 max-w-md mx-auto">
            Click &quot;Start 15 MW simulation&quot; above to simulate an incoming OpenADR 2.0b dispatch signal from the regional utility.
          </p>
          <button
            onClick={startEvent}
            className="mt-2 px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded-[8px] text-[13px] font-medium transition"
          >
            Start simulation
          </button>
        </div>
      )}

      {/* Final Certificate Card if completed */}
      {event.step === 7 && latestCertificate && (
        <div className="pt-4 border-t border-line space-y-3">
          <h3 className="text-[17px] font-semibold text-ink">Generated M&V certificate</h3>
          <CertificateCard certificate={latestCertificate} />
        </div>
      )}
    </div>
  )
}
export default EventView
