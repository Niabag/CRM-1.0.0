import { useState, useEffect } from 'react';
import QRCode from "react-qr-code";
import { API_ENDPOINTS, FRONTEND_ROUTES, apiRequest } from '../../../config/api';
import './businessCard.scss';

const BusinessCard = ({ userId, user }) => {
  const [cardConfig, setCardConfig] = useState({
    cardImage: '/images/default-business-card.png',
    downloadImage: '/images/welcome.png',
    redirectType: 'form', // 'form', 'website', 'download'
    websiteUrl: '',
    showQR: true,
    qrPosition: 'bottom-right',
    qrSize: 150
  });
  
  const [qrValue, setQrValue] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      generateQRCode();
    }
  }, [userId, cardConfig.redirectType, cardConfig.websiteUrl]);

  const generateQRCode = () => {
    if (!userId) return;
    
    let targetUrl;
    
    switch (cardConfig.redirectType) {
      case 'website':
        targetUrl = cardConfig.websiteUrl || 'https://google.com';
        break;
      case 'download':
        targetUrl = cardConfig.downloadImage;
        break;
      case 'form':
      default:
        targetUrl = FRONTEND_ROUTES.CLIENT_REGISTER(userId);
        break;
    }
    
    setQrValue(targetUrl);
  };

  const handleCardImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCardConfig(prev => ({
          ...prev,
          cardImage: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
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

  const handleConfigChange = (field, value) => {
    setCardConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const downloadBusinessCard = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Dimensions standard carte de visite (85.6 x 53.98 mm à 300 DPI)
    canvas.width = 1012;
    canvas.height = 638;
    
    const img = new Image();
    img.onload = () => {
      // Dessiner l'image de fond
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      if (cardConfig.showQR && qrValue) {
        // Générer le QR code
        const qrCanvas = document.createElement('canvas');
        const qrSize = cardConfig.qrSize;
        
        // Ici on devrait utiliser une bibliothèque pour générer le QR code sur canvas
        // Pour la démo, on dessine un carré
        ctx.fillStyle = 'white';
        ctx.fillRect(canvas.width - qrSize - 20, canvas.height - qrSize - 20, qrSize, qrSize);
        ctx.fillStyle = 'black';
        ctx.fillRect(canvas.width - qrSize - 15, canvas.height - qrSize - 15, qrSize - 10, qrSize - 10);
      }
      
      // Télécharger
      const link = document.createElement('a');
      link.download = 'carte-de-visite.png';
      link.href = canvas.toDataURL();
      link.click();
    };
    
    img.src = cardConfig.cardImage;
  };

  const copyQRLink = () => {
    navigator.clipboard.writeText(qrValue);
    alert('✅ Lien copié dans le presse-papier !');
  };

  const testQRCode = () => {
    window.open(qrValue, '_blank');
  };

  return (
    <div className="business-card-container">
      <div className="card-header">
        <h2>💼 Carte de Visite Numérique</h2>
        <p>Créez et personnalisez votre carte de visite avec QR code</p>
      </div>

      <div className="card-content">
        {/* Configuration */}
        <div className="card-config">
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
                />
                <label htmlFor="card-image-upload" className="upload-btn">
                  📷 Choisir une image
                </label>
              </div>
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

          <div className="config-section">
            <h3>🎯 Action après scan</h3>
            
            <div className="form-group">
              <label>Que se passe-t-il après le scan ?</label>
              <select
                value={cardConfig.redirectType}
                onChange={(e) => handleConfigChange('redirectType', e.target.value)}
              >
                <option value="form">Formulaire d'inscription</option>
                <option value="website">Redirection vers un site</option>
                <option value="download">Téléchargement d'un fichier</option>
              </select>
            </div>

            {cardConfig.redirectType === 'website' && (
              <div className="form-group">
                <label>URL du site web :</label>
                <input
                  type="url"
                  placeholder="https://monsite.com"
                  value={cardConfig.websiteUrl}
                  onChange={(e) => handleConfigChange('websiteUrl', e.target.value)}
                />
              </div>
            )}

            {cardConfig.redirectType === 'download' && (
              <div className="form-group">
                <label>Fichier à télécharger :</label>
                <div className="file-upload">
                  <input
                    type="file"
                    accept="image/*,application/pdf,.doc,.docx"
                    onChange={handleDownloadImageUpload}
                    id="download-file-upload"
                  />
                  <label htmlFor="download-file-upload" className="upload-btn">
                    📎 Choisir un fichier
                  </label>
                </div>
                <p className="help-text">
                  Ce fichier sera automatiquement téléchargé lors du scan
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Aperçu */}
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
                    size={cardConfig.qrSize * 0.6} // Réduction pour l'aperçu
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
            
            <button onClick={downloadBusinessCard} className="btn-download">
              💾 Télécharger la carte
            </button>
          </div>
        </div>

        {/* QR Code et actions */}
        <div className="qr-section">
          <h3>📱 QR Code</h3>
          
          <div className="qr-display">
            <div className="qr-code-wrapper">
              {qrValue && (
                <QRCode 
                  value={qrValue} 
                  size={200}
                  bgColor="white"
                  fgColor="black"
                />
              )}
            </div>
            
            <div className="qr-info">
              <div className="qr-details">
                <h4>Action configurée :</h4>
                <div className="action-info">
                  {cardConfig.redirectType === 'form' && (
                    <div className="action-item">
                      <span className="action-icon">📝</span>
                      <span>Formulaire d'inscription prospect</span>
                    </div>
                  )}
                  
                  {cardConfig.redirectType === 'website' && (
                    <div className="action-item">
                      <span className="action-icon">🌐</span>
                      <span>Redirection vers : {cardConfig.websiteUrl || 'URL non définie'}</span>
                    </div>
                  )}
                  
                  {cardConfig.redirectType === 'download' && (
                    <div className="action-item">
                      <span className="action-icon">📥</span>
                      <span>Téléchargement automatique du fichier</span>
                    </div>
                  )}
                </div>
                
                <div className="qr-link">
                  <strong>Lien :</strong>
                  <a href={qrValue} target="_blank" rel="noopener noreferrer">
                    {qrValue}
                  </a>
                </div>
              </div>
              
              <div className="qr-actions">
                <button onClick={copyQRLink} className="btn-copy">
                  📋 Copier le lien
                </button>
                
                <button onClick={testQRCode} className="btn-test">
                  🧪 Tester le QR code
                </button>
                
                <button onClick={generateQRCode} className="btn-refresh">
                  🔄 Régénérer
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="card-stats">
          <h3>📊 Statistiques d'utilisation</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-number">0</span>
              <span className="stat-label">Scans aujourd'hui</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">0</span>
              <span className="stat-label">Scans ce mois</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">0</span>
              <span className="stat-label">Conversions</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">0%</span>
              <span className="stat-label">Taux de conversion</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessCard;