from __future__ import annotations

import argparse
import sys
from pathlib import Path

import pandas as pd


def parse_args() -> argparse.Namespace:
    script_path = Path(__file__).resolve()
    project_root = script_path.parents[3]

    parser = argparse.ArgumentParser(
        description="Remove non Latin/Arabic characters from label columns."
    )
    parser.add_argument(
        "--input",
        default=str(project_root / "data_ml_final_enriched.csv"),
        help="Input CSV file.",
    )
    parser.add_argument(
        "--output",
        default=str(project_root / "data_ml_final_enriched_latin_arabic.csv"),
        help="Output CSV file.",
    )
    parser.add_argument(
        "--columns",
        default="city,zone_name,district,region_name,display_name",
        help="Comma-separated column names to sanitize.",
    )
    parser.add_argument(
        "--in-place",
        action="store_true",
        help="Overwrite the input file.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    script_path = Path(__file__).resolve()
    api_root = script_path.parents[1]
    if str(api_root) not in sys.path:
        sys.path.insert(0, str(api_root))

    from entreprise.services.text_cleaning import sanitize_latin_arabic_text

    input_path = Path(args.input).resolve()
    if not input_path.exists():
        raise FileNotFoundError(f"Input file not found: {input_path}")

    output_path = input_path if args.in_place else Path(args.output).resolve()
    columns = [c.strip() for c in args.columns.split(",") if c.strip()]
    if not columns:
        raise ValueError("No columns provided. Use --columns col1,col2,...")

    print(f"[INFO] Input:  {input_path}")
    print(f"[INFO] Output: {output_path}")
    print(f"[INFO] Columns: {', '.join(columns)}")

    df = pd.read_csv(input_path, low_memory=False)
    changed_cells = 0

    for column in columns:
        if column not in df.columns:
            print(f"[WARN] Column not found, skipped: {column}")
            continue

        original = df[column].fillna("").astype(str)
        cleaned = original.map(sanitize_latin_arabic_text)
        changed_cells += int((original != cleaned).sum())
        df[column] = cleaned

    output_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_path, index=False)

    print(f"[DONE] File written: {output_path}")
    print(f"[DONE] Updated cells: {changed_cells}")


if __name__ == "__main__":
    main()
