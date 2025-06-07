import { useState, useEffect, useRef } from 'react';
import QRCode from "react-qr-code";
import { API_ENDPOINTS, FRONTEND_ROUTES, apiRequest } from '../../../config/api';
import './businessCard.scss';

<<<<<<< HEAD
const BusinessCard = () => {
  const [user, setUser] = useState({});
  const [userId, setUserId] = useState(null);
=======
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
  
>>>>>>> parent of e787ca1 (Interface optimisée de carte de visite avec statistiques séparées et aperçu fixe)
  const [qrValue, setQrValue] = useState("");
<<<<<<< HEAD
  const [error, setError] = useState(null);
=======
  const [previewMode, setPreviewMode] = useState(false);
>>>>>>> parent of 73bac78 (Système de carte de visite amélioré avec statistiques et interface fixe)
  const [loading, setLoading] = useState(false);
<<<<<<< HEAD
<<<<<<< HEAD
  const [showCardPreview, setShowCardPreview] = useState(false);
  const cardRef = useRef(null);

  const decodeToken = (token) => {
    try {
      const payloadBase64 = token.split(".")[1];
      const payload = atob(payloadBase64);
      return JSON.parse(payload);
    } catch (error) {
      console.error("Erreur lors du décodage du token:", error);
      return null;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decodedToken = decodeToken(token);
      if (decodedToken && decodedToken.userId) {
        setUserId(decodedToken.userId);
      }
    }
    
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
=======
=======
>>>>>>> parent of e787ca1 (Interface optimisée de carte de visite avec statistiques séparées et aperçu fixe)
  
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
>>>>>>> parent of e787ca1 (Interface optimisée de carte de visite avec statistiques séparées et aperçu fixe)
    try {
      const userData = await apiRequest(API_ENDPOINTS.AUTH.ME);
      setUser(userData);
    } catch (error) {
      console.error("Erreur lors du chargement des données utilisateur:", error);
    }
  };

  const generateQRCode = () => {
<<<<<<< HEAD
    if (userId) {
      const generatedLink = FRONTEND_ROUTES.CLIENT_REGISTER(userId);
      setQrValue(generatedLink);
      setShowCardPreview(true);
      setError(null);
    } else {
      setError("L'ID utilisateur n'est pas encore disponible.");
=======
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
>>>>>>> parent of e787ca1 (Interface optimisée de carte de visite avec statistiques séparées et aperçu fixe)
    }
  };

  const downloadBusinessCard = async () => {
    if (!cardRef.current) return;

<<<<<<< HEAD
    try {
      setLoading(true);
=======
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
>>>>>>> parent of e787ca1 (Interface optimisée de carte de visite avec statistiques séparées et aperçu fixe)
      
      // Importer html2canvas dynamiquement
      const html2canvas = (await import('html2canvas')).default;
      
      // Capturer la carte de visite
      const canvas = await html2canvas(cardRef.current, {
        scale: 3, // Haute qualité
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        width: 800,
        height: 500
      });

      // Créer le lien de téléchargement
      const link = document.createElement('a');
      link.download = `carte-visite-${user.name?.replace(/\s+/g, '-') || 'business-card'}.png`;
      link.href = canvas.toDataURL('image/png');
      
      // Déclencher le téléchargement
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert('✅ Carte de visite téléchargée avec succès !');
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      alert('❌ Erreur lors du téléchargement de la carte');
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(qrValue);
      alert('✅ Lien copié dans le presse-papiers !');
    } catch (err) {
      console.error('Erreur lors de la copie:', err);
      alert('❌ Erreur lors de la copie du lien');
=======
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
>>>>>>> parent of 73bac78 (Système de carte de visite amélioré avec statistiques et interface fixe)
    }
  };

  return (
    <div className="business-card-container">
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
      <div className="card-header">
        <h2>💼 Carte de visite digitale</h2>
        <p className="card-subtitle">Créez et téléchargez votre carte de visite avec QR code intégré</p>
=======
      {/* ✅ NOUVEAU: Statistiques en haut de page */}
      <div className="stats-header">
=======
=======
>>>>>>> parent of e787ca1 (Interface optimisée de carte de visite avec statistiques séparées et aperçu fixe)
      {/* ✅ NOUVEAU: Statistiques sous le titre */}
      <div className="card-header">
        <h2>💼 Carte de Visite Numérique</h2>
        <p>Créez et personnalisez votre carte de visite avec QR code et actions multiples</p>
        
        {/* ✅ Statistiques intégrées dans l'en-tête */}
<<<<<<< HEAD
>>>>>>> parent of e787ca1 (Interface optimisée de carte de visite avec statistiques séparées et aperçu fixe)
=======
>>>>>>> parent of e787ca1 (Interface optimisée de carte de visite avec statistiques séparées et aperçu fixe)
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
>>>>>>> parent of 73bac78 (Système de carte de visite amélioré avec statistiques et interface fixe)
      </div>

      <div className="card-header">
        <h2>💼 Carte de Visite Numérique</h2>
        <p>Créez et personnalisez votre carte de visite avec QR code et actions multiples</p>
      </div>

      <div className="card-content">
<<<<<<< HEAD
        {/* Section informations utilisateur */}
        <div className="user-info-section">
          <div className="user-avatar">
            {user.name ? user.name.charAt(0).toUpperCase() : "U"}
=======
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
>>>>>>> parent of e787ca1 (Interface optimisée de carte de visite avec statistiques séparées et aperçu fixe)
          </div>
<<<<<<< HEAD
          <div className="user-details">
            <h3>{user.name || "Votre Nom"}</h3>
            <p>{user.email || "votre.email@exemple.com"}</p>
            <span className="user-role">Professionnel • CRM Pro</span>
          </div>
        </div>

<<<<<<< HEAD
<<<<<<< HEAD
        {/* Section génération */}
        <div className="generation-section">
          <div className="generation-info">
            <h3>🎯 Générez votre carte de visite</h3>
            <p>Créez une carte de visite professionnelle avec votre QR code d'inscription intégré</p>
            
            <button onClick={generateQRCode} className="generate-btn">
              ✨ Créer ma carte de visite
=======

=======
>>>>>>> parent of e787ca1 (Interface optimisée de carte de visite avec statistiques séparées et aperçu fixe)
=======
>>>>>>> parent of e787ca1 (Interface optimisée de carte de visite avec statistiques séparées et aperçu fixe)
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

<<<<<<< HEAD
<<<<<<< HEAD
        {/* Aperçu */}
        <div className="card-preview">
=======
        {/* ✅ Aperçu fixe */}
        <div className="card-preview fixed-preview">
>>>>>>> parent of e787ca1 (Interface optimisée de carte de visite avec statistiques séparées et aperçu fixe)
=======
        {/* ✅ Aperçu fixe */}
        <div className="card-preview fixed-preview">
>>>>>>> parent of e787ca1 (Interface optimisée de carte de visite avec statistiques séparées et aperçu fixe)
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
>>>>>>> parent of 73bac78 (Système de carte de visite amélioré avec statistiques et interface fixe)
            </button>
            
            {error && <div className="error-message">{error}</div>}
          </div>
<<<<<<< HEAD
        </div>

        {/* Aperçu et téléchargement de la carte */}
        {showCardPreview && qrValue && (
          <div className="card-preview-section">
            <h3>📋 Aperçu de votre carte de visite</h3>
            
            {/* Carte de visite à télécharger */}
            <div className="business-card-download" ref={cardRef}>
              <div className="card-background">
                <div className="card-left">
                  <div className="card-logo">
                    <div className="logo-circle">
                      {user.name ? user.name.charAt(0).toUpperCase() : "U"}
=======
          
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
>>>>>>> parent of e787ca1 (Interface optimisée de carte de visite avec statistiques séparées et aperçu fixe)
                    </div>
                  </div>
                  <div className="card-info">
                    <h2 className="card-name">{user.name || "Votre Nom"}</h2>
                    <p className="card-title">Professionnel</p>
                    <div className="card-contact">
                      <p>📧 {user.email || "votre.email@exemple.com"}</p>
                      <p>🌐 CRM Pro</p>
                      <p>💼 Solutions Digitales</p>
                    </div>
                  </div>
                </div>
<<<<<<< HEAD
                
                <div className="card-right">
                  <div className="qr-section-card">
                    <QRCode value={qrValue} size={120} />
                    <p className="qr-instruction">Scannez pour vous inscrire</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="card-actions">
              <button 
                onClick={downloadBusinessCard}
                className="download-btn"
                disabled={loading}
              >
                {loading ? "📥 Téléchargement..." : "📥 Télécharger la carte"}
              </button>
              
              <button 
                onClick={copyToClipboard}
                className="copy-btn"
              >
                📋 Copier le lien
              </button>
              
              <a 
                href={qrValue} 
                target="_blank" 
                rel="noopener noreferrer"
                className="test-btn"
              >
                🔗 Tester le formulaire
              </a>
            </div>

            {/* Informations du lien */}
            <div className="link-info">
              <h4>🔗 Lien d'inscription généré :</h4>
              <div className="link-container">
                <a 
                  href={qrValue} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="qr-link"
                >
                  {qrValue}
                </a>
              </div>
=======
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
<<<<<<< HEAD
>>>>>>> parent of e787ca1 (Interface optimisée de carte de visite avec statistiques séparées et aperçu fixe)
            </div>
          </div>
        )}

        {/* Instructions d'utilisation */}
        <div className="instructions-section">
          <h4>📖 Comment utiliser votre carte de visite :</h4>
          <div className="instructions-grid">
            <div className="instruction-item">
              <div className="instruction-icon">1️⃣</div>
              <div className="instruction-content">
                <h5>Générez votre carte</h5>
                <p>Cliquez sur "Créer ma carte de visite" pour générer votre QR code personnalisé</p>
              </div>
            </div>
            
<<<<<<< HEAD
            <div className="instruction-item">
              <div className="instruction-icon">2️⃣</div>
              <div className="instruction-content">
                <h5>Téléchargez l'image</h5>
                <p>Téléchargez votre carte de visite en haute qualité (format PNG)</p>
              </div>
            </div>
            
            <div className="instruction-item">
              <div className="instruction-icon">3️⃣</div>
              <div className="instruction-content">
                <h5>Partagez votre carte</h5>
                <p>Imprimez, envoyez par email ou partagez sur les réseaux sociaux</p>
              </div>
            </div>
            
            <div className="instruction-item">
              <div className="instruction-icon">4️⃣</div>
              <div className="instruction-content">
                <h5>Récupérez vos prospects</h5>
                <p>Vos prospects scannent le QR code, s'inscrivent et apparaissent dans votre CRM</p>
=======
=======
            </div>
            
>>>>>>> parent of e787ca1 (Interface optimisée de carte de visite avec statistiques séparées et aperçu fixe)
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
<<<<<<< HEAD
>>>>>>> parent of e787ca1 (Interface optimisée de carte de visite avec statistiques séparées et aperçu fixe)
=======
>>>>>>> parent of e787ca1 (Interface optimisée de carte de visite avec statistiques séparées et aperçu fixe)
              </div>
            </div>
          </div>
        </div>

        {/* Avantages */}
        <div className="benefits-section">
          <h4>✨ Avantages de votre carte digitale :</h4>
          <ul className="benefits-list">
            <li>🎯 <strong>Inscription automatique</strong> - Vos prospects s'inscrivent en 30 secondes</li>
            <li>📊 <strong>Suivi en temps réel</strong> - Consultez vos nouveaux prospects dans le CRM</li>
            <li>🌍 <strong>Écologique</strong> - Réduisez l'usage de papier avec le digital</li>
            <li>💼 <strong>Professionnel</strong> - Design moderne et épuré</li>
            <li>📱 <strong>Compatible mobile</strong> - Fonctionne sur tous les smartphones</li>
            <li>🔄 <strong>Toujours à jour</strong> - Modifiez vos informations à tout moment</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BusinessCard;