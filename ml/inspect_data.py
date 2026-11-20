"""Print a quick profile of every file in data/ (BACKEND.md section 3.1).

Usage: python ml/inspect_data.py
"""
from pathlib import Path

import pandas as pd

DATA = Path(__file__).resolve().parent.parent / "data"
READERS = {
    ".csv": pd.read_csv,
    ".tsv": lambda p: pd.read_csv(p, sep="\t"),
    ".xlsx": pd.read_excel,
    ".xls": pd.read_excel,
    ".json": pd.read_json,
    ".parquet": pd.read_parquet,
}


def find_time_col(df: pd.DataFrame):
    """Return (name, parsed series) for the first column that parses as datetimes."""
    for col in df.columns:
        if pd.api.types.is_numeric_dtype(df[col]):
            continue
        parsed = pd.to_datetime(df[col], errors="coerce")
        if parsed.notna().mean() > 0.9:
            return col, parsed
    return None, None


def profile(path: Path) -> None:
    print("=" * 80)
    print(f"FILE: {path.name}  ({path.stat().st_size / 1024:.0f} KB)")
    reader = READERS.get(path.suffix.lower())
    if reader is None:
        print("  (skipped: unsupported extension)")
        return
    try:
        df = reader(path)
    except Exception as e:  # show the problem, keep going
        print(f"  ERROR reading: {e}")
        return
    print(f"rows: {len(df):,}   cols: {len(df.columns)}")
    print("dtypes:")
    for col, dt in df.dtypes.items():
        print(f"  {col!r:40} {dt}")
    col, ts = find_time_col(df)
    if col is not None:
        ts = ts.dropna().sort_values()
        step = ts.diff().mode()
        print(f"time column: {col!r}  first: {ts.iloc[0]}  last: {ts.iloc[-1]}  "
              f"step: {step.iloc[0] if len(step) else 'n/a'}")
    else:
        print("time column: none detected")
    print("sample rows:")
    print(df.sample(min(5, len(df)), random_state=0).sort_index().to_string(max_colwidth=30))


def main() -> None:
    if not DATA.exists():
        print(f"No data/ folder at {DATA}")
        return
    files = sorted(p for p in DATA.rglob("*") if p.is_file())
    if not files:
        print("data/ is empty")
    for p in files:
        profile(p)


if __name__ == "__main__":
    main()
