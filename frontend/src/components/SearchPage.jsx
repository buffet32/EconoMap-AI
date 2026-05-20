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
  faUndo,
  faArrowLeft,
  faList,
  faMap,
  faFilter,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
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

const SearchPage = () => {
  const [entreprises, setEntreprises] = useState([]);
  const [filteredEntreprises, setFilteredEntreprises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const navigate = useNavigate();
  
  // Search filters (active filters)
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSecteur, setSelectedSecteur] = useState('');
  const [selectedVille, setSelectedVille] = useState('');
  const [selectedForme, setSelectedForme] = useState('');
  const [selectedCertification, setSelectedCertification] = useState('');

  // Temporary search filters (for input fields)
  const [tempSearchTerm, setTempSearchTerm] = useState('');
  const [tempSelectedSecteur, setTempSelectedSecteur] = useState('');
  const [tempSelectedVille, setTempSelectedVille] = useState('');
  const [tempSelectedForme, setTempSelectedForme] = useState('');
  const [tempSelectedCertification, setTempSelectedCertification] = useState('');

  // Filter sidebar state
  const [showFilters, setShowFilters] = useState(true);

  // Multiple selection filters
  const [selectedSecteurs, setSelectedSecteurs] = useState([]);
  const [selectedVilles, setSelectedVilles] = useState([]);
  const [selectedFormes, setSelectedFormes] = useState([]);
  const [selectedCertifications, setSelectedCertifications] = useState([]);
  const [selectedTailles, setSelectedTailles] = useState([]);

  // Full screen map state
  const [fullScreenMap, setFullScreenMap] = useState(false);

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

  // Filter companies based on search criteria
  useEffect(() => {
    let filtered = entreprises;

    if (searchTerm) {
      filtered = filtered.filter(e => 
        e.nom_entreprise.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.adresse.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.activite.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedSecteur) {
      filtered = filtered.filter(e => e.secteur === selectedSecteur);
    }

    if (selectedVille) {
      filtered = filtered.filter(e => e.ville === selectedVille);
    }

    if (selectedForme) {
      filtered = filtered.filter(e => e.forme_juridique === selectedForme);
    }

    if (selectedCertification) {
      filtered = filtered.filter(e => e.certifications.includes(selectedCertification));
    }

    // Multiple selection filters
    if (selectedSecteurs.length > 0) {
      filtered = filtered.filter(e => selectedSecteurs.includes(e.secteur));
    }

    if (selectedVilles.length > 0) {
      filtered = filtered.filter(e => selectedVilles.includes(e.ville));
    }

    if (selectedFormes.length > 0) {
      filtered = filtered.filter(e => selectedFormes.includes(e.forme_juridique));
    }

    if (selectedCertifications.length > 0) {
      filtered = filtered.filter(e => 
        selectedCertifications.some(cert => e.certifications.includes(cert))
      );
    }

    // Taille d'entreprise filter
    if (selectedTailles.length > 0) {
      filtered = filtered.filter(e => {
        // Logique pour déterminer la taille basée sur les données disponibles
        // Vous pouvez adapter cette logique selon vos données
        const employeeCount = e.nombre_employes || 0;
        const revenue = e.chiffre_affaires || 0;
        
        if (selectedTailles.includes('startup')) {
          // Logique pour startup (moins de 5 ans, moins de 50 employés)
          const isStartup = e.date_creation && 
            (new Date().getFullYear() - new Date(e.date_creation).getFullYear()) < 5 &&
            employeeCount < 50;
          if (isStartup) return true;
        }
        
        if (selectedTailles.includes('petite_moyenne')) {
          // Logique pour petite/moyenne entreprise (50-250 employés)
          if (employeeCount >= 50 && employeeCount <= 250) return true;
        }
        
        if (selectedTailles.includes('grande')) {
          // Logique pour grande entreprise (plus de 250 employés)
          if (employeeCount > 250) return true;
        }
        
        return false;
      });
    }

    setFilteredEntreprises(filtered);
  }, [entreprises, searchTerm, selectedSecteur, selectedVille, selectedForme, selectedCertification, selectedSecteurs, selectedVilles, selectedFormes, selectedCertifications, selectedTailles]);

  // Function to handle search button click
  const handleSearch = () => {
    setSearchTerm(tempSearchTerm);
    setSelectedSecteur(tempSelectedSecteur);
    setSelectedVille(tempSelectedVille);
    setSelectedForme(tempSelectedForme);
    setSelectedCertification(tempSelectedCertification);
  };

  // Function to reset all filters
  const handleReset = () => {
    setSearchTerm('');
    setSelectedSecteur('');
    setSelectedVille('');
    setSelectedForme('');
    setSelectedCertification('');
    setTempSearchTerm('');
    setTempSelectedSecteur('');
    setTempSelectedVille('');
    setTempSelectedForme('');
    setTempSelectedCertification('');
    setSelectedSecteurs([]);
    setSelectedVilles([]);
    setSelectedFormes([]);
    setSelectedCertifications([]);
    setSelectedTailles([]);
    setFilteredEntreprises(entreprises);
  };

  // Function to handle checkbox changes
  const handleSecteurChange = (secteur, checked) => {
    if (checked) {
      setSelectedSecteurs(prev => [...prev, secteur]);
    } else {
      setSelectedSecteurs(prev => prev.filter(s => s !== secteur));
    }
  };

  const handleVilleChange = (ville, checked) => {
    if (checked) {
      setSelectedVilles(prev => [...prev, ville]);
    } else {
      setSelectedVilles(prev => prev.filter(v => v !== ville));
    }
  };

  const handleFormeChange = (forme, checked) => {
    if (checked) {
      setSelectedFormes(prev => [...prev, forme]);
    } else {
      setSelectedFormes(prev => prev.filter(f => f !== forme));
    }
  };

  const handleCertificationChange = (certification, checked) => {
    if (checked) {
      setSelectedCertifications(prev => [...prev, certification]);
    } else {
      setSelectedCertifications(prev => prev.filter(c => c !== certification));
    }
  };

  const handleTailleChange = (taille, checked) => {
    if (checked) {
      setSelectedTailles(prev => [...prev, taille]);
    } else {
      setSelectedTailles(prev => prev.filter(t => t !== taille));
    }
  };

  // Get unique values for dropdowns
  const secteurs = [...new Set(entreprises.map(e => e.secteur))];
  const villes = [...new Set(entreprises.map(e => e.ville))];
  const formes = [...new Set(entreprises.map(e => e.forme_juridique))];
  const certifications = [...new Set(entreprises.flatMap(e => e.certifications.split(', ')))];

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
    
    if (selectedVille && validCompanies.length > 0) {
      const cityCompanies = validCompanies.filter(e => e.ville === selectedVille);
      if (cityCompanies.length > 0) {
        const cityLats = cityCompanies.map(e => parseFloat(e.latitude));
        const cityLons = cityCompanies.map(e => parseFloat(e.longitude));
        const centerLat = cityLats.reduce((sum, lat) => sum + lat, 0) / cityLats.length;
        const centerLon = cityLons.reduce((sum, lon) => sum + lon, 0) / cityLons.length;
        return [centerLat, centerLon];
      }
    }
    
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
    if (validCompanies.length === 1) return 16;
    
    if (selectedVille && validCompanies.length > 0) {
      const cityCompanies = validCompanies.filter(e => e.ville === selectedVille);
      if (cityCompanies.length > 0) {
        const cityLats = cityCompanies.map(e => parseFloat(e.latitude));
        const cityLons = cityCompanies.map(e => parseFloat(e.longitude));
        const cityLatDiff = Math.max(...cityLats) - Math.min(...cityLats);
        const cityLonDiff = Math.max(...cityLons) - Math.min(...cityLons);
        const cityMaxDiff = Math.max(cityLatDiff, cityLonDiff);
        
        if (cityMaxDiff > 0.1) return 12;
        if (cityMaxDiff > 0.05) return 14;
        if (cityMaxDiff > 0.01) return 16;
        return 18;
      }
    }
    
    const lats = validCompanies.map(e => parseFloat(e.latitude));
    const lons = validCompanies.map(e => parseFloat(e.longitude));
    
    const latDiff = Math.max(...lats) - Math.min(...lats);
    const lonDiff = Math.max(...lons) - Math.min(...lons);
    const maxDiff = Math.max(latDiff, lonDiff);
    
    if (maxDiff > 2) return 6;
    if (maxDiff > 1) return 8;
    if (maxDiff > 0.5) return 10;
    if (maxDiff > 0.1) return 12;
    if (maxDiff > 0.05) return 14;
    if (maxDiff > 0.01) return 16;
    return 18;
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

      setEntreprises(prev => prev.filter(e => e.id !== id));
      setFilteredEntreprises(prev => prev.filter(e => e.id !== id));
      
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
    <div className="dashboard-container" style={{ padding: '2rem', margin: '0 auto', maxWidth: '1400px', }}>
      {/* Header with back button */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: '2rem',
        padding: '1.5rem',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '16px',
        color: 'white',
        boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <Link to="/" style={{ textDecoration: 'none', color: 'white', marginRight: '1rem' }}>
          <FontAwesomeIcon icon={faArrowLeft} style={{ fontSize: '1.5rem' }} />
        </Link>
        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '700' }}>
          Recherche d'entreprises
        </h1>
      </div>

      {/* Search Bar with Mini Map */}
      <div style={{
        height: '14rem',
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
        padding: '2rem 1.5rem 1.5rem 1.5rem',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(102, 126, 234, 0.1)',
        marginBottom: '1rem',
        border: '1px solid rgba(102, 126, 234, 0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          alignItems: 'center', 
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          {/* Mini Map */}
          <div style={{
            width: '200px',
            height: '170px',
            borderRadius: '8px',
            overflow: 'hidden',
            border: '2px solid #e5e7eb',
            position: 'relative',
            cursor: 'pointer',
            flexShrink: 0
          }}
          onClick={() => setFullScreenMap(true)}
          >
            <MapContainer 
              center={mapCenter} 
              zoom={mapZoom} 
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
              attributionControl={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution=""
              />
              {filteredEntreprises
                .filter(entreprise => 
                  entreprise.latitude && entreprise.longitude && 
                  !isNaN(parseFloat(entreprise.latitude)) && !isNaN(parseFloat(entreprise.longitude)) &&
                  parseFloat(entreprise.latitude) !== 0 && parseFloat(entreprise.longitude) !== 0
                )
                .slice(0, 5) // Limit to 5 markers for mini map
                .map((entreprise) => (
                <Marker 
                  key={entreprise.id} 
                  position={[parseFloat(entreprise.latitude), parseFloat(entreprise.longitude)]}
                />
              ))}
            </MapContainer>
            <div style={{
              position: 'absolute',
              bottom: '8px',
              right: '8px',
              background: 'rgba(102, 126, 234, 0.9)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 10px',
              fontSize: '11px',
              fontWeight: '500',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              Voir carte
            </div>
          </div>

          {/* Search Input */}
          <input 
            style={{
              padding: '14px 18px',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              fontSize: '16px',
              outline: 'none',
              transition: 'all 0.3s ease',
              minWidth: '200px',
              flex: 1,
              background: 'rgba(255, 255, 255, 0.95)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
            }}
            placeholder="Nom de l'entreprise, adresse, activité..." 
            value={tempSearchTerm}
            onChange={(e) => setTempSearchTerm(e.target.value)}
            onFocus={(e) => {
              e.target.style.borderColor = '#667eea';
              e.target.style.boxShadow = '0 4px 16px rgba(102, 126, 234, 0.2)';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e5e7eb';
              e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
              e.target.style.transform = 'translateY(0)';
            }}
          />

          {/* Sector Filter */}
          <select 
            style={{
              padding: '12px 16px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '16px',
              outline: 'none',
              minWidth: '120px',
              flexShrink: 0
            }}
            value={tempSelectedSecteur}
            onChange={(e) => setTempSelectedSecteur(e.target.value)}
          >
            <option value="">secteur</option>
            {secteurs.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* City Filter */}
          <select 
            style={{
              padding: '12px 16px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '16px',
              outline: 'none',
              minWidth: '120px',
              flexShrink: 0
            }}
            value={tempSelectedVille}
            onChange={(e) => setTempSelectedVille(e.target.value)}
          >
            <option value="">ville</option>
            {villes.map(v => <option key={v} value={v}>{v}</option>)}
          </select>

          {/* Form Filter */}
          <select 
            style={{
              padding: '12px 16px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '16px',
              outline: 'none',
              minWidth: '120px',
              flexShrink: 0
            }}
            value={tempSelectedForme}
            onChange={(e) => setTempSelectedForme(e.target.value)}
          >
            <option value="">forme juridique</option>
            {formes.map(f => <option key={f} value={f}>{f}</option>)}
          </select>

          {/* Certification Filter */}
          <select 
            style={{
              padding: '12px 16px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '16px',
              outline: 'none',
              minWidth: '120px',
              flexShrink: 0
            }}
            value={tempSelectedCertification}
            onChange={(e) => setTempSelectedCertification(e.target.value)}
          >
            <option value="">certification</option>
            {certifications.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Search Button */}
          <button 
            onClick={handleSearch}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '14px 28px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              flexShrink: 0,
              marginTop: '-60px',
              boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 16px rgba(102, 126, 234, 0.3)';
            }}
          >
            <FontAwesomeIcon icon={faSearch} style={{ marginRight: 8 }} />
            Rechercher
          </button>
        </div>

        {/* Results Count */}
        {filteredEntreprises.length !== entreprises.length && (
          <div style={{ 
            color: '#667eea', 
            marginTop: '1rem',
            fontSize: '14px',
            fontWeight: '600',
            textAlign: 'center',
            padding: '8px 16px',
            background: 'rgba(102, 126, 234, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(102, 126, 234, 0.2)'
          }}>
            {filteredEntreprises.length} résultat(s) trouvé(s) sur {entreprises.length} entreprises
          </div>
        )}
      </div>

                {/* Full Screen Map Overlay */}
          {fullScreenMap && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.02) 0%, rgba(118, 75, 162, 0.02) 100%)',
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              backdropFilter: 'blur(5px)'
            }}>
          {/* Map Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 2rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }}>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>
              Carte des entreprises
            </h2>
            <button 
              onClick={() => setFullScreenMap(false)}
              style={{
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              <FontAwesomeIcon icon={faTimes} style={{ marginRight: 8 }} />
              Fermer
            </button>
          </div>

          {/* Full Screen Map */}
          <div style={{ flex: 1, position: 'relative' }}>
            <MapContainer 
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
                                              <h3 style={{ margin: '0 0 10px 0', color: '#667eea' }}>
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
      )}

      {/* Main Content Area */}
      <div style={{ display: 'flex', gap: '2rem', minHeight: '600px', marginTop: '2rem' }}>
        {/* Filters Sidebar */}
        {showFilters && (
          <div style={{
            width: '300px',
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.03) 0%, rgba(118, 75, 162, 0.03) 100%)',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: '0 8px 32px rgba(102, 126, 234, 0.08)',
            height: 'fit-content',
            position: 'sticky',
            top: '2rem',
            border: '1px solid rgba(102, 126, 234, 0.08)',
            backdropFilter: 'blur(10px)'
          }}>
            <h3 style={{ 
              margin: '0 0 1.5rem 0', 
              color: '#667eea',
              fontSize: '1.3rem',
              fontWeight: '700',
              textAlign: 'center',
              padding: '12px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: '8px',
              marginBottom: '2rem'
            }}>
              Filtres
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Secteur Filter */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '1rem',
                  fontWeight: '600',
                  color: '#374151',
                  fontSize: '1rem'
                }}>
                  Secteurs
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {secteurs.map(secteur => (
                    <label key={secteur} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#4b5563'
                    }}>
                      <input 
                        type="checkbox"
                        checked={selectedSecteurs.includes(secteur)}
                        onChange={(e) => handleSecteurChange(secteur, e.target.checked)}
                        style={{ 
                          marginRight: '8px',
                          width: '16px',
                          height: '16px',
                          accentColor: '#8c54bc'
                        }}
                      />
                      {secteur}
                    </label>
                  ))}
                </div>
              </div>

              {/* Ville Filter */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '1rem',
                  fontWeight: '600',
                  color: '#374151',
                  fontSize: '1rem'
                }}>
                  Villes
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {villes.map(ville => (
                    <label key={ville} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#4b5563'
                    }}>
                      <input 
                        type="checkbox"
                        checked={selectedVilles.includes(ville)}
                        onChange={(e) => handleVilleChange(ville, e.target.checked)}
                        style={{ 
                          marginRight: '8px',
                          width: '16px',
                          height: '16px',
                          accentColor: '#8c54bc'
                        }}
                      />
                      {ville}
                    </label>
                  ))}
                </div>
              </div>

              {/* Forme Filter */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '1rem',
                  fontWeight: '600',
                  color: '#374151',
                  fontSize: '1rem'
                }}>
                  Formes juridiques
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {formes.map(forme => (
                    <label key={forme} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#4b5563'
                    }}>
                      <input 
                        type="checkbox"
                        checked={selectedFormes.includes(forme)}
                        onChange={(e) => handleFormeChange(forme, e.target.checked)}
                        style={{ 
                          marginRight: '8px',
                          width: '16px',
                          height: '16px',
                          accentColor: '#8c54bc'
                        }}
                      />
                      {forme}
                    </label>
                  ))}
                </div>
              </div>

              {/* Certification Filter */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '1rem',
                  fontWeight: '600',
                  color: '#374151',
                  fontSize: '1rem'
                }}>
                  Certifications
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {certifications.map(certification => (
                    <label key={certification} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#4b5563'
                    }}>
                      <input 
                        type="checkbox"
                        checked={selectedCertifications.includes(certification)}
                        onChange={(e) => handleCertificationChange(certification, e.target.checked)}
                        style={{ 
                          marginRight: '8px',
                          width: '16px',
                          height: '16px',
                          accentColor: '#8c54bc'
                        }}
                      />
                      {certification}
                    </label>
                  ))}
                </div>
              </div>

              {/* Taille d'entreprise Filter */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '1rem',
                  fontWeight: '600',
                  color: '#374151',
                  fontSize: '1rem'
                }}>
                  Taille d'entreprise
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#4b5563'
                  }}>
                    <input 
                      type="checkbox"
                      checked={selectedTailles.includes('petite_moyenne')}
                      onChange={(e) => handleTailleChange('petite_moyenne', e.target.checked)}
                      style={{ 
                        marginRight: '8px',
                        width: '16px',
                        height: '16px',
                        accentColor: '#8c54bc'
                      }}
                    />
                    Petite et moyenne entreprise
                  </label>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#4b5563'
                  }}>
                    <input 
                      type="checkbox"
                      checked={selectedTailles.includes('grande')}
                      onChange={(e) => handleTailleChange('grande', e.target.checked)}
                      style={{ 
                        marginRight: '8px',
                        width: '16px',
                        height: '16px',
                        accentColor: '#8c54bc'
                      }}
                    />
                    Grande entreprise
                  </label>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#4b5563'
                  }}>
                    <input 
                      type="checkbox"
                      checked={selectedTailles.includes('startup')}
                      onChange={(e) => handleTailleChange('startup', e.target.checked)}
                      style={{ 
                        marginRight: '8px',
                        width: '16px',
                        height: '16px',
                        accentColor: '#8c54bc'
                      }}
                    />
                    Startup
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button 
                  onClick={handleSearch}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 4px 16px rgba(102, 126, 234, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
                  }}
                >
                  Appliquer
                </button>
                <button 
                  onClick={handleReset}
                  style={{
                    flex: 1,
                    background: '#e53e3e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '10px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  <FontAwesomeIcon icon={faUndo} style={{ marginRight: 4 }} />
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div style={{ flex: 1 }}>
          {viewMode === 'list' ? (
            /* List View */
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
                      <FontAwesomeIcon icon={faMapMarkerAlt} style={{ marginRight: 5, color: '#667eea' }} />
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
                          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", 
                          color: "#fff",
                          border: "none",
                          borderRadius: "8px",
                          padding: "10px 18px",
                          cursor: "pointer",
                          fontSize: "14px",
                          fontWeight: "600",
                          transition: "all 0.3s ease",
                          boxShadow: "0 2px 8px rgba(102, 126, 234, 0.3)"
                        }}
                      >
                        Voir
                      </button>
                      {isAdmin && (
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
                      {isAdmin && (
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
          ) : (
            /* Map View */
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.03) 0%, rgba(118, 75, 162, 0.03) 100%)', 
              borderRadius: '16px', 
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(102, 126, 234, 0.08)',
              height: '600px',
              border: '1px solid rgba(102, 126, 234, 0.08)'
            }}>
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
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage; 