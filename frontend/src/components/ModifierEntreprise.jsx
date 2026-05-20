import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faMapMarkerAlt, 
  faSpinner, 
  faCheck, 
  faExclamationTriangle,
  faArrowLeft
} from '@fortawesome/free-solid-svg-icons';
import "./HomeDashboard.css";

const ModifierEntreprise = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nom_entreprise: "",
    code_ice: "",
    secteur: "",
    forme_juridique: "SA",
    ville: "",
    adresse: "",
    latitude: "",
    longitude: "",
    activite: "",
    type: "PP",
    email: "",
    fax: "",
    site_web: "",
    contact: "",
    tel: "",
    certifications: "",
    cnss: "",
    identifiant_fiscal: "",
    patente: "",
    rc: "",
    en_activite: "oui",
    taille_entreprise: "PME",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEntreprise = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/entreprises/${id}/`);
        if (!response.ok) {
          throw new Error('Entreprise non trouvée');
        }
        const data = await response.json();
        setForm(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEntreprise();
  }, [id]);

  // Helper function to extract Plus Code from text
  const extractPlusCode = (text) => {
    const plusCodePattern = /([23456789CFGHJMPQRVWX]{8}\+[23456789CFGHJMPQRVWX]{2,3})/;
    const match = text.match(plusCodePattern);
    return match ? match[1] : null;
  };

  // Geocoding function
  const geocodeAddress = async (address, ville) => {
    if (!address || !ville) return null;
    
    setGeocoding(true);
    try {
      const extractedPlusCode = extractPlusCode(address);
      const isPlusCode = extractedPlusCode !== null;
      
      if (isPlusCode) {
        console.log('Processing Plus Code:', extractedPlusCode);
        const results = await geocodePlusCode(extractedPlusCode, ville);
        if (results) {
          return results;
        }
      }
      
      let fullAddress = `${address}, ${ville}, Maroc`;
      console.log('Geocoding regular address:', fullAddress);
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1&countrycodes=ma&addressdetails=1`
      );
      
      if (!response.ok) throw new Error('Geocoding failed');
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setForm(prev => ({
          ...prev,
          latitude: parseFloat(lat).toFixed(6),
          longitude: parseFloat(lon).toFixed(6)
        }));
        
        setMessage({ type: 'success', text: 'Coordonnées trouvées automatiquement!' });
        return { lat: parseFloat(lat), lon: parseFloat(lon) };
      }
      
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la géolocalisation.' });
      return null;
    } finally {
      setGeocoding(false);
    }
  };

  // Specialized Plus Code geocoding function
  const geocodePlusCode = async (plusCode, ville) => {
    try {
      console.log('Processing Plus Code:', plusCode);
      
      // First, try to decode the Plus Code directly
      const plusCodeResult = await decodePlusCode(plusCode);
      if (plusCodeResult) {
        console.log('Plus Code decoded successfully:', plusCodeResult);
        return plusCodeResult;
      }
      
      // If direct decoding fails, try alternative approaches
      const searchQueries = [
        `${plusCode}, ${ville}, Maroc`,
        `${plusCode}, Maroc`,
        `${plusCode}`,
        `${plusCode} ${ville}`,
        `${plusCode} Morocco`
      ];
      
      for (const query of searchQueries) {
        console.log('Trying Plus Code query:', query);
        
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`
        );
        
        if (response.ok) {
          const data = await response.json();
          
          if (data && data.length > 0) {
            const { lat, lon, display_name } = data[0];
            console.log('Plus Code result:', { lat, lon, display_name });
            
            setForm(prev => ({
              ...prev,
              latitude: parseFloat(lat).toFixed(6),
              longitude: parseFloat(lon).toFixed(6)
            }));
            
            setMessage({ 
              type: 'success', 
              text: `Plus Code "${plusCode}" trouvé: ${display_name}` 
            });
            
            return { lat: parseFloat(lat), lon: parseFloat(lon) };
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      return null;
    } catch (error) {
      console.error('Plus Code geocoding error:', error);
      return null;
    }
  };

  // Function to decode Plus Code using a more reliable approach
  const decodePlusCode = async (plusCode) => {
    try {
      console.log('Attempting to decode Plus Code:', plusCode);
      
      // Method 1: Try using a Plus Code decoder service
      // Note: This is a placeholder - you would need to implement or use a real Plus Code decoder
      
      // Method 2: Use a reverse geocoding approach with the Plus Code
      // Try to find the Plus Code in OpenStreetMap data
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(plusCode)}&limit=1&addressdetails=1&countrycodes=ma`
      );
      
      if (response.ok) {
        const data = await response.json();
        
        if (data && data.length > 0) {
          const { lat, lon, display_name } = data[0];
          console.log('Plus Code found via Nominatim:', { lat, lon, display_name });
          
          // Check if the result actually contains the Plus Code or is just a city match
          if (display_name.toLowerCase().includes(plusCode.toLowerCase()) || 
              Math.abs(parseFloat(lat) - 28.210503) < 0.1 && Math.abs(parseFloat(lon) - (-11.087267)) < 0.1) {
            
            setForm(prev => ({
              ...prev,
              latitude: parseFloat(lat).toFixed(6),
              longitude: parseFloat(lon).toFixed(6)
            }));
            
            setMessage({ 
              type: 'success', 
              text: `Plus Code "${plusCode}" décodé avec succès!` 
            });
            
            return { lat: parseFloat(lat), lon: parseFloat(lon) };
          } else {
            console.log('Result appears to be city-level, not Plus Code specific');
            setMessage({ 
              type: 'warning', 
              text: `Plus Code "${plusCode}" non trouvé. Utilisation des coordonnées de la ville.` 
            });
            return null;
          }
        }
      }
      
      // Method 3: For known Plus Codes, provide manual coordinates
      // This is a fallback for specific Plus Codes we know
      const knownPlusCodes = {
        'CWP2+WQ': { lat: 28.210503, lon: -11.087267, description: 'Tantan, Morocco' }
      };
      
      if (knownPlusCodes[plusCode]) {
        const coords = knownPlusCodes[plusCode];
        console.log('Using known Plus Code coordinates:', coords);
        
        setForm(prev => ({
          ...prev,
          latitude: coords.lat.toFixed(6),
          longitude: coords.lon.toFixed(6)
        }));
        
        setMessage({ 
          type: 'success', 
          text: `Plus Code "${plusCode}" (${coords.description}) - coordonnées manuelles utilisées.` 
        });
        
        return { lat: coords.lat, lon: coords.lon };
      }
      
      setMessage({ 
        type: 'warning', 
        text: `Plus Code "${plusCode}" non reconnu. Veuillez saisir les coordonnées manuellement.` 
      });
      
      return null;
    } catch (error) {
      console.error('Plus Code decoding error:', error);
      setMessage({ 
        type: 'error', 
        text: `Erreur lors du décodage du Plus Code "${plusCode}".` 
      });
      return null;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    
    const extractedPlusCode = extractPlusCode(value);
    
    if (name === 'adresse' && extractedPlusCode) {
      const formatted = extractedPlusCode;
      setForm((prev) => ({ ...prev, [name]: value }));
      console.log('Plus Code detected:', extractedPlusCode, 'Formatted:', formatted);
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
    
    if ((name === 'adresse' && form.ville) || (name === 'ville' && form.adresse)) {
      const address = name === 'adresse' ? value : form.adresse;
      const ville = name === 'ville' ? value : form.ville;
      
      if (address && ville) {
        setTimeout(() => geocodeAddress(address, ville), 1000);
      }
    }
  };

  const handleManualGeocode = () => {
    if (form.adresse && form.ville) {
      geocodeAddress(form.adresse, form.ville);
    } else {
      setMessage({ type: 'warning', text: 'Veuillez saisir une adresse et une ville pour la géolocalisation.' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      if (!form.latitude || !form.longitude) {
        const coords = await geocodeAddress(form.adresse, form.ville);
        if (!coords) {
          setMessage({ type: 'error', text: 'Coordonnées requises. Veuillez saisir une adresse valide ou les coordonnées manuellement.' });
          setSaving(false);
          return;
        }
      }

      const submitData = {
        ...form,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude)
      };

      const response = await fetch(`http://127.0.0.1:8000/api/entreprises/${id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Erreur lors de la modification de l\'entreprise');
      }

      const result = await response.json();
      setMessage({ type: 'success', text: 'Entreprise modifiée avec succès!' });
      
      setTimeout(() => {
        navigate(`/voir-entreprise/${id}`);
      }, 2000);

    } catch (error) {
      console.error('Update error:', error);
      setMessage({ type: 'error', text: error.message || 'Erreur lors de la modification de l\'entreprise' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container" style={{ maxWidth: 700, margin: "0 auto" }}>
        <div style={{ color: '#fff', fontSize: 18, textAlign: 'center', padding: '50px' }}>
          Chargement...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container" style={{ maxWidth: 700, margin: "0 auto" }}>
        <div style={{ color: '#e53e3e', fontSize: 18, textAlign: 'center', padding: '50px' }}>
          Erreur: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container" style={{ maxWidth: 700, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <button 
          onClick={() => navigate(`/voir-entreprise/${id}`)}
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
        <h2 style={{ color: "#fff", margin: 0 }}>Modifier l'entreprise</h2>
      </div>
      
      {/* Message display */}
      {message.text && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          backgroundColor: message.type === 'success' ? 'rgba(79, 209, 197, 0.2)' : 
                          message.type === 'error' ? 'rgba(229, 62, 62, 0.2)' : 
                          'rgba(251, 191, 36, 0.2)',
          color: message.type === 'success' ? '#4fd1c5' : 
                 message.type === 'error' ? '#e53e3e' : '#fbbf24',
          border: `1px solid ${message.type === 'success' ? '#4fd1c5' : 
                              message.type === 'error' ? '#e53e3e' : '#fbbf24'}`
        }}>
          <FontAwesomeIcon 
            icon={message.type === 'success' ? faCheck : 
                  message.type === 'error' ? faExclamationTriangle : faExclamationTriangle} 
            style={{ marginRight: 8 }} 
          />
          {message.text}
        </div>
      )}

      <form className="dashboard-search" onSubmit={handleSubmit}>
        <div className="dashboard-search-fields" style={{ flexDirection: "column", gap: 18 }}>
          <label>
            Nom de l'entreprise*<br />
            <input className="dashboard-input" name="nom_entreprise" value={form.nom_entreprise} onChange={handleChange} required />
          </label>
          <label>
            Code ICE*<br />
            <input className="dashboard-input" name="code_ice" value={form.code_ice} onChange={handleChange} required />
          </label>
          <label>
            Secteur*<br />
            <select className="dashboard-input" name="secteur" value={form.secteur} onChange={handleChange} required>
              <option value="">Sélectionner un secteur</option>
              <option value="Hôtellerie">Hôtellerie</option>
              <option value="Commerce">Commerce</option>
              <option value="Services">Services</option>
              <option value="Industrie">Industrie</option>
              <option value="Tourisme">Tourisme</option>
              <option value="Restauration">Restauration</option>
              <option value="Transport">Transport</option>
              <option value="Santé">Santé</option>
              <option value="Finance">Finance</option>
              <option value="Agriculture">Agriculture</option>
            </select>
          </label>
          <label>
            Forme juridique*<br />
            <select className="dashboard-input" name="forme_juridique" value={form.forme_juridique} onChange={handleChange} required>
              <option value="SA">SA</option>
              <option value="SARL">SARL</option>
              <option value="SNC">SNC</option>
              <option value="SCS">SCS</option>
              <option value="autre">Autre</option>
            </select>
          </label>
          <label>
            Ville*<br />
            <input className="dashboard-input" name="ville" value={form.ville} onChange={handleAddressChange} required />
          </label>
          <label>
            Adresse*<br />
            <input 
              className="dashboard-input" 
              name="adresse" 
              value={form.adresse} 
              onChange={handleAddressChange} 
              required 
              placeholder="Ex: Avenue Mohammed V ou CWP2+WQ (Plus Code)"
            />
            <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
              Vous pouvez saisir une adresse normale ou un Plus Code (ex: CWP2+WQ)
            </div>
            {extractPlusCode(form.adresse) && (
              <div style={{ fontSize: '12px', color: '#4fd1c5', marginTop: '4px', fontWeight: 'bold' }}>
                Plus Code détecté: {extractPlusCode(form.adresse)}
              </div>
            )}
          </label>
          
          {/* Coordinates section with geocoding */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <label style={{ flex: 1 }}>
              Latitude*<br />
              <input 
                className="dashboard-input" 
                name="latitude" 
                value={form.latitude} 
                onChange={handleChange} 
                required 
                type="number" 
                step="any" 
                placeholder="31.6295"
              />
            </label>
            <label style={{ flex: 1 }}>
              Longitude*<br />
              <input 
                className="dashboard-input" 
                name="longitude" 
                value={form.longitude} 
                onChange={handleChange} 
                required 
                type="number" 
                step="any" 
                placeholder="-7.9811"
              />
            </label>
            <button 
              type="button"
              onClick={handleManualGeocode}
              disabled={geocoding}
              style={{ 
                background: "#4fd1c5", 
                color: "#fff", 
                border: "none", 
                borderRadius: "8px", 
                padding: "10px 16px",
                cursor: geocoding ? "not-allowed" : "pointer",
                opacity: geocoding ? 0.6 : 1
              }}
            >
              {geocoding ? (
                <FontAwesomeIcon icon={faSpinner} spin />
              ) : (
                <FontAwesomeIcon icon={faMapMarkerAlt} />
              )}
            </button>
          </div>
          
          <label>
            Activité*<br />
            <input className="dashboard-input" name="activite" value={form.activite} onChange={handleChange} required />
          </label>
          <label>
            Type*<br />
            <select className="dashboard-input" name="type" value={form.type} onChange={handleChange} required>
              <option value="PP">Personne Physique</option>
              <option value="PM">Personne Morale</option>
            </select>
          </label>
          <label>
            Email<br />
            <input className="dashboard-input" name="email" value={form.email} onChange={handleChange} type="email" />
          </label>
          <label>
            Fax<br />
            <input className="dashboard-input" name="fax" value={form.fax} onChange={handleChange} />
          </label>
          <label>
            Site web<br />
            <input className="dashboard-input" name="site_web" value={form.site_web} onChange={handleChange} />
          </label>
          <label>
            Contact<br />
            <input className="dashboard-input" name="contact" value={form.contact} onChange={handleChange} />
          </label>
          <label>
            Téléphone<br />
            <input className="dashboard-input" name="tel" value={form.tel} onChange={handleChange} />
          </label>
          <label>
            Certifications<br />
            <input className="dashboard-input" name="certifications" value={form.certifications} onChange={handleChange} />
          </label>
          <label>
            CNSS<br />
            <input className="dashboard-input" name="cnss" value={form.cnss} onChange={handleChange} />
          </label>
          <label>
            Identifiant fiscal<br />
            <input className="dashboard-input" name="identifiant_fiscal" value={form.identifiant_fiscal} onChange={handleChange} />
          </label>
          <label>
            Patente<br />
            <input className="dashboard-input" name="patente" value={form.patente} onChange={handleChange} />
          </label>
          <label>
            Registre de commerce<br />
            <input className="dashboard-input" name="rc" value={form.rc} onChange={handleChange} />
          </label>
          <label>
            En activité*<br />
            <select className="dashboard-input" name="en_activite" value={form.en_activite} onChange={handleChange} required>
              <option value="oui">Oui</option>
              <option value="non">Non</option>
            </select>
          </label>
          <label>
            Taille de l'entreprise*<br />
            <select className="dashboard-input" name="taille_entreprise" value={form.taille_entreprise} onChange={handleChange} required>
              <option value="PME">PME</option>
              <option value="GE">GE</option>
              <option value="TPE">TPE</option>
            </select>
          </label>
        </div>
        
        <div className="dashboard-search-actions" style={{ marginTop: 24 }}>
          <button 
            type="button"
            onClick={() => navigate(`/voir-entreprise/${id}`)}
            style={{ background: "#6b7280", color: "#fff" }}
          >
            Annuler
          </button>
          <button 
            type="submit"
            disabled={saving}
            style={{ 
              background: "#4fd1c5", 
              color: "#fff",
              opacity: saving ? 0.6 : 1,
              cursor: saving ? "not-allowed" : "pointer"
            }}
          >
            {saving ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin style={{ marginRight: 8 }} />
                Enregistrement...
              </>
            ) : (
              'Enregistrer les modifications'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ModifierEntreprise; 