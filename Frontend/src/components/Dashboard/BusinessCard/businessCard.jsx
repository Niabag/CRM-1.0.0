import { useState, useEffect } from 'react';
import QRCode from "react-qr-code";
import { API_ENDPOINTS, FRONTEND_ROUTES, apiRequest } from '../../../config/api';
import './businessCard.scss';

const BusinessCard = ({ userId, user }) => {
  const [cardConfig, setCardConfig] = useState({
    cardImage: '/images/default-business-card.png',
    showQR: true,
    qrPosition: 'bottom-right',
    qrSize: 150,
    actions: []
  });
  
  const [qrValue, setQrValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [savedCardData, setSavedCardData] = useState(null);
  
  // ✅ NOUVEAU: État pour gérer les actions
  const [editingAction, setEditingAction] = useState(null);
  const [showActionForm, setShowActionForm] = useState(false);
  
  const [stats, setStats] = useState({
    scansToday: 0,
    scansThisMonth: 0,
    totalScans: 0,
    conversions: 0
  });

  useEffect(() => {
    if (userId) {
      generateQRCode();
      fetchStats();
      loadSavedBusinessCard();
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      generateQRCode();
    }
  }, [cardConfig.actions, userId]);

  const loadSavedBusinessCard = async () => {
    try {
      const savedCard = await apiRequest(API_ENDPOINTS.BUSINESS_CARDS.BASE);
      setSavedCardData(savedCard);
      
      if (savedCard.cardConfig) {
        setCardConfig(prev => ({
          ...prev,
          ...savedCard.cardConfig,
          cardImage: savedCard.cardImage || prev.cardImage
        }));
      }
      
      console.log('✅ Carte de visite chargée depuis la BDD');
    } catch (error) {
      console.log('ℹ️ Aucune carte de visite sauvegardée trouvée');
    }
  };

  // ✅ CORRECTION: Générer un QR code simple avec actions encodées dans l'URL
  const generateQRCode = () => {
    if (!userId) {
      console.error("❌ userId manquant pour générer le QR code");
      return;
    }
    
    try {
      // ✅ URL de base
      let targetUrl = `${FRONTEND_ROUTES.CLIENT_REGISTER(userId)}`;
      
      // ✅ NOUVEAU: Ajouter les actions comme paramètre URL si elles existent
      if (cardConfig.actions && cardConfig.actions.length > 0) {
        const actionsParam = encodeURIComponent(JSON.stringify(cardConfig.actions));
        targetUrl += `?actions=${actionsParam}`;
      }
      
      // ✅ VÉRIFICATION: Limiter la taille pour éviter l'erreur QR code
      if (targetUrl.length > 500) {
        console.warn("⚠️ URL trop longue pour QR code, utilisation de l'URL simple");
        targetUrl = `${FRONTEND_ROUTES.CLIENT_REGISTER(userId)}`;
      }
      
      setQrValue(targetUrl);
      console.log("✅ QR code généré:", targetUrl);
    } catch (error) {
      console.error("❌ Erreur lors de la génération du QR code:", error);
      // ✅ FALLBACK: URL simple en cas d'erreur
      setQrValue(`${FRONTEND_ROUTES.CLIENT_REGISTER(userId)}`);
    }
  };

  const fetchStats = async () => {
    try {
      const mockStats = {
        scansToday: Math.floor(Math.random() * 50) + 10,
        scansThisMonth: Math.floor(Math.random() * 500) + 100,
        totalScans: Math.floor(Math.random() * 2000) + 500,
        conversions: Math.floor(Math.random() * 100) + 20
      };
      
      setStats(mockStats);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  const handleCardImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const imageData = reader.result;
        
        setCardConfig(prev => ({
          ...prev,
          cardImage: imageData
        }));
        
        await saveBusinessCardToDB(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveBusinessCardToDB = async (cardImage = null, config = null) => {
    try {
      setLoading(true);
      
      const configToSave = config || cardConfig;
      
      const cleanedConfig = {
        showQR: Boolean(configToSave.showQR !== undefined ? configToSave.showQR : true),
        qrPosition: ['bottom-right', 'bottom-left', 'top-right', 'top-left'].includes(configToSave.qrPosition) 
          ? configToSave.qrPosition 
          : 'bottom-right',
        qrSize: Math.max(100, Math.min(200, Number(configToSave.qrSize) || 150)),
        actions: Array.isArray(configToSave.actions) ? configToSave.actions : []
      };
      
      const dataToSave = {
        cardImage: cardImage || cardConfig.cardImage,
        cardConfig: cleanedConfig
      };
      
      const response = await apiRequest(API_ENDPOINTS.BUSINESS_CARDS.BASE, {
        method: 'POST',
        body: JSON.stringify(dataToSave)
      });
      
      setSavedCardData(response.businessCard);
      console.log('✅ Carte de visite sauvegardée en BDD');
      
      showSuccessMessage('✅ Carte sauvegardée');
      
    } catch (error) {
      console.error('❌ Erreur sauvegarde carte de visite:', error);
      showErrorMessage('❌ Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const showSuccessMessage = (message) => {
    const successMsg = document.createElement('div');
    successMsg.textContent = message;
    successMsg.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #48bb78;
      color: white;
      padding: 10px 20px;
      border-radius: 8px;
      z-index: 9999;
      font-weight: 500;
      box-shadow: 0 4px 15px rgba(72, 187, 120, 0.3);
    `;
    document.body.appendChild(successMsg);
    setTimeout(() => {
      if (document.body.contains(successMsg)) {
        document.body.removeChild(successMsg);
      }
    }, 3000);
  };

  const showErrorMessage = (message) => {
    const errorMsg = document.createElement('div');
    errorMsg.textContent = message;
    errorMsg.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f56565;
      color: white;
      padding: 10px 20px;
      border-radius: 8px;
      z-index: 9999;
      font-weight: 500;
      box-shadow: 0 4px 15px rgba(245, 101, 101, 0.3);
    `;
    document.body.appendChild(errorMsg);
    setTimeout(() => {
      if (document.body.contains(errorMsg)) {
        document.body.removeChild(errorMsg);
      }
    }, 3000);
  };

  const handleConfigChange = async (field, value) => {
    const newConfig = {
      ...cardConfig,
      [field]: value
    };
    
    setCardConfig(newConfig);
    
    if (savedCardData) {
      await saveBusinessCardToDB(null, newConfig);
    }
  };

  // ✅ NOUVEAU: Gestion des actions
  const handleAddAction = () => {
    setEditingAction({
      id: Date.now(),
      type: 'download',
      file: '',
      url: '',
      delay: 0,
      active: true
    });
    setShowActionForm(true);
  };

  const handleEditAction = (action) => {
    setEditingAction({ ...action });
    setShowActionForm(true);
  };

  const handleSaveAction = async () => {
    if (!editingAction) return;

    const updatedActions = cardConfig.actions.some(a => a.id === editingAction.id)
      ? cardConfig.actions.map(a => a.id === editingAction.id ? editingAction : a)
      : [...cardConfig.actions, editingAction];

    const newConfig = {
      ...cardConfig,
      actions: updatedActions
    };

    setCardConfig(newConfig);
    setShowActionForm(false);
    setEditingAction(null);

    if (savedCardData) {
      await saveBusinessCardToDB(null, newConfig);
    }
  };

  const handleDeleteAction = async (actionId) => {
    const updatedActions = cardConfig.actions.filter(a => a.id !== actionId);
    const newConfig = {
      ...cardConfig,
      actions: updatedActions
    };

    setCardConfig(newConfig);

    if (savedCardData) {
      await saveBusinessCardToDB(null, newConfig);
    }
  };

  const generateBusinessCard = async () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = 800;
    canvas.height = 500;
    
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('CARTE DE VISITE NUMÉRIQUE', canvas.width / 2, 80);
    
    ctx.font = '32px Arial';
    ctx.fillText(user?.name || 'Votre Nom', canvas.width / 2, 140);
    
    ctx.font = '24px Arial';
    ctx.fillText(user?.email || 'votre.email@exemple.com', canvas.width / 2, 180);
    
    if (cardConfig.showQR && qrValue) {
      const qrSize = 120;
      const qrX = canvas.width - qrSize - 40;
      const qrY = canvas.height - qrSize - 40;
      
      ctx.fillStyle = 'white';
      ctx.fillRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);
      
      ctx.fillStyle = 'black';
      ctx.fillRect(qrX, qrY, qrSize, qrSize);
      
      ctx.fillStyle = 'white';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('SCANNEZ-MOI', qrX + qrSize/2, qrY + qrSize/2);
    }
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('📱 Scannez le QR code pour vous inscrire', 40, canvas.height - 80);
    ctx.fillText('💼 Recevez automatiquement nos informations', 40, canvas.height - 50);
    
    const dataUrl = canvas.toDataURL('image/png');
    await saveBusinessCardToDB(dataUrl);
    
    return dataUrl;
  };

  const downloadBusinessCard = async () => {
    const cardUrl = await generateBusinessCard();
    
    const link = document.createElement('a');
    link.download = 'carte-de-visite-numerique.png';
    link.href = cardUrl;
    link.click();
  };

  const copyQRLink = () => {
    if (qrValue) {
      navigator.clipboard.writeText(qrValue);
      showSuccessMessage('✅ Lien copié !');
    } else {
      showErrorMessage('❌ Aucun QR code généré');
    }
  };

  const testQRCode = () => {
    if (qrValue) {
      window.open(qrValue, '_blank');
    } else {
      showErrorMessage('❌ Aucun QR code généré');
    }
  };

  return (
    <div className="business-card-container">
      {/* Statistiques en haut */}
      <div className="stats-header">
        <div className="stats-overview">
          <div className="stat-card highlight">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>{stats.totalScans}</h3>
              <p>Scans totaux</p>
              <span className="stat-trend">+{stats.scansToday} aujourd'hui</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <h3>{stats.scansThisMonth}</h3>
              <p>Ce mois</p>
              <span className="stat-trend">+{Math.round((stats.scansThisMonth / 30) * 100) / 100}/jour</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-content">
              <h3>{stats.conversions}</h3>
              <p>Conversions</p>
              <span className="stat-trend">Prospects inscrits</span>
            </div>
          </div>
        </div>
      </div>

      {/* En-tête */}
      <div className="card-header">
        <h2>💼 Carte de Visite Numérique</h2>
        <p>Créez et personnalisez votre carte de visite avec QR code</p>
      </div>

      {/* Layout en colonnes */}
      <div className="card-main-content">
        {/* Colonne de gauche - Configuration */}
        <div className="card-config-column">
          <div className="config-section">
            <h3>🎨 Design de la carte</h3>
            
            <div className="form-group">
              <label>Image de la carte de visite :</label>
              <div className="file-upload">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCardImageUpload}
                  id="card-image-upload"
                  disabled={loading}
                />
                <label htmlFor="card-image-upload" className="upload-btn">
                  {loading ? '⏳ Sauvegarde...' : '📷 Choisir une image'}
                </label>
              </div>
              {savedCardData && (
                <p className="save-status">✅ Image sauvegardée en base de données</p>
              )}
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={cardConfig.showQR}
                  onChange={(e) => handleConfigChange('showQR', e.target.checked)}
                />
                Afficher le QR code sur la carte
              </label>
            </div>

            {cardConfig.showQR && (
              <>
                <div className="form-group">
                  <label>Position du QR code :</label>
                  <select
                    value={cardConfig.qrPosition}
                    onChange={(e) => handleConfigChange('qrPosition', e.target.value)}
                  >
                    <option value="bottom-right">Bas droite</option>
                    <option value="bottom-left">Bas gauche</option>
                    <option value="top-right">Haut droite</option>
                    <option value="top-left">Haut gauche</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Taille du QR code :</label>
                  <input
                    type="range"
                    min="100"
                    max="200"
                    value={cardConfig.qrSize}
                    onChange={(e) => handleConfigChange('qrSize', parseInt(e.target.value))}
                  />
                  <span>{cardConfig.qrSize}px</span>
                </div>
              </>
            )}
          </div>

          {/* ✅ NOUVEAU: Section Actions */}
          <div className="config-section">
            <h3>⚡ Actions après scan</h3>
            <p className="section-description">
              Configurez ce qui se passe quand quelqu'un scanne votre QR code
            </p>

            <div className="actions-list">
              {cardConfig.actions.map((action, index) => (
                <div key={action.id} className="action-item">
                  <div className="action-info">
                    <div className="action-type">
                      {action.type === 'download' && '📥 Téléchargement'}
                      {action.type === 'form' && '📝 Formulaire'}
                      {action.type === 'redirect' && '🔗 Redirection'}
                      {action.type === 'website' && '🌐 Site web'}
                    </div>
                    <div className="action-details">
                      {action.type === 'download' && `Fichier: ${action.file || 'Non défini'}`}
                      {(action.type === 'redirect' || action.type === 'website') && `URL: ${action.url || 'Non définie'}`}
                      {action.type === 'form' && 'Affichage du formulaire d\'inscription'}
                    </div>
                    <div className="action-timing">
                      Délai: {action.delay}ms
                    </div>
                  </div>
                  <div className="action-controls">
                    <button 
                      onClick={() => handleEditAction(action)}
                      className="btn-edit-action"
                      title="Modifier"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => handleDeleteAction(action.id)}
                      className="btn-delete-action"
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}

              {cardConfig.actions.length === 0 && (
                <div className="no-actions">
                  <p>Aucune action configurée</p>
                  <p className="help-text">Les prospects verront seulement le formulaire d'inscription</p>
                </div>
              )}

              <button onClick={handleAddAction} className="btn-add-action">
                ➕ Ajouter une action
              </button>
            </div>
          </div>
        </div>

        {/* Colonne de droite - Aperçu */}
        <div className="card-preview-column">
          <div className="card-preview">
            <h3>👁️ Aperçu de la carte</h3>
            
            <div className="preview-container">
              <div className="business-card-preview">
                <img 
                  src={cardConfig.cardImage} 
                  alt="Carte de visite"
                  className="card-image"
                />
                
                {cardConfig.showQR && qrValue && (
                  <div className={`qr-overlay ${cardConfig.qrPosition}`}>
                    <QRCode 
                      value={qrValue} 
                      size={cardConfig.qrSize * 0.6}
                      bgColor="white"
                      fgColor="black"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="preview-actions">
              <button onClick={downloadBusinessCard} className="btn-download" disabled={loading}>
                {loading ? '⏳ Génération...' : '💾 Télécharger la carte'}
              </button>
            </div>
          </div>

          {/* QR Code et actions */}
          <div className="qr-section">
            <h3>📱 QR Code</h3>
            
            <div className="qr-display">
              <div className="qr-code-wrapper">
                {qrValue ? (
                  <QRCode 
                    value={qrValue} 
                    size={200}
                    bgColor="white"
                    fgColor="black"
                  />
                ) : (
                  <div className="qr-placeholder">
                    <p>⏳ Génération du QR code...</p>
                    <button onClick={generateQRCode} className="btn-generate-qr">
                      🔄 Générer le QR code
                    </button>
                  </div>
                )}
              </div>
              
              <div className="qr-info">
                <div className="qr-details">
                  {qrValue && (
                    <div className="qr-link">
                      <strong>Lien :</strong>
                      <a href={qrValue} target="_blank" rel="noopener noreferrer">
                        {qrValue.length > 50 ? qrValue.substring(0, 50) + '...' : qrValue}
                      </a>
                    </div>
                  )}
                  {cardConfig.actions.length > 0 && (
                    <div className="qr-actions-info">
                      <strong>Actions configurées :</strong>
                      <ul>
                        {cardConfig.actions.map((action, index) => (
                          <li key={action.id}>
                            {index + 1}. {action.type === 'download' ? '📥 Téléchargement' : 
                                          action.type === 'form' ? '📝 Formulaire' : 
                                          action.type === 'redirect' ? '🔗 Redirection' : 
                                          '🌐 Site web'}
                            {action.delay > 0 && ` (+${action.delay}ms)`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                <div className="qr-actions">
                  <button onClick={copyQRLink} className="btn-copy" disabled={!qrValue}>
                    📋 Copier le lien
                  </button>
                  
                  <button onClick={testQRCode} className="btn-test" disabled={!qrValue}>
                    🧪 Tester le QR code
                  </button>
                  
                  <button onClick={generateQRCode} className="btn-refresh">
                    🔄 Régénérer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ NOUVEAU: Modal pour éditer les actions */}
      {showActionForm && editingAction && (
        <div className="action-modal-overlay" onClick={() => setShowActionForm(false)}>
          <div className="action-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚡ Configuration de l'action</h3>
              <button onClick={() => setShowActionForm(false)} className="btn-close-modal">✕</button>
            </div>

            <div className="modal-content">
              <div className="form-group">
                <label>Type d'action :</label>
                <select
                  value={editingAction.type}
                  onChange={(e) => setEditingAction({...editingAction, type: e.target.value})}
                >
                  <option value="download">📥 Téléchargement de fichier</option>
                  <option value="form">📝 Affichage du formulaire</option>
                  <option value="redirect">🔗 Redirection</option>
                  <option value="website">🌐 Ouverture de site web</option>
                </select>
              </div>

              {editingAction.type === 'download' && (
                <div className="form-group">
                  <label>Fichier à télécharger :</label>
                  <input
                    type="text"
                    placeholder="/images/brochure.pdf"
                    value={editingAction.file}
                    onChange={(e) => setEditingAction({...editingAction, file: e.target.value})}
                  />
                  <small>Chemin vers le fichier (ex: /images/brochure.pdf)</small>
                </div>
              )}

              {(editingAction.type === 'redirect' || editingAction.type === 'website') && (
                <div className="form-group">
                  <label>URL de destination :</label>
                  <input
                    type="url"
                    placeholder="https://example.com"
                    value={editingAction.url}
                    onChange={(e) => setEditingAction({...editingAction, url: e.target.value})}
                  />
                </div>
              )}

              <div className="form-group">
                <label>Délai d'exécution (millisecondes) :</label>
                <input
                  type="number"
                  min="0"
                  max="10000"
                  value={editingAction.delay}
                  onChange={(e) => setEditingAction({...editingAction, delay: parseInt(e.target.value) || 0})}
                />
                <small>0 = immédiat, 1000 = 1 seconde, etc.</small>
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={editingAction.active}
                    onChange={(e) => setEditingAction({...editingAction, active: e.target.checked})}
                  />
                  Action active
                </label>
              </div>
            </div>

            <div className="modal-actions">
              <button onClick={() => setShowActionForm(false)} className="btn-cancel">
                Annuler
              </button>
              <button onClick={handleSaveAction} className="btn-save">
                💾 Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessCard;