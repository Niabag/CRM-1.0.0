import { useState, useEffect } from 'react';
import QRCode from "react-qr-code";
import { API_ENDPOINTS, FRONTEND_ROUTES, apiRequest } from '../../../config/api';
import './businessCard.scss';

const BusinessCard = () => {
  const [user, setUser] = useState({});
  const [userId, setUserId] = useState(null);
  const [qrValue, setQrValue] = useState("");
  const [cardData, setCardData] = useState({
    companyName: '',
    position: '',
    phone: '',
    website: '',
    address: '',
    description: '',
    color: '#667eea'
  });
  const [showQR, setShowQR] = useState(false);
  const [loading, setLoading] = useState(false);

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
    try {
      const userData = await apiRequest(API_ENDPOINTS.AUTH.ME);
      setUser(userData);
      setCardData(prev => ({
        ...prev,
        companyName: userData.name || '',
        position: 'Développeur Web'
      }));
    } catch (error) {
      console.error("Erreur lors du chargement des données utilisateur:", error);
    }
  };

  const generateQRCode = () => {
    if (userId) {
      const generatedLink = FRONTEND_ROUTES.CLIENT_REGISTER(userId);
      setQrValue(generatedLink);
      setShowQR(true);
    }
  };

  const handleInputChange = (field, value) => {
    setCardData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('✅ Lien copié dans le presse-papiers !');
    } catch (err) {
      console.error('Erreur lors de la copie:', err);
    }
  };

  const downloadCard = () => {
    // Simulation du téléchargement
    alert('🎨 Fonctionnalité de téléchargement à venir !');
  };

  const colorOptions = [
    '#667eea', '#764ba2', '#f093fb', '#f5576c',
    '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
    '#ffecd2', '#fcb69f', '#a8edea', '#fed6e3'
  ];

  return (
    <div className="business-card-container">
      <div className="page-header">
        <h1>💼 Ma Carte de Visite Digitale</h1>
        <p>Créez et personnalisez votre carte de visite professionnelle</p>
      </div>

      <div className="card-workspace">
        {/* Formulaire de personnalisation */}
        <div className="card-editor">
          <h3>🎨 Personnalisation</h3>
          
          <div className="form-section">
            <h4>Informations principales</h4>
            
            <div className="form-group">
              <label>Nom / Entreprise</label>
              <input
                type="text"
                value={cardData.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                placeholder="Votre nom ou nom d'entreprise"
              />
            </div>

            <div className="form-group">
              <label>Poste / Fonction</label>
              <input
                type="text"
                value={cardData.position}
                onChange={(e) => handleInputChange('position', e.target.value)}
                placeholder="Développeur Web, Designer..."
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={user.email || ''}
                disabled
                className="disabled-input"
              />
            </div>

            <div className="form-group">
              <label>Téléphone</label>
              <input
                type="tel"
                value={cardData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="06 12 34 56 78"
              />
            </div>

            <div className="form-group">
              <label>Site web</label>
              <input
                type="url"
                value={cardData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://monsite.com"
              />
            </div>

            <div className="form-group">
              <label>Adresse</label>
              <input
                type="text"
                value={cardData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="123 Rue Example, 75000 Paris"
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={cardData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Spécialisé en développement web moderne..."
                rows={3}
              />
            </div>
          </div>

          <div className="form-section">
            <h4>🎨 Couleur du thème</h4>
            <div className="color-picker">
              {colorOptions.map(color => (
                <button
                  key={color}
                  className={`color-option ${cardData.color === color ? 'active' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleInputChange('color', color)}
                />
              ))}
            </div>
          </div>

          <div className="form-section">
            <h4>📱 QR Code d'inscription</h4>
            <p className="qr-description">
              Générez un QR code pour permettre à vos prospects de s'inscrire directement
            </p>
            
            {!showQR ? (
              <button onClick={generateQRCode} className="generate-qr-btn">
                🎯 Générer le QR Code
              </button>
            ) : (
              <div className="qr-section">
                <div className="qr-code-display">
                  <QRCode value={qrValue} size={120} />
                </div>
                <div className="qr-actions">
                  <button 
                    onClick={() => copyToClipboard(qrValue)}
                    className="copy-link-btn"
                  >
                    📋 Copier le lien
                  </button>
                  <a 
                    href={qrValue} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="test-link-btn"
                  >
                    🔗 Tester le lien
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Aperçu de la carte */}
        <div className="card-preview">
          <h3>👁️ Aperçu</h3>
          
          <div className="business-card" style={{ borderColor: cardData.color }}>
            <div className="card-header" style={{ background: `linear-gradient(135deg, ${cardData.color}, ${cardData.color}dd)` }}>
              <div className="card-avatar">
                {cardData.companyName ? cardData.companyName.charAt(0).toUpperCase() : user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="card-title">
                <h4>{cardData.companyName || user.name || 'Votre Nom'}</h4>
                <p>{cardData.position || 'Votre Fonction'}</p>
              </div>
            </div>

            <div className="card-content">
              <div className="contact-info">
                {user.email && (
                  <div className="contact-item">
                    <span className="contact-icon">📧</span>
                    <span>{user.email}</span>
                  </div>
                )}
                
                {cardData.phone && (
                  <div className="contact-item">
                    <span className="contact-icon">📞</span>
                    <span>{cardData.phone}</span>
                  </div>
                )}
                
                {cardData.website && (
                  <div className="contact-item">
                    <span className="contact-icon">🌐</span>
                    <span>{cardData.website}</span>
                  </div>
                )}
                
                {cardData.address && (
                  <div className="contact-item">
                    <span className="contact-icon">📍</span>
                    <span>{cardData.address}</span>
                  </div>
                )}
              </div>

              {cardData.description && (
                <div className="card-description">
                  <p>{cardData.description}</p>
                </div>
              )}

              {showQR && (
                <div className="card-qr">
                  <div className="qr-mini">
                    <QRCode value={qrValue} size={60} />
                  </div>
                  <span>Scannez pour vous inscrire</span>
                </div>
              )}
            </div>
          </div>

          <div className="card-actions">
            <button onClick={downloadCard} className="download-btn">
              💾 Télécharger
            </button>
            <button 
              onClick={() => window.print()} 
              className="print-btn"
            >
              🖨️ Imprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessCard;