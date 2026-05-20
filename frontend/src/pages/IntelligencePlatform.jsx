import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import '../styles/intelligence.css';
import GeoIntelligenceMap from '../components/intelligence/GeoIntelligenceMap';
import EconomicDashboard from '../components/intelligence/EconomicDashboard';
import ZoneInsightPanel from '../components/intelligence/ZoneInsightPanel';
import {
  fetchCities,
  fetchSectors,
  fetchDashboard,
  fetchRecommendations,
} from '../services/intelligenceApi';
import { sanitizeDisplayText } from '../utils/textSanitizer';

const IntelligencePlatform = () => {
  const [cities, setCities] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [city, setCity] = useState('');
  const [sector, setSector] = useState('');
  const [zoneCount, setZoneCount] = useState(0);
  const [dashboard, setDashboard] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [mapLevel, setMapLevel] = useState(1);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCities().then((c) => {
      setCities(c);
      if (c.length && !city) setCity(c[0]);
    });
  }, []);

  useEffect(() => {
    if (!city) return;
    fetchSectors(city).then(setSectors);
    setSector('');
  }, [city]);

  const loadData = useCallback(async () => {
    if (!city) return;
    setLoading(true);
    try {
      const dash = await fetchDashboard({ city, sector: sector || undefined });
      setDashboard(dash);
    } catch (e) {
      console.error(e);
      setDashboard(null);
    }
    try {
      const rec = await fetchRecommendations({
        city,
        sector: sector || undefined,
        limit: 8,
      });
      setRecommendations(rec || []);
    } catch (e) {
      console.warn('Recommendations unavailable:', e);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  }, [city, sector]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectZone = (zone, level) => {
    setSelectedZone(zone);
    setMapLevel(level);
  };

  return (
    <div className="intelligence-platform">
      <header className="intel-header">
        <div>
          <h1>Plateforme d&apos;intelligence économique géospatiale</h1>
          <p>Prédictions ML en temps réel · Données Casablanca · Cellules économiques</p>
        </div>
        <div className="intel-filters">
          <select value={city} onChange={(e) => setCity(e.target.value)} aria-label="Ville">
            {cities.map((c) => (
              <option key={c} value={c}>
                {sanitizeDisplayText(c)}
              </option>
            ))}
          </select>
          <select value={sector} onChange={(e) => setSector(e.target.value)} aria-label="Secteur">
            <option value="">Tous les secteurs</option>
            {sectors.map((s) => (
              <option key={s} value={s}>
                {sanitizeDisplayText(s)}
              </option>
            ))}
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
            <input type="checkbox" checked={showHeatmap} onChange={(e) => setShowHeatmap(e.target.checked)} />
            Heatmap densité
          </label>
          <button
            type="button"
            onClick={() => {
              setMapLevel(1);
              setSelectedZone(null);
            }}
            style={{
              background: '#334155',
              border: 'none',
              color: '#fff',
              padding: '0.5rem 0.75rem',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            Réinitialiser carte
          </button>
        </div>
      </header>

      <EconomicDashboard data={dashboard} loading={loading} />

      <div className="intel-grid" style={{ marginTop: '1rem' }}>
        <motion.div className="intel-panel" layout>
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #334155' }}>
            <strong>Carte interactive</strong>
            <span style={{ float: 'right', fontSize: '0.8rem', color: '#94a3b8' }}>
              {zoneCount.toLocaleString()} zones visibles
            </span>
          </div>
          {loading ? (
            <div className="intel-skeleton" style={{ height: 520 }} />
          ) : (
            <GeoIntelligenceMap
              city={city}
              sector={sector}
              selectedZone={selectedZone}
              onSelectZone={handleSelectZone}
              mapLevel={mapLevel}
              onMapLevelChange={setMapLevel}
              showHeatmap={showHeatmap}
              onZoneCountChange={setZoneCount}
            />
          )}
        </motion.div>

        <div className="intel-panel">
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #334155' }}>
            <strong>IA &amp; explicabilité</strong>
          </div>
          <ZoneInsightPanel zone={selectedZone} recommendations={recommendations} />
        </div>
      </div>
    </div>
  );
};

export default IntelligencePlatform;
