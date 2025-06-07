import { useState, useEffect } from 'react';
import { API_ENDPOINTS, apiRequest } from '../../../config/api';
import './prospects.scss';

const ProspectsPage = ({ clients = [], onRefresh, onViewClientDevis }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [loading, setLoading] = useState(false);
  const [selectedProspects, setSelectedProspects] = useState([]);
  const [editingProspect, setEditingProspect] = useState(null);

  // Filtrer et trier les prospects
  const filteredProspects = clients
    .filter(client => {
      const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           client.phone.includes(searchTerm);
      
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && client.status === 'active') ||
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

  // ✅ NOUVELLE FONCTION: Changer le statut actif/inactif
  const handleToggleStatus = async (clientId) => {
    const client = clients.find(c => c._id === clientId);
    const newStatus = client.status === 'active' ? 'inactive' : 'active';
    
    setLoading(true);
    try {
      await apiRequest(API_ENDPOINTS.CLIENTS.UPDATE_STATUS(clientId), {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });

      onRefresh && onRefresh();
      
      const statusText = newStatus === 'active' ? 'activé' : 'désactivé';
      alert(`✅ Prospect ${statusText} avec succès`);
    } catch (err) {
      console.error("Erreur changement statut:", err);
      alert(`❌ Erreur lors du changement de statut: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ✅ NOUVELLE FONCTION: Modifier un prospect
  const handleEditProspect = (prospect) => {
    setEditingProspect({
      ...prospect,
      company: prospect.company || '',
      notes: prospect.notes || ''
    });
  };

  const handleSaveProspect = async (e) => {
    e.preventDefault();
    if (!editingProspect) return;

    setLoading(true);
    try {
      await apiRequest(API_ENDPOINTS.CLIENTS.UPDATE(editingProspect._id), {
        method: "PUT",
        body: JSON.stringify({
          name: editingProspect.name,
          email: editingProspect.email,
          phone: editingProspect.phone,
          company: editingProspect.company,
          notes: editingProspect.notes,
          status: editingProspect.status
        }),
      });

      setEditingProspect(null);
      onRefresh && onRefresh();
      alert("✅ Prospect modifié avec succès");
    } catch (err) {
      console.error("Erreur modification prospect:", err);
      alert(`❌ Erreur lors de la modification: ${err.message}`);
    } finally {
      setLoading(false);
    }
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return '🟢';
      case 'inactive': return '🔴';
      case 'pending': return '🟡';
      default: return '🔵';
    }
  };

  return (
    <div className="prospects-page">
      {/* Modal d'édition */}
      {editingProspect && (
        <div className="modal-overlay\" onClick={() => setEditingProspect(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✏️ Modifier le prospect</h3>
              <button 
                className="modal-close"
                onClick={() => setEditingProspect(null)}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSaveProspect} className="edit-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Nom *</label>
                  <input
                    type="text"
                    value={editingProspect.name}
                    onChange={(e) => setEditingProspect(prev => ({...prev, name: e.target.value}))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={editingProspect.email}
                    onChange={(e) => setEditingProspect(prev => ({...prev, email: e.target.value}))}
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Téléphone *</label>
                  <input
                    type="tel"
                    value={editingProspect.phone}
                    onChange={(e) => setEditingProspect(prev => ({...prev, phone: e.target.value}))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Statut</label>
                  <select
                    value={editingProspect.status}
                    onChange={(e) => setEditingProspect(prev => ({...prev, status: e.target.value}))}
                  >
                    <option value="active">🟢 Actif</option>
                    <option value="inactive">🔴 Inactif</option>
                    <option value="pending">🟡 En attente</option>
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label>Entreprise</label>
                <input
                  type="text"
                  value={editingProspect.company}
                  onChange={(e) => setEditingProspect(prev => ({...prev, company: e.target.value}))}
                  placeholder="Nom de l'entreprise"
                />
              </div>
              
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={editingProspect.notes}
                  onChange={(e) => setEditingProspect(prev => ({...prev, notes: e.target.value}))}
                  placeholder="Notes sur le prospect..."
                  rows={3}
                />
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={() => setEditingProspect(null)}
                  className="btn-cancel"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="btn-save"
                  disabled={loading}
                >
                  {loading ? "Enregistrement..." : "💾 Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
            <div className="stat-item">
              <span className="stat-number">{clients.filter(c => c.status === 'active').length}</span>
              <span className="stat-label">🟢 Actifs</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{clients.filter(c => c.status === 'inactive').length}</span>
              <span className="stat-label">🔴 Inactifs</span>
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
                    {getStatusIcon(prospect.status)}
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

                  {/* Statut en texte */}
                  <div className="status-text">
                    <span 
                      className="status-badge"
                      style={{ 
                        backgroundColor: getStatusColor(prospect.status),
                        color: 'white'
                      }}
                    >
                      {getStatusIcon(prospect.status)} {getStatusLabel(prospect.status)}
                    </span>
                  </div>
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
                    disabled={loading}
                  >
                    {prospect.status === 'active' ? '⏸️' : '▶️'}
                  </button>
                  
                  <button 
                    onClick={() => handleEditProspect(prospect)}
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