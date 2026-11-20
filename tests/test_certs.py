"""BACKEND.md section 6: issue -> verify, tamper, key swap, canonical form."""
import copy
import json
import shutil
import subprocess
from datetime import datetime, timedelta

import pytest
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

from backend import certs
from backend.certs import CertificateRequest, Delivered, build_certificate, canon, canonical_json, sign, verify

START = datetime(2026, 11, 20, 16, 0)
FORECAST = {"points": [{"t": (START + timedelta(minutes=15 * i)).isoformat(), "p50": 44.12 - 0.01 * i}
                       for i in range(-8, 16)]}


def make(delivered=None, **kw):
    req = CertificateRequest(dispatch_id="DR-1120-01", start=START, end=START + timedelta(hours=2.5),
                             target_mw=15.0, delivered=delivered, **kw)
    return build_certificate(req, FORECAST)


def steady(mw, n=10):
    return [Delivered(t=START + timedelta(minutes=15 * i), reduction_mw=mw) for i in range(n)]


def test_issue_then_verify_is_valid():
    cert = make(steady(15.2))
    assert verify(cert) == {"valid": True, "reason": "Signature and hash match"}


def test_survives_http_json_round_trip():
    cert = json.loads(json.dumps(make(steady(15.0))))   # 15.0 etc. as the browser would resend it
    assert verify(cert)["valid"]


def test_tamper_metered_mw_fails_with_hash_mismatch():
    cert = make(steady(15.2))
    bad = copy.deepcopy(cert)
    bad["intervals"][3]["metered_mw"] -= 0.5           # the frontend's Tamper test
    assert verify(bad) == {"valid": False, "reason": "Hash mismatch — certificate was modified"}


def test_swapped_public_key_is_invalid():
    cert = make(steady(15.2))
    cert["public_key"] = certs.public_key_b64(Ed25519PrivateKey.generate())
    assert verify(cert) == {"valid": False, "reason": "Signature invalid"}


def test_resigned_with_foreign_key_is_unknown():
    cert = make(steady(15.2))
    cert["summary"]["avg_reduction_mw"] = 20.0          # forge, then re-sign with a different key
    forged = sign({k: v for k, v in cert.items() if k not in certs.UNSIGNED}, Ed25519PrivateKey.generate())
    assert verify(forged) == {"valid": False, "reason": "Unknown signing key"}


def test_garbage_signature_is_invalid():
    cert = make(steady(15.2))
    cert["signature_ed25519"] = "not base64!"
    assert verify(cert)["valid"] is False


def test_canon_whole_floats_become_ints():
    assert json.dumps(canon(15.0)) == "15"
    assert json.dumps(canon({"b": [1.0, 2.5], "a": {"d": 0.0, "c": True}})) == '{"a": {"c": true, "d": 0}, "b": [1, 2.5]}'
    assert canonical_json({"z": 15.0, "a": 1, "hash_sha256": "x", "public_key": "y"}) == '{"a":1,"z":15}'


def test_summary_math():
    reds = [15.2] * 8 + [13.0, 16.0]                     # 9 of 10 intervals >= 14.25
    cert = make([Delivered(t=START + timedelta(minutes=15 * i), reduction_mw=r) for i, r in enumerate(reds)])
    s = cert["summary"]
    assert s["compliance"] == 0.9 and s["min_reduction_mw"] == 13.0
    assert s["energy_mwh"] == 37.7 and s["avg_reduction_mw"] == 15.1   # 150.6 × 0.25 = 37.65, half-up
    assert s["inference_curtailed_mw"] == 0 and s["sla_breaches"] == 0
    i0 = cert["intervals"][0]
    assert i0["baseline_mw"] == 44.1 and i0["metered_mw"] == 28.9 and i0["reduction_mw"] == 15.2
    assert cert["id"] == "MV-2026-1120-01" and cert["baseline_method"].startswith("Day-ahead")


def test_simulated_delivery_is_deterministic():
    a, b = make(), make()
    assert len(a["intervals"]) == 10
    assert [i["reduction_mw"] for i in a["intervals"]] == [i["reduction_mw"] for i in b["intervals"]]


@pytest.mark.skipif(shutil.which("node") is None, reason="node not installed")
def test_javascript_recomputes_the_same_hash():
    """The frontend's offline check: drop 3 fields, sort keys recursively, JSON.stringify, SHA-256."""
    cert = make(steady(15.0))
    js = r"""
const c = JSON.parse(require('fs').readFileSync(0, 'utf8'));
for (const k of ['hash_sha256','signature_ed25519','public_key']) delete c[k];
const sortKeys = v => Array.isArray(v) ? v.map(sortKeys)
  : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sortKeys(v[k])])) : v;
process.stdout.write(require('crypto').createHash('sha256').update(JSON.stringify(sortKeys(c))).digest('hex'));
"""
    out = subprocess.run(["node", "-e", js], input=json.dumps(cert, ensure_ascii=False).encode(),
                         capture_output=True, check=True)
    assert out.stdout.decode() == cert["hash_sha256"]
