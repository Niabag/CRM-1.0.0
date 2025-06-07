import { useState, useEffect } from 'react';
import QRCode from "react-qr-code";
import { API_ENDPOINTS, FRONTEND_ROUTES, apiRequest } from '../../../config/api';
import './businessCard.scss';

const BusinessCard = () => {
  const [user, setUser] = useState({});
  const [userId, setUserId] = useState(null);
  const [qrValue, setQrValue] = useState("");
  const [error, setError] = useState(null);
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
    } catch (error) {
      console.error("Erreur lors du chargement des données utilisateur:", error);
    }
  };

  const generateQRCode = () => {
    if (userId) {
      const generatedLink = FRONTEND_ROUTES.CLIENT_REGISTER(userId);
      setQrValue(generatedLink);
      setError(null);
    } else {
      setError("L'ID utilisateur n'est pas encore disponible.");
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(qrValue);
      alert('✅ Lien copié dans le presse-papiers !');
    } catch (err) {
      console.error('Erreur lors de la copie:', err);
      alert('❌ Erreur lors de la copie du lien');
    }
  };

  return (
    <div className="business-card-container">
      <div className="card-header">
        <h2>💼 Carte de visite digitale</h2>
        <p className="card-subtitle">Générez votre QR code pour permettre à vos prospects de s'inscrire</p>
      </div>

      <div className="card-content">
        <div className="user-info-section">
          <div className="user-avatar">
            {user.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="user-details">
            <h3>{user.name || "Utilisateur"}</h3>
            <p>{user.email || "email@exemple.com"}</p>
          </div>
        </div>

        <div className="qr-section">
          <div className="qr-info">
            <h3>🎯 Générez votre QR code</h3>
            <p>Permettez à vos prospects de s'inscrire directement en scannant ce code</p>
            
            <button onClick={generateQRCode} className="generate-btn">
              📱 Générer le QR Code
            </button>
            
            {error && <div className="error-message">{error}</div>}
          </div>
          
          {qrValue && (
            <div className="qr-display">
              <div className="qr-code-wrapper">
                <QRCode value={qrValue} size={200} />
              </div>
              
              <div className="qr-details">
                <h4>📋 Lien d'inscription :</h4>
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
                
                <div className="qr-actions">
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
                    🔗 Tester le lien
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="instructions-section">
          <h4>📖 Comment utiliser votre carte de visite :</h4>
          <ul>
            <li>🎯 <strong>Générez le QR code</strong> en cliquant sur le bouton ci-dessus</li>
            <li>📱 <strong>Partagez le QR code</strong> avec vos prospects (email, réseaux sociaux, impression)</li>
            <li>✅ <strong>Vos prospects scannent</strong> le code et s'inscrivent automatiquement</li>
            <li>📊 <strong>Consultez vos nouveaux prospects</strong> dans la section "Prospects"</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BusinessCard;