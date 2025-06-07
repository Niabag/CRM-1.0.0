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
    // Actions multiples avec choix d'activation
    actions: [
      { id: 1, type: 'download', file: '/images/welcome.png', delay: 0, active: false },
      { id: 2, type: 'form', url: '', delay: 1000, active: true },
      { id: 3, type: 'redirect', url: 'https://google.com', delay: 3000, active: false }
    ]
  });
  
  const [qrValue, setQrValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasCard, setHasCard] = useState(false);
  
  // Statistiques en temps réel
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
      checkExistingCard();
      generateQRCode();
      fetchStats();
    }
  }, [userId, cardConfig.actions]);

  // Vérifier si une carte existe
  const checkExistingCard = () => {
    const existingCard = localStorage.getItem(`business-card-${userId}`);
    if (existingCard) {
      try {
        const savedCard = JSON.parse(existingCard);
        setCardConfig(prev => ({ ...prev, ...savedCard }));
        setHasCard(true);
      } catch (error) {
        console.error('Erreur chargement carte:', error);
      }
    }
  };

  // Récupération des statistiques
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
    
    // Filtrer uniquement les actions actives
    const activeActions = cardConfig.actions.filter(a => a.active);
    
    if (activeActions.length === 0) {
      // Si aucune action active, utiliser l'URL simple
      setQrValue(FRONTEND_ROUTES.CLIENT_REGISTER(userId));
      return;
    }
    
    // URL avec actions multiples encodées
    const actionsData = encodeURIComponent(JSON.stringify(activeActions));
    const targetUrl = `${FRONTEND_ROUTES.CLIENT_REGISTER(userId)}?actions=${actionsData}`;
    
    setQrValue(targetUrl);
  };

  const handleCardImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newConfig = {
          ...cardConfig,
          cardImage: reader.result
        };
        setCardConfig(newConfig);
        setHasCard(true);
        // Sauvegarder dans localStorage
        localStorage.setItem(`business-card-${userId}`, JSON.stringify(newConfig));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfigChange = (field, value) => {
    const newConfig = {
      ...cardConfig,
      [field]: value
    };
    setCardConfig(newConfig);
    
    // Sauvegarder automatiquement
    if (hasCard) {
      localStorage.setItem(`business-card-${userId}`, JSON.stringify(newConfig));
    }
  };

  // Gestion des actions multiples
  const addAction = () => {
    const newAction = {
      id: Date.now(),
      type: 'download',
      file: '/images/welcome.png',
      url: '',
      delay: 0,
      active: false
    };
    
    const newConfig = {
      ...cardConfig,
      actions: [...cardConfig.actions, newAction]
    };
    setCardConfig(newConfig);
    
    if (hasCard) {
      localStorage.setItem(`business-card-${userId}`, JSON.stringify(newConfig));
    }
  };

  const updateAction = (actionId, field, value) => {
    const newConfig = {
      ...cardConfig,
      actions: cardConfig.actions.map(action => 
        action.id === actionId 
          ? { ...action, [field]: value }
          : action
      )
    };
    setCardConfig(newConfig);
    
    if (hasCard) {
      localStorage.setItem(`business-card-${userId}`, JSON.stringify(newConfig));
    }
  };

  const removeAction = (actionId) => {
    const newConfig = {
      ...cardConfig,
      actions: cardConfig.actions.filter(action => action.id !== actionId)
    };
    setCardConfig(newConfig);
    
    if (hasCard) {
      localStorage.setItem(`business-card-${userId}`, JSON.stringify(newConfig));
    }
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
    
    const newConfig = {
      ...cardConfig,
      actions: newActions
    };
    setCardConfig(newConfig);
    
    if (hasCard) {
      localStorage.setItem(`business-card-${userId}`, JSON.stringify(newConfig));
    }
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
        const qrSize = cardConfig.qrSize;
        
        // Position du QR code
        let x, y;
        switch (cardConfig.qrPosition) {
          case 'top-left':
            x = 20;
            y = 20;
            break;
          case 'top-right':
            x = canvas.width - qrSize - 20;
            y = 20;
            break;
          case 'bottom-left':
            x = 20;
            y = canvas.height - qrSize - 20;
            break;
          case 'bottom-right':
          default:
            x = canvas.width - qrSize - 20;
            y = canvas.height - qrSize - 20;
            break;
        }
        
        // Dessiner un fond blanc pour le QR code
        ctx.fillStyle = 'white';
        ctx.fillRect(x - 10, y - 10, qrSize + 20, qrSize + 20);
        
        // Dessiner un QR code simplifié (carré noir)
        ctx.fillStyle = 'black';
        ctx.fillRect(x, y, qrSize, qrSize);
        
        // Ajouter du texte "QR CODE"
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('QR CODE', x + qrSize/2, y + qrSize/2);
      }
      
      // Télécharger
      const link = document.createElement('a');
      link.download = 'carte-de-visite-avec-qr.png';
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

  const getActionTypeLabel = (type) => {
    switch (type) {
      case 'download': return '📥 Téléchargement';
      case 'form': return '📝 Formulaire';
      case 'redirect': return '🌐 Redirection';
      default: return type;
    }
  };

  const getActionTypeIcon = (type) => {
    switch (type) {
      case 'download': return '📥';
      case 'form': return '📝';
      case 'redirect': return '🌐';
      default: return '❓';
    }
  };

  return (
    <div className="business-card-container">
      {/* En-tête principal */}
      <div className="card-header">
        <div className="header-content">
          <div className="header-text">
            <h2>💼 Carte de Visite Numérique</h2>
            <p>Créez votre carte de visite interactive avec QR code personnalisé</p>
          </div>
          <div className="header-actions">
            {hasCard && (
              <button onClick={downloadBusinessCard} className="btn-download-header">
                💾 Télécharger la carte
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Section statistiques séparée */}
      <div className="stats-section">
        <h3>📊 Statistiques d'utilisation</h3>
        
        <div className="stats-grid">
          <div className="stat-card highlight">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h4>{stats.totalScans}</h4>
              <p>Scans totaux</p>
              <span className="stat-trend positive">+{stats.scansToday} aujourd'hui</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <h4>{stats.scansThisMonth}</h4>
              <p>Ce mois</p>
              <span className="stat-trend neutral">+{Math.round((stats.scansThisMonth / 30) * 100) / 100}/jour</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-content">
              <h4>{stats.conversions}</h4>
              <p>Conversions</p>
              <span className="stat-trend positive">{stats.conversionRate}% taux</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">⏰</div>
            <div className="stat-content">
              <h4>{stats.topHours[0]?.hour || '--'}</h4>
              <p>Heure de pic</p>
              <span className="stat-trend neutral">{stats.topHours[0]?.scans || 0} scans</span>
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

      <div className="main-content">
        {/* Configuration */}
        <div className="config-panel">
          {/* Design de la carte */}
          <div className="config-section">
            <h3>🎨 Design de la carte</h3>
            
            {!hasCard && (
              <div className="create-card-notice">
                <div className="notice-icon">💼</div>
                <div className="notice-content">
                  <h4>Créer la carte</h4>
                  <p>Importez votre carte de visite pour commencer</p>
                </div>
              </div>
            )}
            
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
                  📷 {hasCard ? 'Changer l\'image' : 'Importer la carte'}
                </label>
              </div>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={cardConfig.showQR}
                  onChange={(e) => handleConfigChange('showQR', e.target.checked)}
                />
                <span className="checkmark"></span>
                Afficher le QR code sur la carte
              </label>
            </div>

            {cardConfig.showQR && (
              <div className="qr-config">
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
                  <label>Taille du QR code : {cardConfig.qrSize}px</label>
                  <input
                    type="range"
                    min="100"
                    max="200"
                    value={cardConfig.qrSize}
                    onChange={(e) => handleConfigChange('qrSize', parseInt(e.target.value))}
                    className="range-slider"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Actions après scan */}
          <div className="config-section">
            <h3>🎯 Actions après scan</h3>
            <p className="section-description">
              Choisissez les actions qui se déclencheront après le scan du QR code
            </p>
            
            <div className="actions-list">
              {cardConfig.actions.map((action, index) => (
                <div key={action.id} className={`action-item ${!action.active ? 'disabled' : ''}`}>
                  <div className="action-header">
                    <div className="action-info">
                      <div className="action-order">#{index + 1}</div>
                      <div className="action-type-display">
                        <span className="action-icon">{getActionTypeIcon(action.type)}</span>
                        <span className="action-label">{getActionTypeLabel(action.type)}</span>
                      </div>
                    </div>
                    
                    <div className="action-controls">
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={action.active}
                          onChange={(e) => updateAction(action.id, 'active', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                      
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
                  
                  {action.active && (
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
                      
                      {action.type === 'redirect' && (
                        <div className="form-group">
                          <label>URL de redirection :</label>
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
                          <div className="file-upload">
                            <input
                              type="file"
                              accept="image/*,application/pdf,.doc,.docx"
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    updateAction(action.id, 'file', reader.result);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              id={`download-file-${action.id}`}
                            />
                            <label htmlFor={`download-file-${action.id}`} className="upload-btn small">
                              📎 Choisir un fichier
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <button onClick={addAction} className="btn-add-action">
              ➕ Ajouter une action
            </button>
          </div>
        </div>

        {/* Aperçu fixe */}
        <div className="preview-panel">
          <div className="preview-section">
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
                      size={Math.min(cardConfig.qrSize * 0.6, 120)}
                      bgColor="white"
                      fgColor="black"
                    />
                  </div>
                )}
              </div>
            </div>
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
              
              {cardConfig.actions.filter(action => action.active).length === 0 && (
                <div className="no-actions">
                  <span className="no-actions-icon">⚠️</span>
                  <span>Aucune action active</span>
                </div>
              )}
            </div>
          </div>

          {/* QR Code et actions */}
          <div className="qr-section">
            <h4>📱 QR Code</h4>
            
            <div className="qr-display">
              <div className="qr-code-wrapper">
                {qrValue && (
                  <QRCode 
                    value={qrValue} 
                    size={150}
                    bgColor="white"
                    fgColor="black"
                  />
                )}
              </div>
              
              <div className="qr-actions">
                <button onClick={copyQRLink} className="btn-qr-action">
                  📋 Copier
                </button>
                
                <button onClick={testQRCode} className="btn-qr-action">
                  🧪 Tester
                </button>
                
                <button onClick={generateQRCode} className="btn-qr-action">
                  🔄 Régénérer
                </button>
              </div>
            </div>
            
            <div className="qr-info">
              <div className="active-actions-count">
                <span className="count-badge">
                  {cardConfig.actions.filter(a => a.active).length}
                </span>
                <span>action(s) active(s)</span>
              </div>
              
              <div className="qr-link">
                <a href={qrValue} target="_blank" rel="noopener noreferrer">
                  Voir le lien complet
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessCard;