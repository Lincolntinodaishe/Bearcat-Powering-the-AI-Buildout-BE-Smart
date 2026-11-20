"""Build the 15-minute site-load dataset (BACKEND.md section 3.2).

SWAP POINT: `load_raw_load()` is the only function to change when the real
facility load file arrives. It must return a pandas Series of facility load
indexed by timestamp, at any frequency, in kW or MW. Everything downstream
(dedupe, unit conversion, 15-min resample, gap handling, campus scaling,
weather join) does not care where the data came from.

Weather has its own swap point, `load_weather()`, for a NOAA file.
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"

SEED = 42
FREQ = "15min"
STEPS_PER_DAY = 96
MAX_GAP = pd.Timedelta("1h")   # gaps up to this are interpolated, longer are dropped

# Campus scale targets (site model: night ~38 MW, afternoon peak ~44 MW)
CAMPUS_P05_MW = 38.0
CAMPUS_P95_MW = 44.0

# Synthetic span: 120 days of 15-min data ending Thu 2026-10-29 23:45, so the
# day-ahead forecast lands on a weekday (Friday), like the demo day.
SYN_DAYS = 120
SYN_END = pd.Timestamp("2026-10-29 23:45")


# --------------------------------------------------------------------------- #
# Swap points
# --------------------------------------------------------------------------- #
def load_raw_load() -> pd.Series:
    """SWAP POINT: return raw facility load indexed by timestamp (kW or MW, any step).

    Real-data example:
        df = pd.read_csv(DATA / "facility_load.csv", parse_dates=["timestamp"])
        return df.set_index("timestamp")["load_kw"]
    """
    return synthetic_load()


def load_weather(index: pd.DatetimeIndex) -> pd.DataFrame:
    """SWAP POINT: return weather (column `temp_f`) aligned to `index`.

    Real-data example (nearest-timestamp join):
        w = pd.read_csv(DATA / "noaa_memphis.csv", parse_dates=["timestamp"]).sort_values("timestamp")
        left = pd.DataFrame({"timestamp": index})
        out = pd.merge_asof(left, w[["timestamp", "temp_f"]], on="timestamp", direction="nearest")
        return out.set_index("timestamp")
    """
    return synthetic_weather(index)


# --------------------------------------------------------------------------- #
# Synthetic generators (documented in data/README_synthetic.md)
# --------------------------------------------------------------------------- #
def seasonal_mean_f(index: pd.DatetimeIndex) -> np.ndarray:
    """Memphis-like seasonal mean: ~41 F mid-January, ~83 F mid-July."""
    doy = index.dayofyear.to_numpy()
    return 62.0 + 21.0 * np.sin(2 * np.pi * (doy - 105) / 365.0)


def synthetic_weather(index: pd.DatetimeIndex) -> pd.DataFrame:
    """temp_f = seasonal_mean + 9*sin(2*pi*(hour-9)/24) + N(0, 1.5), seed stream [42, 1].

    Noise is drawn in index order, so any index with the same start gets the
    same values for the timestamps they share (training and forecast weather agree).
    """
    rng = np.random.default_rng([SEED, 1])
    hour = (index.hour + index.minute / 60.0).to_numpy()
    temp = seasonal_mean_f(index) + 9.0 * np.sin(2 * np.pi * (hour - 9) / 24) + rng.normal(0, 1.5, len(index))
    return pd.DataFrame({"temp_f": temp}, index=index)


def synthetic_load() -> pd.Series:
    """120 days of 15-min campus load (raw MW, before campus scaling), seed stream [42, 2]."""
    idx = pd.date_range(end=SYN_END, periods=SYN_DAYS * STEPS_PER_DAY, freq=FREQ)
    rng = np.random.default_rng([SEED, 2])
    n = len(idx)
    hour = (idx.hour + idx.minute / 60.0).to_numpy()
    temp = synthetic_weather(idx)["temp_f"].to_numpy()

    daily = 2.6 * np.sin(2 * np.pi * (hour - 10.25) / 24)          # peak 16:15, trough 04:15
    weekday = np.where(idx.dayofweek.to_numpy() >= 5, -0.7, 0.0)   # lighter weekend batch load
    cooling = 0.05 * np.clip(temp - 60.0, 0, None)                 # chillers work harder when hot
    ramp = np.linspace(0.0, 1.2, n)                                # GPU build-out over the period
    drift = np.zeros(n)                                            # slow AR(1) wander (job mix)
    shocks = rng.normal(0, 0.06, n)
    for i in range(1, n):
        drift[i] = 0.97 * drift[i - 1] + shocks[i]
    noise = rng.normal(0, 0.12, n)

    raw = 40.0 + daily + weekday + cooling + ramp + drift + noise
    return pd.Series(raw, index=idx, name="load_raw")


# --------------------------------------------------------------------------- #
# Generic pipeline
# --------------------------------------------------------------------------- #
def clean_to_15min(raw: pd.Series) -> pd.Series:
    """Dedupe, sort, kW->MW, put on a 15-min grid, interpolate gaps <= 1 h, drop longer gaps."""
    s = pd.to_numeric(pd.Series(raw), errors="coerce")
    s.index = pd.to_datetime(s.index)
    s = s[~s.index.duplicated(keep="first")].sort_index().dropna()
    if s.median() > 1000:          # a campus is tens of MW, so values in the thousands are kW
        s = s / 1000.0

    obs = s.resample(FREQ).mean()                      # aggregates sub-15-min data onto the grid
    grid = obs.interpolate(method="time", limit_area="inside")   # fills hourly data to 15 min too
    t = pd.Series(obs.dropna().index, index=obs.dropna().index).reindex(grid.index)
    gap = t.bfill() - t.ffill()                        # span between surrounding observations
    return grid[gap.le(MAX_GAP)].rename("load_mw")


def fit_campus_scale(s: pd.Series) -> dict:
    """Linear map so P05 -> 38 MW and P95 -> 44 MW: load_mw = a * raw + b."""
    p05, p95 = s.quantile([0.05, 0.95])
    a = (CAMPUS_P95_MW - CAMPUS_P05_MW) / (p95 - p05)
    b = CAMPUS_P05_MW - a * p05
    return {"a": round(float(a), 6), "b": round(float(b), 6),
            "raw_p05": round(float(p05), 4), "raw_p95": round(float(p95), 4),
            "target_p05_mw": CAMPUS_P05_MW, "target_p95_mw": CAMPUS_P95_MW}


def build_dataset(horizon_steps: int = STEPS_PER_DAY) -> tuple[pd.DataFrame, dict]:
    """Return (df, scaling). df is a regular 15-min grid from first observation to
    last + horizon_steps, columns `load_mw` (NaN in the future and in dropped gaps) and `temp_f`."""
    load = clean_to_15min(load_raw_load())
    scaling = fit_campus_scale(load)
    load = scaling["a"] * load + scaling["b"]

    full = pd.date_range(load.index[0], load.index[-1] + horizon_steps * pd.Timedelta(FREQ), freq=FREQ)
    df = pd.DataFrame({"load_mw": load.reindex(full)}, index=full)
    df["temp_f"] = load_weather(full)["temp_f"].to_numpy()
    df.index.name = "t"
    return df, scaling


if __name__ == "__main__":
    df, scaling = build_dataset()
    hist = df["load_mw"].dropna()
    print(f"history: {hist.index[0]} -> {hist.index[-1]}  ({len(hist):,} rows)")
    print(f"scaling: load_mw = {scaling['a']:.4f} * raw + {scaling['b']:.4f}")
    print(hist.describe().round(2).to_string())
    by_hour = hist.groupby(hist.index.hour).mean().round(2)
    print("mean load by hour:", by_hour.to_dict())
