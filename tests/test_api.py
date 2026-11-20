"""BACKEND.md section 8: every route returns 200 and the documented top-level keys."""
import copy

import pytest
from fastapi.testclient import TestClient

from backend import site_model as sm
from backend.app import app

client = TestClient(app)
EVENT = {"dispatch_id": "DR-TEST-01", "source": "MLGW (OpenADR 2.0b, simulated)",
         "start": "2026-11-20T16:00:00", "end": "2026-11-20T18:30:00", "target_mw": 15.0}


@pytest.fixture(autouse=True)
def reset_lockout():
    sm.set_lockout(False, None)
    yield
    sm.set_lockout(False, None)


def test_health():
    r = client.get("/api/health")
    assert r.status_code == 200 and r.json()["ok"] is True and "model_loaded" in r.json()


def test_forecast_slices_hours():
    r = client.get("/api/forecast?hours=24")
    assert r.status_code == 200
    body = r.json()
    assert {"generated_at", "site", "model", "peak", "points"} <= body.keys()
    assert len(body["points"]) == 96
    assert {"t", "p05", "p50", "p95", "temp_f"} <= body["points"][0].keys()
    assert len(client.get("/api/forecast?hours=6").json()["points"]) == 24


def test_forecast_is_realigned_to_now_at_serve_time():
    from datetime import datetime, timedelta

    pts = client.get("/api/forecast").json()["points"]
    first = datetime.fromisoformat(pts[0]["t"])
    assert timedelta(0) <= first - sm.site_now() <= timedelta(minutes=15)
    raw = {p["t"][11:16]: p["p50"] for p in sm.load_forecast()["points"]}
    assert all(raw[p["t"][11:16]] == p["p50"] for p in pts)      # same value at the same clock time


def test_metrics():
    r = client.get("/api/metrics")
    assert r.status_code == 200 and {"mae_mw", "mape", "coverage", "benchmark_mae_mw", "scaling"} <= r.json().keys()


def test_site():
    r = client.get("/api/site")
    assert r.status_code == 200
    assert {"pools", "cooling_mw", "site_mw", "battery", "substation", "phases", "lmp_usd_mwh", "lockout"} <= r.json().keys()


def test_dispatch():
    r = client.post("/api/dispatch", json={"target_mw": 15, "duration_h": 2, "warning_min": 20, "max_tdp_w": 450,
                                           "allow_batch_drain": True, "lockout_feeders": []})
    assert r.status_code == 200
    body = r.json()
    assert {"target_mw", "duration_h", "levers", "protected", "total_mw", "shortfall_mw", "ride_through_min",
            "cost_usd", "value_usd", "safety", "proposal", "inference_curtailed_mw"} <= body.keys()
    assert body["total_mw"] == 15.0 and body["cost_usd"] == 15959


def test_lockout_enforced_server_side():
    r = client.post("/api/lockout", json={"active": True, "by": "Priyah N."})
    assert r.status_code == 200 and r.json()["active"] and r.json()["by"] == "Priyah N."
    assert client.get("/api/site").json()["lockout"]["active"] is True
    plan = client.post("/api/dispatch", json={"target_mw": 15, "duration_h": 2, "lockout_feeders": []}).json()
    assert plan["safety"]["lockout_blocks"] == ["battery"]       # client didn't send it; server applied it
    assert client.post("/api/lockout", json={"active": False}).json()["active"] is False


def test_lockout_requires_name():
    assert client.post("/api/lockout", json={"active": True, "by": "  "}).status_code == 422


def test_certificate_verify_and_ledger():
    r = client.post("/api/certificate", json={**EVENT, "delivered": [
        {"t": f"2026-11-20T{16 + i // 4}:{15 * (i % 4):02d}:00", "reduction_mw": 15.2} for i in range(10)]})
    assert r.status_code == 200
    cert = r.json()
    assert {"id", "event", "intervals", "summary", "baseline_method", "signed_at",
            "hash_sha256", "signature_ed25519", "public_key"} <= cert.keys()

    v = client.post("/api/verify", json=cert)
    assert v.status_code == 200 and v.json() == {"valid": True, "reason": "Signature and hash match"}

    bad = copy.deepcopy(cert)
    bad["intervals"][0]["metered_mw"] -= 0.5
    assert client.post("/api/verify", json=bad).json()["valid"] is False

    rows = client.get("/api/certificates").json()
    row = next(x for x in rows if x["dispatch_id"] == "DR-TEST-01")
    assert {"id", "dispatch_id", "committed_mw", "verified_mw", "compliance", "hash_sha256", "valid"} <= row.keys()
    assert row["valid"] is True


def test_certificate_without_delivered_is_simulated():
    r = client.post("/api/certificate", json={**EVENT, "dispatch_id": "DR-TEST-02"})
    assert r.status_code == 200 and len(r.json()["intervals"]) == 10


def test_sample_certificate_verifies_with_any_server_key(monkeypatch):
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
    from backend import certs
    other = Ed25519PrivateKey.generate()                 # e.g. a Render host without the env key
    monkeypatch.setattr(certs, "private_key", lambda: other)
    cert = client.get("/mock/certificate.json").json()
    assert cert["public_key"] == certs.public_key_b64(other)
    assert client.post("/api/verify", json=cert).json()["valid"] is True


def test_bad_inputs_are_rejected():
    assert client.post("/api/dispatch", json={"target_mw": -1}).status_code == 422
    assert client.post("/api/certificate", json={**EVENT, "end": "2026-11-20T15:00:00"}).status_code == 422
