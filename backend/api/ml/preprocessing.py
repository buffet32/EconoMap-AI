import pandas as pd

from .features import engineer_features, get_feature_list_a, get_feature_list_b


def cells_to_dataframe(cells_queryset) -> pd.DataFrame:
    rows = []
    for cell in cells_queryset:
        rows.append(
            {
                "cell_id": cell.cell_id,
                "cell_lat": float(cell.cell_lat),
                "cell_lon": float(cell.cell_lon),
                "city": cell.city,
                "sector_main": cell.sector_main,
                "entity_count_real": cell.entity_count_real,
                "entity_count_total": cell.entity_count_total,
                "density_log": cell.density_log,
                "active_rate": cell.active_rate,
                "capital_median": cell.capital_median,
                "capital_mean": cell.capital_mean,
                "capital_max": cell.capital_max,
                "sector_diversity": cell.sector_diversity,
                "formal_ratio": cell.formal_ratio,
                "sarl_count": cell.sarl_count,
                "sa_count": cell.sa_count,
            }
        )
    return pd.DataFrame(rows)


def row_to_dataframe(row: dict, context_df: pd.DataFrame) -> pd.DataFrame:
    """Build a single-row frame with city aggregates from context."""
    single = pd.DataFrame([row])
    combined = pd.concat([context_df, single], ignore_index=True)
    engineered = engineer_features(combined)
    return engineered.tail(1).copy()


def prepare_features_a(df: pd.DataFrame) -> pd.DataFrame:
    num_feat, cat_feat = get_feature_list_a()
    engineered = engineer_features(df)
    cols = [c for c in num_feat + cat_feat if c in engineered.columns]
    return engineered[cols]


def prepare_features_b(df: pd.DataFrame) -> pd.DataFrame:
    num_feat, cat_feat = get_feature_list_b()
    engineered = engineer_features(df)
    cols = [c for c in num_feat + cat_feat if c in engineered.columns]
    return engineered[cols]
