"""Train day-ahead P05/P50/P95 LightGBM models and write forecast.json (BACKEND.md 3.3).

Usage: python ml/train.py        (env DEMO_ALIGN_TODAY=0 keeps the original timestamps)
"""
from __future__ import annotations

import json
import os
import shutil
import sys
from datetime import datetime
from pathlib import Path

import joblib
import lightgbm as lgb
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from ml.prep import FREQ, STEPS_PER_DAY, build_dataset  # noqa: E402

MODELS = ROOT / "ml" / "models"
METRICS = ROOT / "ml" / "metrics.json"
OUT = ROOT / "backend" / "static_data" / "forecast.json"
OUT_MOCK = ROOT / "public" / "mock" / "forecast.json"

SITE = "Memphis AI Campus · Hall A–C"
QUANTILES = {"p05": 0.05, "p50": 0.5, "p95": 0.95}
FEATURES = ["hour", "minute", "dow", "is_weekend", "temp_f", "lag_96", "lag_192", "lag_672", "roll_mean_96"]
HOLDOUT = 7 * STEPS_PER_DAY


def add_features(df: pd.DataFrame) -> pd.DataFrame:
    """Calendar + weather + lags. Every lag is >= 96 steps, so day-ahead has no leakage."""
    out = df.copy()
    idx = out.index
    out["hour"], out["minute"], out["dow"] = idx.hour, idx.minute, idx.dayofweek
    out["is_weekend"] = (idx.dayofweek >= 5).astype(int)
    y = out["load_mw"]
    for k in (96, 192, 672):
        out[f"lag_{k}"] = y.shift(k)
    out["roll_mean_96"] = y.shift(96).rolling(96).mean()   # 96 steps ending at t-96
    return out


def fit(X: pd.DataFrame, y: pd.Series) -> dict:
    models = {}
    for name, q in QUANTILES.items():
        m = lgb.LGBMRegressor(objective="quantile", alpha=q, n_estimators=300, learning_rate=0.05,
                              num_leaves=31, random_state=42, verbose=-1)
        models[name] = m.fit(X, y)
    return models


def predict(models: dict, X: pd.DataFrame) -> pd.DataFrame:
    """Predict all quantiles and sort each row so p05 <= p50 <= p95 (fixes crossings)."""
    raw = np.column_stack([models[k].predict(X) for k in QUANTILES])
    return pd.DataFrame(np.sort(raw, axis=1), index=X.index, columns=list(QUANTILES))


def conformal_q(pred: pd.DataFrame, y: pd.Series, target: float = 0.90) -> float:
    """Split-conformal margin (CQR): how far to widen [p05, p95] so ~90% of
    out-of-sample actuals fall inside. Negative means the band can shrink."""
    scores = np.maximum(pred["p05"] - y, y - pred["p95"]).to_numpy()
    level = min(1.0, np.ceil((len(scores) + 1) * target) / len(scores))
    return float(np.quantile(scores, level))


def widen(pred: pd.DataFrame, q: float) -> pd.DataFrame:
    out = pred.copy()
    out["p05"] = np.minimum(pred["p05"] - q, pred["p50"])
    out["p95"] = np.maximum(pred["p95"] + q, pred["p50"])
    return out


def demo_align(fc: pd.DataFrame) -> pd.DataFrame:
    """Re-time the 24 h forecast to start today at the next quarter-hour.

    Each new timestamp takes the forecast point with the same clock time, so the
    peak stays at its forecast time of day (e.g. 16:15) instead of being shifted.
    """
    start = pd.Timestamp.now().ceil(FREQ)
    new_idx = pd.date_range(start, periods=len(fc), freq=FREQ)
    by_tod = fc.set_axis(fc.index.hour * 60 + fc.index.minute)
    return by_tod.loc[new_idx.hour * 60 + new_idx.minute].set_axis(new_idx)


