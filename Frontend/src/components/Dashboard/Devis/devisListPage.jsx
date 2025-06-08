import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './devis.scss';

const DevisListPage = () => {
  const [devisList, setDevisList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [groupByClient, setGroupByClient] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadDevis();
  }, []);

  const loadDevis = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/devis`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDevisList(data || []);
      } else {
        throw new Error('Erreur lors du chargement des devis');
      }
    } catch (err) {
      console.error('Erreur devis:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (devisId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce devis ?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/devis/${devisId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        loadDevis();
      }
    } catch (err) {
      console.error('Erreur suppression:', err);
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      brouillon: { icon: '📝', text: 'Brouillon', class: 'nouveau' },
      envoye: { icon: '📤', text: 'Envoyé', class: 'en_attente' },
      accepte: { icon: '✅', text: 'Accepté', class: 'fini' },
      refuse: { icon: '❌', text: 'Refusé', class: 'inactif' }
    };
    
    const config = statusConfig[status] || { icon: '❓', text: 'Inconnu', class: 'nouveau' };
    
    return (
      <span className={`devis-status-badge ${config.class}`}>
        {config.icon} {config.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0);
  };

  const groupDevisByClient = (devisList) => {
    const grouped = devisList.reduce((acc, devis) => {
      const clientKey = devis.clientName || 'Client inconnu';
      if (!acc[clientKey]) {
        acc[clientKey] = {
          clientName: devis.clientName,
          clientEmail: devis.clientEmail,
          devis: []
        };
      }
      acc[clientKey].devis.push(devis);
      return acc;
    }, {});

    return Object.values(grouped);
  };

  if (loading) {
    return (
      <div className="devis-page">
        <div className="loading-state">
          <div className="loading-spinner">⏳</div>
          <p>Chargement des devis...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="devis-page">
        <div className="error-state">❌ {error}</div>
      </div>
    );
  }

  const groupedDevis = groupByClient ? groupDevisByClient(devisList) : null;

  return (
    <div className="devis-page">
      {/* Section liste des devis */}
      <div className="devis-list-section">
        <div className="devis-list-header">
          <h2 className="devis-list-title">📄 Mes Devis</h2>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2rem' }}>
            <button
              onClick={() => navigate('/dashboard/devis/new')}
              className="btn-new"
            >
              ➕ Nouveau devis
            </button>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={groupByClient}
                onChange={(e) => setGroupByClient(e.target.checked)}
              />
              Grouper par client
            </label>
          </div>
        </div>

        {devisList.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📄</div>
            <h3 className="empty-message">Aucun devis trouvé</h3>
            <p>Créez votre premier devis pour commencer.</p>
            <button
              onClick={() => navigate('/dashboard/devis/new')}
              className="cta-button"
            >
              ➕ Créer un devis
            </button>
          </div>
        ) : groupByClient ? (
          // Affichage groupé par client
          <div className="clients-devis-groups">
            {groupedDevis.map((group, groupIndex) => (
              <div key={groupIndex} className="client-devis-group">
                <div className="client-group-header">
                  <div className="client-avatar">
                    {getInitials(group.clientName)}
                  </div>
                  <div className="client-group-info">
                    <h3>{group.clientName}</h3>
                    <p>{group.clientEmail}</p>
                    <span className="devis-count">{group.devis.length} devis</span>
                  </div>
                </div>
                
                <div className="devis-grid">
                  {group.devis.map((devis) => (
                    <div key={devis._id} className="devis-card">
                      <div className="devis-card-top">
                        <div className="devis-avatar">
                          {getInitials(devis.clientName)}
                        </div>
                      </div>

                      <div className="devis-card-content">
                        <div className="devis-card-header">
                          <h4 className="devis-card-title">
                            Devis #{devis.devisNumber || devis._id?.slice(-6)}
                          </h4>
                        </div>

                        <div className="devis-card-meta">
                          <span className="devis-card-date">
                            📅 {formatDate(devis.createdAt)}
                          </span>
                          <span className="devis-card-amount">
                            💰 {formatAmount(devis.totalTTC)}
                          </span>
                        </div>

                        {getStatusBadge(devis.status)}

                        <div className="devis-card-actions">
                          <button
                            onClick={() => navigate(`/dashboard/devis/edit/${devis._id}`)}
                            className="card-btn card-btn-edit"
                            title="Modifier"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(devis._id)}
                            className="card-btn card-btn-delete"
                            title="Supprimer"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Affichage normal
          <div className="devis-grid">
            {devisList.map((devis) => (
              <div key={devis._id} className="devis-card">
                <div className="devis-card-top">
                  <div className="devis-avatar">
                    {getInitials(devis.clientName)}
                  </div>
                </div>

                <div className="devis-card-content">
                  <div className="devis-card-header">
                    <h4 className="devis-card-title">
                      Devis #{devis.devisNumber || devis._id?.slice(-6)}
                    </h4>
                  </div>

                  <div className="devis-client-info">
                    <span className="devis-client-icon">👤</span>
                    <span className="devis-client-name">{devis.clientName}</span>
                  </div>

                  <div className="devis-card-meta">
                    <span className="devis-card-date">
                      📅 {formatDate(devis.createdAt)}
                    </span>
                    <span className="devis-card-amount">
                      💰 {formatAmount(devis.totalTTC)}
                    </span>
                  </div>

                  {getStatusBadge(devis.status)}

                  <div className="devis-card-actions">
                    <button
                      onClick={() => navigate(`/dashboard/devis/edit/${devis._id}`)}
                      className="card-btn card-btn-edit"
                      title="Modifier"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(devis._id)}
                      className="card-btn card-btn-delete"
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DevisListPage;