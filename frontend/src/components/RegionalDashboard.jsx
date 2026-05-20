import React, { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBuilding,
  faChartLine,
  faIndustry,
  faMapMarkerAlt,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import './RegionalDashboard.css';
import { fetchCities, fetchDashboard } from '../services/intelligenceApi';
import { formatConfidencePercent } from '../utils/explainabilityText';

const INVALID_SECTORS = new Set(['', 'nan', 'none', 'null', 'n/a', '-', 'unknown']);

const isValidSectorName = (value) => {
  const normalized = String(value ?? '').trim().toLowerCase();
  return !INVALID_SECTORS.has(normalized);
};

const RegionalDashboard = () => {
  const [selectedRegion, setSelectedRegion] = useState('');
  const [regions, setRegions] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCities().then((cities) => {
      setRegions(cities || []);
      if (cities?.length) setSelectedRegion(cities[0]);
    });
  }, []);

  useEffect(() => {
    if (!selectedRegion) return;
    setLoading(true);
    fetchDashboard(selectedRegion)
      .then((data) => setDashboard(data))
      .finally(() => setLoading(false));
  }, [selectedRegion]);

  const topSectors = useMemo(
    () => {
      const source = dashboard?.top_sectors || dashboard?.enterprises_by_sector || [];
      const grouped = new Map();

      source.forEach((sector) => {
        const rawLabel = String(sector?.sector_main ?? '').trim();
        const label = isValidSectorName(rawLabel) ? rawLabel : 'Other';
        const count = Number(sector?.count) || 0;
        grouped.set(label, (grouped.get(label) || 0) + count);
      });

      return [...grouped.entries()]
        .map(([sector_main, count]) => ({ sector_main, count }))
        .sort((a, b) => b.count - a.count);
    },
    [dashboard]
  );
  const topZones = dashboard?.top_zones || dashboard?.top_attractive_zones || [];
  const regionalAnalytics = useMemo(
    () => (dashboard?.regional_analytics || []).slice(0, 6),
    [dashboard]
  );

  if (loading || !dashboard) {
    return (
      <div className="regional-dashboard-container">
        <div className="loading-spinner">
          <FontAwesomeIcon icon={faMapMarkerAlt} spin size="2x" />
          <p>Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="regional-dashboard-container">
      <div className="regional-header">
        <div className="regional-selector">
          <FontAwesomeIcon icon={faMapMarkerAlt} className="selector-icon" />
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="region-select"
          >
            {regions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </div>
        <div className="header-title">
          <h1>Dashboard Régional: {selectedRegion}</h1>
          <p>Analyse économique dynamique basée sur la base de données</p>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">
            <FontAwesomeIcon icon={faBuilding} />
          </div>
          <div className="metric-content">
            <div className="metric-value">{(dashboard.total_entities || 0).toLocaleString()}</div>
            <div className="metric-label">Entités totales</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">
            <FontAwesomeIcon icon={faUsers} />
          </div>
          <div className="metric-content">
            <div className="metric-value">{(dashboard.active_companies || 0).toLocaleString()}</div>
            <div className="metric-label">Entreprises actives</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">
            <FontAwesomeIcon icon={faChartLine} />
          </div>
          <div className="metric-content">
            <div className="metric-value">{((dashboard.active_rate || 0) * 100).toFixed(1)}%</div>
            <div className="metric-label">Taux d&apos;activité</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">
            <FontAwesomeIcon icon={faIndustry} />
          </div>
          <div className="metric-content">
            <div className="metric-value">{(dashboard.avg_sector_diversity || 0).toFixed(2)}</div>
            <div className="metric-label">Diversité sectorielle</div>
          </div>
        </div>
      </div>

      <div className="sectors-section">
        <h2>Top Secteurs</h2>
        <div className="sectors-grid">
          {topSectors.slice(0, 8).map((sector, index) => {
            const pct = dashboard.total_entities
              ? Math.round(((sector.count || 0) / dashboard.total_entities) * 100)
              : 0;
            return (
              <div key={`${sector.sector_main}-${index}`} className="sector-card">
                <div className="sector-header">
                  <h4>{sector.sector_main}</h4>
                  <span className="sector-percentage">{pct}%</span>
                </div>
                <div className="sector-progress">
                  <div className="progress-bar" style={{ width: `${pct}%` }} />
                </div>
                <div className="sector-count">{sector.count} entreprises</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="insights-section">
        <h2>Top Zones (inférence ML)</h2>
        <div className="insights-grid">
          {topZones.slice(0, 6).map((zone) => (
            <div key={`${zone.id}-${zone.display_name}`} className="insight-card positive">
              <div className="insight-header">
                <h3>{zone.display_name}</h3>
                <span className="insight-score">{zone.predicted_score ?? 'N/A'}</span>
              </div>
              <p>
                {zone.sector_main} · {zone.entity_count_real} entités · confiance{' '}
                {formatConfidencePercent(zone.class_confidence)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="size-distribution-section">
        <h2>Analytique régionale</h2>
        <div className="size-grid">
          {regionalAnalytics.map((region, index) => (
            <div key={`${region.region_name}-${index}`} className="size-card">
              <div className="size-label">{region.region_name || 'Unknown Region'}</div>
              <div className="size-percentage">{region.entities || 0}</div>
              <div className="size-count">{region.zones || 0} zones</div>
              <div className="size-bar" style={{ width: `${Math.min(100, (region.avg_density || 0) * 20)}%` }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RegionalDashboard;
