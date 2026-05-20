import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMapMarkerAlt,
  faChartLine,
  faLightbulb,
  faSearch,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import {
  fetchCities,
  fetchSectors,
  fetchZones,
  fetchPredict,
  fetchRecommendations,
} from '../services/intelligenceApi';
import { getStoredUser, hasPremiumAccess } from '../utils/auth';
import { sanitizeDisplayText } from '../utils/textSanitizer';
import {
  explainabilityHeading,
  explainabilityIntro,
  formatConfidencePercent,
  formatExplainabilityFactors,
} from '../utils/explainabilityText';
import './AIFeatures.css';

const AIFeatures = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('predict');
  const [cities, setCities] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [city, setCity] = useState('');
  const [sector, setSector] = useState('');
  const [recommendSector, setRecommendSector] = useState('');
  const [cells, setCells] = useState([]);
  const [selectedCellId, setSelectedCellId] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const predictFactors = formatExplainabilityFactors(
    results?.type === 'predict' ? results.data?.explanations?.score || [] : []
  );

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!hasPremiumAccess(user)) navigate('/premium-access');
  }, [navigate]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'recommend' || tab === 'activity') setActiveTab('recommend');
    else if (tab === 'predict' || tab === 'prediction') setActiveTab('predict');
  }, [searchParams]);

  useEffect(() => {
    fetchCities().then((c) => {
      setCities(c);
      if (c.length) setCity(c[0]);
    });
  }, []);

  useEffect(() => {
    if (!city) return;
    fetchSectors(city).then((s) => {
      setSectors(s);
      if (s.length) {
        setSector((prev) => (prev && s.includes(prev) ? prev : s[0]));
        setRecommendSector((prev) => (prev && s.includes(prev) ? prev : s[0]));
      }
    });
  }, [city]);

  useEffect(() => {
    if (!city || !sector) return;
    fetchZones({ city, sector }).then((data) => {
      const list = data.zones || [];
      setCells(list);
      if (list.length) setSelectedCellId(String(list[0].id));
    });
  }, [city, sector]);

  const handlePredict = async () => {
    if (!city || !sector) return;
    setLoading(true);
    setError('');
    setResults(null);
    try {
      const params = { city, sector_main: sector };
      if (selectedCellId) params.id = selectedCellId;
      const data = await fetchPredict(params);
      setResults({ type: 'predict', data });
    } catch {
      setError('Impossible de calculer la prédiction. Vérifiez que le serveur API est démarré.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecommend = async () => {
    if (!city || !recommendSector) return;
    setLoading(true);
    setError('');
    setResults(null);
    try {
      const recs = await fetchRecommendations({
        city,
        sector: recommendSector,
        limit: 8,
      });
      setResults({ type: 'recommend', data: recs, sector: recommendSector });
    } catch {
      setError('Impossible de charger les recommandations.');
    } finally {
      setLoading(false);
    }
  };

  const renderPredict = () => (
    <div className="ai-feature-section ai-layout-block">
      <div className="ai-input-section">
        <h3>Prédiction d&apos;attractivité économique</h3>
        <p className="ai-description">
          Choisissez une ville et un secteur. Le modèle ML calcule le score, la classe et
          les facteurs explicatifs en temps réel.
        </p>
        <div className="ai-form-grid">
          <label className="ai-field">
            <span>Ville</span>
            <select value={city} onChange={(e) => setCity(e.target.value)} className="ai-select">
              {cities.map((c) => (
                <option key={c} value={c}>{sanitizeDisplayText(c)}</option>
              ))}
            </select>
          </label>
          <label className="ai-field">
            <span>Secteur</span>
            <select value={sector} onChange={(e) => setSector(e.target.value)} className="ai-select">
              {sectors.map((s) => (
                <option key={s} value={s}>{sanitizeDisplayText(s)}</option>
              ))}
            </select>
          </label>
          {cells.length > 0 && (
            <label className="ai-field ai-field-wide">
              <span>Cellule économique</span>
              <select
                value={selectedCellId}
                onChange={(e) => setSelectedCellId(e.target.value)}
                className="ai-select"
              >
                {cells.map((c) => (
                  <option key={c.id} value={c.id}>
                    {sanitizeDisplayText(c.display_name)} — {c.entity_count_real} entités
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        <div className="ai-actions-row">
          <button
            type="button"
            onClick={handlePredict}
            disabled={loading || !city || !sector}
            className="ai-button primary"
          >
            {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faSearch} />}
            Lancer la prédiction ML
          </button>
        </div>
      </div>

      {results?.type === 'predict' && (
        <div className="ai-results-section ai-fade-in">
          <h4>Résultat — {sanitizeDisplayText(city)} · {sanitizeDisplayText(sector)}</h4>
          <div className="ai-predictions-grid">
            <div className="ai-prediction-card ai-prediction-card-main">
              <div className="ai-prediction-header">
                <h5>Score d&apos;attractivité</h5>
                <div className="ai-profitability-score">
                  <span className="score">{results.data.attractivity_score}</span>
                  <span className="label">/ 100</span>
                </div>
              </div>
              <p className="ai-meta-line">
                Classe : <strong>{results.data.attractivity_class}</strong>
                {' · '}
                Confiance estimée {formatConfidencePercent(results.data.class_confidence)}
              </p>
              <p className="ai-meta-line">
                Secteur recommandé : <strong>{sanitizeDisplayText(results.data.recommended_sector) || 'Non disponible'}</strong>
              </p>
            </div>
          </div>
          {predictFactors.length > 0 && (
            <div className="ai-explain-block">
              <h5>{explainabilityHeading(results.data.attractivity_class)}</h5>
              <p className="ai-meta-line">{explainabilityIntro()}</p>
              <ul className="ai-explain-list">
                {predictFactors.map((factor) => (
                  <li key={factor.id}>
                    <span>{factor.label}</span>
                    <span>{factor.percent}%</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderRecommend = () => (
    <div className="ai-feature-section ai-layout-block">
      <div className="ai-input-section">
        <h3>Recommandation de zones par secteur</h3>
        <p className="ai-description">
          Le modèle identifie les cellules les plus attractives pour le secteur choisi.
        </p>
        <div className="ai-form-grid">
          <label className="ai-field">
            <span>Ville</span>
            <select value={city} onChange={(e) => setCity(e.target.value)} className="ai-select">
              {cities.map((c) => (
                <option key={c} value={c}>{sanitizeDisplayText(c)}</option>
              ))}
            </select>
          </label>
          <label className="ai-field">
            <span>Secteur cible</span>
            <select
              value={recommendSector}
              onChange={(e) => setRecommendSector(e.target.value)}
              className="ai-select"
            >
              {sectors.map((s) => (
                <option key={s} value={s}>{sanitizeDisplayText(s)}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="ai-actions-row">
          <button
            type="button"
            onClick={handleRecommend}
            disabled={loading || !recommendSector}
            className="ai-button primary"
          >
            {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faLightbulb} />}
            Recommander les meilleures zones
          </button>
        </div>
      </div>

      {results?.type === 'recommend' && (
        <div className="ai-results-section ai-fade-in">
          <h4>Top zones — {sanitizeDisplayText(results.sector)}</h4>
          <div className="ai-suggestions-list">
            {results.data.map((z, index) => (
            <div key={`${z.display_name}-${index}`} className="ai-suggestion-card">
                <div className="ai-suggestion-header">
                  <div className="ai-region-info">
                    <FontAwesomeIcon icon={faMapMarkerAlt} />
                  <h5>{sanitizeDisplayText(z.display_name)}</h5>
                  </div>
                  <div className="ai-score">
                    <span className="score">{z.predicted_score}</span>
                    <span className="label">Score ML</span>
                  </div>
                </div>
                <p className="ai-meta-line">
                  {sanitizeDisplayText(z.sector_main)} · {z.entity_count_real} entités
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="ai-features-container">
      <header className="ai-header">
        <h2>Prédictions ML</h2>
        <p>Modèles entraînés — choisissez ville, secteur et lancez l&apos;inférence</p>
      </header>

      <nav className="ai-tabs" aria-label="Outils ML">
        <button
          type="button"
          className={`ai-tab ${activeTab === 'predict' ? 'active' : ''}`}
          onClick={() => setActiveTab('predict')}
        >
          <FontAwesomeIcon icon={faChartLine} />
          Attractivité par zone
        </button>
        <button
          type="button"
          className={`ai-tab ${activeTab === 'recommend' ? 'active' : ''}`}
          onClick={() => setActiveTab('recommend')}
        >
          <FontAwesomeIcon icon={faLightbulb} />
          Zones recommandées
        </button>
      </nav>

      {error && <p className="ai-error-banner">{error}</p>}

      <main className="ai-content">
        {activeTab === 'predict' ? renderPredict() : renderRecommend()}
      </main>
    </div>
  );
};

export default AIFeatures;