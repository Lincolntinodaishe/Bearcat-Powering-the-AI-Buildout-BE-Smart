"""Dispatch plan: deterministic lever math with safety checks and costs (BACKEND.md section 5).

Levers are applied least-disruptive first (precool -> battery -> tdp -> batch).
That order protects SLAs; it is not cheapest-first. Inference is never a lever.
All lever MW are at the meter.
"""
from __future__ import annotations

from pydantic import BaseModel, Field

from backend import site_model as sm
from backend.site_model import rnd

PROPOSAL_CAP_W = 300
PROPOSAL_WINDOW_H = 0.5     # the deeper cap only covers the final 30 min (the extension)
FALLBACK_TROUGH_P95, FALLBACK_PEAK_P95 = 39.5, 44.5   # used only if forecast.json is missing


class DispatchRequest(BaseModel):
    target_mw: float = Field(15, gt=0, le=60)
    duration_h: float = Field(2, gt=0, le=12)
    warning_min: float = Field(20, ge=0)
    max_tdp_w: int = Field(450, ge=200, le=700)
    allow_batch_drain: bool = True
    lockout_feeders: list[str] = Field(default_factory=list)


def slowdown(cap_w: float) -> float:
    """Training slowdown at a power cap: 1 − (cap/700)^0.6 (assumption: throughput ∝ power^0.6)."""
    return 1 - (cap_w / sm.GPU_IDLE_TDP_W) ** sm.THROUGHPUT_EXPONENT


def tdp_meter_mw(cap_w: float) -> float:
    """MW saved at the meter by capping all training GPUs to cap_w."""
    it_mw = sm.POOLS["training"]["gpus"] * (sm.GPU_IDLE_TDP_W - cap_w) / 1e6
    return it_mw * sm.METER_FACTOR


def precool_check(forecast: dict | None) -> tuple[bool, str]:
    """Pre-cool charges the chilled-water loop at the forecast trough. It is safe if
    trough P95 + pre-cool draw stays below the forecast peak P95 (no new peak is created)."""
    if forecast and forecast.get("points"):
        p95 = [p["p95"] for p in forecast["points"]]
        trough, peak = min(p95), max(p95)
    else:
        trough, peak = FALLBACK_TROUGH_P95, FALLBACK_PEAK_P95
    charge = trough + sm.PRECOOL["max_mw"]
    return charge < peak, f"charging at trough {trough:.1f} + {sm.PRECOOL['max_mw']:.1f} MW < peak P95 {peak:.1f} MW"


def _lever(id_, name, mw, cost, risk, note, blocked=False):
    return {"id": id_, "name": name, "mw": rnd(mw, 1), "cost_usd": int(rnd(cost)), "risk": risk,
            "note": note, "blocked": blocked}


