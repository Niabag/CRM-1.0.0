import { useState, useEffect } from 'react';
import QRCode from "react-qr-code";
import { API_ENDPOINTS, FRONTEND_ROUTES, apiRequest } from '../../../config/api';
import './businessCard.scss';

const BusinessCard = ({ userId, user }) => {
  const [cardConfig, setCardConfig] = useState({
    cardImage: '/images/default-business-card.png',
    downloadImage: '/images/welcome.png',
    redirectType: 'form',
    websiteUrl: '',
    showQR: true,
    qrPosition: 'bottom-right',
    qrSize: 150,
    actions: [
      { id: 1, type: 'download', file: '/images/welcome.png', delay: 0, active: true },
      { id: 2, type: 'form', url: '', delay: 1000, active: true },
      { id: 3, type: 'redirect', url: 'https://google.com', delay: 3000, active: true }
    ]
  });
  
  const [qrValue, setQrValue] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatedCardUrl, setGeneratedCardUrl] = useState(null);
  const [savedCardData, setSavedCardData] = useState(null);
  
  const [stats, setStats] = useState({
    scansToday: 0,
    scansThisMonth: 0,
    totalScans: 0,
    conversions: 0,
    conversionRate: 0,
    topHours: [],
    recentScans: []
  });

  // ✅ CORRECTION: Générer le QR code automatiquement et charger la carte sauvegardée
  useEffect(() => {
    if (userId) {
      generateQRCode();
      fetchStats();
      loadSavedBusinessCard();
    }
  }, [userId]);

  // ✅ EFFET SÉPARÉ: Régénérer le QR code quand les actions changent
  useEffect(() => {
    if (userId && cardConfig.actions) {
      generateQRCode();
    }
  }, [cardConfig.actions, userId]);

  // ✅ NOUVELLE FONCTION: Charger la carte de visite sauvegardée
  const loadSavedBusinessCard = async () => {
    try {
      const savedCard = await apiRequest(API_ENDPOINTS.BUSINESS_CARDS.BASE);
      setSavedCardData(savedCard);
      
      // Appliquer la configuration sauvegardée
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

  // ✅ FONCTION CORRIGÉE: Générer le QR code
  const generateQRCode = () => {
    if (!userId) {
      console.error("❌ userId manquant pour générer le QR code");
      return;
    }
    
    try {
      const activeActions = cardConfig.actions.filter(a => a.active);
      const actionsData = encodeURIComponent(JSON.stringify(activeActions));
      const targetUrl = `${FRONTEND_ROUTES.CLIENT_REGISTER(userId)}?actions=${actionsData}`;
      
      setQrValue(targetUrl);
      console.log("✅ QR code généré:", targetUrl);
    } catch (error) {
      console.error("❌ Erreur lors de la génération du QR code:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const mockStats = {
        scansToday: Math.floor(Math.random() * 50) + 10,
        scansThisMonth: Math.floor(Math.random() * 500) + 100,
        totalScans: Math.floor(Math.random() * 2000) + 500,
        conversions: Math.floor(Math.random() * 100) + 20,
        conversionRate: Math.floor(Math.random() * 30) + 15,
        topHours: [
          { hour: '14h', scans: 12 },
          { hour: '16h', scans: 8 },
          { hour: '10h', scans: 6 },
          { hour: '18h', scans: 5 }
        ],
        recentScans: [
          { time: '14:32', location: 'Paris', device: 'Mobile' },
          { time: '13:45', location: 'Lyon', device: 'Desktop' },
          { time: '12:18', location: 'Marseille', device: 'Mobile' },
          { time: '11:22', location: 'Toulouse', device: 'Tablet' }
        ]
      };
      
      setStats(mockStats);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  // ✅ FONCTION MODIFIÉE: Sauvegarder l'image en BDD
  const handleCardImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const imageData = reader.result;
        
        // Mettre à jour l'état local
        setCardConfig(prev => ({
          ...prev,
          cardImage: imageData
        }));
        
        // Sauvegarder en BDD
        await saveBusinessCardToDB(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  // ✅ FONCTION CORRIGÉE: Sauvegarder en base de données avec validation stricte
  const saveBusinessCardToDB = async (cardImage = null, config = null) => {
    try {
      setLoading(true);
      
      // ✅ VALIDATION STRICTE des données avant envoi
      const configToSave = config || cardConfig;
      
      // ✅ NETTOYAGE ET VALIDATION des actions
      const cleanedActions = Array.isArray(configToSave.actions) 
        ? configToSave.actions
            .filter(action => {
              // Filtrer les actions valides
              const isValid = action && 
                             typeof action === 'object' && 
                             action.type && 
                             ['download', 'form', 'redirect', 'website'].includes(action.type) &&
                             typeof action.id === 'number' &&
                             action.id > 0;
              
              if (!isValid) {
                console.warn('⚠️ Action invalide filtrée:', action);
              }
              
              return isValid;
            })
            .map((action, index) => {
              // Nettoyer et valider chaque action
              const cleanAction = {
                id: Number(action.id) || (Date.now() + index),
                type: String(action.type),
                file: String(action.file || ''),
                url: String(action.url || ''),
                delay: Number(action.delay) || 0,
                active: Boolean(action.active !== undefined ? action.active : true)
              };
              
              // Validation supplémentaire
              if (!['download', 'form', 'redirect', 'website'].includes(cleanAction.type)) {
                cleanAction.type = 'download';
              }
              
              if (cleanAction.delay < 0) {
                cleanAction.delay = 0;
              }
              
              return cleanAction;
            })
        : [];

      // ✅ CONFIGURATION NETTOYÉE avec validation
      const cleanedConfig = {
        showQR: Boolean(configToSave.showQR !== undefined ? configToSave.showQR : true),
        qrPosition: ['bottom-right', 'bottom-left', 'top-right', 'top-left'].includes(configToSave.qrPosition) 
          ? configToSave.qrPosition 
          : 'bottom-right',
        qrSize: Math.max(100, Math.min(200, Number(configToSave.qrSize) || 150)),
        actions: cleanedActions
      };
      
      const dataToSave = {
        cardImage: cardImage || cardConfig.cardImage,
        cardConfig: cleanedConfig
      };
      
      console.log("💾 Données validées à sauvegarder:", {
        hasCardImage: !!dataToSave.cardImage,
        configKeys: Object.keys(dataToSave.cardConfig),
        actionsCount: dataToSave.cardConfig.actions.length,
        actionsValid: dataToSave.cardConfig.actions.every(a => 
          a.id && a.type && ['download', 'form', 'redirect', 'website'].includes(a.type)
        )
      });
      
      const response = await apiRequest(API_ENDPOINTS.BUSINESS_CARDS.BASE, {
        method: 'POST',
        body: JSON.stringify(dataToSave)
      });
      
      setSavedCardData(response.businessCard);
      console.log('✅ Carte de visite sauvegardée en BDD');
      
      // Afficher un message de succès discret
      showSuccessMessage('✅ Carte sauvegardée');
      
    } catch (error) {
      console.error('❌ Erreur sauvegarde carte de visite:', error);
      showErrorMessage('❌ Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  // ✅ NOUVELLES FONCTIONS: Messages de feedback
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

  const handleDownloadImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCardConfig(prev => ({
          ...prev,
          downloadImage: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfigChange = async (field, value) => {
    const newConfig = {
      ...cardConfig,
      [field]: value
    };
    
    setCardConfig(newConfig);
    
    // Sauvegarder automatiquement la configuration si une carte existe
    if (savedCardData) {
      await saveBusinessCardToDB(null, newConfig);
    }
  };

  const addAction = async () => {
    const newAction = {
      id: Date.now(),
      type: 'download',
      file: '/images/welcome.png',
      url: '',
      delay: 0,
      active: true
    };
    
    const newConfig = {
      ...cardConfig,
      actions: [...cardConfig.actions, newAction]
    };
    
    setCardConfig(newConfig);
    
    // Sauvegarder automatiquement
    if (savedCardData) {
      await saveBusinessCardToDB(null, newConfig);
    }
  };

  const updateAction = async (actionId, field, value) => {
    const newConfig = {
      ...cardConfig,
      actions: cardConfig.actions.map(action => 
        action.id === actionId 
          ? { ...action, [field]: value }
          : action
      )
    };
    
    setCardConfig(newConfig);
    
    // Sauvegarder automatiquement
    if (savedCardData) {
      await saveBusinessCardToDB(null, newConfig);
    }
  };

  const removeAction = async (actionId) => {
    const newConfig = {
      ...cardConfig,
      actions: cardConfig.actions.filter(action => action.id !== actionId)
    };
    
    setCardConfig(newConfig);
    
    // Sauvegarder automatiquement
    if (savedCardData) {
      await saveBusinessCardToDB(null, newConfig);
    }
  };

  const moveAction = async (actionId, direction) => {
    const currentIndex = cardConfig.actions.findIndex(a => a.id === actionId);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === cardConfig.actions.length - 1)
    ) return;

    const newActions = [...cardConfig.actions];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    [newActions[currentIndex], newActions[targetIndex]] = [newActions[targetIndex], newActions[currentIndex]];
    
    const newConfig = {
      ...cardConfig,
      actions: newActions
    };
    
    setCardConfig(newConfig);
    
    // Sauvegarder automatiquement
    if (savedCardData) {
      await saveBusinessCardToDB(null, newConfig);
    }
  };

  // ✅ NOUVELLE FONCTION: Générer la carte de visite avec QR code
  const generateBusinessCard = async () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Dimensions optimales pour carte de visite
    canvas.width = 800;
    canvas.height = 500;
    
    // Fond dégradé
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Titre
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('CARTE DE VISITE NUMÉRIQUE', canvas.width / 2, 80);
    
    // Informations utilisateur
    ctx.font = '32px Arial';
    ctx.fillText(user?.name || 'Votre Nom', canvas.width / 2, 140);
    
    ctx.font = '24px Arial';
    ctx.fillText(user?.email || 'votre.email@exemple.com', canvas.width / 2, 180);
    
    // QR Code (simulé avec un carré)
    if (cardConfig.showQR && qrValue) {
      const qrSize = 120;
      const qrX = canvas.width - qrSize - 40;
      const qrY = canvas.height - qrSize - 40;
      
      // Fond blanc pour QR
      ctx.fillStyle = 'white';
      ctx.fillRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);
      
      // QR simulé
      ctx.fillStyle = 'black';
      ctx.fillRect(qrX, qrY, qrSize, qrSize);
      
      // Texte QR
      ctx.fillStyle = 'white';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('SCANNEZ-MOI', qrX + qrSize/2, qrY + qrSize/2);
    }
    
    // Instructions
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('📱 Scannez le QR code pour vous inscrire', 40, canvas.height - 80);
    ctx.fillText('💼 Recevez automatiquement nos informations', 40, canvas.height - 50);
    
    // Convertir en URL
    const dataUrl = canvas.toDataURL('image/png');
    setGeneratedCardUrl(dataUrl);
    
    // ✅ NOUVEAU: Sauvegarder automatiquement la carte générée
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

  // ✅ FONCTION MODIFIÉE: Utiliser la carte générée pour les téléchargements
  const handleUseGeneratedCard = async (actionId, useCard) => {
    if (useCard) {
      const cardUrl = await generateBusinessCard();
      updateAction(actionId, 'file', cardUrl);
    } else {
      updateAction(actionId, 'file', '/images/welcome.png');
    }
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

  const getActionTypeLabel = (type) => {
    switch (type) {
      case 'download': return '📥 Téléchargement';
      case 'form': return '📝 Formulaire';
      case 'redirect': return '🌐 Redirection';
      case 'website': return '🌐 Site web';
      default: return type;
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
              <span className="stat-trend">{stats.conversionRate}% taux</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">⏰</div>
            <div className="stat-content">
              <h3>{stats.topHours[0]?.hour || '--'}</h3>
              <p>Heure de pic</p>
              <span className="stat-trend">{stats.topHours[0]?.scans || 0} scans</span>
            </div>
          </div>

          {/* ✅ NOUVEAU: Indicateur de sauvegarde */}
          <div className="stat-card">
            <div className="stat-icon">{savedCardData ? '💾' : '⚠️'}</div>
            <div className="stat-content">
              <h3>{savedCardData ? 'Sauvegardée' : 'Non sauvée'}</h3>
              <p>Carte en BDD</p>
              <span className="stat-trend">
                {savedCardData 
                  ? `Modifiée le ${new Date(savedCardData.updatedAt).toLocaleDateString('fr-FR')}`
                  : 'Ajoutez une image'
                }
              </span>
            </div>
          </div>
        </div>
        
        <div className="recent-activity">
          <h4>🕒 Activité récente</h4>
          <div className="activity-list">
            {stats.recentScans.map((scan, index) => (
              <div key={index} className="activity-item">
                <span className="activity-time">{scan.time}</span>
                <span className="activity-location">{scan.location}</span>
                <span className="activity-device">{scan.device}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ✅ EN-TÊTE REMIS EN HAUT */}
      <div className="card-header">
        <h2>💼 Carte de Visite Numérique</h2>
        <p>Créez et personnalisez votre carte de visite avec QR code et actions multiples</p>
      </div>

      {/* ✅ Layout en colonnes fixes */}
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

          {/* Actions après scan */}
          <div className="config-section">
            <h3>🎯 Actions après scan</h3>
            <p className="section-description">
              Configurez plusieurs actions qui se déclencheront dans l'ordre après le scan du QR code
            </p>
            
            <div className="actions-list">
              {cardConfig.actions.map((action, index) => (
                <div key={action.id} className={`action-item ${!action.active ? 'disabled' : ''}`}>
                  <div className="action-header">
                    <div className="action-order">#{index + 1}</div>
                    <div className="action-controls">
                      <button 
                        onClick={() => moveAction(action.id, 'up')}
                        disabled={index === 0}
                        className="btn-move"
                        title="Monter"
                      >
                        ↑
                      </button>
                      <button 
                        onClick={() => moveAction(action.id, 'down')}
                        disabled={index === cardConfig.actions.length - 1}
                        className="btn-move"
                        title="Descendre"
                      >
                        ↓
                      </button>
                      <button 
                        onClick={() => removeAction(action.id)}
                        className="btn-remove"
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  
                  <div className="action-config">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Type d'action :</label>
                        <select
                          value={action.type}
                          onChange={(e) => updateAction(action.id, 'type', e.target.value)}
                        >
                          <option value="download">📥 Téléchargement</option>
                          <option value="form">📝 Formulaire</option>
                          <option value="redirect">🌐 Redirection</option>
                          <option value="website">🌐 Site web</option>
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label>Délai (ms) :</label>
                        <input
                          type="number"
                          min="0"
                          step="500"
                          value={action.delay}
                          onChange={(e) => updateAction(action.id, 'delay', parseInt(e.target.value))}
                        />
                      </div>
                    </div>
                    
                    {(action.type === 'redirect' || action.type === 'website') && (
                      <div className="form-group">
                        <label>URL :</label>
                        <input
                          type="url"
                          placeholder="https://monsite.com"
                          value={action.url || ''}
                          onChange={(e) => updateAction(action.id, 'url', e.target.value)}
                        />
                      </div>
                    )}
                    
                    {action.type === 'download' && (
                      <div className="form-group">
                        <label>Fichier à télécharger :</label>
                        <div className="download-options">
                          {/* ✅ CHECKBOX CARTE DE VISITE */}
                          <label className="checkbox-option">
                            <input
                              type="checkbox"
                              checked={action.file && action.file.startsWith('data:image')}
                              onChange={(e) => handleUseGeneratedCard(action.id, e.target.checked)}
                            />
                            💼 Carte de visite
                          </label>
                        </div>
                      </div>
                    )}
                    
                    <div className="form-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={action.active}
                          onChange={(e) => updateAction(action.id, 'active', e.target.checked)}
                        />
                        Action active
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <button onClick={addAction} className="btn-add-action">
              ➕ Ajouter une action
            </button>
          </div>
        </div>

        {/* Colonne de droite - Aperçu fixe */}
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
              <button onClick={() => setPreviewMode(!previewMode)} className="btn-preview">
                {previewMode ? '📝 Mode édition' : '👁️ Mode aperçu'}
              </button>
              
              <button onClick={downloadBusinessCard} className="btn-download" disabled={loading}>
                {loading ? '⏳ Génération...' : '💾 Télécharger la carte'}
              </button>
            </div>
            
            {/* Aperçu des actions */}
            <div className="actions-preview">
              <h4>🎬 Séquence d'actions</h4>
              <div className="actions-timeline">
                {cardConfig.actions
                  .filter(action => action.active)
                  .map((action, index) => (
                  <div key={action.id} className="timeline-item">
                    <div className="timeline-marker">{index + 1}</div>
                    <div className="timeline-content">
                      <div className="timeline-action">
                        {getActionTypeLabel(action.type)}
                      </div>
                      <div className="timeline-delay">
                        {action.delay > 0 ? `Après ${action.delay}ms` : 'Immédiat'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
                  <h4>Actions configurées :</h4>
                  <div className="action-info">
                    {cardConfig.actions
                      .filter(action => action.active)
                      .map((action, index) => (
                      <div key={action.id} className="action-summary">
                        <span className="action-number">#{index + 1}</span>
                        <span className="action-type">{getActionTypeLabel(action.type)}</span>
                        <span className="action-timing">
                          {action.delay > 0 ? `+${action.delay}ms` : 'Immédiat'}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  {qrValue && (
                    <div className="qr-link">
                      <strong>Lien :</strong>
                      <a href={qrValue} target="_blank" rel="noopener noreferrer">
                        {qrValue}
                      </a>
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
    </div>
  );
};

export default BusinessCard;