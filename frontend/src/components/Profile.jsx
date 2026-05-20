import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getStoredUser, hasPremiumAccess } from '../utils/auth';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const u = getStoredUser();
    if (!u) {
      navigate('/login');
      return;
    }
    setUser(u);
  }, [navigate]);

  if (!user) return null;

  return (
    <div style={{ maxWidth: 520, margin: '2rem auto', padding: '0 1rem', color: '#e8edf4' }}>
      <h2 style={{ marginBottom: '1.5rem' }}>Mon compte</h2>
      <div style={{ background: 'rgba(30,41,59,0.8)', borderRadius: 12, padding: '1.5rem', border: '1px solid #334155' }}>
        <p><strong>Utilisateur :</strong> {user.username}</p>
        <p><strong>Rôle :</strong> {user.role}</p>
        <p><strong>Téléphone :</strong> {user.numero_telephone || '—'}</p>
        <p><strong>Carte :</strong> {user.numero_carte || '—'}</p>
        <p>
          <strong>Premium :</strong>{' '}
          {hasPremiumAccess(user) ? 'Oui — accès aux prédictions ML' : 'Non'}
        </p>
        {hasPremiumAccess(user) && (
          <Link to="/ai-features" style={{ color: '#4fd1c5', display: 'inline-block', marginTop: '1rem' }}>
            Ouvrir les prédictions ML →
          </Link>
        )}
      </div>
    </div>
  );
};

export default Profile;
