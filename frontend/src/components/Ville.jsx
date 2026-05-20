import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBuilding,
  faMapMarkerAlt,
  faPhoneAlt,
  faEnvelope,
  faGlobe,
  faIndustry,
  faArrowLeft,
  faEye,
  faEdit,
  faTrash,
  faCity
} from '@fortawesome/free-solid-svg-icons';
import "./HomeDashboard.css";

const Ville = () => {
  const { ville } = useParams();
  const [entreprises, setEntreprises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();

  // Define city-specific colors and icons based on company count
  const getCityConfig = (count) => {
    if (count >= 20) return { 
      color: '#10B981', 
      icon: '🏙️', 
      bgGradient: 'linear-gradient(135deg, #10B981, #059669)',
      size: 'large'
    };
    if (count >= 10) return { 
      color: '#3B82F6', 
      icon: '🏘️', 
      bgGradient: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
      size: 'medium'
    };
    if (count >= 5) return { 
      color: '#F59E0B', 
      icon: '🏡', 
      bgGradient: 'linear-gradient(135deg, #F59E0B, #D97706)',
      size: 'small'
    };
    return { 
      color: '#6B7280', 
      icon: '🏠', 
      bgGradient: 'linear-gradient(135deg, #6B7280, #4B5563)',
      size: 'tiny'
    };
  };

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/entreprises/")
      .then((res) => res.json())
      .then((data) => {
        const cityCompanies = data.filter(e => e.ville === ville);
        setEntreprises(cityCompanies);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [ville]);

  // Handle delete company
  const handleDelete = async (id, nomEntreprise) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'entreprise "${nomEntreprise}" ?`)) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/entreprises/${id}/`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      // Remove from local state
      setEntreprises(prev => prev.filter(e => e.id !== id));
      alert('Entreprise supprimée avec succès!');
    } catch (error) {
      console.error('Delete error:', error);
      alert('Erreur lors de la suppression de l\'entreprise');
    } finally {
      setDeletingId(null);
    }
  };

  // Check user permissions
  const storedUser = localStorage.getItem('user');
  let isAdmin = false;
  let canAddEntreprise = false;
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser).user;
      isAdmin = user && user.role === 'admin';
      canAddEntreprise = user && (user.role === 'admin' || user.role === 'responsable');
    } catch {}
  }

  // Get city configuration based on company count
  const config = getCityConfig(entreprises.length);

  if (loading) {
    return (
      <div className="dashboard-container">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '50vh',
          color: '#fff',
          fontSize: '1.2rem'
        }}>
          Chargement...
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header Section with City Info */}
      <div style={{
        background: config.bgGradient,
        borderRadius: '20px',
        padding: '2rem',
        marginBottom: '2rem',
        color: '#fff',
        textAlign: 'center',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(255,255,255,0.1)',
          pointerEvents: 'none'
        }} />
        <div style={{ fontSize: '4rem', marginBottom: '1rem', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}>
          {config.icon}
        </div>
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: '700', 
          marginBottom: '0.5rem',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }}>
          Ville : {ville}
        </h1>
        <p style={{ 
          fontSize: '1.2rem', 
          opacity: 0.9,
          marginBottom: '1rem'
        }}>
          {entreprises.length} entreprise{entreprises.length > 1 ? 's' : ''} trouvée{entreprises.length > 1 ? 's' : ''}
        </p>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <button 
            onClick={() => navigate(-1)}
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: '#fff',
              border: '2px solid rgba(255,255,255,0.3)',
              borderRadius: '12px',
              padding: '12px 24px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(10px)'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.3)';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.2)';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            <FontAwesomeIcon icon={faArrowLeft} style={{ marginRight: '8px' }} />
            Retour
          </button>
          {canAddEntreprise && (
            <Link to="/ajouter-entreprise" style={{ textDecoration: 'none' }}>
              <button style={{
                background: 'rgba(255,255,255,0.2)',
                color: '#fff',
                border: '2px solid rgba(255,255,255,0.3)',
                borderRadius: '12px',
                padding: '12px 24px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.3)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.2)';
                e.target.style.transform = 'translateY(0)';
              }}
              >
                <FontAwesomeIcon icon={faBuilding} style={{ marginRight: '8px' }} />
                Ajouter entreprise
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* City Statistics */}
      {entreprises.length > 0 && (
        <div style={{
          background: 'rgba(30,30,50,0.95)',
          borderRadius: '16px',
          padding: '1.5rem',
          marginBottom: '2rem',
          color: '#fff',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ 
            color: config.color, 
            marginBottom: '1rem',
            fontSize: '1.3rem',
            fontWeight: '600'
          }}>
            <FontAwesomeIcon icon={faCity} style={{ marginRight: '8px' }} />
            Statistiques de {ville}
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '1rem',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: config.color }}>
                {entreprises.length}
              </div>
              <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                Entreprises
              </div>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '1rem',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: config.color }}>
                {[...new Set(entreprises.map(e => e.secteur))].length}
              </div>
              <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                Secteurs
              </div>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '1rem',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: config.color }}>
                {entreprises.filter(e => e.type === 'PM').length}
              </div>
              <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                Personnes Morales
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Companies Grid */}
      <div className="dashboard-cards">
        {entreprises.length === 0 ? (
          <div style={{ 
            color: '#fff', 
            fontSize: '1.2rem',
            textAlign: 'center',
            padding: '3rem',
            background: 'rgba(30,30,50,0.95)',
            borderRadius: '16px',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>🏢</div>
            Aucune entreprise trouvée pour cette ville.
          </div>
        ) : (
          entreprises.map((company) => (
            <div key={company.id} className="dashboard-company-card" style={{
              border: `2px solid ${config.color}20`,
              transition: 'all 0.3s ease'
            }}>
              <div className="dashboard-company-card-header">
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: config.bgGradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  color: '#fff',
                  marginRight: '16px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}>
                  {company.nom_entreprise.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="dashboard-company-card-title">{company.nom_entreprise}</div>
                  <div className="dashboard-company-card-sector" style={{ color: config.color }}>
                    <FontAwesomeIcon icon={faIndustry} style={{ marginRight: '5px' }} />
                    {company.secteur}
                  </div>
                </div>
              </div>
              
              <div className="dashboard-company-card-info">
                <FontAwesomeIcon icon={faMapMarkerAlt} style={{ marginRight: '8px', color: config.color, width: '16px' }} />
                {company.ville} - {company.adresse}
              </div>
              
              {company.tel && (
                <div className="dashboard-company-card-info">
                  <FontAwesomeIcon icon={faPhoneAlt} style={{ marginRight: '8px', color: config.color, width: '16px' }} />
                  {company.tel}
                </div>
              )}
              
              {company.email && (
                <div className="dashboard-company-card-info">
                  <FontAwesomeIcon icon={faEnvelope} style={{ marginRight: '8px', color: config.color, width: '16px' }} />
                  {company.email}
                </div>
              )}
              
              {company.site_web && (
                <div className="dashboard-company-card-info">
                  <FontAwesomeIcon icon={faGlobe} style={{ marginRight: '8px', color: config.color, width: '16px' }} />
                  {company.site_web}
                </div>
              )}
              
              <div className="dashboard-company-card-info">
                <strong>Forme:</strong> {company.forme_juridique} | <strong>Type:</strong> {company.type}
              </div>
              
              <div className="dashboard-company-card-actions">
                <button 
                  onClick={() => navigate(`/voir-entreprise/${company.id}`)}
                  style={{ 
                    background: config.bgGradient, 
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "10px 20px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                    transition: "all 0.3s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <FontAwesomeIcon icon={faEye} style={{ marginRight: '5px' }} />
                  Voir
                </button>
                
                {canAddEntreprise && (
                  <button 
                    onClick={() => navigate(`/modifier-entreprise/${company.id}`)}
                    style={{ 
                      background: "#4fd1c5", 
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      padding: "10px 20px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "600",
                      transition: "all 0.3s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    <FontAwesomeIcon icon={faEdit} style={{ marginRight: '5px' }} />
                    Modifier
                  </button>
                )}
                
                {isAdmin && (
                  <button 
                    onClick={() => handleDelete(company.id, company.nom_entreprise)}
                    disabled={deletingId === company.id}
                    style={{ 
                      background: deletingId === company.id ? "#6b7280" : "#e53e3e", 
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      padding: "10px 20px",
                      cursor: deletingId === company.id ? "not-allowed" : "pointer",
                      fontSize: "14px",
                      fontWeight: "600",
                      opacity: deletingId === company.id ? 0.6 : 1,
                      transition: "all 0.3s ease"
                    }}
                    onMouseEnter={(e) => {
                      if (deletingId !== company.id) {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    <FontAwesomeIcon icon={faTrash} style={{ marginRight: '5px' }} />
                    {deletingId === company.id ? 'Suppression...' : 'Supprimer'}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Ville;
