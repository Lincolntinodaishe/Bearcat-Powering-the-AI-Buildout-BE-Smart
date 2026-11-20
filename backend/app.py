"""GridSync API (BACKEND.md section 7).

Run: python -m uvicorn backend.app:app --reload --port 8000
"""
from __future__ import annotations

import json
from typing import Any

from fastapi import Body, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, model_validator
from starlette.exceptions import HTTPException as StarletteHTTPException

from backend import certs
from backend import site_model as sm
from backend.plan import DispatchRequest, build_plan

MODELS_DIR = sm.ROOT / "ml" / "models"
METRICS_PATH = sm.ROOT / "ml" / "metrics.json"
STATIC_UI = sm.ROOT / "backend" / "static"
MOCK_FORECAST = sm.ROOT / "frontend" / "public" / "mock" / "forecast.json"

app = FastAPI(title="GridSync API", version="1.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
                   allow_methods=["*"], allow_headers=["*"])


class LockoutRequest(BaseModel):
    active: bool
    by: str | None = Field(None, max_length=80)

    @model_validator(mode="after")
    def name_required_when_active(self):
        if self.active and not (self.by or "").strip():
            raise ValueError("`by` (technician name) is required to activate a lockout")
        return self


def model_loaded() -> bool:
    return sm.load_forecast() is not None and all((MODELS_DIR / f"lgbm_{q}.pkl").exists()
                                                 for q in ("p05", "p50", "p95"))


def forecast_data() -> dict:
    """Trained forecast, else the frontend mock (model_loaded reports which)."""
    f = sm.current_forecast()
    if f is None and MOCK_FORECAST.exists():
        f = json.loads(MOCK_FORECAST.read_text(encoding="utf-8"))
    if f is None:
        raise HTTPException(503, "No forecast available — run `python ml/train.py`")
    return f


@app.get("/api/health")
def health():
    return {"ok": True, "model_loaded": model_loaded()}


@app.get("/api/forecast")
def forecast(hours: int = Query(24, ge=1, le=24)):
    f = forecast_data()
    points = f["points"][: hours * 4]
    peak = max(points, key=lambda p: p["p50"])
    return {**f, "peak": {"t": peak["t"], "p50": peak["p50"]}, "points": points}


@app.get("/api/metrics")
def metrics():
    if not METRICS_PATH.exists():
        raise HTTPException(404, "metrics.json missing — run `python ml/train.py`")
    return json.loads(METRICS_PATH.read_text(encoding="utf-8"))


@app.get("/api/site")
def site():
    return sm.site_payload()


@app.post("/api/lockout")
def lockout(req: LockoutRequest):
    return sm.set_lockout(req.active, req.by.strip() if req.by else None)


@app.post("/api/dispatch")
def dispatch(req: DispatchRequest):
    # Safety interlock enforced server-side: an active crew lockout always applies,
    # even if the client forgets to send it.
    feeders = sorted({sm.normalize_feeder(f) for f in req.lockout_feeders} | set(sm.active_lockout_feeders()))
    return build_plan(req.model_copy(update={"lockout_feeders": feeders}), sm.load_forecast())


@app.post("/api/certificate")
def certificate(req: certs.CertificateRequest):
    try:
        return certs.issue(req)
    except RuntimeError as e:
        raise HTTPException(503, str(e))
    except ValueError as e:
        raise HTTPException(422, str(e))


@app.post("/api/verify")
def verify(cert: dict[str, Any] = Body(...)):
    return certs.verify(cert)


@app.get("/api/certificates")
def certificates():
    return certs.ledger_rows()


class SPAStaticFiles(StaticFiles):
    """Serve the built frontend; unknown non-API paths fall back to index.html (client routing)."""

    async def get_response(self, path, scope):
        try:
            return await super().get_response(path, scope)
        except StarletteHTTPException as e:
            if e.status_code == 404 and not path.startswith("api"):
                return await super().get_response("index.html", scope)
            raise


# Mounted last so /api routes win; only if the frontend has been built.
if STATIC_UI.is_dir() and (STATIC_UI / "index.html").exists():
    app.mount("/", SPAStaticFiles(directory=STATIC_UI, html=True), name="ui")
