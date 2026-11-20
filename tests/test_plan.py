"""BACKEND.md section 5 reference cases."""
import pytest

from backend import site_model as sm
from backend.plan import DispatchRequest, build_plan

FORECAST = {"points": [{"p95": 39.3}, {"p95": 44.4}]}   # trough / peak for the pre-cool check


def plan(**kw):
    return build_plan(DispatchRequest(**{"target_mw": 15, **kw}), FORECAST)


def mw(p):
    return {l["id"]: l["mw"] for l in p["levers"]}


def test_case1_15mw_2h_450w():
    p = plan(duration_h=2, max_tdp_w=450)
    assert mw(p) == {"precool": 4.0, "battery": 5.0, "tdp": 3.0, "batch": 3.0}
    assert p["total_mw"] == 15.0 and p["shortfall_mw"] == 0.0 and p["proposal"] is None
    # cost and value figures from FRONTEND.md plan.json
    assert [l["cost_usd"] for l in p["levers"]] == [102, 300, 11644, 3913]
    assert p["cost_usd"] == 15959
    assert p["value_usd"] == {"demand_charge_avoided_per_month": 210000, "dr_payment": 4500, "energy_avoided": 5460}
    assert p["safety"] == {"precool_below_peak": True, "lockout_blocks": []}
    assert p["levers"][2]["note"] == "Training slows ~23%, no jobs stopped"


def test_case2_extension_2_5h_shortfall_and_proposal():
    p = plan(duration_h=2.5, max_tdp_w=450)
    assert mw(p) == {"precool": 3.2, "battery": 4.0, "tdp": 3.0, "batch": 4.6}
    assert p["total_mw"] == 14.8 and p["shortfall_mw"] == 0.2
    assert p["proposal"] == {"id": "tdp300", "name": "Deepen training cap 450 → 300 W", "adds_mw": 1.8,
                             "cost_usd": 2071, "note": "Training slows ~40% for the final 30 min; no jobs stopped"}


def test_case3_2_5h_300w_meets_target():
    p = plan(duration_h=2.5, max_tdp_w=300)
    assert mw(p)["tdp"] == 4.8
    assert p["total_mw"] >= 15.0 and p["shortfall_mw"] == 0.0 and p["proposal"] is None


@pytest.mark.parametrize("feeder", ["2B", "Feeder 2B", "feeder 2b"])
def test_case4_lockout_blocks_battery(feeder):
    p = plan(duration_h=2, max_tdp_w=450, lockout_feeders=[feeder])
    bat = next(l for l in p["levers"] if l["id"] == "battery")
    assert bat["blocked"] and bat["mw"] == 0 and bat["note"] == "Blocked — crew on Feeder 2B"
    assert p["shortfall_mw"] > 0
    assert p["safety"]["lockout_blocks"] == ["battery"]


@pytest.mark.parametrize("kw", [
    dict(duration_h=2), dict(duration_h=2.5), dict(duration_h=2.5, max_tdp_w=300),
    dict(duration_h=2, lockout_feeders=["2B"]), dict(duration_h=4, allow_batch_drain=False),
    dict(target_mw=40, duration_h=1, max_tdp_w=200), dict(target_mw=1, duration_h=0.5),
])
def test_case5_inference_never_touched(kw):
    p = plan(**kw)
    assert p["inference_curtailed_mw"] == 0
    assert all(l["id"] != "inference" for l in p["levers"])
    assert p["protected"] == [{"name": "Inference (16,000 GPUs)", "mw": 20.4}]
    assert p["total_mw"] + p["shortfall_mw"] >= kw.get("target_mw", 15) - 1e-9 or p["shortfall_mw"] == 0


def test_short_warning_limits_precool():
    p = plan(duration_h=2, warning_min=7.5)          # half of 15 min -> 4 MWh -> 2.0 MW
    assert mw(p)["precool"] == 2.0


def test_precool_skipped_if_it_would_set_new_peak():
    p = build_plan(DispatchRequest(target_mw=15), {"points": [{"p95": 42.0}, {"p95": 44.0}]})
    assert mw(p)["precool"] == 0 and p["safety"]["precool_below_peak"] is False


def test_site_payload_matches_contract():
    s = sm.site_payload()
    assert [p["mw"] for p in s["pools"]] == [20.4, 12.75, 3.83]
    assert s["site_mw"] == 44.4 and s["substation"]["headroom_mw"] == 11.6
    assert s["lockout"]["feeder"] == "Feeder 2B"
