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
  
  // ✅ NOUVEAU: État simplifié pour l'action carte de visite
  const [enableBusinessCardAction, setEnableBusinessCardAction] = useState(true);
  
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
        
        // ✅ Vérifier si l'action carte de visite est activée
        const hasBusinessCardAction = savedCard.cardConfig.actions?.some(
          action => action.type === 'download' && action.file.includes('carte')
        );
        setEnableBusinessCardAction(hasBusinessCardAction);
      }
      
      console.log('✅ Carte de visite chargée depuis la BDD');
    } catch (error) {
      console.log('ℹ️ Aucune carte de visite sauvegardée trouvée');
    }
  };

  // ✅ CORRECTION: QR code simple et raccourci
  const generateQRCode = () => {
    if (!userId) {
      console.error("❌ userId manquant pour générer le QR code");
      return;
    }
    
    try {
      // ✅ URL SIMPLE ET COURTE
      const targetUrl = `${FRONTEND_ROUTES.CLIENT_REGISTER(userId)}`;
      
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

  // ✅ NOUVEAU: Gérer l'activation/désactivation de l'action carte de visite
  const handleBusinessCardActionToggle = async (enabled) => {
    setEnableBusinessCardAction(enabled);
    
    let updatedActions = [...cardConfig.actions];
    
    if (enabled) {
      // ✅ Ajouter l'action carte de visite si elle n'existe pas
      const hasBusinessCardAction = updatedActions.some(
        action => action.type === 'download' && action.file.includes('carte')
      );
      
      if (!hasBusinessCardAction) {
        const businessCardAction = {
          id: Date.now(),
          type: 'download',
          file: '/images/carte-de-visite.png',
          url: '',
          delay: 0,
          active: true
        };
        updatedActions.push(businessCardAction);
      }
    } else {
      // ✅ Supprimer l'action carte de visite
      updatedActions = updatedActions.filter(
        action => !(action.type === 'download' && action.file.includes('carte'))
      );
    }
    
    const newConfig = {
      ...cardConfig,
      actions: updatedActions
    };
    
    setCardConfig(newConfig);
    
    if (savedCardData) {
      await saveBusinessCardToDB(null, newConfig);
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

          {/* ✅ NOUVEAU: Section simplifiée pour l'action carte de visite */}
          <div className="config-section">
            <h3>💼 Action après scan</h3>
            <p className="section-description">
              Configurez ce qui se passe quand quelqu'un scanne votre QR code
            </p>

            <div className="business-card-action">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={enableBusinessCardAction}
                  onChange={(e) => handleBusinessCardActionToggle(e.target.checked)}
                />
                <span className="checkbox-text">
                  📥 Télécharger automatiquement la carte de visite
                </span>
              </label>
              
              {enableBusinessCardAction && (
                <div className="action-details">
                  <div className="action-preview">
                    <span className="action-icon">📥</span>
                    <div className="action-info">
                      <strong>Téléchargement automatique</strong>
                      <p>La carte de visite sera téléchargée dès le scan du QR code</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Colonne de droite - Aperçu */}
        <div className="card-preview-column">
          {/* ✅ APERÇU DE LA CARTE RESTAURÉ */}
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
                        {qrValue.length > 40 ? qrValue.substring(0, 40) + '...' : qrValue}
                      </a>
                    </div>
                  )}
                  {enableBusinessCardAction && (
                    <div className="qr-actions-info">
                      <strong>Action configurée :</strong>
                      <p>📥 Téléchargement automatique de la carte de visite</p>
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