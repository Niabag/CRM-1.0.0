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
  const actionsExecutedRef = useRef(false);
  
  // ✅ NOUVEAU: Gestion de la redirection finale
  const [finalRedirectUrl, setFinalRedirectUrl] = useState('');
  const [businessCardActions, setBusinessCardActions] = useState([]);

  // ✅ NOUVEAU: Détecter si c'est une URL avec redirection et récupérer les actions
  useEffect(() => {
    const detectRedirectAndActions = async () => {
      // Extraire la destination de l'URL
      const pathParts = window.location.pathname.split('/');
      const lastPart = pathParts[pathParts.length - 1];
      
      // Si ce n'est pas un userId MongoDB (24 caractères hex), c'est une destination
      if (lastPart && lastPart.length !== 24 && !lastPart.match(/^[0-9a-fA-F]{24}$/)) {
        setFinalRedirectUrl(`https://${lastPart}`);
        console.log('🌐 Redirection finale détectée:', `https://${lastPart}`);
        
        // ✅ NOUVEAU: Récupérer les actions de la carte de visite
        try {
          // Utiliser un userId par défaut ou le récupérer depuis l'API
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/business-cards`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token') || 'default-token'}`
            }
          });
          
          if (response.ok) {
            const cardData = await response.json();
            if (cardData.cardConfig && cardData.cardConfig.actions) {
              setBusinessCardActions(cardData.cardConfig.actions);
              console.log('📋 Actions récupérées:', cardData.cardConfig.actions);
            }
          }
        } catch (error) {
          console.log('ℹ️ Impossible de récupérer les actions de la carte');
        }
      }
    };

    detectRedirectAndActions();
  }, []);

  // ✅ NOUVEAU: Exécuter les actions après le chargement de la page
  useEffect(() => {
    if (businessCardActions.length > 0 && !actionsExecutedRef.current) {
      actionsExecutedRef.current = true;
      executeBusinessCardActions();
    }
  }, [businessCardActions]);

  // ✅ NOUVEAU: Exécuter les actions configurées dans la carte de visite
  const executeBusinessCardActions = async () => {
    const activeActions = businessCardActions
      .filter(action => action.active)
      .sort((a, b) => a.id - b.id); // Trier par ordre d'ID

    console.log('🎬 Exécution des actions:', activeActions);

    for (const action of activeActions) {
      try {
        // Attendre le délai configuré
        if (action.delay > 0) {
          console.log(`⏳ Attente de ${action.delay}ms pour l'action ${action.type}`);
          await new Promise(resolve => setTimeout(resolve, action.delay));
        }

        switch (action.type) {
          case 'download':
            await executeDownloadAction(action);
            break;
          case 'form':
            console.log('📝 Action formulaire - déjà affiché');
            break;
          case 'redirect':
          case 'website':
            console.log(`🌐 Action de redirection vers: ${action.url}`);
            // La redirection se fera après l'inscription
            break;
          default:
            console.log(`❓ Type d'action non reconnu: ${action.type}`);
        }
      } catch (error) {
        console.error(`❌ Erreur lors de l'exécution de l'action ${action.type}:`, error);
      }
    }
  };

  // ✅ NOUVEAU: Exécuter l'action de téléchargement avec génération de carte
  const executeDownloadAction = async (action) => {
    try {
      console.log('📥 Exécution de l\'action de téléchargement:', action);
      
      // Générer la carte de visite avec QR code
      const cardImageData = await generateBusinessCardWithQR();
      
      if (cardImageData) {
        // Télécharger l'image générée
        const link = document.createElement('a');
        link.href = cardImageData;
        link.download = action.file || 'carte-de-visite-qr.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('✅ Carte de visite téléchargée avec succès');
        
        // Afficher un message de confirmation
        showDownloadMessage();
      }
    } catch (error) {
      console.error('❌ Erreur lors du téléchargement:', error);
    }
  };

  // ✅ NOUVEAU: Générer la carte de visite avec QR code
  const generateBusinessCardWithQR = async () => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Dimensions de carte de visite standard (85.6 x 53.98 mm à 300 DPI)
      canvas.width = 1012;
      canvas.height = 638;
      
      // Fond dégradé
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#667eea');
      gradient.addColorStop(1, '#764ba2');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Titre principal
      ctx.fillStyle = 'white';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('CARTE DE VISITE NUMÉRIQUE', canvas.width / 2, 80);
      
      // Informations de contact (exemple)
      ctx.font = '32px Arial';
      ctx.fillText('Votre Nom', canvas.width / 2, 140);
      
      ctx.font = '24px Arial';
      ctx.fillText('votre.email@exemple.com', canvas.width / 2, 180);
      ctx.fillText('06 12 34 56 78', canvas.width / 2, 210);
      
      // ✅ NOUVEAU: Générer le QR code
      const qrSize = 150;
      const qrX = canvas.width - qrSize - 40;
      const qrY = canvas.height - qrSize - 40;
      
      // Fond blanc pour le QR code
      ctx.fillStyle = 'white';
      ctx.fillRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);
      
      // ✅ GÉNÉRER LE VRAI QR CODE
      import('qrcode').then(QRCode => {
        const qrUrl = window.location.href;
        
        QRCode.toDataURL(qrUrl, {
          width: qrSize,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        }).then(qrDataUrl => {
          const qrImage = new Image();
          qrImage.onload = () => {
            ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
            
            // Texte d'instruction
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.font = '18px Arial';
            ctx.textAlign = 'left';
            ctx.fillText('📱 Scannez le QR code pour vous inscrire', 40, canvas.height - 80);
            ctx.fillText('💼 Recevez automatiquement nos informations', 40, canvas.height - 50);
            
            // Retourner l'image générée
            resolve(canvas.toDataURL('image/png'));
          };
          qrImage.src = qrDataUrl;
        }).catch(() => {
          // Fallback si QRCode ne fonctionne pas
          ctx.fillStyle = 'black';
          ctx.fillRect(qrX, qrY, qrSize, qrSize);
          ctx.fillStyle = 'white';
          ctx.font = '14px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('QR CODE', qrX + qrSize/2, qrY + qrSize/2);
          
          resolve(canvas.toDataURL('image/png'));
        });
      }).catch(() => {
        // Fallback complet
        ctx.fillStyle = 'black';
        ctx.fillRect(qrX, qrY, qrSize, qrSize);
        ctx.fillStyle = 'white';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('QR CODE', qrX + qrSize/2, qrY + qrSize/2);
        
        resolve(canvas.toDataURL('image/png'));
      });
    });
  };

  // ✅ NOUVEAU: Afficher le message de téléchargement
  const showDownloadMessage = () => {
    const messageDiv = document.createElement('div');
    messageDiv.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 4px 15px rgba(72, 187, 120, 0.3);
        z-index: 9999;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      ">
        <span style="font-size: 1.2rem;">📥</span>
        <span>Carte de visite téléchargée !</span>
      </div>
    `;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
      if (document.body.contains(messageDiv)) {
        document.body.removeChild(messageDiv);
      }
    }, 4000);
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