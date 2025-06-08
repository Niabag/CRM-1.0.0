import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './prospects.scss';

const ProspectsPage = () => {
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedProspects, setSelectedProspects] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProspects, setTotalProspects] = useState(0);
  const [stats, setStats] = useState({});
  
  const navigate = useNavigate();
  const prospectsPerPage = 12;

  useEffect(() => {
    loadProspects();
    loadStats();
  }, [currentPage, searchTerm, statusFilter]);

  const loadProspects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams({
        page: currentPage,
        limit: prospectsPerPage,
        search: searchTerm,
        status: statusFilter !== 'all' ? statusFilter : ''
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/clients?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProspects(data.clients || []);
        setTotalPages(data.totalPages || 1);
        setTotalProspects(data.total || 0);
      } else {
        throw new Error('Erreur lors du chargement des prospects');
      }
    } catch (err) {
      console.error('Erreur prospects:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/stats/clients`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Erreur stats:', err);
    }
  };

  const handleStatusChange = async (prospectId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/clients/${prospectId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        loadProspects();
        loadStats();
      }
    } catch (err) {
      console.error('Erreur changement statut:', err);
    }
  };

  const handleDelete = async (prospectId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce prospect ?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/clients/${prospectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        loadProspects();
        loadStats();
      }
    } catch (err) {
      console.error('Erreur suppression:', err);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProspects.length === 0) return;
    if (!confirm(`Supprimer ${selectedProspects.length} prospect(s) sélectionné(s) ?`)) return;

    try {
      const token = localStorage.getItem('token');
      await Promise.all(
        selectedProspects.map(id =>
          fetch(`${import.meta.env.VITE_API_URL}/api/clients/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
        )
      );
      
      setSelectedProspects([]);
      loadProspects();
      loadStats();
    } catch (err) {
      console.error('Erreur suppression en masse:', err);
    }
  };

  const toggleSelectProspect = (prospectId) => {
    setSelectedProspects(prev =>
      prev.includes(prospectId)
        ? prev.filter(id => id !== prospectId)
        : [...prev, prospectId]
    );
  };

  const toggleSelectAll = () => {
    setSelectedProspects(
      selectedProspects.length === prospects.length
        ? []
        : prospects.map(p => p._id)
    );
  };

  const clearSearch = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'nouveau': return '🔵';
      case 'active': return '🟢';
      case 'inactive': return '🔴';
      case 'pending': return '🟡';
      default: return '⚪';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'nouveau': return 'Nouveau';
      case 'active': return 'Actif';
      case 'inactive': return 'Inactif';
      case 'pending': return 'En attente';
      default: return 'Inconnu';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  if (loading && prospects.length === 0) {
    return (
      <div className="prospects-page">
        <div className="loading-state">
          <div className="loading-spinner">⏳</div>
          <p>Chargement des prospects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="prospects-page">
      {/* En-tête */}
      <div className="prospects-header">
        <div className="header-content">
          <h1 className="page-title">👥 Prospects</h1>
          <div className="stats-summary">
            <div className="stat-item">
              <span className="stat-number">{stats.total || 0}</span>
              <span className="stat-label">Total</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats.nouveau || 0}</span>
              <span className="stat-label">Nouveaux</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats.active || 0}</span>
              <span className="stat-label">Actifs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="filters-section">
        <div className="search-bar">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Rechercher un prospect..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="search-input"
            />
            {searchTerm && (
              <button onClick={clearSearch} className="clear-search">✕</button>
            )}
          </div>
        </div>

        <div className="filters-row">
          <div className="filter-group">
            <label>Statut:</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-select"
            >
              <option value="all">Tous</option>
              <option value="nouveau">Nouveaux</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
              <option value="pending">En attente</option>
            </select>
          </div>

          <div className="bulk-actions">
            <button
              onClick={handleBulkDelete}
              disabled={selectedProspects.length === 0}
              className="bulk-delete-btn"
            >
              🗑️ Supprimer ({selectedProspects.length})
            </button>
          </div>
        </div>

        <div className="pagination-info">
          <span>
            Affichage de {((currentPage - 1) * prospectsPerPage) + 1} à {Math.min(currentPage * prospectsPerPage, totalProspects)} sur {totalProspects} prospects
          </span>
        </div>
      </div>

      {/* Sélection en masse */}
      {selectedProspects.length > 0 && (
        <div className="bulk-select-bar">
          <label className="select-all-checkbox">
            <input
              type="checkbox"
              checked={selectedProspects.length === prospects.length}
              onChange={toggleSelectAll}
            />
            {selectedProspects.length} prospect(s) sélectionné(s)
          </label>
        </div>
      )}

      {/* Grille des prospects */}
      {error ? (
        <div className="error-state">❌ {error}</div>
      ) : prospects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h3>Aucun prospect trouvé</h3>
          <p>
            {searchTerm || statusFilter !== 'all'
              ? 'Aucun prospect ne correspond à vos critères de recherche.'
              : 'Vous n\'avez pas encore de prospects. Ils apparaîtront ici une fois ajoutés.'}
          </p>
          {(searchTerm || statusFilter !== 'all') && (
            <button onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setCurrentPage(1);
            }} className="cta-button">
              Voir tous les prospects
            </button>
          )}
        </div>
      ) : (
        <div className="prospects-grid">
          {prospects.map((prospect) => (
            <div
              key={prospect._id}
              className={`prospect-card ${selectedProspects.includes(prospect._id) ? 'selected' : ''}`}
            >
              {/* Section supérieure */}
              <div className="card-top-section">
                <div className="card-select">
                  <input
                    type="checkbox"
                    checked={selectedProspects.includes(prospect._id)}
                    onChange={() => toggleSelectProspect(prospect._id)}
                  />
                </div>

                <div className="prospect-avatar">
                  {getInitials(prospect.name)}
                </div>

                <div
                  className="status-indicator clickable"
                  onClick={() => {
                    const statuses = ['nouveau', 'active', 'inactive', 'pending'];
                    const currentIndex = statuses.indexOf(prospect.status);
                    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
                    handleStatusChange(prospect._id, nextStatus);
                  }}
                  title="Cliquer pour changer le statut"
                >
                  {getStatusIcon(prospect.status)}
                </div>
              </div>

              {/* Contenu */}
              <div className="card-content">
                <h3 className="prospect-name">{prospect.name}</h3>

                <div className="contact-info">
                  <div className="contact-item">
                    <span className="contact-icon">📧</span>
                    <span className="contact-text">{prospect.email}</span>
                  </div>
                  {prospect.phone && (
                    <div className="contact-item">
                      <span className="contact-icon">📞</span>
                      <span className="contact-text">{prospect.phone}</span>
                    </div>
                  )}
                </div>

                {prospect.company && (
                  <div className="company-info">
                    <span className="company-icon">🏢</span>
                    <span className="company-name">{prospect.company}</span>
                  </div>
                )}

                {prospect.notes && (
                  <div className="notes-preview">
                    <span className="notes-icon">📝</span>
                    <span className="notes-text">{prospect.notes}</span>
                  </div>
                )}

                <div className="status-text">
                  <span className={`status-badge ${prospect.status}`}>
                    {getStatusIcon(prospect.status)} {getStatusText(prospect.status)}
                  </span>
                </div>

                {/* Actions */}
                <div className="card-actions">
                  <button
                    onClick={() => navigate(`/dashboard/prospects/edit/${prospect._id}`)}
                    className="action-btn edit-action"
                    title="Modifier"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(prospect._id)}
                    className="action-btn delete-action"
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="card-footer">
                <span className="join-date">
                  Ajouté le {formatDate(prospect.createdAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination-controls">
          <div className="pagination-wrapper">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="pagination-btn pagination-prev"
            >
              ← Précédent
            </button>

            <div className="pagination-numbers">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`pagination-number ${currentPage === pageNum ? 'active' : ''}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="pagination-btn pagination-next"
            >
              Suivant →
            </button>
          </div>

          <div className="pagination-details">
            <span>Page {currentPage} sur {totalPages}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProspectsPage;