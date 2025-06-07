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
  
  const [stats, setStats] = useState({
    scansToday: 0,
    scansThisMonth: 0,
    totalScans: 0,
    conversions: 0,
    conversionRate: 0,
    topHours: [],
    recentScans: []
  });

  useEffect(() => {
    if (userId) {
      generateQRCode();
      fetchStats();
    }
  }, [userId, cardConfig.actions]);

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

  const generateQRCode = () => {
    if (!userId) return;
    
    const actionsData = encodeURIComponent(JSON.stringify(cardConfig.actions.filter(a => a.active)));
    const targetUrl = `${FRONTEND_ROUTES.CLIENT_REGISTER(userId)}?actions=${actionsData}`;
    
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

  const addAction = () => {
    const newAction = {
      id: Date.now(),
      type: 'download',
      file: '/images/welcome.png',
      url: '',
      delay: 0,
      active: true
    };
    
    setCardConfig(prev => ({
      ...prev,
      actions: [...prev.actions, newAction]
    }));
  };

  const updateAction = (actionId, field, value) => {
    setCardConfig(prev => ({
      ...prev,
      actions: prev.actions.map(action => 
        action.id === actionId 
          ? { ...action, [field]: value }
          : action
      )
    }));
  };

  const removeAction = (actionId) => {
    setCardConfig(prev => ({
      ...prev,
      actions: prev.actions.filter(action => action.id !== actionId)
    }));
  };

  const moveAction = (actionId, direction) => {
    const currentIndex = cardConfig.actions.findIndex(a => a.id === actionId);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === cardConfig.actions.length - 1)
    ) return;

    const newActions = [...cardConfig.actions];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    [newActions[currentIndex], newActions[targetIndex]] = [newActions[targetIndex], newActions[currentIndex]];
    
    setCardConfig(prev => ({
      ...prev,
      actions: newActions
    }));
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
  const handleUseGeneratedCard = (actionId, useCard) => {
    if (useCard) {
      generateBusinessCard().then(cardUrl => {
        updateAction(actionId, 'file', cardUrl);
      });
    } else {
      updateAction(actionId, 'file', '/images/welcome.png');
    }
  };

  const copyQRLink = () => {
    navigator.clipboard.writeText(qrValue);
    alert('✅ Lien copié dans le presse-papier !');
  };

  const testQRCode = () => {
    window.open(qrValue, '_blank');
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
              
              <button onClick={downloadBusinessCard} className="btn-download">
                💾 Télécharger la carte
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
        </div>
      </div>
    </div>
  );
};

export default BusinessCard;