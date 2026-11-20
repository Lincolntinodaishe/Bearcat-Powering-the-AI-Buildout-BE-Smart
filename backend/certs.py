"""M&V certificates: build, hash, sign, verify (BACKEND.md section 6).

Baseline = day-ahead forecast P50 (the counterfactual load without the event).
metered = baseline − reduction. The hash covers every field except
hash_sha256 / signature_ed25519 / public_key, using a canonical JSON form the
frontend reproduces exactly (sorted keys, no spaces, whole floats as ints).
"""
from __future__ import annotations

import base64
import hashlib
import json
import os
import random
from datetime import datetime, timedelta
from functools import lru_cache
from pathlib import Path

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey, Ed25519PublicKey
from pydantic import BaseModel, Field

from backend import site_model as sm
from backend.plan import DispatchRequest, build_plan
from backend.site_model import rnd

KEY_PATH = sm.ROOT / "backend" / "keys" / "ed25519.pem"
KEY_ENV = "GRIDSYNC_ED25519_KEY"      # PEM text; set on Render so the key survives restarts
UNSIGNED = ("hash_sha256", "signature_ed25519", "public_key")
STEP = timedelta(minutes=15)
COMPLIANCE_THRESHOLD = 0.95
BASELINE_METHOD = "Day-ahead LightGBM P50 forecast (counterfactual)"

LEDGER: dict[str, dict] = {}          # cert id -> certificate (in memory, by design)


class Delivered(BaseModel):
    t: datetime
    reduction_mw: float


class CertificateRequest(BaseModel):
    dispatch_id: str = Field("DR-1120-01", min_length=1, max_length=64)
    source: str = "MLGW (OpenADR 2.0b, simulated)"
    start: datetime
    end: datetime
    target_mw: float = Field(15.0, gt=0, le=60)
    delivered: list[Delivered] | None = None


# --------------------------------------------------------------------------- #
# Keys
# --------------------------------------------------------------------------- #
@lru_cache(maxsize=1)
def private_key() -> Ed25519PrivateKey:
    """Env var -> backend/keys/ed25519.pem -> generate and save."""
    pem = os.environ.get(KEY_ENV)
    if pem:
        return serialization.load_pem_private_key(pem.replace("\\n", "\n").encode(), password=None)
    if KEY_PATH.exists():
        return serialization.load_pem_private_key(KEY_PATH.read_bytes(), password=None)
    key = Ed25519PrivateKey.generate()
    KEY_PATH.parent.mkdir(parents=True, exist_ok=True)
    KEY_PATH.write_bytes(key.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8,
                                           serialization.NoEncryption()))
    return key


def public_key_b64(key: Ed25519PrivateKey | None = None) -> str:
    raw = (key or private_key()).public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
    return base64.b64encode(raw).decode()


# --------------------------------------------------------------------------- #
# Canonical form + signing
# --------------------------------------------------------------------------- #
def canon(obj):
    """Recursive: whole floats -> int (15.0 -> 15, as JS writes it), dict keys sorted."""
    if isinstance(obj, float) and obj.is_integer():
        return int(obj)
    if isinstance(obj, dict):
        return {k: canon(v) for k, v in sorted(obj.items())}
    if isinstance(obj, list):
        return [canon(v) for v in obj]
    return obj


def canonical_json(cert: dict) -> str:
    payload = {k: v for k, v in cert.items() if k not in UNSIGNED}
    return json.dumps(canon(payload), separators=(",", ":"), ensure_ascii=False, sort_keys=True)


def hash_cert(cert: dict) -> str:
    return hashlib.sha256(canonical_json(cert).encode("utf-8")).hexdigest()


def sign(cert: dict, key: Ed25519PrivateKey | None = None) -> dict:
    """Return the certificate with hash, signature and public key attached."""
    key = key or private_key()
    h = hash_cert(cert)
    return {**cert, "hash_sha256": h,
            "signature_ed25519": base64.b64encode(key.sign(h.encode())).decode(),
            "public_key": public_key_b64(key)}


def verify(cert: dict) -> dict:
    try:
        if hash_cert(cert) != cert.get("hash_sha256"):
            return {"valid": False, "reason": "Hash mismatch — certificate was modified"}
        pub = Ed25519PublicKey.from_public_bytes(base64.b64decode(cert["public_key"], validate=True))
        pub.verify(base64.b64decode(cert["signature_ed25519"], validate=True), cert["hash_sha256"].encode())
    except (InvalidSignature, ValueError, KeyError, TypeError):
        return {"valid": False, "reason": "Signature invalid"}
    if cert["public_key"] != public_key_b64():
        return {"valid": False, "reason": "Unknown signing key"}
    return {"valid": True, "reason": "Signature and hash match"}


