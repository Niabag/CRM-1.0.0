import { useState, useEffect } from 'react';
import { API_ENDPOINTS, apiRequest } from '../../../config/api';
import './prospects.scss';

const ProspectsPage = ({ clients = [], onRefresh, onViewClientDevis }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [loading, setLoading] = useState(false);
  const [selectedProspects, setSelectedProspects] = useState([]);

  // Filtrer et trier les prospects
  const filteredProspects = clients
    .filter(client => {
      const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           client.phone.includes(searchTerm);
      
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && client.status !== 'inactive') ||
                           (statusFilter === 'inactive' && client.status === 'inactive');
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'email':
          return a.email.localeCompare(b.email);
        case 'date':
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        default:
          return 0;
      }
    });

  const handleDeleteClient = async (clientId) => {
    const client = clients.find(c => c._id === clientId);
    const confirmDelete = window.confirm(
      `❗ Supprimer le prospect "${client?.name}" et tous ses devis ?`
    );
    if (!confirmDelete) return;

    setLoading(true);
    try {
      await apiRequest(API_ENDPOINTS.CLIENTS.DELETE(clientId), {
        method: "DELETE",
      });

      onRefresh && onRefresh();
      alert("✅ Prospect supprimé avec succès");
    } catch (err) {
      console.error("Erreur suppression prospect:", err);
      alert(`❌ Échec suppression: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (clientId) => {
    // Simulation du changement de statut (à implémenter côté backend)
    console.log(`Toggle status for client ${clientId}`);
  };

  const handleSelectProspect = (clientId) => {
    setSelectedProspects(prev => 
      prev.includes(clientId) 
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProspects.length === filteredProspects.length) {
      setSelectedProspects([]);
    } else {
      setSelectedProspects(filteredProspects.map(p => p._id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProspects.length === 0) return;
    
    const confirmDelete = window.confirm(
      `❗ Supprimer ${selectedProspects.length} prospect(s) sélectionné(s) ?`
    );
    if (!confirmDelete) return;

    setLoading(true);
    try {
      await Promise.all(
        selectedProspects.map(id => 
          apiRequest(API_ENDPOINTS.CLIENTS.DELETE(id), { method: "DELETE" })
        )
      );

      setSelectedProspects([]);
      onRefresh && onRefresh();
      alert(`✅ ${selectedProspects.length} prospect(s) supprimé(s)`);
    } catch (err) {
      console.error("Erreur suppression en masse:", err);
      alert(`❌ Erreur lors de la suppression: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#48bb78';
      case 'inactive': return '#f56565';
      case 'pending': return '#ed8936';
      default: return '#4299e1';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'inactive': return 'Inactif';
      case 'pending': return 'En attente';
      default: return 'Nouveau';
    }
  };

  return (
    <div className="prospects-page">
      {/* En-tête avec titre et statistiques */}
      <div className="prospects-header">
        <div className="header-content">
          <h1 className="page-title">👥 Mes Prospects</h1>
          <div className="stats-summary">
            <div className="stat-item">
              <span className="stat-number">{clients.length}</span>
              <span className="stat-label">Total</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{filteredProspects.length}</span>
              <span className="stat-label">Affichés</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{selectedProspects.length}</span>
              <span className="stat-label">Sélectionnés</span>
            </div>
          </div>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="filters-section">
        <div className="search-bar">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Rechercher par nom, email ou téléphone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button 
                className="clear-search"
                onClick={() => setSearchTerm('')}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="filters-row">
          <div className="filter-group">
            <label>Statut :</label>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">Tous</option>
              <option value="active">🟢 Actifs</option>
              <option value="inactive">🔴 Inactifs</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Trier par :</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="name">Nom A-Z</option>
              <option value="email">Email A-Z</option>
              <option value="date">Plus récent</option>
            </select>
          </div>

          {selectedProspects.length > 0 && (
            <div className="bulk-actions">
              <button 
                onClick={handleBulkDelete}
                className="bulk-delete-btn"
                disabled={loading}
              >
                🗑️ Supprimer ({selectedProspects.length})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Liste des prospects */}
      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner">⏳</div>
          <p>Chargement...</p>
        </div>
      ) : filteredProspects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h3>
            {searchTerm || statusFilter !== 'all' 
              ? "Aucun prospect trouvé" 
              : "Aucun prospect enregistré"
            }
          </h3>
          <p>
            {searchTerm || statusFilter !== 'all'
              ? "Essayez de modifier vos critères de recherche"
              : "Utilisez votre QR code pour permettre à vos prospects de s'inscrire !"
            }
          </p>
          {(!searchTerm && statusFilter === 'all') && (
            <button 
              onClick={() => window.location.hash = '#carte'} 
              className="cta-button"
            >
              🎯 Générer mon QR code
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Actions en masse */}
          {filteredProspects.length > 0 && (
            <div className="bulk-select-bar">
              <label className="select-all-checkbox">
                <input
                  type="checkbox"
                  checked={selectedProspects.length === filteredProspects.length}
                  onChange={handleSelectAll}
                />
                <span>Sélectionner tout ({filteredProspects.length})</span>
              </label>
            </div>
          )}

          {/* Grille des cartes prospects */}
          <div className="prospects-grid">
            {filteredProspects.map((prospect) => (
              <div 
                key={prospect._id} 
                className={`prospect-card ${selectedProspects.includes(prospect._id) ? 'selected' : ''}`}
              >
                {/* Checkbox de sélection */}
                <div className="card-select">
                  <input
                    type="checkbox"
                    checked={selectedProspects.includes(prospect._id)}
                    onChange={() => handleSelectProspect(prospect._id)}
                  />
                </div>

                {/* Avatar et statut */}
                <div className="card-header">
                  <div className="prospect-avatar">
                    {prospect.name ? prospect.name.charAt(0).toUpperCase() : "?"}
                  </div>
                  <div 
                    className="status-indicator"
                    style={{ backgroundColor: getStatusColor(prospect.status) }}
                    title={getStatusLabel(prospect.status)}
                  >
                    {prospect.status === 'active' ? '🟢' : 
                     prospect.status === 'inactive' ? '🔴' : '🟡'}
                  </div>
                </div>

                {/* Informations principales */}
                <div className="card-content">
                  <h3 className="prospect-name">{prospect.name || "N/A"}</h3>
                  
                  <div className="contact-info">
                    <div className="contact-item">
                      <span className="contact-icon">📧</span>
                      <span className="contact-text">{prospect.email || "N/A"}</span>
                    </div>
                    <div className="contact-item">
                      <span className="contact-icon">📞</span>
                      <span className="contact-text">{prospect.phone || "N/A"}</span>
                    </div>
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
                </div>

                {/* Actions */}
                <div className="card-actions">
                  <button 
                    onClick={() => onViewClientDevis && onViewClientDevis(prospect)}
                    className="action-btn primary-action"
                    title="Voir les devis"
                  >
                    📄
                  </button>
                  
                  <button 
                    onClick={() => handleToggleStatus(prospect._id)}
                    className="action-btn secondary-action"
                    title={prospect.status === 'active' ? 'Désactiver' : 'Activer'}
                  >
                    {prospect.status === 'active' ? '⏸️' : '▶️'}
                  </button>
                  
                  <button 
                    onClick={() => console.log('Modifier prospect', prospect._id)}
                    className="action-btn edit-action"
                    title="Modifier"
                  >
                    ✏️
                  </button>
                  
                  <button 
                    onClick={() => handleDeleteClient(prospect._id)}
                    className="action-btn delete-action"
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>

                {/* Métadonnées */}
                <div className="card-footer">
                  <span className="join-date">
                    Inscrit le {new Date(prospect.createdAt || Date.now()).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ProspectsPage;