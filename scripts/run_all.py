import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent


def run_step(command: list[str]) -> None:
    print(f"\n[RUN] {' '.join(command)}")
    proc = subprocess.run(command, cwd=ROOT)
    if proc.returncode != 0:
        raise RuntimeError(f"Step failed with code {proc.returncode}: {' '.join(command)}")


def run_mode(mode: str) -> None:
    print(f"\n====================")
    print(f"PIPELINE MODE: {mode}")
    print(f"====================")
    run_step([sys.executable, "cluster_zones.py", mode])
    run_step([sys.executable, "analyze_clusters.py", mode])
    run_step([sys.executable, "train_cluster_classifier.py", mode])
    run_step([sys.executable, "visualize_results.py", mode])


def main() -> None:
    modes = ["typology", "anomaly"]
    if len(sys.argv) > 1:
        arg = sys.argv[1].strip().lower()
        if arg in {"typology", "anomaly"}:
            modes = [arg]
        elif arg == "both":
            modes = ["typology", "anomaly"]
        else:
            raise ValueError("Usage: python run_all.py [typology|anomaly|both]")

    print("Starting full economic-structure pipeline...")
    print(f"Python executable: {sys.executable}")
    print(f"Project root: {ROOT}")

    for mode in modes:
        run_mode(mode)

    print("\nAll requested runs completed successfully.")
    print("Check model/artifacts and model/artifacts/figures for mode-specific outputs.")


if __name__ == "__main__":
    main()
