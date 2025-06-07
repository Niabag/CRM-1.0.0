import { useState, useEffect } from 'react';
import { API_ENDPOINTS, apiRequest } from '../../../config/api';
import './analytics.scss';

const Analytics = () => {
  const [stats, setStats] = useState({
    totalClients: 0,
    totalDevis: 0,
    totalRevenue: 0,
    devisEnAttente: 0,
    devisAcceptes: 0,
    tauxConversion: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Récupérer les clients et devis
      const [clients, devis] = await Promise.all([
        apiRequest(API_ENDPOINTS.CLIENTS.BASE),
        apiRequest(API_ENDPOINTS.DEVIS.BASE)
      ]);

      // Calculer les statistiques
      const totalRevenue = devis.reduce((sum, d) => sum + (d.amount || 0), 0);
      const devisEnAttente = devis.filter(d => d.status === 'pending' || !d.status).length;
      const devisAcceptes = devis.filter(d => d.status === 'accepted').length;
      const tauxConversion = devis.length > 0 ? (devisAcceptes / devis.length) * 100 : 0;

      setStats({
        totalClients: clients.length,
        totalDevis: devis.length,
        totalRevenue,
        devisEnAttente,
        devisAcceptes,
        tauxConversion
      });

      // Activité récente
      const recent = devis
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5)
        .map(d => ({
          type: 'devis',
          title: d.title,
          date: d.date,
          amount: d.amount
        }));

      setRecentActivity(recent);
    } catch (error) {
      console.error('Erreur lors du chargement des analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="analytics-loading">Chargement des statistiques...</div>;
  }

  return (
    <div className="analytics-container">
      <h2>📊 Tableau de bord</h2>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{stats.totalClients}</h3>
            <p>Clients</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📄</div>
          <div className="stat-content">
            <h3>{stats.totalDevis}</h3>
            <p>Devis créés</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>{stats.totalRevenue.toFixed(2)} €</h3>
            <p>Chiffre d'affaires</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>{stats.devisEnAttente}</h3>
            <p>En attente</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.devisAcceptes}</h3>
            <p>Acceptés</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3>{stats.tauxConversion.toFixed(1)}%</h3>
            <p>Taux de conversion</p>
          </div>
        </div>
      </div>

      <div className="recent-activity">
        <h3>🕒 Activité récente</h3>
        {recentActivity.length === 0 ? (
          <p>Aucune activité récente</p>
        ) : (
          <div className="activity-list">
            {recentActivity.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-icon">📄</div>
                <div className="activity-content">
                  <p><strong>{activity.title}</strong></p>
                  <p className="activity-date">
                    {new Date(activity.date).toLocaleDateString('fr-FR')} - {activity.amount?.toFixed(2)} €
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;