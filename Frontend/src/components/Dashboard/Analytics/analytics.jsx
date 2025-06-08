import React, { useState, useEffect } from 'react';
import './analytics.scss';

const Analytics = () => {
  const [stats, setStats] = useState({
    totalClients: 0,
    totalDevis: 0,
    totalCA: 0,
    conversionRate: 0,
    clientsByStatus: {},
    devisByStatus: {},
    monthlyData: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/stats/analytics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        throw new Error('Erreur lors du chargement des statistiques');
      }
    } catch (err) {
      console.error('Erreur analytics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="analytics-container">
        <div className="analytics-loading">
          <div className="loading-spinner">⏳</div>
          <p>Chargement des analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-container">
        <div className="error-state">
          ❌ {error}
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      {/* En-tête */}
      <div className="dashboard-header">
        <h1>📊 Analytics & Statistiques</h1>
        <p className="dashboard-subtitle">Vue d'ensemble de votre activité</p>
      </div>

      {/* KPIs principaux */}
      <div className="kpi-section">
        <h2>📈 Indicateurs Clés</h2>
        <div className="kpi-grid">
          <div className="kpi-card highlight">
            <div className="kpi-icon">👥</div>
            <div className="kpi-content">
              <h3>{stats.totalClients}</h3>
              <p>Total Clients</p>
              <span className="kpi-trend positive">+12% ce mois</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon">📄</div>
            <div className="kpi-content">
              <h3>{stats.totalDevis}</h3>
              <p>Devis Créés</p>
              <span className="kpi-trend positive">+8% ce mois</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon">💰</div>
            <div className="kpi-content">
              <h3>{stats.totalCA?.toLocaleString() || 0}€</h3>
              <p>Chiffre d'Affaires</p>
              <span className="kpi-trend positive">+15% ce mois</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon">📊</div>
            <div className="kpi-content">
              <h3>{stats.conversionRate || 0}%</h3>
              <p>Taux de Conversion</p>
              <span className="kpi-trend neutral">Stable</span>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques détaillées */}
      <div className="stats-section">
        <div className="stats-row">
          {/* Clients par statut */}
          <div className="stats-group">
            <h3>👥 Clients par Statut</h3>
            <div className="stats-grid">
              <div className="stat-card nouveau">
                <div className="stat-icon">🔵</div>
                <div className="stat-content">
                  <h4>{stats.clientsByStatus?.nouveau || 0}</h4>
                  <p>Nouveaux</p>
                </div>
              </div>
              <div className="stat-card active">
                <div className="stat-icon">🟢</div>
                <div className="stat-content">
                  <h4>{stats.clientsByStatus?.active || 0}</h4>
                  <p>Actifs</p>
                </div>
              </div>
              <div className="stat-card inactive">
                <div className="stat-icon">🔴</div>
                <div className="stat-content">
                  <h4>{stats.clientsByStatus?.inactive || 0}</h4>
                  <p>Inactifs</p>
                </div>
              </div>
              <div className="stat-card en-attente">
                <div className="stat-icon">🟡</div>
                <div className="stat-content">
                  <h4>{stats.clientsByStatus?.pending || 0}</h4>
                  <p>En attente</p>
                </div>
              </div>
            </div>
          </div>

          {/* Devis par statut */}
          <div className="stats-group">
            <h3>📄 Devis par Statut</h3>
            <div className="stats-grid">
              <div className="stat-card nouveau">
                <div className="stat-icon">📝</div>
                <div className="stat-content">
                  <h4>{stats.devisByStatus?.brouillon || 0}</h4>
                  <p>Brouillons</p>
                </div>
              </div>
              <div className="stat-card en-attente">
                <div className="stat-icon">⏳</div>
                <div className="stat-content">
                  <h4>{stats.devisByStatus?.envoye || 0}</h4>
                  <p>Envoyés</p>
                </div>
              </div>
              <div className="stat-card fini">
                <div className="stat-icon">✅</div>
                <div className="stat-content">
                  <h4>{stats.devisByStatus?.accepte || 0}</h4>
                  <p>Acceptés</p>
                </div>
              </div>
              <div className="stat-card inactif">
                <div className="stat-icon">❌</div>
                <div className="stat-content">
                  <h4>{stats.devisByStatus?.refuse || 0}</h4>
                  <p>Refusés</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Évolution mensuelle */}
      <div className="evolution-section">
        <h3>📈 Évolution sur 6 mois</h3>
        <div className="evolution-chart">
          {stats.monthlyData?.map((month, index) => (
            <div key={index} className="month-bar">
              <div className="month-data">
                <div className="bar-container">
                  <div 
                    className="bar clients-bar" 
                    style={{ height: `${(month.clients / 20) * 100}%` }}
                    title={`${month.clients} clients`}
                  ></div>
                  <div 
                    className="bar devis-bar" 
                    style={{ height: `${(month.devis / 15) * 100}%` }}
                    title={`${month.devis} devis`}
                  ></div>
                </div>
                <div className="month-stats">
                  <div className="month-clients">{month.clients}c</div>
                  <div className="month-devis">{month.devis}d</div>
                  <div className="month-ca">{month.ca}€</div>
                </div>
              </div>
              <div className="month-label">{month.month}</div>
            </div>
          )) || (
            // Données par défaut si pas de données
            ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'].map((month, index) => (
              <div key={index} className="month-bar">
                <div className="month-data">
                  <div className="bar-container">
                    <div className="bar clients-bar" style={{ height: '50%' }}></div>
                    <div className="bar devis-bar" style={{ height: '30%' }}></div>
                  </div>
                  <div className="month-stats">
                    <div className="month-clients">0c</div>
                    <div className="month-devis">0d</div>
                    <div className="month-ca">0€</div>
                  </div>
                </div>
                <div className="month-label">{month}</div>
              </div>
            ))
          )}
        </div>
        <div className="chart-legend">
          <div className="legend-item">
            <div className="legend-color clients"></div>
            <span>Clients</span>
          </div>
          <div className="legend-item">
            <div className="legend-color devis"></div>
            <span>Devis</span>
          </div>
        </div>
      </div>

      {/* Section bottom */}
      <div className="bottom-section">
        <div className="bottom-row">
          {/* Top clients */}
          <div className="top-clients">
            <h3>🏆 Top Clients</h3>
            <div className="clients-list">
              {[1, 2, 3].map((rank) => (
                <div key={rank} className="client-item">
                  <div className="client-rank">#{rank}</div>
                  <div className="client-avatar">
                    {rank === 1 ? 'JD' : rank === 2 ? 'MS' : 'PL'}
                  </div>
                  <div className="client-info">
                    <h4>
                      {rank === 1 ? 'Jean Dupont' : 
                       rank === 2 ? 'Marie Simon' : 'Pierre Laurent'}
                    </h4>
                    <p>
                      {rank === 1 ? 'Tech Solutions' : 
                       rank === 2 ? 'Design Studio' : 'Consulting Pro'}
                    </p>
                    <div className="client-stats">
                      <span className="client-ca">{rank === 1 ? '15,000' : rank === 2 ? '12,500' : '8,900'}€</span>
                      <span className="client-devis">{rank === 1 ? '8' : rank === 2 ? '6' : '4'} devis</span>
                    </div>
                  </div>
                  <div className="client-status">
                    {rank === 1 ? '🟢' : rank === 2 ? '🟡' : '🔵'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activité récente */}
          <div className="recent-activity">
            <h3>🕒 Activité Récente</h3>
            <div className="activity-list">
              {[
                { type: 'client', icon: '👤', title: 'Nouveau client', client: 'Sophie Martin', company: 'Web Agency', time: 'Il y a 2h' },
                { type: 'devis', icon: '📄', title: 'Devis accepté', client: 'Pierre Durand', amount: '5,500€', status: 'accepte', time: 'Il y a 4h' },
                { type: 'system', icon: '🔔', title: 'Rappel', client: 'Marie Dubois', time: 'Il y a 1j' }
              ].map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-icon">{activity.icon}</div>
                  <div className="activity-content">
                    <h4>{activity.title}</h4>
                    <p>
                      <span className="activity-client">{activity.client}</span>
                      {activity.company && <span className="activity-company">• {activity.company}</span>}
                      {activity.amount && <span className="activity-amount">• {activity.amount}</span>}
                      {activity.status && <span className={`activity-status ${activity.status}`}>{activity.status}</span>}
                    </p>
                    <div className="activity-date">{activity.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;