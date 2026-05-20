import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBrain,
  faFileAlt,
  faChartBar,
  faLightbulb,
  faUpload,
  faSpinner,
  faCheckCircle,
  faExclamationTriangle,
  faDownload
} from '@fortawesome/free-solid-svg-icons';
import './AIInterpretation.css';

const AIInterpretation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('data-analysis');
  const [selectedFile, setSelectedFile] = useState(null);
  const [analysisText, setAnalysisText] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }

    try {
      const userData = JSON.parse(storedUser);
      if (!userData.user || !(userData.user.is_premium || userData.user.subscription_type === 'premium')) {
        navigate('/payment');
      }
    } catch (error) {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'market') {
      setActiveTab('market-insights');
    } else if (tab === 'data') {
      setActiveTab('data-analysis');
    }
  }, [searchParams]);

  // Mock analysis results
  const mockAnalysisResults = {
    summary: "L'analyse révèle une tendance positive dans le secteur technologique avec une croissance de 15% sur les 6 derniers mois.",
    insights: [
      {
        type: "positive",
        title: "Croissance sectorielle",
        description: "Le secteur technologique montre une croissance de 15% supérieure à la moyenne nationale.",
        confidence: 92
      },
      {
        type: "opportunity",
        title: "Opportunité de marché",
        description: "Le segment des applications mobiles présente un potentiel de croissance de 25%.",
        confidence: 88
      },
      {
        type: "warning",
        title: "Concurrence accrue",
        description: "L'entrée de nouveaux acteurs pourrait intensifier la compétition dans les 12 prochains mois.",
        confidence: 76
      }
    ],
    recommendations: [
      "Investir dans la R&D mobile",
      "Développer des partenariats stratégiques",
      "Optimiser la présence digitale"
    ],
    metrics: {
      marketSize: "2.5 milliards MAD",
      growthRate: "+15%",
      competitionLevel: "Moyen",
      entryBarriers: "Élevées"
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleAnalysis = async () => {
    if (!analysisText.trim() && !selectedFile) return;

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setResults(mockAnalysisResults);
      setLoading(false);
    }, 3000);
  };

  const renderDataAnalysis = () => (
    <div className="ai-interpretation-section">
      <div className="ai-input-section">
        <h3>Analyse de données et interprétation IA</h3>
        <p className="ai-description">
          Téléchargez un fichier de données ou saisissez du texte pour obtenir une analyse
          intelligente et des insights actionnables.
        </p>

        <div className="ai-upload-section">
          <div className="ai-file-upload">
            <input
              type="file"
              id="file-upload"
              accept=".csv,.xlsx,.pdf,.txt,.json"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <label htmlFor="file-upload" className="ai-upload-label">
              <FontAwesomeIcon icon={faUpload} />
              <span>Choisir un fichier</span>
              <small>CSV, Excel, PDF, TXT, JSON</small>
            </label>
            {selectedFile && (
              <div className="ai-selected-file">
                <FontAwesomeIcon icon={faFileAlt} />
                <span>{selectedFile.name}</span>
              </div>
            )}
          </div>

          <div className="ai-text-input-section">
            <h4>Ou saisissez votre texte d'analyse</h4>
            <textarea
              placeholder="Collez vos données ou décrivez ce que vous souhaitez analyser..."
              value={analysisText}
              onChange={(e) => setAnalysisText(e.target.value)}
              className="ai-textarea"
              rows={6}
            />
          </div>
        </div>

        <button
          onClick={handleAnalysis}
          disabled={loading || (!analysisText.trim() && !selectedFile)}
          className="ai-button primary large"
        >
          {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faBrain} />}
          Analyser avec IA
        </button>
      </div>

      {results && (
        <div className="ai-results-section">
          <div className="ai-results-header">
            <h4>Résultats de l'analyse IA</h4>
            <button className="ai-export-button">
              <FontAwesomeIcon icon={faDownload} />
              Exporter
            </button>
          </div>

          <div className="ai-summary-card">
            <h5>Résumé exécutif</h5>
            <p>{results.summary}</p>
          </div>

          <div className="ai-insights-grid">
            {results.insights.map((insight, index) => (
              <div key={index} className={`ai-insight-card ${insight.type}`}>
                <div className="ai-insight-header">
                  <div className="ai-insight-icon">
                    {insight.type === 'positive' && <FontAwesomeIcon icon={faCheckCircle} />}
                    {insight.type === 'opportunity' && <FontAwesomeIcon icon={faLightbulb} />}
                    {insight.type === 'warning' && <FontAwesomeIcon icon={faExclamationTriangle} />}
                  </div>
                  <div className="ai-insight-meta">
                    <h6>{insight.title}</h6>
                    <span className="ai-confidence">Confiance: {insight.confidence}%</span>
                  </div>
                </div>
                <p>{insight.description}</p>
              </div>
            ))}
          </div>

          <div className="ai-recommendations-card">
            <h5>Recommandations</h5>
            <ul>
              {results.recommendations.map((rec, index) => (
                <li key={index}>
                  <FontAwesomeIcon icon={faLightbulb} />
                  {rec}
                </li>
              ))}
            </ul>
          </div>

          <div className="ai-metrics-grid">
            <div className="ai-metric-card">
              <div className="ai-metric-value">{results.metrics.marketSize}</div>
              <div className="ai-metric-label">Taille du marché</div>
            </div>
            <div className="ai-metric-card">
              <div className="ai-metric-value">{results.metrics.growthRate}</div>
              <div className="ai-metric-label">Taux de croissance</div>
            </div>
            <div className="ai-metric-card">
              <div className="ai-metric-value">{results.metrics.competitionLevel}</div>
              <div className="ai-metric-label">Niveau de concurrence</div>
            </div>
            <div className="ai-metric-card">
              <div className="ai-metric-value">{results.metrics.entryBarriers}</div>
              <div className="ai-metric-label">Barrières d'entrée</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderMarketInsights = () => (
    <div className="ai-interpretation-section">
      <div className="ai-market-insights">
        <h3>Insights marché en temps réel</h3>
        <p className="ai-description">
          Découvrez les tendances actuelles et les opportunités du marché marocain
          analysées par notre IA.
        </p>

        <div className="ai-market-grid">
          <div className="ai-market-card trending">
            <div className="ai-market-header">
              <FontAwesomeIcon icon={faChartBar} />
              <h4>Secteur Technologique</h4>
            </div>
            <div className="ai-market-stats">
              <div className="ai-stat">
                <span className="ai-stat-value">+23%</span>
                <span className="ai-stat-label">Croissance</span>
              </div>
              <div className="ai-stat">
                <span className="ai-stat-value">156</span>
                <span className="ai-stat-label">Nouvelles entreprises</span>
              </div>
            </div>
            <p className="ai-market-insight">
              Le secteur tech marocain montre une dynamique exceptionnelle avec
              l'émergence de startups fintech et edtech.
            </p>
          </div>

          <div className="ai-market-card opportunity">
            <div className="ai-market-header">
              <FontAwesomeIcon icon={faLightbulb} />
              <h4>Énergie Renouvelable</h4>
            </div>
            <div className="ai-market-stats">
              <div className="ai-stat">
                <span className="ai-stat-value">+31%</span>
                <span className="ai-stat-label">Investissements</span>
              </div>
              <div className="ai-stat">
                <span className="ai-stat-value">89</span>
                <span className="ai-stat-label">Projets actifs</span>
              </div>
            </div>
            <p className="ai-market-insight">
              Les investissements dans les énergies renouvelables atteignent des
              niveaux records avec un focus sur l'éolien et le solaire.
            </p>
          </div>

          <div className="ai-market-card warning">
            <div className="ai-market-header">
              <FontAwesomeIcon icon={faExclamationTriangle} />
              <h4>Commerce Traditionnel</h4>
            </div>
            <div className="ai-market-stats">
              <div className="ai-stat">
                <span className="ai-stat-value">-8%</span>
                <span className="ai-stat-label">Évolution</span>
              </div>
              <div className="ai-stat">
                <span className="ai-stat-value">234</span>
                <span className="ai-stat-label">Fermetures</span>
              </div>
            </div>
            <p className="ai-market-insight">
              Le commerce traditionnel fait face à des défis croissants avec
              la montée du e-commerce et des centres commerciaux modernes.
            </p>
          </div>
        </div>

        <div className="ai-market-alerts">
          <h4>Alertes importantes</h4>
          <div className="ai-alerts-list">
            <div className="ai-alert positive">
              <FontAwesomeIcon icon={faCheckCircle} />
              <div className="ai-alert-content">
                <h5>Nouvelle opportunité: Export digital</h5>
                <p>Le Maroc se positionne comme hub d'export digital vers l'Afrique</p>
              </div>
            </div>
            <div className="ai-alert info">
              <FontAwesomeIcon icon={faLightbulb} />
              <div className="ai-alert-content">
                <h5>Tendance: Intelligence Artificielle</h5>
                <p>Plus de 50 startups IA créées cette année au Maroc</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="ai-interpretation-container">
      <div className="ai-header">
        <h2>Interprétation IA Avancée</h2>
        <p>Analysez vos données et obtenez des insights intelligents pour prendre de meilleures décisions</p>
      </div>

      <div className="ai-tabs">
        <button
          className={`ai-tab ${activeTab === 'data-analysis' ? 'active' : ''}`}
          onClick={() => setActiveTab('data-analysis')}
        >
          <FontAwesomeIcon icon={faBrain} />
          Analyse de données
        </button>
        <button
          className={`ai-tab ${activeTab === 'market-insights' ? 'active' : ''}`}
          onClick={() => setActiveTab('market-insights')}
        >
          <FontAwesomeIcon icon={faChartBar} />
          Insights marché
        </button>
      </div>

      <div className="ai-content">
        {activeTab === 'data-analysis' && renderDataAnalysis()}
        {activeTab === 'market-insights' && renderMarketInsights()}
      </div>

      <div className="ai-premium-banner">
        <FontAwesomeIcon icon={faCheckCircle} />
        <span>Cette fonctionnalité avancée est réservée aux comptes Premium</span>
      </div>
    </div>
  );
};

export default AIInterpretation;