def build_plan(req: DispatchRequest, forecast: dict | None = None) -> dict:
    h = req.duration_h
    locked = {sm.normalize_feeder(f) for f in req.lockout_feeders}
    prices = sm.PRICES
    levers: list[dict] = []
    lockout_blocks: list[str] = []

    def remaining() -> float:
        return rnd(req.target_mw - sum(l["mw"] for l in levers), 1)

    # 1. Pre-cool: shift chiller work out of the event window
    pc = sm.PRECOOL
    name = "Pre-cool loop to 42°F, coast chillers"
    energy = pc["energy_mwh"] * (min(req.warning_min, 15) / 15)  # < 15 min warning: partial pre-cool
    below_peak, _ = precool_check(forecast)
    if pc["feeder"] in locked:
        levers.append(_lever("precool", name, 0, 0, "low", f"Blocked — crew on Feeder {pc['feeder']}", True))
        lockout_blocks.append("precool")
    elif not below_peak:
        levers.append(_lever("precool", name, 0, 0, "low", "Not used — pre-cooling would set a new peak", True))
    else:
        mw = min(pc["max_mw"], energy / h)
        cost = mw * h * 1000 * prices["energy_usd_per_kwh"] * pc["efficiency_penalty"]
        note = "Keeps ≥10 min cooling ride-through; pre-cool stays below forecast peak"
        if req.warning_min < 15:
            note += f"; only {req.warning_min:g} min warning, loop partly pre-cooled"
        levers.append(_lever("precool", name, mw, cost, "low", note))

    # 2. Battery: discharge down to the 40% reserve
    b = sm.BATTERY
    name = "Discharge battery"
    if b["feeder"] in locked:
        levers.append(_lever("battery", name, 0, 0, "low", f"Blocked — crew on Feeder {b['feeder']}", True))
        lockout_blocks.append("battery")
    elif remaining() <= 0:
        levers.append(_lever("battery", name, 0, 0, "low", "Not needed — target already met"))
    else:
        usable = (b["soc"] - b["reserve"]) * b["capacity_mwh"]
        mw = min(b["max_mw"], usable / h)
        levers.append(_lever("battery", name, mw, mw * h * b["wear_usd_per_mwh"], "low",
                             f"{b['reserve']:.0%} kept as backup reserve"))

    # 3. Training GPU power cap: slower training, no jobs stopped
    cap = req.max_tdp_w
    name = f"Cap training GPUs {sm.GPU_IDLE_TDP_W} → {cap} W"
    if cap >= sm.GPU_IDLE_TDP_W:
        levers.append(_lever("tdp", name, 0, 0, "medium", "No cap requested"))
    elif remaining() <= 0:
        levers.append(_lever("tdp", name, 0, 0, "medium", "Not needed — target already met"))
    else:
        s = slowdown(cap)
        cost = s * sm.POOLS["training"]["gpus"] * h * prices["training_gpu_hour_usd"]
        levers.append(_lever("tdp", name, tdp_meter_mw(cap), cost, "medium",
                             f"Training slows ~{rnd(s * 100):.0f}%, no jobs stopped"))

    # 4. Batch drain: fills the remaining gap only
    name = "Drain batch jobs at next checkpoint"
    gap = remaining()
    if not req.allow_batch_drain:
        levers.append(_lever("batch", name, 0, 0, "medium", "Batch drain not allowed for this event"))
    elif gap <= 0:
        levers.append(_lever("batch", name, 0, 0, "medium", "Not needed — target already met"))
    else:
        mw = min(sm.BATCH_MAX_MW, gap)
        cost = (mw / sm.BATCH_MAX_MW) * sm.POOLS["batch"]["gpus"] * h * prices["batch_gpu_hour_usd"]
        levers.append(_lever("batch", name, mw, cost, "medium",
                             "Non-critical Slurm jobs drained at checkpoint, resume after event"))

    total = rnd(sum(l["mw"] for l in levers), 1)
    shortfall = rnd(max(0.0, req.target_mw - total), 1)

    proposal = None
    if shortfall > 0 and cap > PROPOSAL_CAP_W:
        extra = (slowdown(PROPOSAL_CAP_W) - slowdown(cap)) * sm.POOLS["training"]["gpus"] \
            * PROPOSAL_WINDOW_H * prices["training_gpu_hour_usd"]
        proposal = {"id": "tdp300", "name": f"Deepen training cap {cap} → {PROPOSAL_CAP_W} W",
                    "adds_mw": rnd(tdp_meter_mw(PROPOSAL_CAP_W) - tdp_meter_mw(cap), 1),
                    "cost_usd": int(rnd(extra)),
                    "note": f"Training slows ~{rnd(slowdown(PROPOSAL_CAP_W) * 100):.0f}% for the final 30 min; "
                            "no jobs stopped"}

    gpus_inf = sm.POOLS["inference"]["gpus"]
    return {
        "target_mw": req.target_mw,
        "duration_h": h,
        "levers": levers,
        "protected": [{"name": f"Inference ({gpus_inf:,} GPUs)", "mw": rnd(sm.pool_mw("inference"), 1)}],
        "total_mw": total,
        "shortfall_mw": shortfall,
        "ride_through_min": pc["ride_through_min"],
        "cost_usd": sum(l["cost_usd"] for l in levers),
        "value_usd": {
            "demand_charge_avoided_per_month": int(rnd(req.target_mw * 1000 * prices["demand_charge_usd_per_kw_month"])),
            "dr_payment": int(rnd(total * h * prices["dr_payment_usd_per_mwh"])),
            "energy_avoided": int(rnd(total * h * prices["lmp_usd_per_mwh"])),
        },
        "safety": {"precool_below_peak": below_peak, "lockout_blocks": lockout_blocks},
        "proposal": proposal,
        "inference_curtailed_mw": 0,
    }
