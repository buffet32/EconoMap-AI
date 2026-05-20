import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBuilding,
  faUserGroup,
  faPhoneAlt,
  faEnvelope,
  faSearch,
  faMapMarkerAlt,
  faFileAlt,
  faUndo
} from '@fortawesome/free-solid-svg-icons';
import {
  faFacebookF,
  faTwitter,
  faLinkedinIn,
  faYoutube
} from '@fortawesome/free-brands-svg-icons';
import { Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import "./HomeDashboard.css";

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const Home = () => {
  const [entreprises, setEntreprises] = useState([]);
  const [filteredEntreprises, setFilteredEntreprises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const navigate = useNavigate();
  
  // User authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isResponsable, setIsResponsable] = useState(false);
  
  // Calcul du nombre de responsables (utilisateurs avec le rôle responsable)
  const [responsableCount, setResponsableCount] = useState(0);
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        const user = parsed.user || parsed;
        
        // Set user authentication states
        setIsLoggedIn(true);
        setIsResponsable(user && user.role === 'responsable');
        
        // Check if user is admin and redirect to admin dashboard
        if (user.role === 'admin') {
          navigate('/admin-dashboard');
          return;
        }
        
        setCheckingAuth(false);
        
        const token = parsed.access || (parsed.user && parsed.user.access) || parsed.access_token;
        if (token) {
          fetch('http://127.0.0.1:8000/api/users/?role=responsable', {
            headers: { Authorization: `Bearer ${token}` }
          })
            .then(res => res.json())
            .then(data => {
              if (Array.isArray(data)) {
                setResponsableCount(data.length);
              } else if (data.results) {
                setResponsableCount(data.results.length);
              }
            })
            .catch(() => setResponsableCount(0));
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    } else {
      // Guest user (not logged in)
      setIsLoggedIn(false);
      setIsResponsable(false);
      setCheckingAuth(false);
    }
  }, [navigate]);
  // Calcul du nombre d'entreprises récemment ajoutées (7 derniers jours)
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentEntreprises = entreprises.filter(e => new Date(e.date_creation) >= sevenDaysAgo);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/entreprises/")
      .then((res) => res.json())
      .then((data) => {
        setEntreprises(data);
        setFilteredEntreprises(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Get unique values for dropdowns
  const secteurs = [...new Set(entreprises.map(e => e.secteur))];
  const villes = [...new Set(entreprises.map(e => e.ville))];
  const formes = [...new Set(entreprises.map(e => e.forme_juridique))];
  const certifications = [...new Set(entreprises.flatMap(e => e.certifications.split(', ')))];

  // Calculate city distribution for stats
  const cityStats = entreprises.reduce((acc, e) => {
    acc[e.ville] = (acc[e.ville] || 0) + 1;
    return acc;
  }, {});

  // Calculate sector distribution for stats
  const sectorStats = entreprises.reduce((acc, e) => {
    acc[e.secteur] = (acc[e.secteur] || 0) + 1;
    return acc;
  }, {});

  const totalCompanies = entreprises.length;

  // Calculate map center and bounds based on filtered companies
  const calculateMapCenter = () => {
    if (filteredEntreprises.length === 0) {
      return [31.6295, -7.9811]; // Default to Marrakech
    }
    
    // Filter out companies with invalid coordinates
    const validCompanies = filteredEntreprises.filter(e => 
      e.latitude && e.longitude && 
      !isNaN(parseFloat(e.latitude)) && !isNaN(parseFloat(e.longitude)) &&
      parseFloat(e.latitude) !== 0 && parseFloat(e.longitude) !== 0
    );
    
    if (validCompanies.length === 0) {
      return [31.6295, -7.9811]; // Default to Marrakech if no valid coordinates
    }
    
    const lats = validCompanies.map(e => parseFloat(e.latitude));
    const lons = validCompanies.map(e => parseFloat(e.longitude));
    
    // If filtering by a specific city, try to center more precisely
    if (validCompanies.length > 0) {
      // Use the average of all companies in the selected city for better centering
      const cityCompanies = validCompanies.filter(e => e.ville === validCompanies[0].ville); // Assuming the first company's city is representative
      if (cityCompanies.length > 0) {
        const cityLats = cityCompanies.map(e => parseFloat(e.latitude));
        const cityLons = cityCompanies.map(e => parseFloat(e.longitude));
        const centerLat = cityLats.reduce((sum, lat) => sum + lat, 0) / cityLats.length;
        const centerLon = cityLons.reduce((sum, lon) => sum + lon, 0) / cityLons.length;
        return [centerLat, centerLon];
      }
    }
    
    // Default calculation for all filtered companies
    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const centerLon = (Math.min(...lons) + Math.max(...lons)) / 2;
    
    return [centerLat, centerLon];
  };

  // Calculate appropriate zoom level based on filtered companies
  const calculateMapZoom = () => {
    if (filteredEntreprises.length === 0) return 12;
    
    // Filter out companies with invalid coordinates
    const validCompanies = filteredEntreprises.filter(e => 
      e.latitude && e.longitude && 
      !isNaN(parseFloat(e.latitude)) && !isNaN(parseFloat(e.longitude)) &&
      parseFloat(e.latitude) !== 0 && parseFloat(e.longitude) !== 0
    );
    
    if (validCompanies.length === 0) return 12;
    if (validCompanies.length === 1) return 16; // Zoom in more for single company
    
    // If filtering by a specific city, zoom in more for city-level focus
    if (validCompanies.length > 0) {
      const cityCompanies = validCompanies.filter(e => e.ville === validCompanies[0].ville); // Assuming the first company's city is representative
      if (cityCompanies.length > 0) {
        const cityLats = cityCompanies.map(e => parseFloat(e.latitude));
        const cityLons = cityCompanies.map(e => parseFloat(e.longitude));
        const cityLatDiff = Math.max(...cityLats) - Math.min(...cityLats);
        const cityLonDiff = Math.max(...cityLons) - Math.min(...cityLons);
        const cityMaxDiff = Math.max(cityLatDiff, cityLonDiff);
        
        // More aggressive zooming for city-specific filtering
        if (cityMaxDiff > 0.1) return 12; // City area
        if (cityMaxDiff > 0.05) return 14; // City center
        if (cityMaxDiff > 0.01) return 16; // Neighborhood
        return 18; // Street level
      }
    }
    
    const lats = validCompanies.map(e => parseFloat(e.latitude));
    const lons = validCompanies.map(e => parseFloat(e.longitude));
    
    const latDiff = Math.max(...lats) - Math.min(...lats);
    const lonDiff = Math.max(...lons) - Math.min(...lons);
    const maxDiff = Math.max(latDiff, lonDiff);
    
    // Adjust zoom based on the spread of companies - more aggressive zooming for city focus
    if (maxDiff > 2) return 6; // Very large spread - zoom out
    if (maxDiff > 1) return 8; // Large spread - zoom out
    if (maxDiff > 0.5) return 10; // Medium-large spread
    if (maxDiff > 0.1) return 12; // Medium spread
    if (maxDiff > 0.05) return 14; // Small spread - city level
    if (maxDiff > 0.01) return 16; // Very small spread - neighborhood level
    return 18; // Extremely small spread - street level
  };

  const mapCenter = calculateMapCenter();
  const mapZoom = calculateMapZoom();

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
      setFilteredEntreprises(prev => prev.filter(e => e.id !== id));
      
      // Show success message (you can add a toast notification here)
      alert('Entreprise supprimée avec succès!');
    } catch (error) {
      console.error('Delete error:', error);
      alert('Erreur lors de la suppression de l\'entreprise');
    } finally {
      setDeletingId(null);
    }
  };

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

  return (
    <div className="dashboard-container">
      {/* Dashboard Stats */}
      <div className="dashboard-stats">
        {[ 
          { label: "Entreprises", value: entreprises.length, icon: faBuilding, color: "#8c54bc" },
          { label: "Personnes morales", value: entreprises.filter(e => e.type === 'PM').length, icon: faUserGroup, color: "#4fd1c5" },
        ].map((stat, idx) => (
          <div key={idx} className="dashboard-card">
            <div>
              <div style={{ color: "#aaa", fontSize: 14 }}>{stat.label}</div>
              <div style={{ fontWeight: 700, fontSize: 28 }}>{stat.value}</div>
            </div>
            <div className="dashboard-card-icon" style={{ background: stat.color }}>
              <FontAwesomeIcon icon={stat.icon} style={{ color: "#fff", fontSize: 22 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Search/Filter Section */}
      <div className="dashboard-search">
        <h2>Recherche d'entreprises</h2>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          padding: '2rem',
          background: 'linear-gradient(135deg, rgba(140, 84, 188, 0.1), rgba(124, 58, 237, 0.1))',
          borderRadius: '12px',
          border: '2px dashed rgba(140, 84, 188, 0.3)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '4rem', 
              marginBottom: '1rem',
              color: '#8c54bc'
            }}>
              🔍
            </div>
            <h3 style={{ 
              color: '#8c54bc', 
              marginBottom: '1rem',
              fontSize: '1.5rem'
            }}>
              Rechercher des entreprises
            </h3>
            <p style={{ 
              color: '#666', 
              marginBottom: '2rem',
              fontSize: '1rem'
            }}>
              Utilisez nos outils de recherche avancés pour trouver les entreprises qui correspondent à vos critères
            </p>
            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button 
                onClick={() => navigate('/recherche-entreprises')}
                style={{ 
                  background: 'linear-gradient(135deg, #8c54bc, #7c3aed)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(140, 84, 188, 0.3)',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(140, 84, 188, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(140, 84, 188, 0.3)';
                }}
              >
                <FontAwesomeIcon icon={faSearch} style={{ marginRight: 8 }} />
                Lancer la recherche
              </button>
              
              {canAddEntreprise && (
                <button 
                  onClick={() => navigate('/ajouter-entreprise')}
                  style={{ 
                    background: 'linear-gradient(135deg, #4fd1c5, #38b2ac)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 24px',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(79, 209, 197, 0.3)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 16px rgba(79, 209, 197, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 12px rgba(79, 209, 197, 0.3)';
                  }}
                >
                  <FontAwesomeIcon icon={faBuilding} style={{ marginRight: 8 }} />
                  Ajouter entreprise
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Map and Quick Stats Section */}
      <div className="dashboard-map-quickstats">
        {/* Map Card */}
        <div className="dashboard-map-card">
          <h2>Localisation des entreprises</h2>
          <div style={{ height: '400px', width: '100%' }}>
            <MapContainer 
              key={`${mapCenter[0]}-${mapCenter[1]}-${mapZoom}-${filteredEntreprises.length}`}
              center={mapCenter} 
              zoom={mapZoom} 
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {filteredEntreprises
                .filter(entreprise => 
                  entreprise.latitude && entreprise.longitude && 
                  !isNaN(parseFloat(entreprise.latitude)) && !isNaN(parseFloat(entreprise.longitude)) &&
                  parseFloat(entreprise.latitude) !== 0 && parseFloat(entreprise.longitude) !== 0
                )
                .map((entreprise) => (
                <Marker 
                  key={entreprise.id} 
                  position={[parseFloat(entreprise.latitude), parseFloat(entreprise.longitude)]}
                >
                  <Popup>
                    <div style={{ minWidth: '200px' }}>
                      <h3 style={{ margin: '0 0 10px 0', color: '#8c54bc' }}>
                        {entreprise.nom_entreprise}
                      </h3>
                      <p style={{ margin: '5px 0', fontSize: '14px' }}>
                        <strong>Secteur:</strong> {entreprise.secteur}
                      </p>
                      <p style={{ margin: '5px 0', fontSize: '14px' }}>
                        <strong>Adresse:</strong> {entreprise.adresse}
                      </p>
                      <p style={{ margin: '5px 0', fontSize: '14px' }}>
                        <strong>Téléphone:</strong> {entreprise.tel}
                      </p>
                      <p style={{ margin: '5px 0', fontSize: '14px' }}>
                        <strong>Email:</strong> {entreprise.email}
                      </p>
                      <p style={{ margin: '5px 0', fontSize: '14px' }}>
                        <strong>Forme:</strong> {entreprise.forme_juridique}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      </div>

      {/* Section Accès rapide par secteur */}
      <div className="dashboard-secteurs">
        <h2 style={{ 
          textAlign: 'center', 
          color: '#8c54bc', 
          fontSize: '2rem', 
          fontWeight: '700', 
          marginBottom: '2rem',
          textShadow: '0 2px 4px rgba(140, 84, 188, 0.3)'
        }}>
          Accès rapide par secteur
        </h2>
        <div className="dashboard-secteurs-list">
          {secteurs.map((secteur) => {
            // Define sector-specific colors and icons
            const sectorConfig = {
              'Technologie': { color: '#3B82F6', icon: '💻', bgGradient: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' },
              'Santé': { color: '#EF4444', icon: '🏥', bgGradient: 'linear-gradient(135deg, #EF4444, #DC2626)' },
              'Finance': { color: '#10B981', icon: '💰', bgGradient: 'linear-gradient(135deg, #10B981, #059669)' },
              'Éducation': { color: '#8B5CF6', icon: '🎓', bgGradient: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' },
              'Transport': { color: '#F59E0B', icon: '🚚', bgGradient: 'linear-gradient(135deg, #F59E0B, #D97706)' },
              'Construction': { color: '#6B7280', icon: '🏗️', bgGradient: 'linear-gradient(135deg, #6B7280, #4B5563)' },
              'Commerce': { color: '#EC4899', icon: '🛍️', bgGradient: 'linear-gradient(135deg, #EC4899, #DB2777)' },
              'Industrie': { color: '#8B5A2B', icon: '🏭', bgGradient: 'linear-gradient(135deg, #8B5A2B, #654321)' },
              'Agriculture': { color: '#22C55E', icon: '🌾', bgGradient: 'linear-gradient(135deg, #22C55E, #16A34A)' },
              'Tourisme': { color: '#06B6D4', icon: '🏖️', bgGradient: 'linear-gradient(135deg, #06B6D4, #0891B2)' },
              'Énergie': { color: '#F97316', icon: '⚡', bgGradient: 'linear-gradient(135deg, #F97316, #EA580C)' },
              'Télécommunications': { color: '#6366F1', icon: '📡', bgGradient: 'linear-gradient(135deg, #6366F1, #4F46E5)' },
              'Médias': { color: '#A855F7', icon: '📺', bgGradient: 'linear-gradient(135deg, #A855F7, #9333EA)' },
              'Consulting': { color: '#14B8A6', icon: '📊', bgGradient: 'linear-gradient(135deg, #14B8A6, #0D9488)' },
              'Logistique': { color: '#F43F5E', icon: '📦', bgGradient: 'linear-gradient(135deg, #F43F5E, #E11D48)' }
            };

            const config = sectorConfig[secteur] || { 
              color: '#8c54bc', 
              icon: '🏢', 
              bgGradient: 'linear-gradient(135deg, #8c54bc, #7c3aed)' 
            };

            return (
              <Link 
                to={`/secteur/${encodeURIComponent(secteur)}`} 
                key={secteur} 
                className="dashboard-secteur-card"
                style={{
                  background: config.bgGradient,
                  border: '2px solid transparent',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div 
                  className="dashboard-secteur-icon"
                  style={{
                    fontSize: '3rem',
                    marginBottom: '1rem',
                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
                  }}
                >
                  {config.icon}
                </div>
                <div 
                  className="dashboard-secteur-label"
                  style={{
                    color: '#fff',
                    fontWeight: '700',
                    fontSize: '1.1rem',
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    textAlign: 'center'
                  }}
                >
                  {secteur}
                </div>
                <div 
                  className="dashboard-secteur-count"
                  style={{
                    color: 'rgba(255,255,255,0.9)',
                    fontSize: '0.9rem',
                    marginTop: '0.5rem',
                    fontWeight: '500'
                  }}
                >
                  {entreprises.filter(e => e.secteur === secteur).length} entreprises
                </div>
                <div 
                  className="dashboard-secteur-overlay"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(255,255,255,0.1)',
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                    pointerEvents: 'none'
                  }}
                />
            </Link>
            );
          })}
        </div>
      </div>

      {/* Section Accès rapide par ville */}
      <div className="dashboard-villes">
        <h2 style={{ 
          textAlign: 'center', 
          color: '#4fd1c5', 
          fontSize: '2rem', 
          fontWeight: '700', 
          marginBottom: '2rem',
          textShadow: '0 2px 4px rgba(79, 209, 197, 0.3)'
        }}>
          Accès rapide par ville
        </h2>
        <div className="dashboard-villes-list">
          {villes.map((ville) => {
            // Calculate company count for this city
            const companyCount = entreprises.filter(e => e.ville === ville).length;
            
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

            const config = getCityConfig(companyCount);

            return (
              <Link 
                to={`/ville/${encodeURIComponent(ville)}`} 
                key={ville} 
                className="dashboard-ville-card"
                style={{
                  background: config.bgGradient,
                  border: '2px solid transparent',
                  position: 'relative',
                  overflow: 'hidden',
                  minHeight: config.size === 'large' ? '180px' : config.size === 'medium' ? '160px' : '140px'
                }}
              >
                <div 
                  className="dashboard-ville-icon"
                  style={{
                    fontSize: config.size === 'large' ? '3rem' : config.size === 'medium' ? '2.5rem' : '2rem',
                    marginBottom: '1rem',
                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
                    transition: 'transform 0.3s ease'
                  }}
                >
                  {config.icon}
                </div>
                <div 
                  className="dashboard-ville-label"
                  style={{
                    color: '#fff',
                    fontWeight: '700',
                    fontSize: config.size === 'large' ? '1.2rem' : '1rem',
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    textAlign: 'center',
                    marginBottom: '0.5rem'
                  }}
                >
                  {ville}
                </div>
                <div 
                  className="dashboard-ville-count"
                  style={{
                    color: 'rgba(255,255,255,0.9)',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    textAlign: 'center'
                  }}
                >
                  {companyCount} entreprise{companyCount > 1 ? 's' : ''}
              </div>
                <div 
                  className="dashboard-ville-overlay"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(255,255,255,0.1)',
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                    pointerEvents: 'none'
                  }}
                />
            </Link>
            );
          })}
        </div>
      </div>

      {/* Section Liste des entreprises */}
      <div className="dashboard-entreprises">
        <h2 style={{ 
          textAlign: 'center', 
          color: '#8c54bc', 
          fontSize: '2rem', 
          fontWeight: '700', 
          marginBottom: '2rem',
          textShadow: '0 2px 4px rgba(140, 84, 188, 0.3)'
        }}>
          Liste des entreprises
        </h2>
        
        {/* Company Cards Grid */}
        <div className="dashboard-cards">
          {loading ? (
            <div style={{ color: '#fff', fontSize: 18, textAlign: 'center', padding: '2rem' }}>
              Chargement des entreprises...
            </div>
          ) : filteredEntreprises.length === 0 ? (
            <div style={{ color: '#fff', fontSize: 18, textAlign: 'center', padding: '2rem' }}>
              {entreprises.length === 0 ? 'Aucune entreprise trouvée.' : 'Aucune entreprise ne correspond à vos critères de recherche.'}
            </div>
          ) : (
            filteredEntreprises.map((e) => (
              <div key={e.id} className="dashboard-company-card">
                <div className="dashboard-company-card-header">
                  <img 
                    src={`https://placehold.co/60x60?text=${encodeURIComponent(e.nom_entreprise.charAt(0))}`} 
                    alt="Logo" 
                    className="dashboard-company-card-logo" 
                  />
                  <div>
                    <div className="dashboard-company-card-title">{e.nom_entreprise}</div>
                    <div className="dashboard-company-card-sector">Secteur: {e.secteur}</div>
                  </div>
                </div>
                <div className="dashboard-company-card-info">
                  <FontAwesomeIcon icon={faMapMarkerAlt} style={{ marginRight: 5, color: '#8c54bc' }} />
                  {e.adresse}
                </div>
                <div className="dashboard-company-card-info">
                  <FontAwesomeIcon icon={faPhoneAlt} style={{ marginRight: 5, color: '#4fd1c5' }} />
                  {e.tel || 'N/A'}
                </div>
                <div className="dashboard-company-card-info">
                  <FontAwesomeIcon icon={faEnvelope} style={{ marginRight: 5, color: '#a78bfa' }} />
                  {e.email}
                </div>
                <div className="dashboard-company-card-info">
                  <strong>Forme:</strong> {e.forme_juridique} | <strong>Type:</strong> {e.type}
                </div>
                <div className="dashboard-company-card-actions">
                  <button 
                    onClick={() => navigate(`/voir-entreprise/${e.id}`)}
                    style={{ 
                      background: "#8c54bc", 
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      padding: "8px 16px",
                      cursor: "pointer",
                      fontSize: "14px"
                    }}
                  >
                    Voir
                  </button>
                  {canAddEntreprise && (
                    <button
                      onClick={() => navigate(`/modifier-entreprise/${e.id}`)}
                      style={{
                        background: "#4fd1c5",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        padding: "8px 16px",
                        cursor: "pointer",
                        fontSize: "14px"
                      }}
                    >
                      Modifier
                    </button>
                  )}
                  {canAddEntreprise && (
                    <button
                      onClick={() => handleDelete(e.id, e.nom_entreprise)}
                      disabled={deletingId === e.id}
                      style={{
                        background: deletingId === e.id ? "#6b7280" : "#e53e3e",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        padding: "8px 16px",
                        cursor: deletingId === e.id ? "not-allowed" : "pointer",
                        fontSize: "14px",
                        opacity: deletingId === e.id ? 0.6 : 1
                      }}
                    >
                      {deletingId === e.id ? 'Suppression...' : 'Supprimer'}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;