"""Site model: single source of truth for every constant (BACKEND.md section 4).

Everything the plan, certificates and Assumptions page use comes from here.
"""
from __future__ import annotations

import json
from datetime import datetime
from decimal import ROUND_HALF_UP, Decimal
from functools import lru_cache
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
STATIC_DATA = ROOT / "backend" / "static_data"
FORECAST_PATH = STATIC_DATA / "forecast.json"

GPU_IDLE_TDP_W = 700               # full per-GPU power (the uncapped TDP)
GPUS_PER_NODE = 8
NODE_KW_AT_700 = 10.2              # 8 GPUs (5.6 kW) + CPU, NIC, fans, etc.
METER_FACTOR = 1.2                 # each MW of IT removed also removes ~0.2 MW of cooling

POOLS = {
    "inference": {"name": "Inference", "gpus": 16000, "protected": True},
    "training": {"name": "Training cluster", "gpus": 10000, "protected": False},
    "batch": {"name": "Batch (Slurm)", "gpus": 3000, "protected": False},
}
COOLING_MW = 7.4                   # ≈ 0.2 × IT

BATTERY = {"capacity_mwh": 20, "max_mw": 5, "soc": 0.9, "reserve": 0.4, "feeder": "2B", "wear_usd_per_mwh": 30}
PRECOOL = {"max_mw": 4.0, "energy_mwh": 8.0, "efficiency_penalty": 0.15, "ride_through_min": 10.4, "feeder": "1A"}
SUBSTATION = {"capacity_mw": 56, "transformer_temp_c": 71, "alarm_c": 95, "trip_c": 110}
PHASES = {"a_mw": 14.9, "b_mw": 14.6, "c_mw": 14.9}

PRICES = {
    "energy_usd_per_kwh": 0.085,
    "lmp_usd_per_mwh": 182,
    "demand_charge_usd_per_kw_month": 14,
    "dr_payment_usd_per_mwh": 150,
    "training_gpu_hour_usd": 2.50,  # value of a training GPU-hour
    "batch_gpu_hour_usd": 1.00,     # batch is deferrable, lower value
}
THROUGHPUT_EXPONENT = 0.6           # ASSUMPTION: throughput ∝ (cap/700)^0.6
CHECKPOINT = {"state_tb": 2.4, "burst_gbps": 60}   # ≈ 40 s
BATCH_MAX_MW = 4.6                  # 3.83 MW IT × 1.2 at the meter

# In-memory state (resets on restart; no database by design)
lockout: dict = {"active": False, "feeder": "2B", "by": None, "since": None}


def rnd(x: float, ndigits: int = 0) -> float:
    """Round half-up (Python's round() gives 3.825 -> 3.82; we want 3.83, like JS/Excel)."""
    q = Decimal(1).scaleb(-ndigits)
    clean = Decimal(str(round(x, 9)))     # strip float noise first: 375*10.2 = 3824.9999999999995
    return float(clean.quantize(q, rounding=ROUND_HALF_UP))


def pool_mw(pool_id: str) -> float:
    """pool MW = gpus / 8 × 10.2 kW / 1000 (unrounded)."""
    return POOLS[pool_id]["gpus"] / GPUS_PER_NODE * NODE_KW_AT_700 / 1000


def site_mw() -> float:
    return sum(pool_mw(p) for p in POOLS) + COOLING_MW


def normalize_feeder(f: str) -> str:
    """'Feeder 2B', 'feeder 2b', '2B' -> '2B'."""
    return f.strip().upper().removeprefix("FEEDER").strip()


def set_lockout(active: bool, by: str | None) -> dict:
    lockout["active"] = active
    lockout["by"] = by if active else None
    lockout["since"] = datetime.now().replace(microsecond=0).isoformat() if active else None
    return lockout_payload()


def lockout_payload() -> dict:
    return {"active": lockout["active"], "feeder": f"Feeder {lockout['feeder']}", "by": lockout["by"],
            "since": lockout["since"]}


def active_lockout_feeders() -> list[str]:
    return [lockout["feeder"]] if lockout["active"] else []


@lru_cache(maxsize=1)
def load_forecast() -> dict | None:
    """forecast.json written by ml/train.py, or None if training hasn't run."""
    if not FORECAST_PATH.exists():
        return None
    return json.loads(FORECAST_PATH.read_text(encoding="utf-8"))


def site_payload() -> dict:
    """GET /api/site (FRONTEND.md section 4, site.json)."""
    pools = []
    for pid, p in POOLS.items():
        row = {"id": pid, "name": p["name"], "gpus": p["gpus"], "mw": rnd(pool_mw(pid), 2), "protected": p["protected"]}
        if pid == "training":
            row["tdp_w"] = GPU_IDLE_TDP_W
        pools.append(row)
    total = site_mw()
    return {
        "pools": pools,
        "cooling_mw": COOLING_MW,
        "site_mw": rnd(total, 1),
        "battery": {k: BATTERY[k] for k in ("capacity_mwh", "max_mw", "soc", "reserve")},
        "substation": {"capacity_mw": SUBSTATION["capacity_mw"],
                       "headroom_mw": rnd(SUBSTATION["capacity_mw"] - rnd(total, 1), 1),
                       "transformer_temp_c": SUBSTATION["transformer_temp_c"],
                       "transformer_alarm_c": SUBSTATION["alarm_c"],
                       "transformer_trip_c": SUBSTATION["trip_c"]},
        "phases": dict(PHASES),
        "lmp_usd_mwh": PRICES["lmp_usd_per_mwh"],
        "lockout": lockout_payload(),
    }
