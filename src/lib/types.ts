export interface ForecastPoint {
  t: string
  p05: number
  p50: number
  p95: number
  temp_f: number
}

export interface Forecast {
  generated_at: string
  site: string
  model: {
    name: string
    mae_mw: number
    mape: number
    coverage: number
    benchmark_mae_mw: number
    benchmark: string
  }
  peak: {
    t: string
    p50: number
  }
  points: ForecastPoint[]
}

export interface Pool {
  id: string
  name: string
  gpus: number
  mw: number
  protected: boolean
  tdp_w?: number
}

export interface Site {
  pools: Pool[]
  cooling_mw: number
  site_mw: number
  battery: {
    capacity_mwh: number
    max_mw: number
    soc: number
    reserve: number
  }
  substation: {
    capacity_mw: number
    headroom_mw: number
    transformer_temp_c: number
    transformer_alarm_c: number
    transformer_trip_c: number
  }
  phases: {
    a_mw: number
    b_mw: number
    c_mw: number
  }
  lmp_usd_mwh: number
  lockout: {
    active: boolean
    feeder: string
    by: string | null
    timestamp?: string | null
  }
}

export interface Lever {
  id: string
  name: string
  mw: number
  cost_usd: number
  risk: 'low' | 'medium' | 'high'
  note: string
  blocked?: boolean
}

export interface DispatchRequest {
  target_mw: number
  duration_h: number
  warning_min: number
  max_tdp_w: number
  allow_batch_drain: boolean
  lockout_feeders?: string[]
}

export interface Plan {
  target_mw: number
  duration_h: number
  levers: Lever[]
  protected: { name: string; mw: number }[]
  total_mw: number
  shortfall_mw: number
  ride_through_min: number
  cost_usd: number
  value_usd: {
    demand_charge_avoided_per_month: number
    dr_payment: number
    energy_avoided?: number
  }
  safety: {
    precool_below_peak: boolean
    lockout_blocks: string[]
  }
  proposal?: {
    id: string
    name: string
    adds_mw: number
    cost_usd: number
    note: string
  } | null
  inference_curtailed_mw?: number
}

export interface CertificateInterval {
  t: string
  baseline_mw: number
  metered_mw: number
  reduction_mw: number
}

// POST /api/certificate body (BACKEND.md section 6)
export interface CertificateRequest {
  dispatch_id: string
  source: string
  start: string
  end: string
  target_mw: number
  delivered: { t: string; reduction_mw: number }[]
}

export interface Certificate {
  id: string
  event: {
    dispatch_id: string
    source: string
    start: string
    end: string
    target_mw: number
  }
  intervals: CertificateInterval[]
  summary: {
    avg_reduction_mw: number
    min_reduction_mw: number
    energy_mwh: number
    compliance: number
    inference_curtailed_mw: number
    sla_breaches: number
  }
  baseline_method: string
  hash_sha256: string
  signature_ed25519: string
  public_key: string
  signed_at: string
}

export interface AuditRow {
  id: string
  time: string
  who: string
  action: string
  detail: string
  status?: 'ok' | 'watch' | 'danger'
}

