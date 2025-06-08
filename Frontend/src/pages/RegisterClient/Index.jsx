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
  const [businessCardData, setBusinessCardData] = useState(null);

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
      }
      
      // ✅ CORRECTION: Récupérer les données de carte de visite avec le bon userId
      try {
        const actualUserId = userId || '507f1f77bcf86cd799439011'; // userId par défaut
        console.log('🔍 Tentative de récupération des données de carte pour userId:', actualUserId);
        
        // Essayer de récupérer les données de carte de visite
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/business-cards`, {
          headers: {
            'Content-Type': 'application/json',
            // Pas d'authentification pour l'instant, on récupère les données publiques
          }
        });
        
        if (response.ok) {
          const cardData = await response.json();
          setBusinessCardData(cardData);
          
          if (cardData.cardConfig && cardData.cardConfig.actions) {
            setBusinessCardActions(cardData.cardConfig.actions);
            console.log('📋 Actions récupérées:', cardData.cardConfig.actions);
            console.log('🖼️ Données de carte récupérées:', {
              hasImage: !!cardData.cardImage,
              config: cardData.cardConfig
            });
          }
        } else {
          console.log('ℹ️ Impossible de récupérer les données de carte, utilisation des données par défaut');
          setBusinessCardData({
            cardImage: null,
            cardConfig: {
              showQR: true,
              qrPosition: 'bottom-right',
              qrSize: 150,
              actions: [
                {
                  id: 1,
                  type: 'download',
                  file: '/images/carte-de-visite.png',
                  url: '',
                  delay: 1000,
                  active: true
                }
              ]
            }
          });
          setBusinessCardActions([
            {
              id: 1,
              type: 'download',
              file: '/images/carte-de-visite.png',
              url: '',
              delay: 1000,
              active: true
            }
          ]);
        }
      } catch (error) {
        console.log('ℹ️ Erreur lors de la récupération des données de carte:', error);
        // Utiliser des données par défaut avec action de téléchargement
        setBusinessCardData({
          cardImage: null,
          cardConfig: {
            showQR: true,
            qrPosition: 'bottom-right',
            qrSize: 150,
            actions: [
              {
                id: 1,
                type: 'download',
                file: '/images/carte-de-visite.png',
                url: '',
                delay: 1000,
                active: true
              }
            ]
          }
        });
        setBusinessCardActions([
          {
            id: 1,
            type: 'download',
            file: '/images/carte-de-visite.png',
            url: '',
            delay: 1000,
            active: true
          }
        ]);
      }
    };

    detectRedirectAndActions();
  }, [userId]);

  // ✅ CORRECTION: Exécuter les actions dès le chargement de la page
  useEffect(() => {
    if (businessCardActions.length > 0 && !actionsExecutedRef.current) {
      actionsExecutedRef.current = true;
      console.log('🎬 Démarrage de l\'exécution des actions automatiques');
      executeBusinessCardActions();
    }
  }, [businessCardActions]);

  // ✅ CORRECTION: Exécuter les actions configurées dans la carte de visite
  const executeBusinessCardActions = async () => {
    const activeActions = businessCardActions
      .filter(action => action.active)
      .sort((a, b) => a.id - b.id);

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
            console.log('📥 Exécution de l\'action de téléchargement automatique');
            await executeDownloadAction(action);
            break;
          case 'form':
            console.log('📝 Action formulaire - déjà affiché');
            break;
          case 'redirect':
          case 'website':
            console.log(`🌐 Action de redirection vers: ${action.url}`);
            break;
          default:
            console.log(`❓ Type d'action non reconnu: ${action.type}`);
        }
      } catch (error) {
        console.error(`❌ Erreur lors de l'exécution de l'action ${action.type}:`, error);
      }
    }
  };

  // ✅ CORRECTION: Fonction de téléchargement améliorée
  const executeDownloadAction = async (action) => {
    try {
      console.log('📥 Génération de la carte de visite pour téléchargement...');
      
      // Générer la carte de visite avec les vraies données
      const cardImageData = await generateBusinessCardWithQR();
      
      if (cardImageData) {
        // Télécharger l'image générée
        const link = document.createElement('a');
        link.href = cardImageData;
        link.download = 'carte-de-visite-qr.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('✅ Carte de visite téléchargée avec succès');
        showDownloadMessage();
      } else {
        console.error('❌ Impossible de générer la carte de visite');
      }
    } catch (error) {
      console.error('❌ Erreur lors du téléchargement:', error);
    }
  };

  // ✅ CORRECTION: Génération de carte de visite améliorée
  const generateBusinessCardWithQR = async () => {
    return new Promise(async (resolve) => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Dimensions de carte de visite standard
        canvas.width = 1012;
        canvas.height = 638;
        
        console.log('🖼️ Démarrage de la génération de carte...');
        
        // ✅ ÉTAPE 1: Charger l'image de carte de visite si disponible
        if (businessCardData && businessCardData.cardImage) {
          console.log('🖼️ Chargement de l\'image de carte personnalisée');
          
          try {
            await new Promise((resolveImage, rejectImage) => {
              const cardImage = new Image();
              cardImage.onload = async () => {
                console.log('✅ Image de carte chargée');
                // Dessiner l'image de carte de visite
                ctx.drawImage(cardImage, 0, 0, canvas.width, canvas.height);
                
                // ✅ ÉTAPE 2: Ajouter le QR code si configuré
                if (businessCardData.cardConfig && businessCardData.cardConfig.showQR) {
                  await addQRCodeToCard(ctx, canvas, businessCardData.cardConfig);
                }
                
                resolveImage();
              };
              
              cardImage.onerror = () => {
                console.log('❌ Erreur chargement image, utilisation du fallback');
                rejectImage();
              };
              
              cardImage.src = businessCardData.cardImage;
            });
          } catch (imageError) {
            console.log('📝 Génération d\'une carte par défaut');
            await generateFallbackCard(ctx, canvas);
          }
        } else {
          console.log('📝 Aucune image personnalisée, génération d\'une carte par défaut');
          await generateFallbackCard(ctx, canvas);
        }
        
        const dataUrl = canvas.toDataURL('image/png');
        console.log('✅ Carte de visite générée avec succès');
        resolve(dataUrl);
        
      } catch (error) {
        console.error('❌ Erreur lors de la génération:', error);
        resolve(null);
      }
    });
  };

  // ✅ FONCTION: Ajouter le QR code sur la carte
  const addQRCodeToCard = async (ctx, canvas, config) => {
    try {
      const qrSize = config.qrSize || 150;
      const position = config.qrPosition || 'bottom-right';
      
      // Calculer la position du QR code
      let qrX, qrY;
      const margin = 20;
      
      switch (position) {
        case 'bottom-right':
          qrX = canvas.width - qrSize - margin;
          qrY = canvas.height - qrSize - margin;
          break;
        case 'bottom-left':
          qrX = margin;
          qrY = canvas.height - qrSize - margin;
          break;
        case 'top-right':
          qrX = canvas.width - qrSize - margin;
          qrY = margin;
          break;
        case 'top-left':
          qrX = margin;
          qrY = margin;
          break;
        default:
          qrX = canvas.width - qrSize - margin;
          qrY = canvas.height - qrSize - margin;
      }
      
      console.log(`📍 Position QR: ${position} (${qrX}, ${qrY}) taille: ${qrSize}px`);
      
      // Générer le QR code avec la vraie URL
      const qrUrl = window.location.href;
      
      // Utiliser la bibliothèque QRCode
      try {
        const QRCode = await import('qrcode');
        const qrDataUrl = await QRCode.default.toDataURL(qrUrl, {
          width: qrSize,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        
        await new Promise((resolve) => {
          const qrImage = new Image();
          qrImage.onload = () => {
            // Fond blanc pour le QR code
            ctx.fillStyle = 'white';
            ctx.fillRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10);
            
            // Dessiner le QR code
            ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
            
            console.log('✅ QR code ajouté à la carte');
            resolve();
          };
          qrImage.src = qrDataUrl;
        });
        
      } catch (qrError) {
        console.log('⚠️ Erreur QRCode, utilisation du fallback');
        drawFallbackQR(ctx, qrX, qrY, qrSize);
      }
    } catch (error) {
      console.error('❌ Erreur ajout QR code:', error);
    }
  };

  // ✅ FONCTION: Dessiner un QR code de fallback
  const drawFallbackQR = (ctx, x, y, size) => {
    // Fond blanc
    ctx.fillStyle = 'white';
    ctx.fillRect(x - 5, y - 5, size + 10, size + 10);
    
    // QR code simplifié
    ctx.fillStyle = 'black';
    ctx.fillRect(x, y, size, size);
    
    // Motif de QR code basique
    const cellSize = size / 21;
    ctx.fillStyle = 'white';
    
    for (let i = 0; i < 21; i++) {
      for (let j = 0; j < 21; j++) {
        if ((i + j) % 3 === 0) {
          ctx.fillRect(x + i * cellSize, y + j * cellSize, cellSize, cellSize);
        }
      }
    }
    
    // Texte au centre
    ctx.fillStyle = 'black';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('QR', x + size/2, y + size/2);
    
    console.log('✅ QR code fallback ajouté');
  };

  // ✅ FONCTION: Générer une carte par défaut
  const generateFallbackCard = async (ctx, canvas) => {
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
    
    // Informations de contact
    ctx.font = '32px Arial';
    ctx.fillText('Votre Nom', canvas.width / 2, 140);
    
    ctx.font = '24px Arial';
    ctx.fillText('votre.email@exemple.com', canvas.width / 2, 180);
    ctx.fillText('06 12 34 56 78', canvas.width / 2, 210);
    
    // Ajouter le QR code si configuré
    if (businessCardData && businessCardData.cardConfig && businessCardData.cardConfig.showQR) {
      await addQRCodeToCard(ctx, canvas, businessCardData.cardConfig);
    }
    
    // Texte d'instruction
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('📱 Scannez le QR code pour vous inscrire', 40, canvas.height - 80);
    ctx.fillText('💼 Recevez automatiquement nos informations', 40, canvas.height - 50);
  };

  // ✅ NOUVEAU: Fonction de téléchargement manuel
  const handleManualDownload = async () => {
    console.log('📥 Téléchargement manuel demandé');
    await executeDownloadAction({ type: 'download' });
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
      const pathParts = window.location.pathname.split('/');
      let actualUserId = userId;
      
      if (finalRedirectUrl) {
        actualUserId = userId || '507f1f77bcf86cd799439011';
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
      
      // Redirection finale
      setTimeout(() => {
        if (finalRedirectUrl) {
          console.log('🌐 Redirection vers:', finalRedirectUrl);
          window.location.href = finalRedirectUrl;
        } else {
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
        
        {/* ✅ NOUVEAU: Bouton de téléchargement manuel */}
        <div className="manual-download-section">
          <button 
            type="button"
            onClick={handleManualDownload}
            className="manual-download-btn"
            disabled={loading || success}
          >
            📥 Télécharger la carte de visite
          </button>
          <p className="download-help">Cliquez pour télécharger votre carte de visite avec QR code</p>
        </div>
        
        {finalRedirectUrl && (
          <div className="redirect-notice">
            <span className="redirect-icon">🌐</span>
            <span>Après inscription, vous serez redirigé vers: <strong>{finalRedirectUrl}</strong></span>
          </div>
        )}
        
        {businessCardData && businessCardData.cardImage && (
          <div className="download-notice">
            <span className="download-icon">📥</span>
            <span>Carte de visite personnalisée détectée - téléchargement automatique activé</span>
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