import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { API_ENDPOINTS, apiRequest } from "../../config/api";
import "./registerClient.scss";

const RegisterClient = () => {
  const { userId } = useParams();
  const [searchParams] = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const downloadedRef = useRef(false);
  
  // ✅ NOUVEAU: Gestion de la redirection finale
  const [finalRedirectUrl, setFinalRedirectUrl] = useState('');

  // ✅ NOUVEAU: Détecter si c'est une URL avec redirection
  useEffect(() => {
    // Extraire la destination de l'URL
    // Format: /register-client/google.com ou /register-client/[userId]
    const pathParts = window.location.pathname.split('/');
    const lastPart = pathParts[pathParts.length - 1];
    
    // Si ce n'est pas un userId MongoDB (24 caractères hex), c'est une destination
    if (lastPart && lastPart.length !== 24 && !lastPart.match(/^[0-9a-fA-F]{24}$/)) {
      setFinalRedirectUrl(`https://${lastPart}`);
      console.log('🌐 Redirection finale détectée:', `https://${lastPart}`);
      
      // Déclencher le téléchargement automatique
      if (!downloadedRef.current) {
        downloadedRef.current = true;
        downloadFile('/images/carte-de-visite.png', 'carte-de-visite.png');
      }
    } else {
      // URL normale avec userId, téléchargement par défaut
      if (!downloadedRef.current) {
        downloadedRef.current = true;
        downloadFile('/images/carte-de-visite.png', 'carte-de-visite.png');
      }
    }
  }, []);

  // ✅ FONCTION: Téléchargement de fichier
  const downloadFile = (fileUrl, fileName) => {
    try {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName || 'fichier-telecharge';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log(`✅ Téléchargement déclenché: ${fileName}`);
    } catch (error) {
      console.error('❌ Erreur téléchargement:', error);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // ✅ CORRECTION: Utiliser le vrai userId depuis l'URL ou un userId par défaut
      const pathParts = window.location.pathname.split('/');
      let actualUserId = userId;
      
      // Si l'URL contient une redirection, utiliser un userId par défaut ou le premier paramètre
      if (finalRedirectUrl) {
        // Vous devrez adapter cette logique selon votre système
        // Pour l'instant, on utilise un userId par défaut ou on le récupère autrement
        actualUserId = userId || '507f1f77bcf86cd799439011'; // userId par défaut
      }

      await apiRequest(API_ENDPOINTS.CLIENTS.REGISTER(actualUserId), {
        method: "POST",
        body: JSON.stringify({ 
          name, 
          email, 
          phone, 
          company,
          address,
          postalCode,
          city,
          notes
        }),
      });

      setSuccess(true);
      
      // ✅ REDIRECTION FINALE
      setTimeout(() => {
        if (finalRedirectUrl) {
          console.log('🌐 Redirection vers:', finalRedirectUrl);
          window.location.href = finalRedirectUrl;
        } else {
          // Redirection par défaut
          window.location.href = 'https://google.com';
        }
      }, 2000);
      
    } catch (err) {
      console.error("❌ Erreur inscription client:", err);
      setError(err.message || "Erreur d'inscription du client");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-client-container">
      <form onSubmit={handleRegister} className="register-form">
        <h2>📝 Inscription Prospect</h2>
        <p className="form-subtitle">Remplissez vos informations pour être recontacté</p>
        
        {/* ✅ NOUVEAU: Affichage de la redirection détectée */}
        {finalRedirectUrl && (
          <div className="redirect-notice">
            <span className="redirect-icon">🌐</span>
            <span>Après inscription, vous serez redirigé vers: <strong>{finalRedirectUrl}</strong></span>
          </div>
        )}
        
        {/* Message de téléchargement */}
        <div className="download-notice">
          <span className="download-icon">📥</span>
          <span>Votre carte de visite a été téléchargée automatiquement !</span>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        {success && (
          <div className="success-message">
            ✅ Inscription réussie ! 
            {finalRedirectUrl 
              ? ` Redirection vers ${finalRedirectUrl} dans 2 secondes...` 
              : ' Redirection vers Google dans 2 secondes...'
            }
          </div>
        )}
        
        {/* Informations principales */}
        <div className="form-section">
          <h3>👤 Informations personnelles</h3>
          
          <input
            type="text"
            placeholder="Nom et prénom *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={success}
          />
          
          <input
            type="email"
            placeholder="Email *"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={success}
          />
          
          <input
            type="tel"
            placeholder="Téléphone *"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            disabled={success}
          />
        </div>

        {/* Adresse */}
        <div className="form-section">
          <h3>📍 Adresse</h3>
          
          <input
            type="text"
            placeholder="Adresse (rue, numéro)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={success}
          />
          
          <div className="form-row">
            <input
              type="text"
              placeholder="Code postal"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              disabled={success}
              maxLength={5}
            />
            
            <input
              type="text"
              placeholder="Ville"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={success}
            />
          </div>
        </div>

        {/* Informations complémentaires */}
        <div className="form-section">
          <h3>🏢 Informations complémentaires</h3>
          
          <input
            type="text"
            placeholder="Entreprise / Organisation"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            disabled={success}
          />
          
          <textarea
            placeholder="Votre projet, besoins, commentaires..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={success}
            rows={3}
          />
        </div>
        
        <button type="submit" disabled={loading || success} className="submit-btn">
          {loading ? "Inscription en cours..." : success ? "Inscription réussie !" : "✅ S'inscrire"}
        </button>
        
        <p className="form-footer">
          * Champs obligatoires • Vos données sont sécurisées
        </p>
      </form>
    </div>
  );
};

export default RegisterClient;