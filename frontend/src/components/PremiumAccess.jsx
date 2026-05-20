import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCrown, faLock, faArrowRight, faCreditCard } from '@fortawesome/free-solid-svg-icons';
import './PremiumAccess.css';

const PremiumAccess = () => {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser).user;
        setIsPremium(user && (user.is_premium || user.subscription_type === 'premium' || user.role === 'admin' || user.role === 'responsable'));
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    setLoading(false);
  }, []);

  const handlePayment = async () => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      // Redirect to Login page if not logged in
      navigate('/login');
      return;
    }

    // Redirect to payment page if logged in
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="premium-access-container">
        <div className="loading-spinner">
          <FontAwesomeIcon icon={faCrown} spin size="2x" />
          <p>Vérification de votre statut...</p>
        </div>
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="premium-access-container">
        <div className="premium-locked">
          <div className="premium-icon">
            <FontAwesomeIcon icon={faLock} size="3x" />
          </div>
          <h2>Fonctionnalités IA Premium</h2>
          <p>Cette section est réservée aux utilisateurs Premium.</p>
          <div className="premium-benefits">
            <h3>Avantages Premium :</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                {
                  bg: '#E6F1FB', stroke: '#185FA5',
                  label: "Prédiction d'attractivité par zone (modèles A)",
                  icon: <><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></>
                },
                {
                  bg: '#EEEDFE', stroke: '#534AB7',
                  label: "Recommandation de zones par secteur (modèle B)",
                  icon: <><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8" strokeDasharray="3 2"/></>
                },
                {
                  bg: '#EAF3DE', stroke: '#3B6D11',
                  label: "Explicabilité SHAP des prédictions",
                  icon: <><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></>
                },
              ].map(({ bg, stroke, label, icon }, i) => (
                <li key={i} style={{ 
  display: 'flex', 
  alignItems: 'center', 
  gap: '14px', 
  background: 'rgba(255, 255, 255, 0.05)', 
  border: '1px solid rgba(255,255,255,0.1)', 
  borderRadius: '12px', 
  padding: '14px 16px' 
}}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      {icon}
                    </svg>
                  </div>
                  <span style={{ fontSize: 14, color: '#ffffff' }}>
                    {label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="premium-cta" style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(79,209,197,0.1)', borderRadius: 10, border: '1px solid rgba(79,209,197,0.3)' }}>
            <p style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Comptes de démonstration</p>
            <p style={{ fontSize: '0.9rem', margin: 0 }}>
              Premium : <code>premium</code> / <code>Premium123!</code><br />
              Admin : <code>admin</code> / <code>Admin123!</code>
            </p>
          </div>
          <div className="premium-cta">
            <p>Connectez-vous avec un compte premium pour accéder aux prédictions ML.</p>
            <div className="premium-actions">
              <button 
                className="pay-btn" 
                onClick={handlePayment}
                disabled={processingPayment}
              >
                {processingPayment ? (
                  <>
                    <FontAwesomeIcon icon={faCreditCard} spin />
                    <span>Traitement...</span>
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faCreditCard} />
                    <span>Payer maintenant</span>
                  </>
                )}
              </button>
              <Link to="/" className="back-home-btn">
                Retour à l'accueil
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="premium-access-container">
      <div className="premium-welcome">
        <div className="premium-badge">
          <FontAwesomeIcon icon={faCrown} />
          <span>Accès Premium Confirmé</span>
        </div>
        <h2>Bienvenue dans votre espace IA Premium !</h2>
        <p>Explorez toutes les fonctionnalités d'intelligence artificielle conçues pour optimiser vos décisions entrepreneuriales.</p>

        <div className="premium-quick-access">
          <h3>Accès rapide :</h3>
          <div className="quick-access-grid">
            <Link to="/ai-features?tab=predict" className="quick-access-card">
              <div className="card-icon">
                <FontAwesomeIcon icon={faCrown} />
              </div>
              <div className="card-content">
                <h4>Attractivité par zone</h4>
                <p>Score ML, classe et explicabilité</p>
              </div>
              <FontAwesomeIcon icon={faArrowRight} className="card-arrow" />
            </Link>

            <Link to="/ai-features?tab=recommend" className="quick-access-card">
              <div className="card-icon">
                🤖
              </div>
              <div className="card-content">
                <h4>Zones recommandées</h4>
                <p>Top cellules pour un secteur</p>
              </div>
              <FontAwesomeIcon icon={faArrowRight} className="card-arrow" />
            </Link>

            <Link to="/" className="quick-access-card">
              <div className="card-icon">🗺️</div>
              <div className="card-content">
                <h4>Carte intelligence</h4>
                <p>Exploration géospatiale</p>
              </div>
              <FontAwesomeIcon icon={faArrowRight} className="card-arrow" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumAccess;