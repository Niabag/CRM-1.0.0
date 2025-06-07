import { useState, useEffect, useRef } from 'react';
import QRCode from "react-qr-code";
import { API_ENDPOINTS, FRONTEND_ROUTES, apiRequest } from '../../../config/api';
import './businessCard.scss';

const BusinessCard = () => {
  const [user, setUser] = useState({});
  const [userId, setUserId] = useState(null);
  const [qrValue, setQrValue] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
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
      setShowCardPreview(true);
      setError(null);
    } else {
      setError("L'ID utilisateur n'est pas encore disponible.");
    }
  };

  const downloadBusinessCard = async () => {
    if (!cardRef.current) return;

    try {
      setLoading(true);
      
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
        <p className="card-subtitle">Créez et téléchargez votre carte de visite avec QR code intégré</p>
      </div>

      <div className="card-content">
        {/* Section informations utilisateur */}
        <div className="user-info-section">
          <div className="user-avatar">
            {user.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="user-details">
            <h3>{user.name || "Votre Nom"}</h3>
            <p>{user.email || "votre.email@exemple.com"}</p>
            <span className="user-role">Professionnel • CRM Pro</span>
          </div>
        </div>

        {/* Section génération */}
        <div className="generation-section">
          <div className="generation-info">
            <h3>🎯 Générez votre carte de visite</h3>
            <p>Créez une carte de visite professionnelle avec votre QR code d'inscription intégré</p>
            
            <button onClick={generateQRCode} className="generate-btn">
              ✨ Créer ma carte de visite
            </button>
            
            {error && <div className="error-message">{error}</div>}
          </div>
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