def main() -> None:
    df, scaling = build_dataset(horizon_steps=STEPS_PER_DAY)
    feats = add_features(df)
    hist = feats[feats["load_mw"].notna()].dropna(subset=FEATURES)
    future = feats[feats.index > df["load_mw"].last_valid_index()].iloc[:STEPS_PER_DAY]

    # Honest holdout: last 7 days, never seen by the models. The week before it
    # calibrates the band (split conformal), so calibration never sees the holdout.
    train, calib, test = hist.iloc[:-2 * HOLDOUT], hist.iloc[-2 * HOLDOUT:-HOLDOUT], hist.iloc[-HOLDOUT:]
    m = fit(train[FEATURES], train["load_mw"])
    q_calib = conformal_q(predict(m, calib[FEATURES]), calib["load_mw"])
    raw_pred = predict(m, test[FEATURES])
    pred = widen(raw_pred, q_calib)
    y = test["load_mw"]
    err = (pred["p50"] - y).abs()
    inside = lambda p: float(((y >= p["p05"]) & (y <= p["p95"])).mean())  # noqa: E731
    metrics = {
        "mae_mw": round(float(err.mean()), 3),
        "mape": round(float((err / y).mean()), 4),
        "coverage": round(inside(pred), 3),
        "coverage_uncalibrated": round(inside(raw_pred), 3),
        "benchmark_mae_mw": round(float((test["lag_672"] - y).abs().mean()), 3),
        "benchmark": "Same time last week",
    }

    # Final models: refit on all history, then forecast the next 96 steps.
    # Band margin for the live forecast uses both out-of-sample weeks (calib + holdout).
    oos = hist.iloc[-2 * HOLDOUT:]
    q_final = conformal_q(predict(m, oos[FEATURES]), oos["load_mw"])
    metrics["conformal_margin_mw"] = round(q_final, 3)
    models = fit(hist[FEATURES], hist["load_mw"])
    MODELS.mkdir(parents=True, exist_ok=True)
    for name, mod in models.items():
        joblib.dump(mod, MODELS / f"lgbm_{name}.pkl")
    joblib.dump({"conformal_margin_mw": q_final}, MODELS / "calibration.pkl")

    fc = widen(predict(models, future[FEATURES]), q_final).round(2)
    fc["temp_f"] = future["temp_f"].round(1)
    trained_through = hist.index[-1]
    aligned = os.environ.get("DEMO_ALIGN_TODAY", "1") == "1"
    if aligned:
        fc = demo_align(fc)

    peak_t = fc["p50"].idxmax()
    forecast = {
        "generated_at": datetime.now().replace(microsecond=0).isoformat(),
        "site": SITE,
        "model": {"name": "LightGBM quantile (P05/P50/P95)", "mae_mw": round(metrics["mae_mw"], 2),
                  "mape": round(metrics["mape"], 3), "coverage": round(metrics["coverage"], 2),
                  "benchmark_mae_mw": round(metrics["benchmark_mae_mw"], 2), "benchmark": metrics["benchmark"],
                  "trained_through": trained_through.isoformat()},
        "peak": {"t": peak_t.isoformat(), "p50": float(fc.loc[peak_t, "p50"])},
        "points": [{"t": t.isoformat(), **{k: float(v) for k, v in row.items()}} for t, row in fc.iterrows()],
    }
    for path in (OUT, OUT_MOCK):
        path.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(forecast, indent=2, ensure_ascii=False), encoding="utf-8")
    shutil.copyfile(OUT, OUT_MOCK)

    METRICS.write_text(json.dumps({
        **metrics, "model": forecast["model"]["name"], "features": FEATURES, "quantiles": list(QUANTILES),
        "train": {"start": train.index[0].isoformat(), "end": train.index[-1].isoformat(), "rows": len(train)},
        "holdout": {"start": test.index[0].isoformat(), "end": test.index[-1].isoformat(), "rows": len(test)},
        "trained_through": trained_through.isoformat(), "demo_aligned": aligned,
        "scaling": {**scaling, "note": "Normalized to campus scale: load_mw = a * raw + b"},
        "data": "Synthetic (see data/README_synthetic.md)",
    }, indent=2), encoding="utf-8")

    print("\nGridSync day-ahead model  (holdout = last 7 days)")
    print("-" * 52)
    print(f"{'P50 MAE':<28}{metrics['mae_mw']:>10.3f} MW")
    print(f"{'P50 MAPE':<28}{metrics['mape'] * 100:>10.2f} %")
    print(f"{'P05-P95 coverage':<28}{metrics['coverage'] * 100:>10.1f} %   (target 90; "
          f"{metrics['coverage_uncalibrated'] * 100:.1f} % before conformal)")
    print(f"{'Conformal margin':<28}{q_final:>10.3f} MW")
    print(f"{'Benchmark MAE (last week)':<28}{metrics['benchmark_mae_mw']:>10.3f} MW")
    print(f"{'Improvement vs benchmark':<28}{metrics['benchmark_mae_mw'] / metrics['mae_mw']:>10.2f} x")
    print("-" * 52)
    print(f"trained through {trained_through}   forecast {fc.index[0]} -> {fc.index[-1]}")
    print(f"peak {peak_t:%Y-%m-%d %H:%M}  P50 {forecast['peak']['p50']} MW   "
          f"band width avg {(fc['p95'] - fc['p05']).mean():.2f} MW")
    print(f"wrote {OUT.relative_to(ROOT)} and {OUT_MOCK.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
