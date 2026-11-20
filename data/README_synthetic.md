# Synthetic data

**All data in GridSync is synthetic. It contains no real customer, utility or facility data.**

The facility load and weather packet was not available, so `ml/prep.py` generates both
from fixed formulas with fixed seeds. Re-running `python ml/train.py` reproduces the
exact same dataset, models and metrics (apart from the demo re-timing described below).

## Facility load: 120 days at 15-minute resolution

- Span: 2026-07-04 00:00 to 2026-10-29 23:45 (11,520 points).
  The span ends on a Thursday, so the day-ahead forecast falls on a weekday.
- Random streams: `numpy.random.default_rng([42, 2])` for load and `[42, 1]` for weather.
  Both come from seed 42, with separate streams so that load noise isn't
  correlated with weather noise.

```
raw_mw(t) = 40.0
          + 2.6  * sin(2π (hour − 10.25) / 24)      # daily cycle: peak 16:15, trough 04:15
          − 0.7  * is_weekend                        # lighter batch load on weekends
          + 0.05 * max(temp_f − 60, 0)               # cooling load rises with heat
          + ramp(t)                                  # 0 → 1.2 MW linear GPU build-out over the span
          + drift(t)                                 # AR(1): drift_t = 0.97·drift_{t−1} + N(0, 0.06)
          + N(0, 0.12)                               # metering / job-mix noise
```

`hour` is fractional, for example 16.25 for 16:15.

### Campus scaling

The generic pipeline then rescales whatever load it is given (synthetic or real) to
campus size. The night 5th percentile maps to 38 MW and the afternoon 95th percentile
maps to 44 MW:

```
load_mw = a · raw + b      (a, b fitted on the series' P05 / P95; stored in ml/metrics.json → scaling)
```

The Assumptions page reports this as "normalized to campus scale".

## Weather: synthetic Memphis temperature

```
seasonal_mean(doy) = 62 + 21 · sin(2π (doy − 105) / 365)     # ≈ 41 °F mid-January, ≈ 83 °F mid-July
temp_f(t)          = seasonal_mean(doy) + 9 · sin(2π (hour − 9) / 24) + N(0, 1.5)
```

- The daily maximum is around 15:00.
- The forecast assumes the temperature is known in advance, standing in for a weather forecast.
- No wet-bulb temperature or grid (EIA/TVA) load is generated, so neither is used as a feature.

## Forecast timestamps ("demo alignment")

The model forecasts the 96 quarter-hours after the last training timestamp. With
`DEMO_ALIGN_TODAY=1` (the default), those points are re-timed so the forecast starts
today at the next quarter-hour. Each new timestamp takes the forecast point with the
same clock time, so the shape and the time of the peak are unchanged.

The original end of training data is stored in `forecast.json → model.trained_through`.
To keep the original timestamps, set `DEMO_ALIGN_TODAY=0`.

## Swapping in real data

- **Load:** replace the body of `load_raw_load()` in `ml/prep.py`. It must return a
  Series of facility load indexed by timestamp, in kW or MW, at any step.
- **Weather:** replace `load_weather()` to read a NOAA file. Both functions contain a
  commented real-data example.

The rest of the pipeline stays as it is: dedupe, kW→MW conversion, 15-minute resample,
interpolation of gaps ≤ 1 h, dropping of longer gaps, and campus scaling.
