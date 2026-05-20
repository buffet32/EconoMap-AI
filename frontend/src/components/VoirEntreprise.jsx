import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faMapMarkerAlt, 
  faPhoneAlt, 
  faEnvelope, 
  faBuilding, 
  faUserTie, 
  faFileAlt,
  faGlobe,
  faFax,
  faCertificate,
  faArrowLeft
} from '@fortawesome/free-solid-svg-icons';
import "./HomeDashboard.css";

const VoirEntreprise = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [entreprise, setEntreprise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEntreprise = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/entreprises/${id}/`);
        if (!response.ok) {
          throw new Error('Entreprise non trouvée');
        }
        const data = await response.json();
        setEntreprise(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEntreprise();
  }, [id]);

  if (loading) {
    return (
      <div className="dashboard-container" style={{ maxWidth: 800, margin: "0 auto" }}>
        <div style={{ color: '#fff', fontSize: 18, textAlign: 'center', padding: '50px' }}>
          Chargement...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container" style={{ maxWidth: 800, margin: "0 auto" }}>
        <div style={{ color: '#e53e3e', fontSize: 18, textAlign: 'center', padding: '50px' }}>
          Erreur: {error}
        </div>
      </div>
    );
  }

  if (!entreprise) {
    return (
      <div className="dashboard-container" style={{ maxWidth: 800, margin: "0 auto" }}>
        <div style={{ color: '#fff', fontSize: 18, textAlign: 'center', padding: '50px' }}>
          Entreprise non trouvée
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container" style={{ maxWidth: 800, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <button 
          onClick={() => navigate('/')}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: '#8c54bc', 
            fontSize: 18, 
            cursor: 'pointer',
            marginRight: 16
          }}
        >
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <h2 style={{ color: "#fff", margin: 0 }}>Détails de l'entreprise</h2>
      </div>

      {/* Company Header Card */}
      <div className="dashboard-search" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <img 
            src={`https://placehold.co/80x80?text=${encodeURIComponent(entreprise.nom_entreprise.charAt(0))}`} 
            alt="Logo" 
            style={{ borderRadius: '50%', border: '3px solid #8c54bc' }}
          />
          <div>
            <h1 style={{ color: '#fff', margin: '0 0 8px 0', fontSize: 28 }}>
              {entreprise.nom_entreprise}
            </h1>
            <div style={{ color: '#4fd1c5', fontSize: 18, fontWeight: 500 }}>
              {entreprise.secteur}
            </div>
          </div>
        </div>
      </div>

      {/* Company Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Left Column */}
        <div>
          {/* Basic Information */}
          <div className="dashboard-search" style={{ marginBottom: 24 }}>
            <h3 style={{ color: '#fff', marginBottom: 16 }}>Informations de base</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="dashboard-company-card-info">
                <FontAwesomeIcon icon={faBuilding} style={{ marginRight: 8, color: '#8c54bc', width: 16 }} />
                <strong>Code ICE:</strong> {entreprise.code_ice}
              </div>
              <div className="dashboard-company-card-info">
                <FontAwesomeIcon icon={faUserTie} style={{ marginRight: 8, color: '#4fd1c5', width: 16 }} />
                <strong>Forme juridique:</strong> {entreprise.forme_juridique}
              </div>
              <div className="dashboard-company-card-info">
                <FontAwesomeIcon icon={faFileAlt} style={{ marginRight: 8, color: '#a78bfa', width: 16 }} />
                <strong>Type:</strong> {entreprise.type === 'PP' ? 'Personne Physique' : 'Personne Morale'}
              </div>
              <div className="dashboard-company-card-info">
                <FontAwesomeIcon icon={faBuilding} style={{ marginRight: 8, color: '#fbbf24', width: 16 }} />
                <strong>Activité:</strong> {entreprise.activite}
              </div>
              <div className="dashboard-company-card-info">
                <FontAwesomeIcon icon={faCertificate} style={{ marginRight: 8, color: '#e53e3e', width: 16 }} />
                <strong>Certifications:</strong> {entreprise.certifications || 'Aucune'}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="dashboard-search">
            <h3 style={{ color: '#fff', marginBottom: 16 }}>Informations de contact</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="dashboard-company-card-info">
                <FontAwesomeIcon icon={faPhoneAlt} style={{ marginRight: 8, color: '#4fd1c5', width: 16 }} />
                <strong>Téléphone:</strong> {entreprise.tel || 'Non renseigné'}
              </div>
              <div className="dashboard-company-card-info">
                <FontAwesomeIcon icon={faEnvelope} style={{ marginRight: 8, color: '#a78bfa', width: 16 }} />
                <strong>Email:</strong> {entreprise.email || 'Non renseigné'}
              </div>
              <div className="dashboard-company-card-info">
                <FontAwesomeIcon icon={faFax} style={{ marginRight: 8, color: '#fbbf24', width: 16 }} />
                <strong>Fax:</strong> {entreprise.fax || 'Non renseigné'}
              </div>
              <div className="dashboard-company-card-info">
                <FontAwesomeIcon icon={faGlobe} style={{ marginRight: 8, color: '#8c54bc', width: 16 }} />
                <strong>Site web:</strong> {entreprise.site_web || 'Non renseigné'}
              </div>
              <div className="dashboard-company-card-info">
                <FontAwesomeIcon icon={faUserTie} style={{ marginRight: 8, color: '#4fd1c5', width: 16 }} />
                <strong>Contact:</strong> {entreprise.contact || 'Non renseigné'}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div>
          {/* Location Information */}
          <div className="dashboard-search" style={{ marginBottom: 24 }}>
            <h3 style={{ color: '#fff', marginBottom: 16 }}>Localisation</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="dashboard-company-card-info">
                <FontAwesomeIcon icon={faMapMarkerAlt} style={{ marginRight: 8, color: '#8c54bc', width: 16 }} />
                <strong>Adresse:</strong> {entreprise.adresse}
              </div>
              <div className="dashboard-company-card-info">
                <FontAwesomeIcon icon={faMapMarkerAlt} style={{ marginRight: 8, color: '#4fd1c5', width: 16 }} />
                <strong>Ville:</strong> {entreprise.ville}
              </div>
              <div className="dashboard-company-card-info">
                <FontAwesomeIcon icon={faMapMarkerAlt} style={{ marginRight: 8, color: '#a78bfa', width: 16 }} />
                <strong>Coordonnées:</strong> {entreprise.latitude}, {entreprise.longitude}
              </div>
            </div>
          </div>

          {/* Administrative Information */}
          <div className="dashboard-search" style={{ marginBottom: 24 }}>
            <h3 style={{ color: '#fff', marginBottom: 16 }}>Informations administratives</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="dashboard-company-card-info">
                <FontAwesomeIcon icon={faFileAlt} style={{ marginRight: 8, color: '#8c54bc', width: 16 }} />
                <strong>CNSS:</strong> {entreprise.cnss || 'Non renseigné'}
              </div>
              <div className="dashboard-company-card-info">
                <FontAwesomeIcon icon={faFileAlt} style={{ marginRight: 8, color: '#4fd1c5', width: 16 }} />
                <strong>Identifiant fiscal:</strong> {entreprise.identifiant_fiscal || 'Non renseigné'}
              </div>
              <div className="dashboard-company-card-info">
                <FontAwesomeIcon icon={faFileAlt} style={{ marginRight: 8, color: '#a78bfa', width: 16 }} />
                <strong>Patente:</strong> {entreprise.patente || 'Non renseigné'}
              </div>
              <div className="dashboard-company-card-info">
                <FontAwesomeIcon icon={faFileAlt} style={{ marginRight: 8, color: '#fbbf24', width: 16 }} />
                <strong>Registre de commerce:</strong> {entreprise.rc || 'Non renseigné'}
              </div>
            </div>
          </div>

          {/* Status Information */}
          <div className="dashboard-search">
            <h3 style={{ color: '#fff', marginBottom: 16 }}>Statut</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="dashboard-company-card-info">
                <FontAwesomeIcon icon={faBuilding} style={{ marginRight: 8, color: '#8c54bc', width: 16 }} />
                <strong>En activité:</strong> {entreprise.en_activite === 'oui' ? 'Oui' : 'Non'}
              </div>
              <div className="dashboard-company-card-info">
                <FontAwesomeIcon icon={faBuilding} style={{ marginRight: 8, color: '#4fd1c5', width: 16 }} />
                <strong>Taille:</strong> {entreprise.taille_entreprise}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 16, marginTop: 32, justifyContent: 'center' }}>
        <button 
          onClick={() => navigate(`/modifier-entreprise/${id}`)}
          style={{ 
            background: "#4fd1c5", 
            color: "#fff", 
            border: "none", 
            borderRadius: "8px", 
            padding: "12px 24px",
            cursor: "pointer",
            fontSize: 16
          }}
        >
          Modifier
        </button>
        <button 
          onClick={() => navigate('/')}
          style={{ 
            background: "#8c54bc", 
            color: "#fff", 
            border: "none", 
            borderRadius: "8px", 
            padding: "12px 24px",
            cursor: "pointer",
            fontSize: 16
          }}
        >
          Retour à la liste
        </button>
      </div>
    </div>
  );
};

export default VoirEntreprise; 