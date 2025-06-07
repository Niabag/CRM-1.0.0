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
    qrSize: 150,
    // ✅ NOUVEAU: Actions multiples
    actions: [
      { id: 1, type: 'download', file: '/images/welcome.png', delay: 0, active: true },
      { id: 2, type: 'form', url: '', delay: 1000, active: true },
      { id: 3, type: 'redirect', url: 'https://google.com', delay: 3000, active: true }
    ]
  });
  
  const [qrValue, setQrValue] = useState("");
  const [loading, setLoading] = useState(false);
  
  // ✅ NOUVEAU: Statistiques en temps réel
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

  // ✅ NOUVEAU: Récupération des statistiques
  const fetchStats = async () => {
    try {
      // Simuler des données de statistiques (à remplacer par de vraies données)
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
    
    // ✅ NOUVEAU: URL avec actions multiples encodées
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

  // ✅ NOUVEAU: Gestion des actions multiples
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

  return (
    <div className="business-card-container">
      {/* ✅ NOUVEAU: Statistiques sous le titre */}
      <div className="card-header">
        <h2>💼 Carte de Visite Numérique</h2>
        <p>Créez et personnalisez votre carte de visite avec QR code et actions multiples</p>
        
        {/* ✅ Statistiques intégrées dans l'en-tête */}
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

          {/* ✅ NOUVEAU: Section actions multiples */}
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
                            📎 Choisir
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

        {/* ✅ Aperçu fixe */}
        <div className="card-preview fixed-preview">
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
            <button onClick={downloadBusinessCard} className="btn-download">
              💾 Télécharger la carte
            </button>
          </div>
          
          {/* ✅ NOUVEAU: Aperçu des actions */}
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
  );
};

export default BusinessCard;