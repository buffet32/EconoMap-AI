import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBrain,
  faChartLine,
  faRobot,
  faLightbulb,
  faMapMarkerAlt,
  faFileAlt,
  faChartBar,
  faStar,
  faCrown,
  faArrowRight
} from '@fortawesome/free-solid-svg-icons';
import './PremiumDashboard.css';

const PremiumDashboard = () => {
  const navigate = useNavigate();
  const [userStats, setUserStats] = useState({
    aiQueries: 247,
    predictionsUsed: 89,
    insightsGenerated: 156,
    premiumDaysLeft: 28
  });

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

  const aiFeatures = [
    {
      id: 'prediction-region',
      title: 'Prédiction par région',
      description: 'Analysez la rentabilité des activités par région avec notre IA avancée',
      icon: faChartLine,
      path: '/ai-features',
      color: '#4fd1c5',
      usage: '89 utilisations ce mois'
    },
    {
      id: 'activity-suggestion',
      title: 'Suggestion par activité',
      description: 'Découvrez les meilleures régions pour développer votre activité',
      icon: faMapMarkerAlt,
      path: '/ai-features?tab=activity',
      color: '#8c54bc',
      usage: '156 recherches'
    },
    {
      id: 'chatbot',
      title: 'Chatbot IA',
      description: 'Posez vos questions à notre assistant IA spécialisé en entrepreneuriat',
      icon: faRobot,
      path: '/ai-features?tab=chatbot',
      color: '#ff6b6b',
      usage: '247 conversations'
    },
    {
      id: 'data-analysis',
      title: 'Analyse de données',
      description: 'Téléchargez vos fichiers et obtenez des insights intelligents',
      icon: faFileAlt,
      path: '/ai-interpretation',
      color: '#ffd93d',
      usage: '34 analyses'
    },
        {
      id: 'business-intelligence',
      title: 'Intelligence économique',
      description: 'Rapports détaillés et recommandations stratégiques',
      icon: faLightbulb,
      path: '/ai-interpretation?tab=market',
      color: '#4d96ff',
      usage: '12 rapports générés'
    }
  ];

  const recentActivity = [
    {
      type: 'prediction',
      title: 'Prédiction réalisée',
      description: 'Analyse de rentabilité pour Marrakech',
      time: 'Il y a 2h',
      icon: faChartLine
    },
    {
      type: 'chat',
      title: 'Conversation avec IA',
      description: 'Conseils sur le secteur technologique',
      time: 'Il y a 5h',
      icon: faRobot
    },
    {
      type: 'analysis',
      title: 'Analyse de données',
      description: 'Rapport sur les tendances marché',
      time: 'Hier',
      icon: faFileAlt
    }
  ];

  return (
    <div className="premium-dashboard-container">
      <div className="premium-header">
        <div className="premium-welcome">
          <div className="premium-badge">
            <FontAwesomeIcon icon={faCrown} />
            <span>Premium</span>
          </div>
          <h1>Tableau de bord IA Premium</h1>
          <p>Exploitez toute la puissance de l'intelligence artificielle pour vos décisions entrepreneuriales</p>
        </div>

        <div className="premium-stats">
          <div className="premium-stat-card">
            <div className="stat-icon">
              <FontAwesomeIcon icon={faBrain} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{userStats.aiQueries}</div>
              <div className="stat-label">Requêtes IA</div>
            </div>
          </div>

          <div className="premium-stat-card">
            <div className="stat-icon">
              <FontAwesomeIcon icon={faChartLine} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{userStats.predictionsUsed}</div>
              <div className="stat-label">Prédictions utilisées</div>
            </div>
          </div>

          <div className="premium-stat-card">
            <div className="stat-icon">
              <FontAwesomeIcon icon={faLightbulb} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{userStats.insightsGenerated}</div>
              <div className="stat-label">Insights générés</div>
            </div>
          </div>

          <div className="premium-stat-card premium">
            <div className="stat-icon">
              <FontAwesomeIcon icon={faStar} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{userStats.premiumDaysLeft}</div>
              <div className="stat-label">Jours restants</div>
            </div>
          </div>
        </div>
      </div>

      <div className="premium-features-section">
        <h2>Fonctionnalités IA disponibles</h2>
        <div className="premium-features-grid">
          {aiFeatures.map((feature) => (
            <Link key={feature.id} to={feature.path} className="premium-feature-card">
              <div className="feature-header">
                <div className="feature-icon" style={{ backgroundColor: feature.color }}>
                  <FontAwesomeIcon icon={feature.icon} />
                </div>
                <div className="feature-arrow">
                  <FontAwesomeIcon icon={faArrowRight} />
                </div>
              </div>

              <div className="feature-content">
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <div className="feature-usage">
                  <span>{feature.usage}</span>
                </div>
              </div>

                          </Link>
          ))}
        </div>
      </div>

      <div className="premium-activity-section">
        <h2>Activité récente</h2>
        <div className="premium-activity-list">
          {recentActivity.map((activity, index) => (
            <div key={index} className="premium-activity-item">
              <div className="activity-icon">
                <FontAwesomeIcon icon={activity.icon} />
              </div>
              <div className="activity-content">
                <h4>{activity.title}</h4>
                <p>{activity.description}</p>
                <span className="activity-time">{activity.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="premium-tips-section">
        <h2>Conseils pour maximiser votre abonnement Premium</h2>
        <div className="premium-tips-grid">
          <div className="premium-tip-card">
            <div className="tip-icon">
              <FontAwesomeIcon icon={faLightbulb} />
            </div>
            <div className="tip-content">
              <h4>Utilisez les prédictions régionales</h4>
              <p>Avant de lancer une nouvelle activité, consultez nos prédictions
              de rentabilité par région pour optimiser vos investissements.</p>
            </div>
          </div>

          <div className="premium-tip-card">
            <div className="tip-icon">
              <FontAwesomeIcon icon={faRobot} />
            </div>
            <div className="tip-content">
              <h4>Dialoguez avec l'IA</h4>
              <p>Le chatbot peut vous aider à affiner vos stratégies et répondre
              à vos questions spécifiques sur l'entrepreneuriat marocain.</p>
            </div>
          </div>

          <div className="premium-tip-card">
            <div className="tip-icon">
              <FontAwesomeIcon icon={faFileAlt} />
            </div>
            <div className="tip-content">
              <h4>Analysez vos données</h4>
              <p>Téléchargez vos rapports et fichiers pour obtenir des analyses
              détaillées et des recommandations personnalisées.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="premium-cta-section">
        <div className="premium-cta-content">
          <h2>Prêt à révolutionner votre approche entrepreneuriale ?</h2>
          <p>Avec nos outils IA Premium, prenez des décisions plus éclairées et
          augmentez vos chances de succès.</p>
                  </div>
      </div>
    </div>
  );
};

export default PremiumDashboard;