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
  
  // ✅ NOUVEAU: Gestion des actions multiples
  const [actions, setActions] = useState([]);
  const [currentActionIndex, setCurrentActionIndex] = useState(0);

  // ✅ NOUVEAU: Décoder et exécuter les actions depuis l'URL
  useEffect(() => {
    const actionsParam = searchParams.get('actions');
    if (actionsParam) {
      try {
        const decodedActions = JSON.parse(decodeURIComponent(actionsParam));
        setActions(decodedActions);
        console.log('✅ Actions décodées:', decodedActions);
        
        // Exécuter les actions dans l'ordre
        executeActions(decodedActions);
      } catch (error) {
        console.error('❌ Erreur décodage actions:', error);
        // Fallback vers l'action par défaut
        executeDefaultAction();
      }
    } else {
      // Action par défaut si pas d'actions spécifiées
      executeDefaultAction();
    }
  }, [searchParams]);

  // ✅ NOUVEAU: Exécuter les actions dans l'ordre avec délais
  const executeActions = (actionsList) => {
    actionsList.forEach((action, index) => {
      setTimeout(() => {
        executeAction(action, index);
        setCurrentActionIndex(index);
      }, action.delay || 0);
    });
  };

  // ✅ NOUVEAU: Exécuter une action spécifique
  const executeAction = (action, index) => {
    console.log(`🎬 Exécution action ${index + 1}:`, action);
    
    switch (action.type) {
      case 'download':
        downloadFile(action.file || '/images/welcome.png', `fichier-${index + 1}`);
        break;
        
      case 'form':
        // L'action formulaire est déjà affichée par défaut
        console.log('📝 Formulaire affiché');
        break;
        
      case 'redirect':
      case 'website':
        if (action.url) {
          console.log(`🌐 Redirection vers: ${action.url}`);
          // Ne pas rediriger immédiatement, attendre la fin du processus
        }
        break;
        
      default:
        console.log('❓ Type d\'action inconnu:', action.type);
    }
  };

  // ✅ NOUVEAU: Fonction de téléchargement de fichier
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

  // ✅ NOUVEAU: Action par défaut (rétrocompatibilité)
  const executeDefaultAction = () => {
    if (downloadedRef.current) return;
    downloadedRef.current = true;
    downloadFile('/images/welcome.png', 'carte-de-visite.png');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await apiRequest(API_ENDPOINTS.CLIENTS.REGISTER(userId), {
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
      
      // ✅ NOUVEAU: Exécuter les redirections après inscription
      const redirectActions = actions.filter(action => 
        action.type === 'redirect' || action.type === 'website'
      );
      
      if (redirectActions.length > 0) {
        const finalRedirect = redirectActions[redirectActions.length - 1];
        setTimeout(() => {
          window.location.href = finalRedirect.url;
        }, 2000);
      } else {
        // Redirection par défaut vers Google
        setTimeout(() => {
          window.location.href = 'https://google.com';
        }, 2000);
      }
      
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
        
        {/* ✅ NOUVEAU: Affichage des actions en cours */}
        {actions.length > 0 && (
          <div className="actions-status">
            <h4>🎬 Actions en cours :</h4>
            <div className="actions-list">
              {actions.map((action, index) => (
                <div 
                  key={index} 
                  className={`action-status ${index <= currentActionIndex ? 'completed' : 'pending'}`}
                >
                  <span className="action-icon">
                    {action.type === 'download' ? '📥' : 
                     action.type === 'form' ? '📝' : 
                     action.type === 'redirect' || action.type === 'website' ? '🌐' : '❓'}
                  </span>
                  <span className="action-label">
                    {action.type === 'download' ? 'Téléchargement automatique' : 
                     action.type === 'form' ? 'Formulaire d\'inscription' : 
                     action.type === 'redirect' ? 'Redirection programmée' : 
                     action.type === 'website' ? 'Redirection vers site' : 'Action inconnue'}
                  </span>
                  <span className="action-timing">
                    {action.delay > 0 ? `+${action.delay}ms` : 'Immédiat'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Message de téléchargement (rétrocompatibilité) */}
        {actions.length === 0 && (
          <div className="download-notice">
            <span className="download-icon">📥</span>
            <span>Votre carte de visite a été téléchargée automatiquement !</span>
          </div>
        )}
        
        {error && <div className="error-message">{error}</div>}
        {success && (
          <div className="success-message">
            ✅ Inscription réussie ! 
            {actions.some(a => a.type === 'redirect' || a.type === 'website') 
              ? ' Redirection en cours...' 
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