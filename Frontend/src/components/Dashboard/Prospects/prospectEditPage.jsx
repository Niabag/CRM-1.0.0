import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './prospectEdit.scss';

const ProspectEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [prospect, setProspect] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    status: 'nouveau',
    notes: ''
  });

  useEffect(() => {
    loadProspect();
  }, [id]);

  const loadProspect = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/clients/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProspect(data);
        setFormData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          company: data.company || '',
          status: data.status || 'nouveau',
          notes: data.notes || ''
        });
      } else {
        throw new Error('Prospect non trouvé');
      }
    } catch (err) {
      console.error('Erreur chargement prospect:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStatusClick = () => {
    const statuses = ['nouveau', 'active', 'inactive', 'pending'];
    const currentIndex = statuses.indexOf(formData.status);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    setFormData(prev => ({
      ...prev,
      status: nextStatus
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/clients/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        navigate('/dashboard/prospects');
      } else {
        throw new Error('Erreur lors de la sauvegarde');
      }
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce prospect ?')) return;

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/clients/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        navigate('/dashboard/prospects');
      } else {
        throw new Error('Erreur lors de la suppression');
      }
    } catch (err) {
      console.error('Erreur suppression:', err);
      setError(err.message);
    }
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

  if (loading) {
    return (
      <div className="prospect-edit-page">
        <div className="loading-container">
          <div className="loading-spinner">⏳</div>
          <p className="loading-text">Chargement du prospect...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="prospect-edit-page">
        <div className="error-container">
          <h2>❌ Erreur</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/dashboard/prospects')} className="btn-back">
            ← Retour aux prospects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="prospect-edit-page">
      <div className="edit-container">
        {/* En-tête */}
        <div className="edit-header">
          <button onClick={() => navigate('/dashboard/prospects')} className="btn-back">
            ← Retour aux prospects
          </button>
          
          <div className="prospect-header-info">
            <div className="prospect-avatar-large">
              {getInitials(formData.name)}
            </div>
            
            <div className="prospect-title">
              <h1>{formData.name || 'Prospect sans nom'}</h1>
              <p className="prospect-subtitle">{formData.email}</p>
            </div>
            
            <div 
              className="status-indicator-large clickable"
              onClick={handleStatusClick}
              title="Cliquer pour changer le statut"
            >
              <div className="status-icon">{getStatusIcon(formData.status)}</div>
              <div className="status-text">{getStatusText(formData.status)}</div>
              <div className="status-hint">Cliquer pour changer</div>
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <div className="edit-form">
          {error && (
            <div className="error-message">❌ {error}</div>
          )}

          {/* Informations personnelles */}
          <div className="form-section">
            <h3>👤 Informations personnelles</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Nom complet *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Téléphone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label>Entreprise</label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          {/* Statut */}
          <div className="form-section">
            <h3>📊 Statut et suivi</h3>
            
            <div className="form-group">
              <label>Statut</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
              >
                <option value="nouveau">🔵 Nouveau</option>
                <option value="active">🟢 Actif</option>
                <option value="inactive">🔴 Inactif</option>
                <option value="pending">🟡 En attente</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Notes sur ce prospect..."
              />
            </div>
          </div>

          {/* Informations système */}
          <div className="form-section">
            <h3>ℹ️ Informations système</h3>
            
            <div className="info-section">
              <div className="info-item">
                <span className="info-label">ID:</span>
                <span className="info-value">{prospect?._id}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Créé le:</span>
                <span className="info-value">
                  {prospect?.createdAt ? new Date(prospect.createdAt).toLocaleString('fr-FR') : 'N/A'}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Modifié le:</span>
                <span className="info-value">
                  {prospect?.updatedAt ? new Date(prospect.updatedAt).toLocaleString('fr-FR') : 'N/A'}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Source:</span>
                <span className="info-value">{prospect?.source || 'Manuel'}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="form-actions">
            <button
              onClick={() => navigate('/dashboard/prospects')}
              className="btn-cancel"
            >
              ❌ Annuler
            </button>
            
            <button
              onClick={handleDelete}
              className="btn-delete"
            >
              🗑️ Supprimer
            </button>
            
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-save"
            >
              {saving ? '⏳ Sauvegarde...' : '💾 Sauvegarder'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProspectEditPage;