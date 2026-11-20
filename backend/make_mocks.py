"""Write the frontend mock files by calling the real backend functions (BACKEND.md section 7).

Run after `python ml/train.py`:  python -m backend.make_mocks
Writes backend/static_data/*.json and copies them to frontend/public/mock/.
"""
from __future__ import annotations

import json
import random
import shutil
from datetime import datetime, timedelta

from backend import certs
from backend import site_model as sm
from backend.plan import DispatchRequest, build_plan

MOCK_DIR = sm.ROOT / "frontend" / "public" / "mock"


def approved_event_delivery(start: datetime) -> list[certs.Delivered]:
    """The demo's 'approve' path: 2 h at the 15 MW plan, then the 30-min extension
    at the extended plan + deeper cap (14.8 + 1.8 = 16.6 MW). ±3% noise, seed 42."""
    forecast = sm.load_forecast()
    base = build_plan(DispatchRequest(target_mw=15, duration_h=2), forecast)["total_mw"]
    ext = build_plan(DispatchRequest(target_mw=15, duration_h=2.5), forecast)
    ext_mw = ext["total_mw"] + (ext["proposal"]["adds_mw"] if ext["proposal"] else 0)
    rng = random.Random(42)
    return [certs.Delivered(t=start + timedelta(minutes=15 * i),
                            reduction_mw=(base if i < 8 else ext_mw) * rng.uniform(0.97, 1.03))
            for i in range(10)]


def main() -> None:
    forecast = sm.load_forecast()
    if forecast is None:
        raise SystemExit("forecast.json missing — run `python ml/train.py` first")
    day = datetime.fromisoformat(forecast["peak"]["t"]).date()
    start = datetime.combine(day, datetime.min.time()).replace(hour=16)

    cert = certs.build_certificate(certs.CertificateRequest(
        dispatch_id="DR-1120-01", start=start, end=start + timedelta(hours=2.5), target_mw=15.0,
        delivered=approved_event_delivery(start)))
    files = {
        "site.json": sm.site_payload(),
        "plan.json": build_plan(DispatchRequest(target_mw=15, duration_h=2), forecast),
        "plan_extended.json": build_plan(DispatchRequest(target_mw=15, duration_h=2.5), forecast),
        "certificate.json": cert,
        "verify.json": certs.verify(cert),
    }
    MOCK_DIR.mkdir(parents=True, exist_ok=True)
    for name, data in files.items():
        path = sm.STATIC_DATA / name
        path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
        shutil.copyfile(path, MOCK_DIR / name)
    shutil.copyfile(sm.FORECAST_PATH, MOCK_DIR / "forecast.json")
    print(f"wrote {', '.join(files)} (+ forecast.json) to backend/static_data and frontend/public/mock")
    print(f"certificate {cert['id']}: {cert['summary']}  verify: {files['verify.json']['reason']}")


if __name__ == "__main__":
    main()