# --------------------------------------------------------------------------- #
# Build
# --------------------------------------------------------------------------- #
def baseline_lookup(forecast: dict | None):
    """Return f(t) -> forecast P50 at the nearest timestamp. Outside the forecast's
    24 h window, use the nearest clock time (the forecast is a day-ahead profile)."""
    pts = (forecast or {}).get("points") or []
    if not pts:
        raise RuntimeError("forecast.json missing — run `python ml/train.py` first")
    ts = [datetime.fromisoformat(p["t"]) for p in pts]
    p50 = [p["p50"] for p in pts]

    def at(t: datetime) -> float:
        if ts[0] - STEP <= t <= ts[-1] + STEP:
            i = min(range(len(ts)), key=lambda k: abs(ts[k] - t))
        else:
            tod = lambda d: d.hour * 60 + d.minute  # noqa: E731
            i = min(range(len(ts)), key=lambda k: min(abs(tod(ts[k]) - tod(t)), 1440 - abs(tod(ts[k]) - tod(t))))
        return p50[i]
    return at


def simulate_delivered(req: CertificateRequest) -> list[Delivered]:
    """No metering sent: plan total × uniform(0.97, 1.03), seeded from dispatch_id."""
    hours = (req.end - req.start).total_seconds() / 3600
    total = build_plan(DispatchRequest(target_mw=req.target_mw, duration_h=hours), sm.load_forecast())["total_mw"]
    rng = random.Random(int(hashlib.sha256(req.dispatch_id.encode()).hexdigest()[:16], 16))
    out, t = [], req.start
    while t < req.end:
        out.append(Delivered(t=t, reduction_mw=total * rng.uniform(0.97, 1.03)))
        t += STEP
    return out


def cert_id(req: CertificateRequest) -> str:
    return f"MV-{req.start:%Y}-{req.dispatch_id.removeprefix('DR-')}"


def build_certificate(req: CertificateRequest, forecast: dict | None = None,
                      signed_at: datetime | None = None) -> dict:
    if req.end <= req.start:
        raise ValueError("end must be after start")
    baseline = baseline_lookup(forecast if forecast is not None else sm.current_forecast())
    delivered = sorted(req.delivered or simulate_delivered(req), key=lambda d: d.t)
    if not delivered:
        raise ValueError("no delivered intervals")

    intervals = []
    for d in delivered:
        base = rnd(baseline(d.t), 1)
        red = rnd(d.reduction_mw, 1)
        intervals.append({"t": d.t.isoformat(timespec="seconds"), "baseline_mw": base,
                          "metered_mw": rnd(base - red, 1), "reduction_mw": red})

    reds = [i["reduction_mw"] for i in intervals]
    met = sum(r >= COMPLIANCE_THRESHOLD * req.target_mw for r in reds)
    cert = {
        "id": cert_id(req),
        "event": {"dispatch_id": req.dispatch_id, "source": req.source,
                  "start": req.start.isoformat(timespec="seconds"), "end": req.end.isoformat(timespec="seconds"),
                  "target_mw": req.target_mw},
        "intervals": intervals,
        "summary": {"avg_reduction_mw": rnd(sum(reds) / len(reds), 1), "min_reduction_mw": min(reds),
                    "energy_mwh": rnd(sum(reds) * 0.25, 1), "compliance": rnd(met / len(reds), 2),
                    "inference_curtailed_mw": 0, "sla_breaches": 0},
        "baseline_method": BASELINE_METHOD,
        "signed_at": (signed_at or sm.site_now()).replace(microsecond=0).isoformat(),
    }
    return sign(cert)


def issue(req: CertificateRequest) -> dict:
    """Build, sign and record in the ledger. Re-issuing the same dispatch replaces its row."""
    cert = build_certificate(req)
    LEDGER[cert["id"]] = cert
    return cert


def ledger_rows() -> list[dict]:
    return [{"id": c["id"], "dispatch_id": c["event"]["dispatch_id"], "committed_mw": c["event"]["target_mw"],
             "verified_mw": c["summary"]["avg_reduction_mw"], "compliance": c["summary"]["compliance"],
             "hash_sha256": c["hash_sha256"], "valid": verify(c)["valid"]} for c in LEDGER.values()]
