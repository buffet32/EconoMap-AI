import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBuilding,
  faChartBar,
  faChartPie,
  faChartLine,
  faMapMarkerAlt,
  faIndustry,
  faUsers,
  faCalendarAlt,
  faArrowUp,
  faArrowDown,
  faEquals
} from '@fortawesome/free-solid-svg-icons';
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const [entreprises, setEntreprises] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser).user;
        if (user.role !== 'admin') {
          window.location.href = '/';
          return;
        } else {
          setLoggedIn(true);
        }
      } catch {
        window.location.href = '/';
        return;
      }
    } else {
      window.location.href = '/';
      return;
    }

    // Fetch data
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;
      
      const parsed = JSON.parse(storedUser);
      const token = parsed.access || (parsed.user && parsed.user.access) || parsed.access_token;
      if (!token) return;

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const [entreprisesRes, usersRes] = await Promise.all([
        fetch("http://127.0.0.1:8000/api/entreprises/", { headers }),
        fetch("http://127.0.0.1:8000/api/users/", { headers })
      ]);

      if (!entreprisesRes.ok || !usersRes.ok) {
        throw new Error('API request failed');
      }

      const entreprisesData = await entreprisesRes.json();
      const usersData = await usersRes.json();

      setEntreprises(entreprisesData);
      setUsers(Array.isArray(usersData) ? usersData : usersData.results || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  if (!loggedIn || loading) {
    return (
      <div className="admin-dashboard-container">
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

  // Calculate statistics
  const totalCompanies = entreprises.length;
  const totalUsers = users.length;
  const activeCompanies = entreprises.filter(e => e.en_activite === 'oui').length;
  const inactiveCompanies = totalCompanies - activeCompanies;

  // Sector statistics
  const sectorStats = entreprises.reduce((acc, e) => {
    acc[e.secteur] = (acc[e.secteur] || 0) + 1;
    return acc;
  }, {});

  const topSectors = Object.entries(sectorStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  // City statistics
  const cityStats = entreprises.reduce((acc, e) => {
    acc[e.ville] = (acc[e.ville] || 0) + 1;
    return acc;
  }, {});

  const topCities = Object.entries(cityStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  // Company type statistics
  const companyTypes = entreprises.reduce((acc, e) => {
    acc[e.type] = (acc[e.type] || 0) + 1;
    return acc;
  }, {});

  // Legal form statistics
  const legalForms = entreprises.reduce((acc, e) => {
    acc[e.forme_juridique] = (acc[e.forme_juridique] || 0) + 1;
    return acc;
  }, {});

  // Recent companies (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentCompanies = entreprises.filter(e => new Date(e.date_creation) >= thirtyDaysAgo);

  // Growth calculation
  const previousPeriod = new Date();
  if (selectedPeriod === 'month') {
    previousPeriod.setMonth(previousPeriod.getMonth() - 1);
  } else if (selectedPeriod === 'quarter') {
    previousPeriod.setMonth(previousPeriod.getMonth() - 3);
  } else if (selectedPeriod === 'year') {
    previousPeriod.setFullYear(previousPeriod.getFullYear() - 1);
  }

  const currentPeriodCompanies = entreprises.filter(e => new Date(e.date_creation) >= previousPeriod);
  const previousPeriodCompanies = entreprises.filter(e => {
    const date = new Date(e.date_creation);
    return date >= new Date(previousPeriod.getTime() - (previousPeriod.getTime() - new Date().getTime()));
  });

  const growthRate = previousPeriodCompanies.length > 0 
    ? ((currentPeriodCompanies.length - previousPeriodCompanies.length) / previousPeriodCompanies.length * 100).toFixed(1)
    : 0;

  const getGrowthIcon = (rate) => {
    if (rate > 0) return { icon: faArrowUp, color: '#10B981', text: 'Croissance' };
    if (rate < 0) return { icon: faArrowDown, color: '#EF4444', text: 'Déclin' };
    return { icon: faEquals, color: '#6B7280', text: 'Stable' };
  };

  const growthInfo = getGrowthIcon(growthRate);

  return (
    <div className="admin-dashboard-container">
      {/* Header */}
      <div className="admin-dashboard-header">
        <h1>
          <FontAwesomeIcon icon={faChartBar} style={{ marginRight: '12px', color: '#8c54bc' }} />
          Tableau de Bord Administrateur
        </h1>
        <div className="period-selector">
          <label>Période: </label>
          <select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="period-select"
          >
            <option value="month">Mois</option>
            <option value="quarter">Trimestre</option>
            <option value="year">Année</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card primary">
          <div className="metric-icon">
            <FontAwesomeIcon icon={faBuilding} />
          </div>
          <div className="metric-content">
            <div className="metric-value">{totalCompanies}</div>
            <div className="metric-label">Total Entreprises</div>
            <div className="metric-change positive">
              <FontAwesomeIcon icon={faArrowUp} />
              +{recentCompanies.length} ce mois
            </div>
          </div>
        </div>

        <div className="metric-card success">
          <div className="metric-icon">
            <FontAwesomeIcon icon={faUsers} />
          </div>
          <div className="metric-content">
            <div className="metric-value">{totalUsers}</div>
            <div className="metric-label">Utilisateurs</div>
            <div className="metric-change positive">
              <FontAwesomeIcon icon={faArrowUp} />
              Actifs
            </div>
          </div>
        </div>

        <div className="metric-card warning">
          <div className="metric-icon">
            <FontAwesomeIcon icon={faIndustry} />
          </div>
          <div className="metric-content">
            <div className="metric-value">{Object.keys(sectorStats).length}</div>
            <div className="metric-label">Secteurs d'Activité</div>
            <div className="metric-change neutral">
              <FontAwesomeIcon icon={faEquals} />
              Diversifiés
            </div>
          </div>
        </div>

        <div className="metric-card info">
          <div className="metric-icon">
            <FontAwesomeIcon icon={faMapMarkerAlt} />
          </div>
          <div className="metric-content">
            <div className="metric-value">{Object.keys(cityStats).length}</div>
            <div className="metric-label">Villes Couvertes</div>
            <div className="metric-change positive">
              <FontAwesomeIcon icon={faArrowUp} />
              Expansion
            </div>
          </div>
        </div>
      </div>

      {/* Growth and Activity */}
      <div className="stats-row">
        <div className="stats-card">
          <h3>
            <FontAwesomeIcon icon={faChartLine} style={{ marginRight: '8px', color: '#8c54bc' }} />
            Croissance des Entreprises
          </h3>
          <div className="growth-metric">
            <div className="growth-rate" style={{ color: growthInfo.color }}>
              {growthRate > 0 ? '+' : ''}{growthRate}%
            </div>
            <div className="growth-label">
              <FontAwesomeIcon icon={growthInfo.icon} style={{ marginRight: '8px' }} />
              {growthInfo.text}
            </div>
          </div>
          <div className="growth-details">
            <div className="growth-item">
              <span>Période actuelle:</span>
              <strong>{currentPeriodCompanies.length}</strong>
            </div>
            <div className="growth-item">
              <span>Période précédente:</span>
              <strong>{previousPeriodCompanies.length}</strong>
            </div>
          </div>
        </div>

        <div className="stats-card">
          <h3>
            <FontAwesomeIcon icon={faCalendarAlt} style={{ marginRight: '8px', color: '#4fd1c5' }} />
            Activité Récente
          </h3>
          <div className="activity-metric">
            <div className="activity-number">{recentCompanies.length}</div>
            <div className="activity-label">Nouvelles entreprises (30 jours)</div>
          </div>
          <div className="activity-chart">
            {recentCompanies.slice(0, 7).map((company, index) => (
              <div 
                key={company.id} 
                className="activity-bar"
                style={{ 
                  height: `${(index + 1) * 10}px`,
                  background: `linear-gradient(135deg, #8c54bc, #7c3aed)`
                }}
                title={`${company.nom_entreprise} - ${company.secteur}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        {/* Sector Distribution */}
        <div className="chart-card">
          <h3>
            <FontAwesomeIcon icon={faChartPie} style={{ marginRight: '8px', color: '#8c54bc' }} />
            Distribution par Secteur
          </h3>
          <div className="chart-content">
            {topSectors.map(([sector, count], index) => {
              const percentage = ((count / totalCompanies) * 100).toFixed(1);
              const colors = ['#8c54bc', '#4fd1c5', '#fbbf24', '#ef4444', '#10b981'];
              return (
                <div key={sector} className="chart-item">
                  <div className="chart-item-header">
                    <span className="chart-item-label">{sector}</span>
                    <span className="chart-item-value">{count}</span>
                  </div>
                  <div className="chart-bar-container">
                    <div 
                      className="chart-bar" 
                      style={{ 
                        width: `${percentage}%`,
                        background: colors[index % colors.length]
                      }}
                    />
                    <span className="chart-percentage">{percentage}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* City Distribution */}
        <div className="chart-card">
          <h3>
            <FontAwesomeIcon icon={faMapMarkerAlt} style={{ marginRight: '8px', color: '#4fd1c5' }} />
            Distribution par Ville
          </h3>
          <div className="chart-content">
            {topCities.map(([city, count], index) => {
              const percentage = ((count / totalCompanies) * 100).toFixed(1);
              const colors = ['#4fd1c5', '#8c54bc', '#fbbf24', '#ef4444', '#10b981'];
              return (
                <div key={city} className="chart-item">
                  <div className="chart-item-header">
                    <span className="chart-item-label">{city}</span>
                    <span className="chart-item-value">{count}</span>
                  </div>
                  <div className="chart-bar-container">
                    <div 
                      className="chart-bar" 
                      style={{ 
                        width: `${percentage}%`,
                        background: colors[index % colors.length]
                      }}
                    />
                    <span className="chart-percentage">{percentage}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detailed Statistics */}
      <div className="detailed-stats">
        <div className="stats-section">
          <h3>
            <FontAwesomeIcon icon={faBuilding} style={{ marginRight: '8px', color: '#8c54bc' }} />
            Types d'Entreprises
          </h3>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">{companyTypes.PM || 0}</div>
              <div className="stat-label">Personnes Morales</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{companyTypes.PP || 0}</div>
              <div className="stat-label">Personnes Physiques</div>
            </div>
          </div>
        </div>

        <div className="stats-section">
          <h3>
            <FontAwesomeIcon icon={faChartBar} style={{ marginRight: '8px', color: '#4fd1c5' }} />
            Formes Juridiques
          </h3>
          <div className="stats-grid">
            {Object.entries(legalForms).map(([form, count]) => (
              <div key={form} className="stat-item">
                <div className="stat-number">{count}</div>
                <div className="stat-label">{form}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="stats-section">
          <h3>
            <FontAwesomeIcon icon={faChartBar} style={{ marginRight: '8px', color: '#fbbf24' }} />
            Statut d'Activité
          </h3>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">{activeCompanies}</div>
              <div className="stat-label">En Activité</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{inactiveCompanies}</div>
              <div className="stat-label">Inactives</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 