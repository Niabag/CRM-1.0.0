import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import './businessCard.scss';

const BusinessCard = () => {
  const [businessCard, setBusinessCard] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    logo: null,
    qrPosition: 'bottom-right',
    qrSize: 80,
    actions: []
  });

  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [editingAction, setEditingAction] = useState(null);
  const [newAction, setNewAction] = useState({
    type: 'form',
    title: '',
    url: '',
    fileName: '',
    fileUrl: '',
    delay: 0,
    active: true,
    order: 0
  });

  useEffect(() => {
    loadBusinessCard();
  }, []);

  useEffect(() => {
    if (businessCard.companyName) {
      generateQRCode();
    }
  }, [businessCard.actions]);

  const loadBusinessCard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/business-cards/my-card`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBusinessCard(data);
        if (data._id) {
          generateQRCodeUrl(data._id);
        }
      } else if (response.status === 404) {
        // Pas de carte existante, on garde les valeurs par défaut
        console.log('Aucune carte de visite trouvée, création d\'une nouvelle');
      } else {
        throw new Error('Erreur lors du chargement de la carte');
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateQRCodeUrl = (cardId) => {
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/register-client/${cardId}`;
    setQrCodeUrl(url);
  };

  const generateQRCode = async () => {
    if (!businessCard._id) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/business-cards/${businessCard._id}/generate-qr`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setQrCodeUrl(data.qrUrl);
      }
    } catch (err) {
      console.error('Erreur génération QR:', err);
    }
  };

  const handleInputChange = (field, value) => {
    setBusinessCard(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setBusinessCard(prev => ({
          ...prev,
          logo: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const saveBusinessCard = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      const url = businessCard._id 
        ? `${import.meta.env.VITE_API_URL}/api/business-cards/${businessCard._id}`
        : `${import.meta.env.VITE_API_URL}/api/business-cards`;
      
      const method = businessCard._id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(businessCard)
      });

      if (response.ok) {
        const savedCard = await response.json();
        setBusinessCard(savedCard);
        generateQRCodeUrl(savedCard._id);
        alert('Carte de visite sauvegardée avec succès !');
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

  // Gestion des actions
  const openActionModal = (action = null) => {
    if (action) {
      setEditingAction(action);
      setNewAction({ ...action });
    } else {
      setEditingAction(null);
      setNewAction({
        type: 'form',
        title: '',
        url: '',
        fileName: '',
        fileUrl: '',
        delay: 0,
        active: true,
        order: businessCard.actions.length
      });
    }
    setShowActionModal(true);
  };

  const closeActionModal = () => {
    setShowActionModal(false);
    setEditingAction(null);
    setNewAction({
      type: 'form',
      title: '',
      url: '',
      fileName: '',
      fileUrl: '',
      delay: 0,
      active: true,
      order: 0
    });
  };

  const saveAction = () => {
    const updatedActions = [...businessCard.actions];
    
    if (editingAction) {
      const index = updatedActions.findIndex(a => a.id === editingAction.id);
      if (index !== -1) {
        updatedActions[index] = { ...newAction, id: editingAction.id };
      }
    } else {
      const newId = Date.now().toString();
      updatedActions.push({ ...newAction, id: newId });
    }
    
    setBusinessCard(prev => ({
      ...prev,
      actions: updatedActions
    }));
    
    closeActionModal();
  };

  const deleteAction = (actionId) => {
    if (confirm('Supprimer cette action ?')) {
      setBusinessCard(prev => ({
        ...prev,
        actions: prev.actions.filter(a => a.id !== actionId)
      }));
    }
  };

  const toggleAction = (actionId) => {
    setBusinessCard(prev => ({
      ...prev,
      actions: prev.actions.map(a => 
        a.id === actionId ? { ...a, active: !a.active } : a
      )
    }));
  };

  const moveAction = (actionId, direction) => {
    const actions = [...businessCard.actions];
    const index = actions.findIndex(a => a.id === actionId);
    
    if (direction === 'up' && index > 0) {
      [actions[index], actions[index - 1]] = [actions[index - 1], actions[index]];
    } else if (direction === 'down' && index < actions.length - 1) {
      [actions[index], actions[index + 1]] = [actions[index + 1], actions[index]];
    }
    
    // Mettre à jour les ordres
    actions.forEach((action, i) => {
      action.order = i;
    });
    
    setBusinessCard(prev => ({
      ...prev,
      actions
    }));
  };

  const downloadImage = async () => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Dimensions carte de visite standard (85.6 x 53.98 mm à 300 DPI)
      canvas.width = 1012;
      canvas.height = 638;
      
      // Fond blanc
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Contenu de base
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 48px Arial';
      ctx.fillText(businessCard.companyName || 'Entreprise', 50, 100);
      
      ctx.font = '32px Arial';
      ctx.fillText(businessCard.contactName || 'Contact', 50, 150);
      ctx.fillText(businessCard.email || 'email@example.com', 50, 200);
      ctx.fillText(businessCard.phone || '01 23 45 67 89', 50, 250);
      
      // Télécharger
      const link = document.createElement('a');
      link.download = 'carte-de-visite.png';
      link.href = canvas.toDataURL();
      link.click();
    } catch (err) {
      console.error('Erreur téléchargement:', err);
    }
  };

  const downloadWithQR = async () => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = 1012;
      canvas.height = 638;
      
      // Fond blanc
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Contenu
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 48px Arial';
      ctx.fillText(businessCard.companyName || 'Entreprise', 50, 100);
      
      ctx.font = '32px Arial';
      ctx.fillText(businessCard.contactName || 'Contact', 50, 150);
      ctx.fillText(businessCard.email || 'email@example.com', 50, 200);
      ctx.fillText(businessCard.phone || '01 23 45 67 89', 50, 250);
      
      // QR Code (simulé)
      ctx.fillStyle = '#000000';
      ctx.fillRect(canvas.width - 150, canvas.height - 150, 120, 120);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(canvas.width - 140, canvas.height - 140, 100, 100);
      
      const link = document.createElement('a');
      link.download = 'carte-de-visite-avec-qr.png';
      link.href = canvas.toDataURL();
      link.click();
    } catch (err) {
      console.error('Erreur téléchargement avec QR:', err);
    }
  };

  const copyQRUrl = () => {
    navigator.clipboard.writeText(qrCodeUrl);
    alert('URL copiée dans le presse-papiers !');
  };

  const testQRUrl = () => {
    window.open(qrCodeUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="business-card-container">
        <div className="loading-container">
          <div className="loading-spinner">⏳</div>
          <p>Chargement de la carte de visite...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="business-card-container">
      {/* Statistiques en haut */}
      <div className="stats-header">
        <div className="stats-overview">
          <div className="stat-card highlight">
            <div className="stat-icon">💳</div>
            <div className="stat-content">
              <h3>1</h3>
              <p>Carte Active</p>
              <span className="stat-trend">Configurée</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-content">
              <h3>{businessCard.actions?.length || 0}</h3>
              <p>Actions</p>
              <span className="stat-trend">Configurées</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">📱</div>
            <div className="stat-content">
              <h3>{qrCodeUrl ? '1' : '0'}</h3>
              <p>QR Code</p>
              <span className="stat-trend">{qrCodeUrl ? 'Généré' : 'À générer'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* En-tête */}
      <div className="card-header">
        <h2>💳 Carte de Visite Digitale</h2>
        <p>Créez votre carte de visite avec QR code et actions personnalisées</p>
      </div>

      {error && (
        <div className="error-state">❌ {error}</div>
      )}

      <div className="card-main-content">
        {/* Colonne configuration */}
        <div className="card-config-column">
          {/* Configuration de base */}
          <div className="config-section">
            <h3>📝 Informations de base</h3>
            <p className="section-description">
              Renseignez les informations qui apparaîtront sur votre carte de visite.
            </p>
            
            <div className="form-group">
              <label>Nom de l'entreprise</label>
              <input
                type="text"
                value={businessCard.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                placeholder="Mon Entreprise"
              />
            </div>
            
            <div className="form-group">
              <label>Nom du contact</label>
              <input
                type="text"
                value={businessCard.contactName}
                onChange={(e) => handleInputChange('contactName', e.target.value)}
                placeholder="Jean Dupont"
              />
            </div>
            
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={businessCard.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="contact@monentreprise.fr"
              />
            </div>
            
            <div className="form-group">
              <label>Téléphone</label>
              <input
                type="tel"
                value={businessCard.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="01 23 45 67 89"
              />
            </div>
            
            <div className="form-group">
              <label>Site web</label>
              <input
                type="url"
                value={businessCard.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://monentreprise.fr"
              />
            </div>
            
            <div className="form-group">
              <label>Adresse</label>
              <input
                type="text"
                value={businessCard.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="123 Rue de la Paix, 75001 Paris"
              />
            </div>
            
            <div className="form-group">
              <label>Logo</label>
              <div className="file-upload">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                />
                <div className="upload-btn">📷 Choisir un logo</div>
              </div>
            </div>
          </div>

          {/* Configuration QR Code */}
          <div className="config-section">
            <h3>📱 Configuration QR Code</h3>
            <p className="section-description">
              Personnalisez l'apparence et la position du QR code sur votre carte.
            </p>
            
            <div className="form-group">
              <label>Position du QR Code</label>
              <select
                value={businessCard.qrPosition}
                onChange={(e) => handleInputChange('qrPosition', e.target.value)}
              >
                <option value="bottom-right">Bas droite</option>
                <option value="bottom-left">Bas gauche</option>
                <option value="top-right">Haut droite</option>
                <option value="top-left">Haut gauche</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Taille du QR Code: {businessCard.qrSize}px</label>
              <input
                type="range"
                min="60"
                max="120"
                value={businessCard.qrSize}
                onChange={(e) => handleInputChange('qrSize', parseInt(e.target.value))}
              />
            </div>
          </div>

          {/* Gestion des actions */}
          <div className="config-section">
            <h3>🎯 Actions personnalisées</h3>
            <p className="section-description">
              Configurez les actions qui se déclencheront quand quelqu'un scanne votre QR code.
            </p>
            
            <div className="actions-list">
              {businessCard.actions?.length > 0 ? (
                businessCard.actions
                  .sort((a, b) => (a.order || 0) - (b.order || 0))
                  .map((action, index) => (
                    <div key={action.id} className={`action-item ${action.active ? 'active' : 'inactive'}`}>
                      <div className="action-order">{index + 1}</div>
                      <div className="action-icon">
                        {action.type === 'form' && '📝'}
                        {action.type === 'redirect' && '🔗'}
                        {action.type === 'download' && '📥'}
                      </div>
                      <div className="action-content">
                        <div className="action-title">
                          {action.title || `Action ${action.type}`}
                          {action.delay > 0 && (
                            <span className="action-delay">{action.delay}s</span>
                          )}
                        </div>
                        <div className="action-details">
                          {action.type === 'redirect' && action.url}
                          {action.type === 'download' && action.fileName}
                          {action.type === 'form' && 'Formulaire d\'inscription'}
                        </div>
                      </div>
                      <div className="action-controls">
                        <button
                          onClick={() => moveAction(action.id, 'up')}
                          disabled={index === 0}
                          className="move-btn"
                          title="Monter"
                        >
                          ⬆️
                        </button>
                        <button
                          onClick={() => moveAction(action.id, 'down')}
                          disabled={index === businessCard.actions.length - 1}
                          className="move-btn"
                          title="Descendre"
                        >
                          ⬇️
                        </button>
                        <button
                          onClick={() => toggleAction(action.id)}
                          className={`toggle-btn ${action.active ? 'active' : 'inactive'}`}
                          title={action.active ? 'Désactiver' : 'Activer'}
                        >
                          {action.active ? '✅' : '❌'}
                        </button>
                        <button
                          onClick={() => openActionModal(action)}
                          className="edit-btn"
                          title="Modifier"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => deleteAction(action.id)}
                          className="delete-btn"
                          title="Supprimer"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="no-actions">
                  <p>Aucune action configurée</p>
                  <p>Ajoutez des actions pour personnaliser l'expérience de vos visiteurs.</p>
                </div>
              )}
            </div>
            
            <button onClick={() => openActionModal()} className="add-action-btn">
              ➕ Ajouter une action
            </button>
          </div>
        </div>

        {/* Colonne aperçu */}
        <div className="card-preview-column">
          {/* Aperçu de la carte */}
          <div className="card-preview">
            <h3>👁️ Aperçu de la carte</h3>
            
            <div className="preview-container">
              <div className="business-card-preview">
                {businessCard.logo && (
                  <img src={businessCard.logo} alt="Logo" className="card-image" />
                )}
                
                {qrCodeUrl && (
                  <div className={`qr-overlay ${businessCard.qrPosition}`}>
                    <QRCode
                      value={qrCodeUrl}
                      size={businessCard.qrSize}
                      level="M"
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div className="download-buttons">
              <button
                onClick={downloadImage}
                disabled={!businessCard.companyName}
                className="download-image-btn"
              >
                📥 Image seule
              </button>
              <button
                onClick={downloadWithQR}
                disabled={!businessCard.companyName || !qrCodeUrl}
                className="download-with-qr-btn"
              >
                📱 Avec QR Code
              </button>
            </div>
          </div>

          {/* Section QR Code */}
          <div className="qr-section">
            <h3>📱 QR Code & Actions</h3>
            
            <div className="qr-display">
              <div className="qr-code-wrapper">
                {qrCodeUrl ? (
                  <QRCode
                    value={qrCodeUrl}
                    size={200}
                    level="M"
                  />
                ) : (
                  <div className="qr-placeholder">
                    <p>QR Code sera généré après sauvegarde</p>
                    <button onClick={generateQRCode} className="btn-generate-qr">
                      🔄 Générer QR Code
                    </button>
                  </div>
                )}
              </div>
              
              <div className="qr-info">
                {qrCodeUrl && (
                  <div className="qr-details">
                    <div className="qr-link">
                      <strong>URL du QR Code:</strong><br />
                      <a href={qrCodeUrl} target="_blank" rel="noopener noreferrer">
                        {qrCodeUrl}
                      </a>
                    </div>
                    
                    <div className="qr-actions-info">
                      <strong>Actions configurées:</strong>
                      <ul>
                        {businessCard.actions?.filter(a => a.active).map((action, index) => (
                          <li key={action.id}>
                            {index + 1}. {action.title || action.type}
                            {action.delay > 0 && ` (délai: ${action.delay}s)`}
                          </li>
                        )) || <li>Aucune action active</li>}
                      </ul>
                    </div>
                  </div>
                )}
                
                <div className="qr-actions">
                  <button
                    onClick={copyQRUrl}
                    disabled={!qrCodeUrl}
                    className="btn-copy"
                  >
                    📋 Copier URL
                  </button>
                  <button
                    onClick={testQRUrl}
                    disabled={!qrCodeUrl}
                    className="btn-test"
                  >
                    🔗 Tester
                  </button>
                  <button
                    onClick={generateQRCode}
                    className="btn-refresh"
                  >
                    🔄 Actualiser
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bouton de sauvegarde */}
      <div style={{ textAlign: 'center', margin: '2rem 0' }}>
        <button
          onClick={saveBusinessCard}
          disabled={saving}
          className="btn-save"
          style={{
            padding: '1rem 2rem',
            fontSize: '1.1rem',
            background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          {saving ? '⏳ Sauvegarde...' : '💾 Sauvegarder la carte'}
        </button>
        {businessCard._id && (
          <div className="save-status">
            ✅ Dernière sauvegarde: {new Date().toLocaleString('fr-FR')}
          </div>
        )}
      </div>

      {/* Modal d'action */}
      {showActionModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingAction ? 'Modifier l\'action' : 'Nouvelle action'}</h3>
              <button onClick={closeActionModal} className="modal-close">✕</button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Type d'action</label>
                <select
                  value={newAction.type}
                  onChange={(e) => setNewAction(prev => ({ ...prev, type: e.target.value }))}
                >
                  <option value="form">📝 Formulaire d'inscription</option>
                  <option value="redirect">🔗 Redirection vers URL</option>
                  <option value="download">📥 Téléchargement de fichier</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Titre de l'action</label>
                <input
                  type="text"
                  value={newAction.title}
                  onChange={(e) => setNewAction(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Nom de l'action"
                />
              </div>
              
              {newAction.type === 'redirect' && (
                <div className="form-group">
                  <label>URL de redirection</label>
                  <input
                    type="url"
                    value={newAction.url}
                    onChange={(e) => setNewAction(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://example.com"
                  />
                </div>
              )}
              
              {newAction.type === 'download' && (
                <>
                  <div className="form-group">
                    <label>Nom du fichier</label>
                    <input
                      type="text"
                      value={newAction.fileName}
                      onChange={(e) => setNewAction(prev => ({ ...prev, fileName: e.target.value }))}
                      placeholder="document.pdf"
                    />
                  </div>
                  <div className="form-group">
                    <label>URL du fichier</label>
                    <input
                      type="url"
                      value={newAction.fileUrl}
                      onChange={(e) => setNewAction(prev => ({ ...prev, fileUrl: e.target.value }))}
                      placeholder="https://example.com/document.pdf"
                    />
                  </div>
                </>
              )}
              
              <div className="form-group">
                <label>Délai d'exécution (secondes)</label>
                <input
                  type="number"
                  min="0"
                  value={newAction.delay}
                  onChange={(e) => setNewAction(prev => ({ ...prev, delay: parseInt(e.target.value) || 0 }))}
                />
              </div>
              
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={newAction.active}
                    onChange={(e) => setNewAction(prev => ({ ...prev, active: e.target.checked }))}
                  />
                  Action active
                </label>
              </div>
            </div>
            
            <div className="modal-footer">
              <button onClick={closeActionModal} className="btn-cancel">
                Annuler
              </button>
              <button onClick={saveAction} className="btn-save">
                {editingAction ? 'Modifier' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessCard;