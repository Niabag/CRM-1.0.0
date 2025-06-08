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
  
  // ✅ AJOUT: État pour contrôler l'affichage du formulaire
  const [showForm, setShowForm] = useState(true);
  const [actionsCompleted, setActionsCompleted] = useState(false);

  // ✅ CORRECTION: Détecter si c'est une URL avec redirection et récupérer les actions
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
      
      // ✅ CORRECTION: Toujours utiliser les données par défaut avec téléchargement automatique
      console.log('🔍 Configuration des actions par défaut');
      
      const defaultCardData = {
        cardImage: '/images/modern-business-card-design-template-42551612346d5b08984f0b61a8044609_screen.jpg',
        cardConfig: {
          showQR: true,
          qrPosition: 'top-right',
          qrSize: 100,
          actions: [
            {
              id: 1,
              type: 'download',
              file: 'carte-apercu',
              url: '',
              delay: 1000,
              active: true
            }
          ]
        }
      };
      
      setBusinessCardData(defaultCardData);
      setBusinessCardActions(defaultCardData.cardConfig.actions);
      
      console.log('📋 Actions configurées:', defaultCardData.cardConfig.actions);
      console.log('🖼️ Image par défaut configurée');
      
      // ✅ CORRECTION: Toujours masquer le formulaire car seule l'action téléchargement est active
      setShowForm(false);
    };

    detectRedirectAndActions();
  }, [userId]);

  // ✅ CORRECTION: Exécuter les actions dès que les données sont chargées
  useEffect(() => {
    if (businessCardActions.length > 0 && !actionsExecutedRef.current) {
      actionsExecutedRef.current = true;
      console.log('🎬 Démarrage de l\'exécution des actions automatiques');
      
      // ✅ CORRECTION: Délai plus court pour l'exécution
      setTimeout(() => {
        executeBusinessCardActions();
      }, 500);
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
        console.log(`🎯 Exécution de l'action: ${action.type}`);
        
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
            console.log('📝 Action formulaire - affichage du formulaire');
            setShowForm(true);
            break;
          case 'redirect':
          case 'website':
            console.log(`🌐 Action de redirection vers: ${action.url}`);
            if (action.url) {
              setTimeout(() => {
                window.location.href = action.url;
              }, 1000);
            }
            break;
          default:
            console.log(`❓ Type d'action non reconnu: ${action.type}`);
        }
      } catch (error) {
        console.error(`❌ Erreur lors de l'exécution de l'action ${action.type}:`, error);
      }
    }
    
    setActionsCompleted(true);
    
    // ✅ CORRECTION: Si redirection finale, rediriger après les actions
    if (finalRedirectUrl) {
      setTimeout(() => {
        console.log('🌐 Redirection automatique vers:', finalRedirectUrl);
        window.location.href = finalRedirectUrl;
      }, 3000);
    }
  };

  // ✅ CORRECTION: Téléchargement de l'image générée avec les vraies données
  const executeDownloadAction = async (action) => {
    try {
      console.log('📥 Génération de la carte de visite pour téléchargement...');
      
      if (action.file === 'carte-apercu') {
        console.log('🖼️ Génération de la carte avec l\'image personnalisée et QR code...');
        const cardImageData = await generateBusinessCardFromData();
        
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
      } else {
        // Téléchargement d'un fichier spécifique (ancien comportement)
        console.log('📁 Téléchargement du fichier:', action.file);
        const link = document.createElement('a');
        link.href = action.file;
        link.download = action.file.split('/').pop() || 'fichier';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showDownloadMessage();
      }
    } catch (error) {
      console.error('❌ Erreur lors du téléchargement:', error);
    }
  };

  // ✅ FONCTION CORRIGÉE: Génération basée sur les vraies données de la carte
  const generateBusinessCardFromData = async () => {
    return new Promise(async (resolve) => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Dimensions de carte de visite standard
        canvas.width = 1012;
        canvas.height = 638;
        
        console.log('🖼️ Démarrage de la génération de carte...');
        
        // ✅ CORRECTION: Toujours utiliser l'image par défaut
        if (businessCardData && businessCardData.cardImage) {
          console.log('🖼️ Chargement de l\'image de carte par défaut');
          
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
              
              // ✅ CORRECTION: Utiliser l'image par défaut
              cardImage.src = businessCardData.cardImage;
            });
          } catch (imageError) {
            console.log('📝 Génération d\'une carte par défaut');
            await generateFallbackCard(ctx, canvas);
          }
        } else {
          console.log('📝 Aucune image, génération d\'une carte par défaut');
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
      const qrSize = config.qrSize || 100;
      const position = config.qrPosition || 'top-right';
      
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
          qrY = margin;
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
    await executeDownloadAction({ type: 'download', file: 'carte-apercu' });
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
      <div className="download-only-container">
        <div className="download-message">
          <h2>📥 Téléchargement de votre carte de visite</h2>
          <p>Le téléchargement de votre carte de visite a été lancé automatiquement.</p>
          
          <div className="manual-download-section">
            <button 
              onClick={handleManualDownload}
              className="manual-download-btn"
            >
              📥 Télécharger à nouveau
            </button>
            <p className="download-help">Cliquez pour relancer le téléchargement</p>
          </div>
          
          {finalRedirectUrl && (
            <div className="redirect-notice">
              <span className="redirect-icon">🌐</span>
              <span>Redirection vers <strong>{finalRedirectUrl}</strong> dans quelques secondes...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterClient;