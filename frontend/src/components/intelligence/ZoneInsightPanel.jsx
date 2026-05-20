import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fetchInsights } from '../../services/intelligenceApi';
import { sanitizeDisplayText } from '../../utils/textSanitizer';
import {
  explainabilityHeading,
  explainabilityIntro,
  formatConfidencePercent,
  formatExplainabilityFactors,
} from '../../utils/explainabilityText';

const ZoneInsightPanel = ({ zone, recommendations }) => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!zone?.id) {
      setInsights(null);
      return;
    }
    setLoading(true);
    fetchInsights(zone.id)
      .then(setInsights)
      .catch(() => setInsights(null))
      .finally(() => setLoading(false));
  }, [zone?.id]);

  if (!zone) {
    return (
      <div className="intel-side">
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
          Sélectionnez une zone sur la carte pour voir les prédictions ML et l&apos;explicabilité.
        </p>
        {recommendations?.length > 0 && (
          <>
            <h4 style={{ marginTop: '1rem' }}>Recommandations ML</h4>
            {recommendations.map((r) => (
              <div key={`${r.display_name}-${r.sector_main}`} className="intel-zone-card">
                <strong>{sanitizeDisplayText(r.display_name)}</strong> — {sanitizeDisplayText(r.sector_main)}
                <br />
                <span className="intel-badge" style={{ background: '#4fd1c533', color: '#4fd1c5' }}>
                  Score {r.predicted_score}
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    );
  }

  const pred = insights?.zone?.prediction || zone.prediction;
  const explainabilityFactors = formatExplainabilityFactors(pred?.explanations?.score || []);

  return (
    <div className="intel-side">
      <motion.div
        key={zone.id}
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        className="intel-zone-card active"
      >
        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem' }}>
          {sanitizeDisplayText(zone.display_name)} · {sanitizeDisplayText(zone.sector_main)}
        </h3>
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
          {sanitizeDisplayText(zone.city)} · {zone.entity_count_real} entités · densité {zone.density_log?.toFixed(2)}
        </p>
      </motion.div>

      {loading && <div className="intel-skeleton" style={{ height: 100, marginTop: 8 }} />}

      {pred && !loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: '0.75rem' }}>
          <h4 style={{ fontSize: '0.85rem', color: '#4fd1c5' }}>Prédiction ML (temps réel)</h4>
          <p>
            Score: <strong>{pred.attractivity_score}</strong> · Classe:{' '}
            <span className="intel-badge" style={{ background: '#8c54bc44', color: '#c4b5fd' }}>
              {pred.attractivity_class}
            </span>{' '}
            (confiance estimée {formatConfidencePercent(pred.class_confidence)})
          </p>
          <p style={{ fontSize: '0.85rem' }}>
            Secteur recommandé: <strong>{sanitizeDisplayText(pred.recommended_sector) || 'Non disponible'}</strong>
          </p>

          <h4 style={{ fontSize: '0.85rem', marginTop: '1rem' }}>
            {explainabilityHeading(pred.attractivity_class)}
          </h4>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{explainabilityIntro()}</p>
          <ul className="intel-explain" style={{ listStyle: 'none', padding: 0 }}>
            {explainabilityFactors.map((factor) => (
              <li key={factor.id}>
                <span>{factor.label}</span>
                <span>{factor.percent}%</span>
              </li>
            ))}
          </ul>
          {insights?.summary && (
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.75rem' }}>{insights.summary}</p>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default ZoneInsightPanel;
