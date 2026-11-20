import React from 'react'
import PageHeader from '../components/layout/PageHeader'

export const AssumptionsPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-[850px]">
      <PageHeader
        title="System assumptions and constants"
        description="Comprehensive technical and financial parameters governing the GridSync digital twin."
      />

      <div className="bg-white border border-line rounded-card divide-y divide-line text-[14px]">
        {/* Computing infrastructure */}
        <div className="p-5 space-y-2">
          <h3 className="font-semibold text-ink text-[16px]">AI compute infrastructure</h3>
          <ul className="space-y-1 text-ink2 text-[13px] list-disc list-inside">
            <li><strong>GPU fleet:</strong> 29,000 total GPUs (16,000 inference, 10,000 training, 3,000 batch Slurm).</li>
            <li><strong>Inference cluster:</strong> 20.4 MW protected baseline — never capped, shed, or throttled.</li>
            <li><strong>Training node power:</strong> 10.2 kW per node at 700 W base TDP (8x H100 SXM5).</li>
            <li><strong>Meter scaling factor:</strong> 1.20× (each 1.0 MW of IT load reduction drops cooling draw by 0.2 MW).</li>
            <li><strong>Throughput scaling:</strong> Throughput ∝ Power^0.6 (assumption, used to estimate training slowdown).</li>
          </ul>
        </div>

        {/* Storage and cooling */}
        <div className="p-5 space-y-2">
          <h3 className="font-semibold text-ink text-[16px]">Thermal loop and energy storage</h3>
          <ul className="space-y-1 text-ink2 text-[13px] list-disc list-inside">
            <li><strong>BESS storage:</strong> 20 MWh lithium storage, 5 MW max discharge inverter capacity.</li>
            <li><strong>Emergency reserve:</strong> 40% (8 MWh) locked for life-safety and emergency standby.</li>
            <li><strong>Pre-cool thermal buffer:</strong> 42°F chilled water loop provides ≥10 min cooling ride-through.</li>
            <li><strong>Burst-buffer checkpoint:</strong> 2.4 TB distributed training weights dumped at 60 GB/s in ~40 seconds.</li>
          </ul>
        </div>

        {/* Pricing and economics */}
        <div className="p-5 space-y-2">
          <h3 className="font-semibold text-ink text-[16px]">Tariff and economics model</h3>
          <ul className="space-y-1 text-ink2 text-[13px] list-disc list-inside">
            <li><strong>Retail electricity:</strong> $0.085 / kWh base commercial tariff.</li>
            <li><strong>Peak demand charge:</strong> $14.00 / kW-month avoided peak charge ($210,000/month for 15 MW).</li>
            <li><strong>Demand response payment:</strong> $150 / MWh utility capacity credit.</li>
            <li><strong>GPU delay cost:</strong> $2.50 per GPU-hour opportunity cost for foundation training.</li>
            <li><strong>Batch delay cost:</strong> $1.00 per batch GPU-hour.</li>
            <li><strong>Battery wear cost:</strong> $30.00 / MWh cycle degradation cost.</li>
          </ul>
        </div>

        {/* Model specifications */}
        <div className="p-5 space-y-2">
          <h3 className="font-semibold text-ink text-[16px]">Forecasting methodology</h3>
          <ul className="space-y-1 text-ink2 text-[13px] list-disc list-inside">
            <li><strong>Model:</strong> LightGBM quantile regression (P05, P50, P95).</li>
            <li><strong>Cadence:</strong> 15-minute interval forecasting across 24-hour rolling horizon.</li>
            <li><strong>Accuracy (7-day holdout):</strong> MAE 0.31 MW, MAPE 0.76% (vs 0.43 MW same-time-last-week benchmark); P05–P95 band covers 89% of actuals after conformal calibration.</li>
            <li><strong>Data:</strong> synthetic 15-min load (120 days, seed 42), normalized to campus scale (P05 → 38 MW, P95 → 44 MW); see data/README_synthetic.md.</li>
            <li><strong>Verification:</strong> Day-ahead P50 counterfactual baseline serves as the cryptographic ground truth.</li>
          </ul>
        </div>
      </div>

      <div className="p-4 bg-panel border border-line rounded-[10px] text-[13px] text-ink2">
        <strong>Data integrity disclosure:</strong> All telemetry and verification records in this demonstration are synthetic or sample data modeled on authentic utility tariffs and datacenter load profiles.
      </div>
    </div>
  )
}
export default AssumptionsPage
